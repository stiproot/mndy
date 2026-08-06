import type { Request, Response, NextFunction } from "express";
import { OrchestratorService } from "../services/orchestrator.service.js";
import type { ContributorInsightsRequest } from "../types/index.js";
import { setupSSE, sendSSEEvent, endSSE, wantsSSE } from "../utils/sse.js";

const orchestratorService = new OrchestratorService();

/**
 * POST /contributor-insights
 * Analyze a contributor's GitHub activity and return insights
 */
export async function contributorInsightsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as ContributorInsightsRequest;
  const isSSE = wantsSSE(req.headers.accept, req.query.stream);

  try {
    if (isSSE) {
      // Stream response via SSE
      setupSSE(res);

      for await (const event of orchestratorService.streamInsights(body)) {
        sendSSEEvent(res, event);
      }

      endSSE(res);
    } else {
      // Synchronous JSON response
      const result = await orchestratorService.getInsights(body);
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /health
 * Health check endpoint
 */
export function healthHandler(_req: Request, res: Response): void {
  res.json({
    status: "healthy",
    service: "cc-svc",
    timestamp: new Date().toISOString(),
  });
}
