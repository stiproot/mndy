import { saveState, getState } from "../state-manager";
import { Configs, PartitionKeys } from "../consts";
import { IReq, ICmd } from '../types';
import { Response } from 'express';
import { buildStateStoreMetadata } from "../partitions";
import { workflowProc } from "./procs";

export const processPersistProjCmd = async (req: IReq<ICmd>, res: Response) => {
  console.info("processPersistProjCmd START.");

  const data = req.body.cmdData;
  const { user_id, id } = data;

  const state = [{ key: id, value: data }];

  await saveState(Configs.DAPR_PROJS_STATE_STORE_NAME, state, buildStateStoreMetadata(PartitionKeys.PROJS));

  console.info("Processed persist cmd.");

  const workflowReq = { body: { cmdData: { userId: user_id, projectId: id } } } as IReq<ICmd>;

  await workflowProc(workflowReq)

  console.info("processPersistProjCmd END.");

  res.status(200).send('OK');
};

export const processUpdateProjCmd = async (req: IReq<ICmd>, res: Response) => {
  const data = req.body.cmdData;
  const { projectId, delta } = data;

  const original = await getState(Configs.DAPR_PROJS_STATE_STORE_NAME, projectId, buildStateStoreMetadata(PartitionKeys.PROJS));
  const updated = Object.assign(original, delta);
  const state = [{ key: projectId, value: updated }];

  await saveState(Configs.DAPR_PROJS_STATE_STORE_NAME, state, buildStateStoreMetadata(PartitionKeys.PROJS));
  console.info("Processed update cmd.");

  res.status(200).send('OK');
};