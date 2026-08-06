import type { ToolRunner as GenericToolRunner } from "mcp-core";
import type { MetaAdsClient } from "meta-ads-core";

/** This server's tool runner: effects may require the Meta client and nothing else. */
export type ToolRunner = GenericToolRunner<MetaAdsClient>;
