/**
 * The reporting semantics an agent must know to report these numbers honestly.
 *
 * This lives beside `kpis.ts` because it documents that module's actual contract — what
 * `undefined` means, what a metric's units are — rather than being loose advice. It is
 * shipped to clients as MCP server `instructions`, so it reaches Claude Desktop, Claude
 * Code and anything else with zero installation on the user's part.
 *
 * Keep it short. `instructions` is sent on every connect and competes for attention with
 * everything else in the context; the long-form workflow guidance belongs in the skill.
 */
export const REPORTING_SEMANTICS = `
Reporting rules for this data:

- A KPI returned as null means NOT COMPUTABLE — an input was missing, or the denominator
  was zero. It does not mean zero. Say "not available" rather than reporting 0.
- Money is in the advertising account's or store's own currency. Do not add a currency
  symbol unless the tool told you the currency, and never assume dollars.
- Never combine amounts from accounts in different currencies into one total.
- Percentages (CTR, conversion rate) are already percentages, not fractions.
- These tools are read-only. They cannot change budgets, pause campaigns or edit anything.
`.trim();

/**
 * Multi-account targeting, stated once.
 *
 * The per-call override is the reason one running server serves every brand, and getting
 * it wrong means answering a question about one brand with another's numbers — the single
 * worst failure available to this system.
 */
export const BRAND_TARGETING = `
Targeting a specific brand or account:

- Pass the account id on the call itself; do not ask the user to restart anything.
- If the user names a brand you have no id for, ask rather than falling back to the
  server's default — reporting the wrong account's numbers is worse than asking.
`.trim();

/** Compose a server's instructions from a lead paragraph plus the shared rules. */
export const buildInstructions = (
  summary: string,
  extra: readonly string[] = [],
): string => [summary.trim(), ...extra.map((s) => s.trim()), REPORTING_SEMANTICS].join("\n\n");
