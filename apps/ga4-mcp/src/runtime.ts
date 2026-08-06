import type { ToolRunner as GenericToolRunner } from "mcp-core";
import type { GA4Client } from "ga4-core";

/** This server's tool runner: effects may require the GA4 client and nothing else. */
export type ToolRunner = GenericToolRunner<GA4Client>;
