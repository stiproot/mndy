#!/usr/bin/env node
// Wire the analytics MCP servers into Claude Desktop.
//
// Desktop launches each server itself over stdio, so after this runs there is nothing to
// start, no port to remember and nothing to restart after a reboot.
//
// It MERGES into claude_desktop_config.json rather than writing it: that file may already
// hold servers this repo knows nothing about, and clobbering someone's existing setup to
// install ours would be unforgivable. A timestamped backup is taken before any write.

import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Servers offered to a Desktop user. Developer/infra servers are deliberately excluded. */
const SERVERS = [
  {
    app: "ga4-mcp",
    label: "Google Analytics 4",
    client: "mndy-ga4",
    credentials: [
      { key: "GA4_PROPERTY_ID", prompt: "GA4 property ID (numeric)", required: true },
      {
        key: "GOOGLE_APPLICATION_CREDENTIALS",
        prompt: "Path to the GA4 service-account JSON key",
        required: true,
        isPath: true,
      },
    ],
  },
  {
    app: "meta-ads-mcp",
    label: "Meta Ads (Facebook/Instagram)",
    client: "mndy-meta-ads",
    credentials: [
      { key: "META_ACCESS_TOKEN", prompt: "Meta access token", required: true, secret: true },
      { key: "META_AD_ACCOUNT_ID", prompt: "Meta ad account ID (act_…)", required: true },
    ],
  },
  {
    app: "google-ads-mcp",
    label: "Google Ads (paid search)",
    client: "mndy-google-ads",
    credentials: [
      { key: "GOOGLE_ADS_CLIENT_ID", prompt: "Google Ads OAuth client ID", required: true },
      { key: "GOOGLE_ADS_CLIENT_SECRET", prompt: "OAuth client secret", required: true, secret: true },
      { key: "GOOGLE_ADS_DEVELOPER_TOKEN", prompt: "Developer token", required: true, secret: true },
      { key: "GOOGLE_ADS_REFRESH_TOKEN", prompt: "OAuth refresh token", required: true, secret: true },
      { key: "GOOGLE_ADS_CUSTOMER_ID", prompt: "Customer ID (10 digits)", required: true },
      {
        key: "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
        prompt: "Manager (MCC) account ID — blank if none",
        required: false,
      },
    ],
  },
  {
    app: "shopify-mcp",
    label: "Shopify",
    client: "mndy-shopify",
    credentials: [
      { key: "SHOPIFY_CLIENT_ID", prompt: "Shopify client ID", required: true },
      { key: "SHOPIFY_CLIENT_SECRET", prompt: "Shopify client secret", required: true, secret: true },
      { key: "SHOPIFY_STORE_URL", prompt: "Store domain (store.myshopify.com)", required: true },
    ],
  },
];

/**
 * An ABSOLUTE path to the bun binary.
 *
 * Claude Desktop launches servers with a minimal environment — it is a GUI app, not a
 * login shell — so a bare `bun` frequently is not on PATH even when it works in a
 * terminal. Resolving it here means the config keeps working regardless.
 */
function bunPath() {
  try {
    return execFileSync("which", ["bun"], { encoding: "utf8" }).trim() || "bun";
  } catch {
    return "bun";
  }
}

