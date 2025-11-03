import { publishPubSubMsg } from "../pubsub-manager";
import { CmdTypes, Configs } from "../consts";
import { IReq, ICmd, ICmdMetadata } from '../types';

export const workflowProc = async (req: IReq<ICmd>) => {

  console.info("workflowProc START.");

  const { userId, projectId } = req.body.cmdData;

  const cmd = {
    cmd_type: CmdTypes.BUILD_WORKFLOW,
    cmd_data: {},
    cmd_metadata: {
      user_id: userId,
      project_id: projectId,
    } as ICmdMetadata
  };

  await publishPubSubMsg(Configs.WORKFLOW_TOPIC, cmd);

  console.info("workflowProc END.");
};