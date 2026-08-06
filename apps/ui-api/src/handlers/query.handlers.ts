import { Effect } from "effect";
import { Response } from "express";
import { DaprStateSvc, AppLayer } from "../svc";
import { Configs, PartitionKeys } from "../config";
import { buildProjsQry, buildStateStoreMetadata, decompressEffect } from "../utils";
import { IReq, IQry, DaprQueryResponse, CompressedDataResponse } from "../types";

// Query all projects
export const processProjsQry = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Processing projs qry request...", req.body);

    const stateSvc = yield* DaprStateSvc;
    const qry = buildProjsQry(req.body?.qryData);

    // Note: Dapr SDK's query method doesn't support metadata options
    // (the original code also ignored this parameter)
    const resp = yield* stateSvc.queryState<DaprQueryResponse<unknown>>(
      Configs.DAPR_PROJS_STATE_STORE_NAME,
      qry
    );

    return resp.results.map((p) => p.data);
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Query single project
export const processProjQry = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const projId = req.body.qryData.projId;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Processing proj qry request...", req.body);

    const stateSvc = yield* DaprStateSvc;
    const data = yield* stateSvc.getState(
      Configs.DAPR_PROJS_STATE_STORE_NAME,
      projId!,
      buildStateStoreMetadata(PartitionKeys.PROJS)
    );

    return data;
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Query user processes (actor state)
export const processProcsQry = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const userId = req.body.qryData.userId;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Processing procs qry request...", req.body);

    const stateSvc = yield* DaprStateSvc;
    const data = yield* stateSvc.getActorState(
      "MndyProcActor",
      userId!,
      "get_state"
    );

    return data;
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Query structure (compressed data)
export const processStructQry = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { projId, structType } = req.body.qryData;
  const key = `${projId}-${structType}`;

  const effect = Effect.gen(function* () {
    const stateSvc = yield* DaprStateSvc;

    const struct = yield* stateSvc.getState<CompressedDataResponse>(
      Configs.DAPR_STRUCTS_STATE_STORE_NAME,
      key,
      buildStateStoreMetadata(projId!)
    );

    const obj = yield* decompressEffect(struct.compressed_data);
    return obj;
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process qry request error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};

// Query units (compressed data)
export const processUnitsQry = async (
  req: IReq<IQry>,
  res: Response
): Promise<void> => {
  const { projId, unitType } = req.body.qryData;
  const key = `${projId}-${unitType}`;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("Processing units qry request...", req.body);

    const stateSvc = yield* DaprStateSvc;

    const struct = yield* stateSvc.getState<CompressedDataResponse>(
      Configs.DAPR_AZDO_STATE_STORE_NAME,
      key,
      buildStateStoreMetadata(projId!)
    );

    const obj = yield* decompressEffect(struct.compressed_data);
    return obj;
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then((data) => res.json(data))
    .catch((error: unknown) => {
      console.error("Process unit of type qry error:", error);
      res.status(500).json({ error: "Error processing query." });
    });
};
