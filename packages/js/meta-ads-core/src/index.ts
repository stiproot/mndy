/**
 * meta-ads-core — the Meta Ads reporting domain and its Marketing API adapter.
 */

export {
  ALL_INSIGHTS_FIELDS,
  DATE_PRESETS,
  DEFAULT_INSIGHTS_FIELDS,
  LEVELS,
  identifierFieldsForLevel,
  resolveInsightsFields,
  type CampaignInfo,
  type DatePreset,
  type GetInsightsInput,
  type InsightsData,
  type InsightsResult,
  type Level,
  type TimeRange,
} from "./domain/models.js";

export {
  META_AUTH_ERROR_CODE,
  MetaApiError,
  MetaAuthError,
  MetaRateLimitError,
  isAuthFailure,
} from "./domain/errors.js";
export type { MetaAdsReader, MetaFailure } from "./domain/ports.js";

// Infrastructure — wire this from a composition root only.
export { MetaAdsClient, MetaConfig } from "./infrastructure/meta.client.js";
