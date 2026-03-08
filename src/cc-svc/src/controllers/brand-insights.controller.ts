import type { Request, Response, NextFunction } from "express";
import { BrandInsightsService } from "../services/brand-insights.service.js";
import type { BrandInsightsRequest } from "../types/index.js";
import { setupSSE, sendSSEEvent, endSSE, wantsSSE } from "../utils/sse.js";

const brandInsightsService = new BrandInsightsService();

/**
 * POST /brand-insights
 * Analyze brand analytics data and return insights
 */
export async function brandInsightsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as BrandInsightsRequest;
  const isSSE = wantsSSE(req.headers.accept, req.query.stream);

  try {
    if (isSSE) {
      // Stream response via SSE
      setupSSE(res);

      for await (const event of brandInsightsService.streamInsights(body)) {
        sendSSEEvent(res, event);
      }

      endSSE(res);
    } else {
      // Synchronous JSON response
      const result = await brandInsightsService.getInsights(body);
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
}
