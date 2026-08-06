#!/usr/bin/env node
// Workspace guard — this repo is ONE bun workspace and ONE uv workspace. Every package
// manifest belongs to one of them, or is explicitly excluded on purpose.
//
// Two failure modes this catches, both of which had already happened:
//
//   1. A manifest nobody owns. `apps/ui/src/ui/package.json` was a two-file artifact of
//      running `vue add quasar` in the wrong directory — outside both workspaces, with its
//      own npm lockfile, declaring a dependency that was already declared correctly one
//      level up. Invisible to `bun install`, and it sat there for months.
//   2. A second package manager. A stray package-lock.json or yarn.lock means some part of
//      the repo resolves dependencies differently from the rest, which is how the azdo
//      image ended up unbuildable: bun tolerated a peer conflict npm would not.
//
// Python members are globbed by convention (`apps/*-worker`), so a new worker joins by
// existing. This checks that no pyproject.toml falls outside those globs.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Manifests deliberately outside the workspaces, with the reason.
 * Anything here is unmanaged: `bun install` will not touch it.
 */
const EXCLUDED = new Map([
  ["tools/d3-lab", "legacy d3 sandbox — not built, not deployed, deliberately unmanaged"],
  ["tools/d3-lab/lab/d3-lab", "nested copy inside the same legacy sandbox"],
]);

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".venv", ".turbo", "secrets"]);

function findManifests(name) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        walk(join(dir, entry.name));
      } else if (entry.name === name) {
        found.push(relative(root, dir) || ".");
      }
    }
  };
  walk(root);
  return found;
}

/** Turn a workspace glob into a matcher. Only `*` at one path segment is used here. */
const globMatches = (glob, path) =>
  new RegExp(`^${glob.replace(/\*/g, "[^/]+")}$`).test(path);

function uvMembers() {
  const contents = readFileSync(join(root, "pyproject.toml"), "utf8");
  const block = contents.match(/\[tool\.uv\.workspace\][\s\S]*?members\s*=\s*\[([\s\S]*?)\]/);
  if (!block) return [];
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

export function checkWorkspaces() {
  const violations = [];

  // --- bun ---
  const bunGlobs = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).workspaces ?? [];
  for (const dir of findManifests("package.json")) {
    if (dir === ".") continue;
    if (EXCLUDED.has(dir)) continue;
    if (bunGlobs.some((glob) => globMatches(glob, dir))) continue;
    violations.push(
      `${dir}/package.json is in no bun workspace. Move it under apps/ or packages/js/, ` +
        `or add it to EXCLUDED in this script with a reason.`,
    );
  }

  // --- uv ---
  const pyGlobs = uvMembers();
  for (const dir of findManifests("pyproject.toml")) {
    if (dir === ".") continue;
    if (EXCLUDED.has(dir)) continue;
    if (pyGlobs.some((glob) => globMatches(glob, dir))) continue;
    violations.push(
      `${dir}/pyproject.toml is in no uv workspace member glob (${pyGlobs.join(", ")}).`,
    );
  }

  // --- one package manager ---
  for (const lockfile of ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"]) {
    for (const dir of findManifests(lockfile)) {
      if (EXCLUDED.has(dir)) continue;
      violations.push(
        `${dir}/${lockfile} — this repo installs with bun. Delete it; bun.lock at the root ` +
          `is the only lockfile.`,
      );
    }
  }

  // --- the root lockfile exists ---
  if (!existsSync(join(root, "bun.lock"))) {
    violations.push("bun.lock is missing from the repo root.");
  }

  if (violations.length > 0) {
    console.error("✗ check-workspaces: a package is outside the workspaces.\n");
    for (const violation of violations) console.error(`  ${violation}`);
    return 1;
  }

  const jsCount = findManifests("package.json").length - 1 - EXCLUDED.size;
  const pyCount = findManifests("pyproject.toml").length - 1;
  console.log(
    `✓ check-workspaces: ${jsCount} bun members, ${pyCount} uv members, one lockfile, ` +
      `${EXCLUDED.size} deliberate exclusions.`,
  );
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkWorkspaces());
}
