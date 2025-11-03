import { publishPubSubMsg } from "../pubsub-manager";
import { Configs } from "../consts";
import { IReq, ICmd, ICmdMetadata, IPubSubCmd, IAzdoReq } from '../types';
import { Response } from 'express';
import { workflowProc } from "./procs";

export const processWorkflowCmd = async (req: IReq<ICmd>, res: Response) => {
  console.info("processWorkflowCmd START.")

  await workflowProc(req);

  console.info("processWorkflowCmd END.")

  res.status(200).send('OK');
};

export const processAzdoProxyCmds = async (req: IReq<ICmd>, res: Response) => {

  const { userId, reqs }: { userId: string, reqs: IAzdoReq[] } = req.body.cmdData;

  await Promise.all(reqs.map(r => publishPubSubMsg(Configs.WORKFLOW_TOPIC, createAzdoCmd(r, userId))));

  console.info("Processed azdo proxy cmds.");

  res.status(200).send('OK');
};

const createAzdoCmd = (req: IAzdoReq, userId: string, projectId: string = "default"): IPubSubCmd => {
  const cmd = {
    cmd_type: req.cmdType,
    cmd_data: req.cmdData,
    cmd_metadata: {
      user_id: userId,
      project_id: projectId,
    } as ICmdMetadata,
  } as IPubSubCmd;

  return cmd;
}