#!/usr/bin/env bun
/**
 * Meta Access Token Refresh Script
 *
 * Refreshes a Meta (Facebook) access token and updates the .env file.
 * Supports both user tokens (60-day) and system user tokens.
 *
 * Usage:
 *   bun run refresh-meta-token [options]
 *
 * Options:
 *   --env-file=<path>  Path to .env file (default: src/meta-ads-mcp/.env)
 *   --app-id=<id>      Meta App ID (reads from .env if not provided)
 *   --app-secret=<secret> Meta App Secret (reads from .env if not provided)
 *   --token=<token>    Current access token (reads from .env if not provided)
 *   --dry-run          Print new token without updating .env
 *
 * Examples:
 *   bun run refresh-meta-token
 *   bun run refresh-meta-token --env-file=src/meta-ads-mcp/.env
 *   bun run refresh-meta-token --dry-run
 *
 * Prerequisites:
 *   - META_APP_ID and META_APP_SECRET must be in .env file
 *   - META_ACCESS_TOKEN must be in .env file (the token to refresh)
 *
 * Note: Short-lived tokens (1-2 hours) from Graph API Explorer cannot be refreshed.
 *       This script works with long-lived user tokens and system user tokens.
 */

import { resolve, dirname } from "path";
import crypto from "crypto";

interface ParsedArgs {
  envFilePath: string;
  appId?: string;
  appSecret?: string;
  currentToken?: string;
  dryRun: boolean;
  verifyOnly: boolean;
  skipVerify: boolean;
}

interface TokenInfo {
  isValid: boolean;
  type?: string;
  appId?: string;
  application?: string;
  expiresAt?: number;
  dataAccessExpiresAt?: number;
  scopes?: string[];
  error?: string;
}

/**
 * Find repository root by going up from the script directory
 */
function getRepoRoot(): string {
  // Script is in scripts/src/, so go up 2 levels to get to repo root
  return resolve(import.meta.dir, "../..");
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const repoRoot = getRepoRoot();
  const parsed: ParsedArgs = {
    envFilePath: resolve(repoRoot, "src/meta-ads-mcp/.env"),
    dryRun: false,
    verifyOnly: false,
    skipVerify: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--env-file=")) {
      const envPath = arg.split("=")[1];
      // If path is absolute, use as-is; otherwise resolve from repo root
      parsed.envFilePath = envPath.startsWith("/")
        ? envPath
        : resolve(repoRoot, envPath);
    } else if (arg.startsWith("--app-id=")) {
      parsed.appId = arg.split("=")[1];
    } else if (arg.startsWith("--app-secret=")) {
      parsed.appSecret = arg.split("=")[1];
    } else if (arg.startsWith("--token=")) {
      parsed.currentToken = arg.split("=")[1];
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--verify" || arg === "--verify-only") {
      parsed.verifyOnly = true;
    } else if (arg === "--no-verify") {
      parsed.skipVerify = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: bun run refresh-meta-token [options]");
      console.log("\nOptions:");
      console.log("  --env-file=<path>     Path to .env file (default: src/meta-ads-mcp/.env)");
      console.log("  --app-id=<id>         Meta App ID");
      console.log("  --app-secret=<secret> Meta App Secret");
      console.log("  --token=<token>       Current access token");
      console.log("  --verify, --verify-only  Check the current token's status and exit (no refresh)");
      console.log("  --no-verify           Write the new token without verifying it first");
      console.log("  --dry-run             Print new token without updating .env");
      console.log("  --help, -h            Show this help message");
      process.exit(0);
    }
  }

  return parsed;
}

/**
 * Load environment variables from .env file
 */
async function loadEnv(envPath: string): Promise<Record<string, string>> {
  const file = Bun.file(envPath);

  if (!(await file.exists())) {
    throw new Error(`Environment file not found: ${envPath}`);
  }

  const content = await file.text();
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    const key = trimmed.substring(0, equalIndex).trim();
    const value = trimmed.substring(equalIndex + 1).trim();

    env[key] = value;
  }

  return env;
}

/**
 * Update .env file with new token
 */
