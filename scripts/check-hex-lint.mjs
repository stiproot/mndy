#!/usr/bin/env node
// Hex-lint coverage guard — fail LOUDLY when a TypeScript package has hexagonal source
// layers but its lint script does not run dependency-cruiser.
//
// The boundary rules in .dependency-cruiser.cjs are worthless if nothing invokes them.
// This guard makes adopting the layering and enforcing it the same act.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function packageJsonPaths(parent) {
  const parentPath = resolve(root, parent);
  if (!existsSync(parentPath)) return [];
  return readdirSync(parentPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(parentPath, entry.name, "package.json"))
    .filter(existsSync);
}

function lintLine(content) {
  const lines = content.split("\n");
  const index = lines.findIndex((line) => /"lint"\s*:/.test(line));
  return index === -1 ? 1 : index + 1;
}

/** Depth from a package dir to the repo root, as the depcruise --config argument needs it. */
function configArg(packageDir) {
  const depth = relative(root, packageDir).split("/").length;
  return `${"../".repeat(depth)}.dependency-cruiser.cjs`;
}

export function checkHexLint() {
  const violations = [];
  const packageJsons = [...packageJsonPaths("apps"), ...packageJsonPaths("packages/js")];

  for (const packageJson of packageJsons) {
    const packageDir = dirname(packageJson);
    const src = join(packageDir, "src");
    const hasHexLayer =
      existsSync(join(src, "domain")) || existsSync(join(src, "presentation"));
    if (!hasHexLayer) continue;

    const content = readFileSync(packageJson, "utf8");
    const pkg = JSON.parse(content);
    if (!String(pkg.scripts?.lint ?? "").includes("depcruise --config")) {
      violations.push({
        file: relative(root, packageJson),
        line: lintLine(content),
        fix: `depcruise --config ${configArg(packageDir)} src`,
      });
    }
  }

  if (violations.length > 0) {
    console.error(
      "✗ check-hex-lint: TypeScript hex package missing dependency-cruiser lint coverage.\n",
    );
    for (const violation of violations) {
      console.error(`  ${violation.file}:${violation.line}`);
      console.error(`  Fix: append \` && ${violation.fix}\` to scripts.lint.\n`);
    }
    return 1;
  }

  console.log("✓ check-hex-lint: every hex package runs dependency-cruiser.");
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkHexLint());
}
