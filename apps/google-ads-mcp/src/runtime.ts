import type { ToolRunner as GenericToolRunner } from "mcp-core";
import type { GoogleAdsClient } from "google-ads-core";

/** This server's tool runner: effects may require the Google Ads client and nothing else. */
export type ToolRunner = GenericToolRunner<GoogleAdsClient>;