/** Where Claude Desktop keeps its config, per OS. */
function desktopConfigPath() {
  const home = homedir();
  switch (platform()) {
    case "darwin":
      return join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
    case "win32":
      return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
    default:
      // Linux Desktop builds use the XDG location.
      return join(process.env.XDG_CONFIG_HOME ?? join(home, ".config"), "Claude", "claude_desktop_config.json");
  }
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const values = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

const isPlaceholder = (value) =>
  !value || /^<<.*>>$/.test(value) || /^(your|xxx+|changeme)/i.test(value);

/**
 * Ask a question, failing loudly if input has run out.
 *
 * `readline/promises` leaves a pending question unresolved when stdin reaches EOF, so the
 * process just exits 0 having silently done nothing — the worst possible outcome for an
 * installer, since the user is told nothing and believes it worked.
 */
async function ask(rl, prompt) {
  const answer = await Promise.race([
    rl.question(prompt),
    new Promise((_resolve, reject) =>
      rl.once("close", () => reject(new Error("input ended before the installer finished"))),
    ),
  ]);
  return answer;
}

async function main() {
  const configPath = desktopConfigPath();
  // --yes installs every server whose .env is already complete, without prompting. Useful
  // for re-running after a credential change, and the path the tests exercise.
  const nonInteractive = process.argv.includes("--yes") || process.argv.includes("-y");
  const rl = nonInteractive
    ? null
    : createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nmndy → Claude Desktop\n");
  console.log(`Config: ${configPath}`);
  if (nonInteractive) {
    console.log("Non-interactive: installing every server with a complete .env.\n");
  } else {
    console.log("Leave a server blank to skip it. Existing .env values are offered as defaults.\n");
  }

  const chosen = [];

  for (const server of SERVERS) {
    const envPath = join(root, "apps", server.app, ".env");
    const existing = readEnvFile(envPath);
    const configured = server.credentials
      .filter((c) => c.required)
      .every((c) => !isPlaceholder(existing[c.key]));

    if (nonInteractive) {
      if (!configured) {
        console.log(`  - ${server.label}: skipped, ${envPath} is incomplete`);
        continue;
      }
      const env = {};
      for (const credential of server.credentials) {
        const value = existing[credential.key];
        if (isPlaceholder(value)) continue;
        env[credential.key] = credential.isPath
          ? resolve(value.replace(/^~/, homedir()))
          : value;
      }
      console.log(`  + ${server.label}`);
      chosen.push({ server, env });
      continue;
    }

    const answer = (
      await ask(
        rl,
        `Install ${server.label}?${configured ? " [already configured]" : ""} (Y/n) `,
      )
    ).trim().toLowerCase();
    if (answer === "n" || answer === "no") continue;

    const env = {};
    let skip = false;

    for (const credential of server.credentials) {
      const current = existing[credential.key];
      const hasCurrent = !isPlaceholder(current);
      const shown = hasCurrent
        ? credential.secret
          ? " [keep existing]"
          : ` [${current}]`
        : "";

      const value = (await ask(rl, `  ${credential.prompt}${shown}: `)).trim();
      const resolved = value || (hasCurrent ? current : "");

      if (!resolved && credential.required) {
        console.log(`  → skipping ${server.label}: ${credential.key} is required.\n`);
        skip = true;
        break;
      }
      if (resolved) {
        env[credential.key] = credential.isPath ? resolve(resolved.replace(/^~/, homedir())) : resolved;
      }
    }
    if (skip) continue;

    // Warn rather than fail: a wrong path is recoverable, and stopping the whole install
    // over one is worse than letting the user fix it after.
    for (const credential of server.credentials) {
      if (credential.isPath && env[credential.key] && !existsSync(env[credential.key])) {
        console.log(`  ! warning: ${env[credential.key]} does not exist`);
      }
    }

    chosen.push({ server, env });
    console.log("");
  }

  rl?.close();

  if (chosen.length === 0) {
    console.log("Nothing selected — no changes made.");
    return 0;
  }

  // Write each server's .env so the HTTP/dev path keeps working from the same credentials.
  for (const { server, env } of chosen) {
    const envPath = join(root, "apps", server.app, ".env");
    const merged = { ...readEnvFile(envPath), ...env };
    const body = Object.entries(merged)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    writeFileSync(envPath, `${body}\n`, { mode: 0o600 });
  }

  // Merge into the Desktop config.
  let config = {};
  if (existsSync(configPath)) {
    const backup = `${configPath}.mndy-backup-${Date.now()}`;
    copyFileSync(configPath, backup);
    try {
      config = JSON.parse(readFileSync(configPath, "utf8"));
    } catch {
      console.error(`\n! ${configPath} is not valid JSON. Backed up to ${backup}.`);
      console.error("  Fix or remove it and run this again — refusing to overwrite it blind.");
      return 1;
    }
    console.log(`Backed up existing config to ${backup}`);
  } else {
    mkdirSync(dirname(configPath), { recursive: true });
  }

  config.mcpServers ??= {};
  const runtime = bunPath();
  for (const { server, env } of chosen) {
    config.mcpServers[server.client] = {
      command: runtime,
      args: [join(root, "apps", server.app, "dist", "index.js")],
      // Credentials are passed via `env` below, but setting cwd means the server also
      // picks up its own .env — so a credential added there later works without
      // re-running this installer.
      cwd: join(root, "apps", server.app),
      env: { ...env, MCP_TRANSPORT: "stdio" },
    };
  }

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

  console.log(`\n✓ Wrote ${chosen.length} server(s) to ${configPath}`);
  for (const { server } of chosen) console.log(`    ${server.client}  (${server.label})`);
  console.log("\nOther servers already in that file were left untouched.");
  console.log("\nNext: quit Claude Desktop completely and reopen it. Then ask something like");
  console.log('  "How did our ads perform last week?"\n');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`\ninstall-desktop failed: ${error.message}`);
    process.exit(1);
  },
);
