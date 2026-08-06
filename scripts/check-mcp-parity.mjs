#!/usr/bin/env node
// MCP parity guard — every MCP server must be reachable, documented, and honest about
// whether it needs infrastructure.
//
// Three kinds of drift this catches, all of which had already happened at least once:
//
//   1. A server exists but is wired up nowhere. `google-ads-mcp` sat in the tree for
//      months as a single orphaned types.ts: no package.json, no Makefile target, no
//      plugin entry, invisible to every build.
//   2. A server is documented as infrastructure-free while depending on Dapr. The whole
//      value of "Mode 1" is that claim; prose alone cannot keep it true.
//   3. A server is registered in the plugin's .mcp.json on a port no app actually serves.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PLUGIN_MCP_JSON = join(
  root,
  "plugin-marketplace/plugins/mndy-mcp/.mcp.json",
);
const README = join(root, "README.md");
const MAKEFILE = join(root, "Makefile");

/** Servers that legitimately require infrastructure. Everything else must not. */
const INFRA_SERVERS = new Set(["dapr-mcp"]);

/** Packages whose presence in an app's dependencies implies a Dapr requirement. */
const INFRA_DEPENDENCIES = ["dapr-core", "@dapr/dapr"];

function mcpApps() {
  const appsPath = join(root, "apps");
  if (!existsSync(appsPath)) return [];
  return readdirSync(appsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith("-mcp"))
    .map((entry) => entry.name);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function checkMcpParity() {
  const violations = [];
  const apps = mcpApps();
  const makefile = existsSync(MAKEFILE) ? readFileSync(MAKEFILE, "utf8") : "";
  const readme = existsSync(README) ? readFileSync(README, "utf8") : "";
  const pluginUrls = existsSync(PLUGIN_MCP_JSON)
    ? Object.values(readJson(PLUGIN_MCP_JSON).mcpServers ?? {}).map((s) => s.url ?? "")
    : [];

  const declaredPorts = new Set();

  for (const app of apps) {
    const appDir = join(root, "apps", app);
    const packageJsonPath = join(appDir, "package.json");

    if (!existsSync(packageJsonPath)) {
      violations.push(`apps/${app} has no package.json — it is in no workspace and cannot build.`);
      continue;
    }

    const pkg = readJson(packageJsonPath);
    const envTemplate = join(appDir, ".env.template");

    if (!existsSync(envTemplate)) {
      violations.push(`apps/${app} has no .env.template — its port and config are undiscoverable.`);
    } else {
      const port = readFileSync(envTemplate, "utf8").match(/^\s*PORT\s*=\s*(\d+)\s*$/m);
      if (port) declaredPorts.add(port[1]);
    }

    if (!existsSync(join(appDir, "README.md"))) {
      violations.push(`apps/${app} has no README.md.`);
    }

    if (!makefile.includes(`run-${app}:`)) {
      violations.push(`apps/${app} has no \`make run-${app}\` target.`);
    }

    // The load-bearing claim: infra-free means infra-free.
    const dependencies = Object.keys(pkg.dependencies ?? {});
    const usesInfra = INFRA_DEPENDENCIES.some((dep) => dependencies.includes(dep));
    if (usesInfra && !INFRA_SERVERS.has(app)) {
      violations.push(
        `apps/${app} depends on Dapr but is documented as needing no infrastructure. ` +
          `Either drop the dependency or add it to INFRA_SERVERS here AND to the README table.`,
      );
    }
    if (!usesInfra && INFRA_SERVERS.has(app)) {
      violations.push(
        `apps/${app} is listed as needing infrastructure but has no Dapr dependency — ` +
          `if that is no longer true, update the README table and INFRA_SERVERS.`,
      );
    }

    if (!readme.includes(`\`${app}\``)) {
      violations.push(`apps/${app} is missing from the README's infrastructure table.`);
    }
  }

  // Every port the plugin points at must be served by some app.
  for (const url of pluginUrls) {
    const port = url.match(/localhost:(\d+)/)?.[1];
    if (port && !declaredPorts.has(port)) {
      violations.push(
        `The mndy-mcp plugin registers a server on port ${port}, which no app declares.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("✗ check-mcp-parity: MCP servers and their documentation have drifted.\n");
    for (const violation of violations) console.error(`  ${violation}`);
    return 1;
  }

  console.log(`✓ check-mcp-parity: ${apps.length} MCP servers, all wired and documented.`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkMcpParity());
}
