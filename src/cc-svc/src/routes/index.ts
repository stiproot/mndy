import { Router, type Router as RouterType } from "express";
import { insightsRouter } from "./insights.routes.js";
import { healthHandler } from "../controllers/insights.controller.js";

export const router: RouterType = Router();

// Health check
router.get("/health", healthHandler);

// Insights routes
router.use("/", insightsRouter);
