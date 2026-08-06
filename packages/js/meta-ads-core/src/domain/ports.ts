import type { Effect } from "effect";
import type { TimeoutError } from "analytics-core";
import type { MetaApiError, MetaAuthError, MetaRateLimitError } from "./errors.js";
import type { CampaignInfo, GetInsightsInput, InsightsResult } from "./models.js";

export type MetaFailure =
  | MetaApiError
  | MetaAuthError
  | MetaRateLimitError
  | TimeoutError;

export interface MetaAdsReader {
  readonly defaultAdAccountId: string;
  readonly hasAccessToken: boolean;
  readonly getInsights: (
    input: GetInsightsInput,
  ) => Effect.Effect<InsightsResult, MetaFailure>;
  readonly getCampaigns: (
    adAccountId?: string,
    limit?: number,
  ) => Effect.Effect<readonly CampaignInfo[], MetaFailure>;
}
