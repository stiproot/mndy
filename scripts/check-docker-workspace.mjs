#!/usr/bin/env node
// Docker/workspace drift guard — an app's image must copy and build every workspace
// package the app declares a dependency on.
//
// This exists because it already happened: extracting the MCP logic into packages/js/*
// added `analytics-core`, `ga4-core`, `meta-ads-core`, `shopify-core` and `github-core` as
// workspace dependencies, and not one Dockerfile was updated. Every MCP image was broken
// for two commits and nothing noticed, because `bun run build` compiles from the workspace
// on disk and never exercises an image.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** Workspace dependencies declared by a manifest. */
function workspaceDeps(manifestPath) {
  const deps = readJson(manifestPath).dependencies ?? {};
  return Object.entries(deps)
    .filter(([, spec]) => String(spec).startsWith("workspace"))
    .map(([name]) => name);
}

function packageDir(name) {
  const candidate = join("packages", "js", name);
  return existsSync(join(root, candidate, "package.json")) ? candidate : null;
}

/** Every workspace package an app needs, transitively. */
function closure(app) {
  const seen = new Set();
  const walk = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const dir = packageDir(name);
    if (!dir) return;
    for (const dep of workspaceDeps(join(root, dir, "package.json"))) walk(dep);
  };
  for (const dep of workspaceDeps(join(root, "apps", app, "package.json"))) walk(dep);
  return [...seen].filter(packageDir);
}

export function checkDockerWorkspace() {
  const violations = [];
  const appsPath = join(root, "apps");

  for (const entry of readdirSync(appsPath, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const app = entry.name;
    const dockerfile = join(appsPath, app, "Dockerfile");
    const manifest = join(appsPath, app, "package.json");
    if (!existsSync(dockerfile) || !existsSync(manifest)) continue;

    const contents = readFileSync(dockerfile, "utf8");
    // Only images built from the repo root can copy sibling packages at all.
    if (!contents.includes("COPY package.json") && !contents.includes("COPY --parents")) continue;

    for (const pkg of closure(app)) {
      const dir = packageDir(pkg);
      if (!contents.includes(`COPY ${dir}/ ./${dir}/`)) {
        violations.push(`apps/${app}/Dockerfile does not COPY ${dir}/ — required by ${app}.`);
      }
      if (!contents.includes(`--cwd ${dir} build`)) {
        violations.push(`apps/${app}/Dockerfile does not build ${dir} before the app.`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("✗ check-docker-workspace: image is missing a workspace dependency.\n");
    for (const violation of violations) console.error(`  ${violation}`);
    console.error("\n  An app's image must COPY and build every workspace package it depends on,");
    console.error("  dependencies before dependents.");
    return 1;
  }

  console.log("✓ check-docker-workspace: every image copies its workspace dependencies.");
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkDockerWorkspace());
}
