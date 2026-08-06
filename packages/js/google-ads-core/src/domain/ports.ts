import type { Effect } from "effect";
import type { TimeoutError } from "analytics-core";
import type {
  GoogleAdsApiError,
  GoogleAdsAuthError,
  GoogleAdsQuotaError,
} from "./errors.js";
import type {
  CampaignInfo,
  GetCampaignsInput,
  GetPerformanceInput,
  PerformanceResult,
} from "./models.js";

export type GoogleAdsFailure =
  | GoogleAdsApiError
  | GoogleAdsQuotaError
  | GoogleAdsAuthError
  | TimeoutError;

export interface GoogleAdsReader {
  /** The customer used when a call does not name one. */
  readonly defaultCustomerId: string;
  readonly getCampaigns: (
    input: GetCampaignsInput,
  ) => Effect.Effect<readonly CampaignInfo[], GoogleAdsFailure>;
  readonly getPerformance: (
    input: GetPerformanceInput,
  ) => Effect.Effect<PerformanceResult, GoogleAdsFailure>;
}
