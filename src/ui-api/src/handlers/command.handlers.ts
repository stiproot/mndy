import { Effect } from "effect";
import { Response } from "express";
import { DaprStateSvc, DaprPubSubSvc, AppLayer, StateItem } from "../svc";
import { Configs, PartitionKeys, CmdTypes } from "../config";
import { buildStateStoreMetadata } from "../utils";
import { IReq, ICmd, IPubSubCmd, ICmdMetadata, IAzdoReq } from "../types";

// Helper to create workflow command
const createWorkflowCmd = (userId: string, projectId: string): IPubSubCmd => ({
  cmd_type: CmdTypes.BUILD_WORKFLOW,
  cmd_data: {},
  cmd_metadata: {
    user_id: userId,
    project_id: projectId,
  } as ICmdMetadata,
});

// Helper to create AzDO proxy command
const createAzdoCmd = (
  req: IAzdoReq,
  userId: string,
  projectId: string = "default"
): IPubSubCmd => ({
  cmd_type: req.cmdType,
  cmd_data: req.cmdData,
  cmd_metadata: {
    user_id: userId,
    project_id: projectId,
  } as ICmdMetadata,
});

// Workflow process helper (extracted for reuse)
const workflowProc = (
  userId: string,
  projectId: string
): Effect.Effect<void, import("../errors").DaprPubSubError, DaprPubSubSvc> =>
  Effect.gen(function* () {
    yield* Effect.logInfo("workflowProc START.");

    const pubsubSvc = yield* DaprPubSubSvc;
    const cmd = createWorkflowCmd(userId, projectId);

    yield* pubsubSvc.publish(Configs.WORKFLOW_TOPIC, cmd);

    yield* Effect.logInfo("workflowProc END.");
  });

// Process workflow command
export const processWorkflowCmd = async (
  req: IReq<ICmd>,
  res: Response
): Promise<void> => {
  const { userId, projectId } = req.body.cmdData;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("processWorkflowCmd START.");
    yield* workflowProc(userId!, projectId!);
    yield* Effect.logInfo("processWorkflowCmd END.");
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then(() => res.status(200).send("OK"))
    .catch((error: unknown) => {
      console.error("Workflow command error:", error);
      res.status(500).json({ error: "Workflow command failed" });
    });
};

// Process AzDO proxy commands
export const processAzdoProxyCmds = async (
  req: IReq<ICmd>,
  res: Response
): Promise<void> => {
  const { userId, reqs } = req.body.cmdData as {
    userId: string;
    reqs: IAzdoReq[];
  };

  const effect = Effect.gen(function* () {
    const pubsubSvc = yield* DaprPubSubSvc;

    yield* Effect.all(
      reqs.map((r) =>
        pubsubSvc.publish(Configs.WORKFLOW_TOPIC, createAzdoCmd(r, userId))
      ),
      { concurrency: "unbounded" }
    );

    yield* Effect.logInfo("Processed azdo proxy cmds.");
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then(() => res.status(200).send("OK"))
    .catch((error: unknown) => {
      console.error("AzDO proxy command error:", error);
      res.status(500).json({ error: "AzDO proxy command failed" });
    });
};

// Persist project command
export const processPersistProjCmd = async (
  req: IReq<ICmd>,
  res: Response
): Promise<void> => {
  const data = req.body.cmdData as { user_id: string; id: string };
  const { user_id, id } = data;

  const effect = Effect.gen(function* () {
    yield* Effect.logInfo("processPersistProjCmd START.");

    const stateSvc = yield* DaprStateSvc;
    const state: StateItem<typeof data>[] = [{ key: id, value: data }];

    yield* stateSvc.saveState(
      Configs.DAPR_PROJS_STATE_STORE_NAME,
      state,
      buildStateStoreMetadata(PartitionKeys.PROJS)
    );

    yield* Effect.logInfo("Processed persist cmd.");

    // Trigger workflow
    yield* workflowProc(user_id, id);

    yield* Effect.logInfo("processPersistProjCmd END.");
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then(() => res.status(200).send("OK"))
    .catch((error: unknown) => {
      console.error("Persist project command error:", error);
      res.status(500).json({ error: "Persist project command failed" });
    });
};

// Update project command
export const processUpdateProjCmd = async (
  req: IReq<ICmd>,
  res: Response
): Promise<void> => {
  const { projectId, delta } = req.body.cmdData as {
    projectId: string;
    delta: Record<string, unknown>;
  };

  const effect = Effect.gen(function* () {
    const stateSvc = yield* DaprStateSvc;

    // Get original project
    const original = yield* stateSvc.getState<Record<string, unknown>>(
      Configs.DAPR_PROJS_STATE_STORE_NAME,
      projectId,
      buildStateStoreMetadata(PartitionKeys.PROJS)
    );

    // Merge with delta
    const updated = { ...original, ...delta };
    const state: StateItem<typeof updated>[] = [
      { key: projectId, value: updated },
    ];

    yield* stateSvc.saveState(
      Configs.DAPR_PROJS_STATE_STORE_NAME,
      state,
      buildStateStoreMetadata(PartitionKeys.PROJS)
    );

    yield* Effect.logInfo("Processed update cmd.");
  }).pipe(Effect.provide(AppLayer));

  Effect.runPromise(effect)
    .then(() => res.status(200).send("OK"))
    .catch((error: unknown) => {
      console.error("Update project command error:", error);
      res.status(500).json({ error: "Update project command failed" });
    });
};
