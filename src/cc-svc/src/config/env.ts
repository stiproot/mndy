import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3002"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Required
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  GITHUB_ISSUES_MCP_URL: z.string().url("GITHUB_ISSUES_MCP_URL must be a valid URL"),

  // Optional with defaults
  CLAUDE_MODEL: z.string().default("claude-sonnet-4-5-20250929"),
  GITHUB_TOKEN: z.string().optional(),

  // Agent limits
  MAX_ORCHESTRATOR_TURNS: z.coerce.number().default(10),
  MAX_SUBAGENT_TURNS: z.coerce.number().default(5),
  MAX_BUDGET_USD: z.coerce.number().default(1.0),
  MAX_SUBAGENT_BUDGET_USD: z.coerce.number().default(0.25),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    for (const error of result.error.errors) {
      console.error(`  ${error.path.join(".")}: ${error.message}`);
    }
    process.exit(1);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function getConfig(): EnvConfig {
  if (!cachedConfig) {
    return validateEnv();
  }
  return cachedConfig;
}
