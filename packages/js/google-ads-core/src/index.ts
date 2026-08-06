/**
 * google-ads-core — the Google Ads reporting domain and its API adapter.
 */

export {
  CAMPAIGN_STATUSES,
  DATE_PRESETS,
  LEVELS,
  MICROS_PER_UNIT,
  buildCampaignsQuery,
  buildPerformanceQuery,
  fromMicros,
  identifierFieldsForLevel,
  normalizeCustomerId,
  resourceForLevel,
  selectFieldsFor,
  type CampaignInfo,
  type CampaignStatus,
  type DatePreset,
  type GetCampaignsInput,
  type GetPerformanceInput,
  type Level,
  type PerformanceResult,
  type PerformanceRow,
  type TimeRange,
} from "./domain/models.js";

export {
  GoogleAdsApiError,
  GoogleAdsAuthError,
  GoogleAdsQuotaError,
} from "./domain/errors.js";
export type { GoogleAdsFailure, GoogleAdsReader } from "./domain/ports.js";

// Infrastructure — wire this from a composition root only.
export { GoogleAdsClient, GoogleAdsConfig } from "./infrastructure/google-ads.client.js";
