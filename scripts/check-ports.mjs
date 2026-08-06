#!/usr/bin/env node
// Port-collision guard — fail LOUDLY when two apps claim the same default port.
//
// This exists because `ui-api` and `github-issues-mcp` both defaulted to 3001 for months:
// `make run-ui-api` and `make run-github-issues-mcp` could not both run, and nothing said
// so. The truth lives in each app's `.env.template` (`PORT=<n>`), which is also what the
// Makefile targets and the compose services inherit.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Ports owned by infrastructure we do not control, reserved so no app may claim them. */
const RESERVED = new Map([
  [3500, "Dapr sidecar HTTP"],
  [50000, "Dapr placement"],
  [27017, "MongoDB"],
  [5672, "RabbitMQ"],
  [9411, "Zipkin"],
]);

function appDirs() {
  const appsPath = join(root, "apps");
  if (!existsSync(appsPath)) return [];
  return readdirSync(appsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(appsPath, entry.name));
}

/** Read `PORT=<n>` out of an app's .env.template. Returns null when the app declares none. */
function declaredPort(appDir) {
  const template = join(appDir, ".env.template");
  if (!existsSync(template)) return null;
  const match = readFileSync(template, "utf8").match(/^\s*PORT\s*=\s*(\d+)\s*$/m);
  return match ? { port: Number(match[1]), file: template } : null;
}

export function checkPorts() {
  const claims = new Map();
  const violations = [];

  for (const appDir of appDirs()) {
    const declared = declaredPort(appDir);
    if (!declared) continue;

    const name = relative(root, appDir);
    const reserved = RESERVED.get(declared.port);
    if (reserved) {
      violations.push(`${name} claims ${declared.port}, reserved for ${reserved}.`);
      continue;
    }

    const existing = claims.get(declared.port);
    if (existing) {
      violations.push(
        `${name} and ${existing} both claim port ${declared.port}. ` +
          `They cannot run at the same time — give one of them a free port.`,
      );
      continue;
    }
    claims.set(declared.port, name);
  }

  if (violations.length > 0) {
    console.error("✗ check-ports: conflicting default ports.\n");
    for (const violation of violations) console.error(`  ${violation}`);
    console.error("\n  Ports are declared as PORT=<n> in each app's .env.template.");
    return 1;
  }

  const summary = [...claims.entries()]
    .sort(([a], [b]) => a - b)
    .map(([port, name]) => `${port} ${name}`)
    .join(", ");
  console.log(`✓ check-ports: ${claims.size} apps, no collisions (${summary}).`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkPorts());
}
