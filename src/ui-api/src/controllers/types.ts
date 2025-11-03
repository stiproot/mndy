import { Request } from 'express';
import { CmdTypes } from './consts';

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

export interface IProj { }

export interface IQry {
  qryData: any;
}

export interface ICmd {
  cmdData: any;
}

export interface IPropMap {
  key: string;
  val: any;
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
  cmd_post_op: ICmdMetadataPostOp;
}

export interface IPubSubCmd {
  cmd_type: CmdTypes;
  cmd_data: any;
  cmd_metadata: ICmdMetadata;
}

export interface IAzdoReq {
  cmdType: CmdTypes;
  cmdData: any;
}