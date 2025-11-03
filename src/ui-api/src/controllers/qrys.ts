import { queryState, getState, getActorState } from "./state-manager";
import { Configs, PartitionKeys } from "./consts";
import { buildProjsQry } from "./qry.builder";
import { Response } from 'express';
import { IReq, IQry } from './types';
import { buildStateStoreMetadata } from "./partitions";
import { decompress } from "./compression";
import { KeyValueType } from "@dapr/dapr/types/KeyValue.type";

export const processProjsQry = async (req: IReq<IQry>, res: Response) => {
  try {
    console.log("Processing projs qry request...", req.body);
    const qry = buildProjsQry(req.body?.qryData);
    const resp = await queryState(Configs.DAPR_PROJS_STATE_STORE_NAME, qry, buildStateStoreMetadata(PartitionKeys.PROJS));
    const data = resp["results"].map(p => p.data);
    res.json(data);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const processProjQry = async (req: IReq<IQry>, res: Response) => {
  try {
    console.log("Processing proj qry request...", req.body);
    const projId = req.body.qryData.projId;
    const data = await getState(Configs.DAPR_PROJS_STATE_STORE_NAME, projId, buildStateStoreMetadata(PartitionKeys.PROJS));
    res.json(data);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const processProcsQry = async (req: IReq<IQry>, res: Response) => {
  try {
    console.info("processing procs qry request...", req.body);
    const userId = req.body.qryData.userId;
    const data = await getActorState("MndyProcActor", userId, "get_state");
    res.json(data);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const processStructQry = async (req: IReq<IQry>, res: Response) => {
  try {
    const { projId, structType } = req.body.qryData;
    const key = `${projId}-${structType}`;
    const struct = await getState(Configs.DAPR_STRUCTS_STATE_STORE_NAME, key, buildStateStoreMetadata(projId));

    const data = (struct as KeyValueType)["compressed_data"];
    const obj = decompress(data);

    res.json(obj);
  } catch (error) {
    console.error("Process qry request error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};

export const processUnitsQry = async (req: IReq<IQry>, res: Response) => {
  try {
    console.info("processing units qry request...", req.body);
    const { projId, unitType } = req.body.qryData;
    const key = `${projId}-${unitType}`;
    const struct = await getState(Configs.DAPR_AZDO_STATE_STORE_NAME, key, buildStateStoreMetadata(projId));

    const data = (struct as KeyValueType)["compressed_data"];
    const obj = decompress(data);

    res.json(obj);
  } catch (error) {
    console.error("Process unit of type qry error:", error);
    res.status(500).json({ error: "Error processing query." });
  }
};