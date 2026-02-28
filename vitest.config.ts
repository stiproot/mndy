import { defineConfig, loadEnv } from "vitest/config";

export default defineConfig(({ mode }) => {
  // Load test environment variables from tests/.env.test
  const env = loadEnv(mode, "tests", "");

  return {
    test: {
      globals: true,
      environment: "node",
      include: ["tests/**/*.test.ts"],
      testTimeout: 60000, // 60s timeout for integration tests
      hookTimeout: 30000, // 30s timeout for setup/teardown
      env,
    },
  };
});
