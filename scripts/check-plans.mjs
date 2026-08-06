#!/usr/bin/env node
// Plan hygiene guard — plans are how outstanding work survives a session ending, so a plan
// that lies about its state is worse than no plan.
//
// Enforces what CLAUDE.md's Plans section promises:
//   - every plan declares Status: and Established:
//   - Status is from the vocabulary
//   - a Deferred plan names what brings it back (Revisit when:)
//   - an archived plan says where its lasting context went (Lifted to:)
//   - a Complete plan is not left sitting in the active directory
//   - every docs/plans path cited from OUTSIDE docs/plans still resolves
//
// That last rule is the one that bites: archiving a plan silently rots every citation of
// it, and citations live in steering docs and code comments that nobody re-reads.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(root, "docs", "plans");
const ARCHIVE = join(PLANS, "impl");

const STATUSES = ["Planning", "Active", "Blocked", "Deferred", "Complete"];
/** Docs that live under plans/ but are not themselves plans. */
const NOT_PLANS = new Set(["docs/plans/impl/README.md"]);

function markdownFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownFiles(path));
    else if (entry.name.endsWith(".md")) found.push(path);
  }
  return found;
}

/** A plan directory's README carries the plan-level status; its parts carry their own. */
const isPlan = (path) => !NOT_PLANS.has(relative(root, path));

export function checkPlans() {
  const violations = [];
  if (!existsSync(PLANS)) return 0;

  for (const path of markdownFiles(PLANS)) {
    if (!isPlan(path)) continue;
    const rel = relative(root, path);
    const body = readFileSync(path, "utf8");

    const status = body.match(/^Status:\s*(\w+)/m);
    if (!status) {
      violations.push(`${rel}: no "Status:" line (one of ${STATUSES.join(" | ")}).`);
      continue;
    }
    if (!STATUSES.includes(status[1])) {
      violations.push(`${rel}: Status "${status[1]}" is not in ${STATUSES.join(" | ")}.`);
    }
    if (!/^Established:/m.test(body)) {
      violations.push(`${rel}: no "Established:" line.`);
    }
    if (status[1] === "Deferred" && !/^Revisit when:/m.test(body)) {
      violations.push(
        `${rel}: Deferred plans must carry "Revisit when:" naming what brings them back.`,
      );
    }

    const archived = path.startsWith(ARCHIVE);
    // A split plan is a directory: its README carries the plan-level "Lifted to", and the
    // numbered parts carry only their own status. Requiring it per part would be noise.
    const isPartOfSplitPlan =
      path.endsWith(".md") &&
      !path.endsWith("README.md") &&
      existsSync(join(dirname(path), "README.md"));

    if (archived && !isPartOfSplitPlan && !/Lifted to/i.test(body)) {
      violations.push(`${rel}: archived, but does not say where its context was lifted to.`);
    }
    if (!archived && status[1] === "Complete") {
      violations.push(
        `${rel}: Complete but still in docs/plans/ — lift its lasting context, then move ` +
          `it to docs/plans/impl/.`,
      );
    }
  }

  // Citations from outside docs/plans must still resolve.
  const skip = new Set(["node_modules", ".git", "dist", ".venv", ".turbo", "docs"]);
  const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (skip.has(entry.name)) continue;
        walk(join(dir, entry.name), out);
      } else if (/\.(md|ts|mjs|js|sh)$/.test(entry.name)) out.push(join(dir, entry.name));
    }
    return out;
  };
  for (const file of walk(root)) {
    const body = readFileSync(file, "utf8");
    for (const match of body.matchAll(/docs\/plans\/[\w./-]+\.md/g)) {
      if (!existsSync(join(root, match[0]))) {
        violations.push(`${relative(root, file)} cites ${match[0]}, which does not exist.`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("✗ check-plans: a plan is malformed or a citation is broken.\n");
    for (const violation of [...new Set(violations)]) console.error(`  ${violation}`);
    return 1;
  }

  const active = markdownFiles(PLANS).filter((p) => !p.startsWith(ARCHIVE) && isPlan(p));
  console.log(
    `✓ check-plans: ${active.length} active, ` +
      `${markdownFiles(ARCHIVE).filter(isPlan).length} archived, all citations resolve.`,
  );
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkPlans());
}
