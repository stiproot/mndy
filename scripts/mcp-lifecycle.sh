#!/usr/bin/env bash
# Detached lifecycle for the MCP servers: start / stop / restart / status / logs.
#
# Why this is a script rather than Makefile recipes: correctly stopping a server means
# finding the process even when its pidfile is stale or missing. `bun run --cwd apps/X
# start` execs `node dist/index.js`, so the command line alone cannot tell one server from
# another — every one of them looks identical. What *is* unique is the working directory,
# which this reads from /proc/<pid>/cwd. Without that, a crashed-and-orphaned server keeps
# holding its port while the next `start` dies with EADDRINUSE and `status` cheerfully
# reports "up" because the orphan answers the health check.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${MCP_RUN_DIR:-$ROOT/.mcp-run}"

usage() {
  echo "usage: $(basename "$0") {start|stop|restart|status|logs} <server>..." >&2
  exit 64
}

[ $# -ge 2 ] || usage
action="$1"; shift
servers=("$@")

# The port a server listens on, from its .env if present, else its .env.template.
server_port() {
  local server="$1" file
  for file in "$ROOT/apps/$server/.env" "$ROOT/apps/$server/.env.template"; do
    if [ -f "$file" ]; then
      local port
      port="$(grep -E '^[[:space:]]*PORT[[:space:]]*=' "$file" | head -1 | cut -d= -f2 | tr -d '[:space:]')"
      [ -n "$port" ] && { echo "$port"; return 0; }
    fi
  done
  return 1
}

# Every pid whose working directory is this server's app directory — the only reliable
# way to identify it, including orphans whose parent `bun` has gone.
server_pids() {
  local server="$1" target="$ROOT/apps/$1" pid cwd
  for pid in $(pgrep -x node 2>/dev/null; pgrep -x bun 2>/dev/null); do
    cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null)" || continue
    [ "$cwd" = "$target" ] && echo "$pid"
  done
}

port_is_open() {
  local port="$1"
  curl -sf --max-time 2 "http://localhost:$port/health" >/dev/null 2>&1
}

do_stop() {
  local server="$1"
  local pidfile="$RUN_DIR/$server.pid"
  local stopped=0 pid

  if [ -f "$pidfile" ]; then
    pid="$(cat "$pidfile")"
    # Negative pid targets the whole process group, so the `bun` wrapper and its `node`
    # child die together rather than leaving the child orphaned holding the port.
    kill -- -"$pid" 2>/dev/null && stopped=1
    kill "$pid" 2>/dev/null && stopped=1
    rm -f "$pidfile"
  fi

  # Sweep anything still living in this server's directory, pidfile or not.
  for pid in $(server_pids "$server"); do
    kill "$pid" 2>/dev/null && stopped=1
  done

  # Give them a moment, then insist.
  local port; port="$(server_port "$server" || true)"
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    [ -n "$(server_pids "$server")" ] || break
    sleep 0.2
  done
  for pid in $(server_pids "$server"); do
    kill -9 "$pid" 2>/dev/null
  done

  if [ "$stopped" = 1 ]; then
    echo "  - $server stopped"
  else
    echo "  = $server was not running"
  fi

  if [ -n "$port" ] && port_is_open "$port"; then
    echo "  ! $server: port $port is STILL serving — something outside this repo owns it" >&2
    return 1
  fi
  return 0
}

do_start() {
  local server="$1"
  local pidfile="$RUN_DIR/$server.pid"
  local port pid

  if [ -n "$(server_pids "$server")" ]; then
    echo "  = $server already running (pid $(server_pids "$server" | tr '\n' ' '))"
    return 0
  fi

  if [ ! -f "$ROOT/apps/$server/.env" ]; then
    echo "  - $server skipped — no apps/$server/.env (copy from .env.template)"
    return 0
  fi

  port="$(server_port "$server" || true)"
  # Refuse rather than start a process that will die on EADDRINUSE and leave a stale
  # pidfile pointing at nothing while the squatter answers health checks.
  if [ -n "$port" ] && port_is_open "$port"; then
    echo "  ! $server NOT started — port $port is already in use" >&2
    return 1
  fi

  mkdir -p "$RUN_DIR"
  setsid bun run --cwd "$ROOT/apps/$server" start > "$RUN_DIR/$server.log" 2>&1 < /dev/null &
  pid=$!
  echo "$pid" > "$pidfile"

  # Confirm it actually came up rather than reporting success and walking away.
  for _ in $(seq 1 40); do
    if [ -n "$port" ] && port_is_open "$port"; then
      echo "  + $server started (pid $pid) on :$port"
      return 0
    fi
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.25
  done

  echo "  ! $server failed to come up — see $RUN_DIR/$server.log" >&2
  tail -n 5 "$RUN_DIR/$server.log" | sed 's/^/      /' >&2
  rm -f "$pidfile"
  return 1
}

do_status() {
  local server="$1" port pids
  port="$(server_port "$server" || echo '?')"
  pids="$(server_pids "$server" | tr '\n' ' ')"

  if [ -n "$port" ] && port_is_open "$port"; then
    if [ -n "$pids" ]; then
      echo "  up      $server  :$port  (pid ${pids% })"
    else
      echo "  ORPHAN  $server  :$port  serving, but no process in apps/$server — run stop" >&2
    fi
  elif [ -n "$pids" ]; then
    echo "  broken  $server  :$port  process alive (${pids% }) but not answering /health" >&2
  else
    echo "  down    $server  :$port"
  fi
}

rc=0
case "$action" in
  start)   for s in "${servers[@]}"; do do_start "$s"  || rc=1; done ;;
  stop)    for s in "${servers[@]}"; do do_stop "$s"   || rc=1; done ;;
  restart) for s in "${servers[@]}"; do do_stop "$s"   || rc=1; done
           for s in "${servers[@]}"; do do_start "$s"  || rc=1; done ;;
  status)  for s in "${servers[@]}"; do do_status "$s" || rc=1; done ;;
  logs)    files=(); for s in "${servers[@]}"; do [ -f "$RUN_DIR/$s.log" ] && files+=("$RUN_DIR/$s.log"); done
           [ ${#files[@]} -gt 0 ] || { echo "no logs in $RUN_DIR" >&2; exit 1; }
           tail -n 40 -f "${files[@]}" ;;
  *)       usage ;;
esac
exit $rc
