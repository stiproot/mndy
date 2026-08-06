import { Router, type Router as RouterType } from "express";
import { brandInsightsHandler } from "../controllers/brand-insights.controller.js";
import { validateRequest } from "../middleware/index.js";
import { brandInsightsRequestSchema } from "../schemas/index.js";

export const brandInsightsRouter: RouterType = Router();

/**
 * POST /brand-insights
 *
 * Request body:
 * {
 *   dateRange: {
 *     startDate: string (YYYY-MM-DD),
 *     endDate: string (YYYY-MM-DD)
 *   },
 *   options?: {
 *     includeGA4?: boolean,
 *     includeShopify?: boolean,
 *     includeMeta?: boolean
 *   }
 * }
 *
 * Supports SSE streaming via:
 * - Accept: text/event-stream header
 * - ?stream=true query parameter
 */
brandInsightsRouter.post(
  "/brand-insights",
  validateRequest(brandInsightsRequestSchema),
  brandInsightsHandler
);
