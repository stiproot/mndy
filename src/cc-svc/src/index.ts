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
  console.log(
    `  Insights: POST http://localhost:${PORT}${BASE_PATH}/contributor-insights`
  );
  console.log(`  MCP Server: ${config.GITHUB_ISSUES_MCP_URL}`);
});

export { app };
