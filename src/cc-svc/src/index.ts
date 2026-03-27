import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/index.js";
import { validateEnv } from "./config/index.js";

// Validate environment on startup
const config = validateEnv();

const app: Express = express();
const PORT = config.PORT;
const BASE_PATH = "/cc-svc";

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use(BASE_PATH, router);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`cc-svc running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}${BASE_PATH}/health`);
  console.log(`  Chat: POST http://localhost:${PORT}${BASE_PATH}/chat`);
  console.log(
    `  Insights: POST http://localhost:${PORT}${BASE_PATH}/contributor-insights`
  );
  console.log(`  MCP Servers:`);
  console.log(`    - GitHub Issues: ${config.GITHUB_ISSUES_MCP_URL}`);

  if (config.GA4_MCP_URL) console.log(`    - GA4: ${config.GA4_MCP_URL}`);
  if (config.META_MCP_URL) console.log(`    - Meta Ads: ${config.META_MCP_URL}`);
  if (config.SHOPIFY_MCP_URL) console.log(`    - Shopify: ${config.SHOPIFY_MCP_URL}`);
  if (config.DAPR_MCP_URL) console.log(`    - Dapr: ${config.DAPR_MCP_URL}`);
});

export { app };
