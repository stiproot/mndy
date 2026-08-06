import type { ToolRunner as GenericToolRunner } from "mcp-core";
import type { ShopifyClient } from "shopify-core";

/** This server's tool runner: effects may require the Shopify client and nothing else. */
export type ToolRunner = GenericToolRunner<ShopifyClient>;
