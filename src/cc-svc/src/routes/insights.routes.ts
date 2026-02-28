import { Router, type Router as RouterType } from "express";
import { contributorInsightsHandler } from "../controllers/insights.controller.js";
import { validateRequest } from "../middleware/index.js";
import { contributorInsightsRequestSchema } from "../schemas/index.js";

export const insightsRouter: RouterType = Router();

/**
 * POST /contributor-insights
 *
 * Request body:
 * {
 *   owner: string,
 *   repo: string,
 *   username: string,
 *   options?: {
 *     includeClosedIssues?: boolean,
 *     lookbackDays?: number,
 *     maxIssues?: number
 *   }
 * }
 *
 * Supports SSE streaming via:
 * - Accept: text/event-stream header
 * - ?stream=true query parameter
 */
insightsRouter.post(
  "/contributor-insights",
  validateRequest(contributorInsightsRequestSchema),
  contributorInsightsHandler
);
