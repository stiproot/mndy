import { Request } from "express";
import { CmdTypes } from "./config";

export enum ProcStatuses {
  PENDING = "PENDING",
  COMPLETE = "COMPLETE",
  RUNNING = "RUNNING",
  ERROR = "ERROR",
  CANCELLED = "CANCELLED",
}

export interface IReq<T> extends Request {
  body: T;
}

export interface IProj {}

export interface IQry {
  qryData: {
    userId?: string;
    projId?: string;
    structType?: string;
    unitType?: string;
    isPinned?: string;
    teamName?: string;
    id?: string | number;
    ql?: string;
  };
}

export interface ICmd {
  cmdData: {
    userId?: string;
    projectId?: string;
    user_id?: string;
    id?: string;
    delta?: Record<string, unknown>;
    reqs?: IAzdoReq[];
  };
}

export interface IPropMap {
  key: string;
  val: unknown;
}

export interface ICmdMetadataEnrichmentPropMap {
  prop_map: IPropMap[];
}

export interface ICmdMetadataPostOpProc {
  proc_status: ProcStatuses;
  proc_err: string | null;
  utc_created_timestamp: string;
}

export interface ICmdMetadataPostOp {
  cmd_result_enrichment: ICmdMetadataEnrichmentPropMap;
  proc: ICmdMetadataPostOpProc;
}

export interface ICmdMetadata {
  user_id: string;
  project_id: string;
  cmd_post_op?: ICmdMetadataPostOp;
}

export interface IPubSubCmd {
  cmd_type: CmdTypes;
  cmd_data: Record<string, unknown>;
  cmd_metadata: ICmdMetadata;
}

export interface IAzdoReq {
  cmdType: CmdTypes;
  cmdData: Record<string, unknown>;
}

// Dapr query response type
export interface DaprQueryResponse<T> {
  results: Array<{ data: T; key: string }>;
  token?: string;
}

// Compressed data response
export interface CompressedDataResponse {
  compressed_data: string;
}

// WebSocket Types
import { WebSocket } from "ws";
import { Schema } from "effect";

// Client update message schema (from workers via Dapr)
export const ClientUpdateMessageSchema = Schema.Struct({
  user_id: Schema.String,
  message_type: Schema.String,
  payload: Schema.Unknown,
  timestamp: Schema.optional(Schema.String),
});

export type ClientUpdateMessage = typeof ClientUpdateMessageSchema.Type;

// Dapr CloudEvent envelope schema
export const CloudEventSchema = Schema.Struct({
  id: Schema.String,
  source: Schema.String,
  type: Schema.String,
  specversion: Schema.String,
  datacontenttype: Schema.optional(Schema.String),
  data: ClientUpdateMessageSchema,
  pubsubname: Schema.optional(Schema.String),
  topic: Schema.optional(Schema.String),
  traceid: Schema.optional(Schema.String),
  traceparent: Schema.optional(Schema.String),
  tracestate: Schema.optional(Schema.String),
  time: Schema.optional(Schema.String),
});

export type CloudEvent = typeof CloudEventSchema.Type;

// WebSocket client connection state
export interface WebSocketClient {
  userId: string;
  socket: WebSocket;
  isAlive: boolean;
  connectedAt: Date;
  lastPing?: Date;
}

// Outbound message to WebSocket client
export interface OutboundMessage {
  type: string;
  data: unknown;
  timestamp: string;
}