async function updateEnvFile(envPath: string, newToken: string): Promise<void> {
  const file = Bun.file(envPath);
  const content = await file.text();
  const lines = content.split("\n");

  const updatedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith("META_ACCESS_TOKEN=")) {
      return `META_ACCESS_TOKEN=${newToken}`;
    }
    return line;
  });

  await Bun.write(envPath, updatedLines.join("\n"));
}

/**
 * Calculate HMAC-SHA256 for appsecret_proof
 */
function calculateAppSecretProof(accessToken: string, appSecret: string): string {
  return crypto
    .createHmac("sha256", appSecret)
    .update(accessToken)
    .digest("hex");
}

/**
 * Inspect a token via the debug_token endpoint. Works even for EXPIRED tokens —
 * it reports validity, type, expiry, and granted scopes rather than just failing.
 */
async function verifyToken(
  appId: string,
  appSecret: string,
  token: string
): Promise<TokenInfo> {
  const url = new URL("https://graph.facebook.com/v21.0/debug_token");
  url.searchParams.set("input_token", token);
  // App access token: "<app_id>|<app_secret>"
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const response = await fetch(url.toString());
  const body = await response.json();

  if (!response.ok || !body.data) {
    return {
      isValid: false,
      error: body.error?.message || `debug_token failed (HTTP ${response.status})`,
    };
  }

  const d = body.data;
  return {
    isValid: Boolean(d.is_valid),
    type: d.type,
    appId: d.app_id,
    application: d.application,
    expiresAt: d.expires_at,
    dataAccessExpiresAt: d.data_access_expires_at,
    scopes: d.scopes,
    error: d.error?.message,
  };
}

/**
 * Print a human-readable summary of a TokenInfo.
 */
function printTokenInfo(label: string, info: TokenInfo): void {
  console.log(`\n${label}`);
  console.log(`  Valid:   ${info.isValid ? "✅ yes" : "❌ no"}`);
  if (info.type) console.log(`  Type:    ${info.type}`);
  if (info.application) console.log(`  App:     ${info.application} (${info.appId ?? "?"})`);
  if (info.scopes?.length) console.log(`  Scopes:  ${info.scopes.join(", ")}`);
  const fmt = (t?: number) =>
    !t ? "never (permanent)" : new Date(t * 1000).toISOString();
  if (info.expiresAt !== undefined) console.log(`  Expires: ${fmt(info.expiresAt)}`);
  if (info.dataAccessExpiresAt !== undefined)
    console.log(`  Data access expires: ${fmt(info.dataAccessExpiresAt)}`);
  if (info.error) console.log(`  Note:    ${info.error}`);
}

/**
 * Refresh Meta access token using the token refresh API
 */
async function refreshToken(
  appId: string,
  appSecret: string,
  currentToken: string
): Promise<{ accessToken: string; expiresIn?: number; tokenType: string }> {
  // First try: Token exchange for long-lived tokens
  const exchangeUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  exchangeUrl.searchParams.set("grant_type", "fb_exchange_token");
  exchangeUrl.searchParams.set("client_id", appId);
  exchangeUrl.searchParams.set("client_secret", appSecret);
  exchangeUrl.searchParams.set("fb_exchange_token", currentToken);

  console.log("Attempting to exchange token for long-lived version...");

  try {
    const response = await fetch(exchangeUrl.toString());

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Token exchange failed:", errorData);

      // If token exchange fails, try the refresh endpoint
      return await refreshSystemUserToken(appId, appSecret, currentToken);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type || "Bearer",
    };
  } catch (error) {
    console.error("Error during token exchange:", error);
    throw new Error("Failed to exchange token");
  }
}

/**
 * Refresh system user token using the refresh API
 */
