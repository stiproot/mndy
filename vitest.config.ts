import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000, // 60s timeout for integration tests
    hookTimeout: 30000, // 30s timeout for setup/teardown
    envFile: "tests/.env",
  },
});
