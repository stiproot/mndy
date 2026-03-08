import { Router, type Router as RouterType } from "express";
import { collectHandler, analyzeHandler } from "../controllers/data-collection.controller.js";
import { validateRequest } from "../middleware/index.js";
import { collectRequestSchema, analyzeRequestSchema } from "../schemas/data-collection.schema.js";

export const dataCollectionRouter: RouterType = Router();

/**
 * POST /brand-insights/collect
 *
 * Request body:
 * {
 *   dateRange: {
 *     startDate: string (YYYY-MM-DD),
 *     endDate: string (YYYY-MM-DD)
 *   },
 *   sources: ["ga4", "shopify", "meta"],
 *   brandId?: string (default: "default"),
 *   force?: boolean (default: false)
 * }
 *
 * Collects raw analytics data from specified sources and persists to Dapr actors.
 * Use force=true to refresh data even if cached.
 */
dataCollectionRouter.post(
  "/brand-insights/collect",
  validateRequest(collectRequestSchema),
  collectHandler
);

/**
 * POST /brand-insights/analyze
 *
 * Request body:
 * {
 *   dateRange: {
 *     startDate: string (YYYY-MM-DD),
 *     endDate: string (YYYY-MM-DD)
 *   },
 *   sources: ["ga4", "shopify"],
 *   brandId?: string (default: "default")
 * }
 *
 * Analyzes cached data and generates brand insights report.
 * Expects data to be collected first via /brand-insights/collect.
 *
 * Supports SSE streaming via:
 * - Accept: text/event-stream header
 * - ?stream=true query parameter
 */
dataCollectionRouter.post(
  "/brand-insights/analyze",
  validateRequest(analyzeRequestSchema),
  analyzeHandler
);
