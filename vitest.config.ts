import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from tests directory
const envResult = config({ path: resolve(__dirname, "tests/.env") });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000, // 60s timeout for integration tests
    hookTimeout: 30000, // 30s timeout for setup/teardown
    env: envResult.parsed || {},
  },
});
