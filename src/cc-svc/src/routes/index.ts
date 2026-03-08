import { Router, type Router as RouterType } from "express";
import { insightsRouter } from "./insights.routes.js";
import { chatRouter } from "./chat.routes.js";
import { brandInsightsRouter } from "./brand-insights.routes.js";
import { dataCollectionRouter } from "./data-collection.routes.js";
import { healthHandler } from "../controllers/insights.controller.js";

export const router: RouterType = Router();

// Health check
router.get("/health", healthHandler);

// Insights routes
router.use("/", insightsRouter);

// Brand insights routes (legacy endpoint)
router.use("/", brandInsightsRouter);

// Data collection and analysis routes (new architecture)
router.use("/", dataCollectionRouter);

// Chat routes
router.use("/", chatRouter);