async function refreshSystemUserToken(
  appId: string,
  appSecret: string,
  currentToken: string
): Promise<{ accessToken: string; expiresIn?: number; tokenType: string }> {
  console.log("Attempting system user token refresh...");

  const refreshUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  refreshUrl.searchParams.set("grant_type", "fb_refresh_token");
  refreshUrl.searchParams.set("fb_refresh_token", currentToken);
  refreshUrl.searchParams.set("client_id", appId);
  refreshUrl.searchParams.set("client_secret", appSecret);

  try {
    const response = await fetch(refreshUrl.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Token refresh failed: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type || "Bearer",
    };
  } catch (error) {
    console.error("Error during token refresh:", error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs();

  console.log("🔄 Meta Access Token Refresh Tool\n");
  console.log(`Environment file: ${args.envFilePath}`);

  // Load environment variables
  const env = await loadEnv(args.envFilePath);

  // Get credentials
  const appId = args.appId || env.META_APP_ID;
  const appSecret = args.appSecret || env.META_APP_SECRET;
  const currentToken = args.currentToken || env.META_ACCESS_TOKEN;

  // Validate credentials
  if (!appId) {
    throw new Error("META_APP_ID not found. Set it in .env or pass --app-id");
  }
  if (!appSecret) {
    throw new Error("META_APP_SECRET not found. Set it in .env or pass --app-secret");
  }
  if (!currentToken) {
    throw new Error("META_ACCESS_TOKEN not found. Set it in .env or pass --token");
  }

  console.log(`App ID: ${appId}`);
  console.log(`Current token: ${currentToken.substring(0, 20)}...`);

  // Inspect the current token first (works even if expired)
  try {
    const info = await verifyToken(appId, appSecret, currentToken);
    printTokenInfo("Current token status:", info);
    if (info.isValid && info.type === "USER" && info.expiresAt) {
      console.log(
        "\n💡 This is a USER token with an expiry. Consider a System User token for a permanent credential."
      );
    }
  } catch (error) {
    console.warn(
      `\n⚠️  Could not verify current token: ${error instanceof Error ? error.message : error}`
    );
  }

  if (args.verifyOnly) {
    console.log("\n🔍 Verify-only mode — no refresh attempted.");
    return;
  }
  console.log();

  // Refresh the token
  try {
    const result = await refreshToken(appId, appSecret, currentToken);

    console.log("✅ Token refreshed successfully!\n");
    console.log(`New token: ${result.accessToken.substring(0, 20)}...`);

    if (result.expiresIn) {
      const expiryDays = Math.floor(result.expiresIn / 86400);
      console.log(`Expires in: ${expiryDays} days (${result.expiresIn} seconds)`);
    } else {
      console.log("Token type: Permanent (no expiry)");
    }

    // Confirm the new token is actually valid before writing it to .env.
    // A token we could not verify is treated the same as one that verified
    // invalid: we do not write it. Otherwise a transient debug_token failure
    // would silently install an unchecked credential.
    //
    // The gate only guards the write — under --dry-run (which writes nothing)
    // we report the verification result and still print the token.
    if (args.skipVerify) {
      console.log("\n⏭️  Skipping verification of the new token (--no-verify).");
    } else {
      let verified = false;
      try {
        const newInfo = await verifyToken(appId, appSecret, result.accessToken);
        printTokenInfo("New token status:", newInfo);
        verified = newInfo.isValid;
        if (!verified) {
          console.warn("\n⚠️  The new token did not verify as valid.");
        }
      } catch (error) {
        console.warn(
          `\n⚠️  Could not verify new token: ${error instanceof Error ? error.message : error}`
        );
      }

      if (!verified && !args.dryRun) {
        console.warn("⚠️  Not updating .env.");
        console.log(
          "\n💡 The exchange itself succeeded — re-run to try again, add --dry-run to print\n" +
            "   the token without writing, or --no-verify to write it unverified."
        );
        process.exit(1);
      }
    }

    if (args.dryRun) {
      console.log("\n🔍 Dry run mode - .env file not updated");
      console.log(`\nNew token (full):\n${result.accessToken}`);
    } else {
      await updateEnvFile(args.envFilePath, result.accessToken);
      console.log(`\n✅ Updated ${args.envFilePath}`);
    }
  } catch (error) {
    console.error("\n❌ Failed to refresh token");
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }

    console.log("\n💡 Troubleshooting:");
    console.log("  - Ensure META_APP_ID and META_APP_SECRET are correct");
    console.log("  - Short-lived tokens (1-2 hours) from Graph API Explorer cannot be refreshed");
    console.log("  - Generate a new token manually if refresh continues to fail");
    console.log("  - For permanent tokens, use system users: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/");

    process.exit(1);
  }
}

main().catch(console.error);
