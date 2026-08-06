#!/usr/bin/env node
// Secret guard — fail LOUDLY when a real credential is about to be committed.
//
// This exists because judgement is a bad detector. During the monorepo migration a tracked
// `.core.env` holding the literal placeholder `<<azdo-pat>>` was reported as a leaked Azure
// DevOps PAT requiring rotation; it wasn't, and the false alarm cost more than a real one
// would have. The rules below match on the SHAPE of each provider's token — length, prefix,
// alphabet — so a placeholder (`ghp_xxxx…`, `<<azdo-pat>>`, `your-token-here`) is not a
// finding and a real token is.
//
// Scans files tracked by git in the working tree. History is not scanned: rewriting it is
// almost never the right response, and the point is to stop the NEXT leak.

import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_BYTES = 2_000_000;

/**
 * Each rule matches a credential format precisely enough that placeholders fall out.
 * `refine` gets the matched text for the cases where shape alone is not decisive.
 */
const RULES = [
  {
    name: "Meta access token",
    pattern: /\bEAA[A-Za-z0-9]{40,}\b/g,
  },
  {
    name: "Shopify Admin API token",
    pattern: /\bshpat_[a-f0-9]{32}\b/g,
  },
  {
    name: "Shopify app secret",
    pattern: /\bshpss_[a-f0-9]{32}\b/g,
  },
  {
    name: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs)_[A-Za-z0-9]{36}\b/g,
  },
  {
    name: "GitHub fine-grained PAT",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/g,
  },
  {
    name: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    name: "AWS access key id",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: "Slack token",
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
  },
  {
    name: "Private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    name: "Azure DevOps PAT",
    // 52 chars of base32-ish. Common English words hit this rarely, but require some
    // digit content so a long lowercase prose run cannot trip it.
    pattern: /\b[a-z2-7]{52}\b/g,
    refine: (match) => /[2-7]/.test(match),
  },
];

/**
 * A match is a placeholder when it is visibly filler: a run of one repeated character,
 * or it contains an obvious stand-in word. Real tokens are high-variety.
 */
function isPlaceholder(match) {
  const body = match.replace(/^[A-Za-z_]+_/, "");
  const distinct = new Set(body).size;
  if (distinct <= 2) return true;
  return /\b(x{6,}|your|example|sample|placeholder|dummy|fake|redacted|changeme|replace)\b/i.test(
    match,
  );
}

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: root, maxBuffer: 64 * 1024 * 1024 })
    .toString()
    .split("\0")
    .filter(Boolean);
}

export function checkSecrets() {
  const findings = [];

  for (const relative of trackedFiles()) {
    const absolute = join(root, relative);

    let contents;
    try {
      if (statSync(absolute).size > MAX_BYTES) continue;
      contents = readFileSync(absolute, "utf8");
    } catch {
      continue; // deleted, or binary/unreadable — nothing to scan
    }
    if (contents.indexOf("\u0000") !== -1) continue; // binary

    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      for (const match of contents.matchAll(rule.pattern)) {
        const value = match[0];
        if (isPlaceholder(value)) continue;
        if (rule.refine && !rule.refine(value)) continue;

        const line = contents.slice(0, match.index).split("\n").length;
        findings.push({ file: relative, line, rule: rule.name });
      }
    }
  }

  if (findings.length > 0) {
    console.error("✗ check-secrets: real credentials found in tracked files.\n");
    for (const finding of findings) {
      console.error(`  ${finding.file}:${finding.line}  ${finding.rule}`);
    }
    console.error(
      "\n  Remove the value, move it to a gitignored .env, and ROTATE it — it is already" +
        "\n  in your working tree and may be in history.",
    );
    return 1;
  }

  console.log("✓ check-secrets: no real credentials in tracked files.");
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(checkSecrets());
}
