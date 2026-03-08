import type { Request, Response, NextFunction } from "express";
import { DataCollectionService } from "../services/data-collection.service.js";
import { BrandAnalysisService } from "../services/brand-analysis.service.js";
import type { CollectRequest, AnalyzeRequest } from "../schemas/data-collection.schema.js";
import { setupSSE, sendSSEEvent, endSSE, wantsSSE } from "../utils/sse.js";

const dataCollectionService = new DataCollectionService();
const brandAnalysisService = new BrandAnalysisService();

/**
 * POST /brand-insights/collect
 * Collect raw analytics data from specified sources and persist to actors
 */
export async function collectHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as CollectRequest;

  try {
    const result = await dataCollectionService.collectData(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /brand-insights/analyze
 * Analyze cached data and generate brand insights report
 */
export async function analyzeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const body = req.body as AnalyzeRequest;
  const isSSE = wantsSSE(req.headers.accept, req.query.stream);

  try {
    if (isSSE) {
      // Stream response via SSE
      setupSSE(res);

      for await (const event of brandAnalysisService.streamAnalyze(body)) {
        sendSSEEvent(res, event);
      }

      endSSE(res);
    } else {
      // Synchronous JSON response
      const result = await brandAnalysisService.analyze(body);
      res.json(result);
    }
  } catch (error) {
    next(error);
  }
}
