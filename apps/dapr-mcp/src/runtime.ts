import type { ToolRunner as GenericToolRunner } from "mcp-core";
import type { DaprActorSvc } from "dapr-core";
import type { DataCacheSvc } from "./services/data-cache.service.js";

/** This server's tool runner. Both services are built once by the composition root. */
export type ToolRunner = GenericToolRunner<DataCacheSvc | DaprActorSvc>;
