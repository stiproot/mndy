from fastapi import APIRouter, Response, status
from dataclasses import asdict
import logging
from mndy_framework.types import RootCmd, DaprConfigs, Proj
from mndy_framework.comms import publish_event, save_state
from models.reqs import PublishCmdReq, PersistProjStateReq


router = APIRouter()


@router.post("/workflow/publish")
async def publish_workflow_cmd(req: PublishCmdReq):
    logging.info("Received evt.")

    try:
        cmd = RootCmd(**req.cmd_data)

        await publish_event(
            pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
            topic_name=DaprConfigs.WORKFLOW_TOPIC.value,
            data=cmd._serialize_(),
        )

        logging.info("Processed evt")

        return Response(status_code=status.HTTP_200_OK)
    except Exception as e:
        logging.error(f"Error publishing evt: {e}")

        return Response(
            content=json_dumps({"error": str(e)}),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.post("/state/persist")
async def publish_workflow_cmd(req: PersistProjStateReq):
    logging.info("Received evt.")

    try:
        proj = Proj.from_dict(req.cmd_data)

        await save_state(
            store_name=DaprConfigs.DAPR_PROJS_STATE_STORE_NAME.value,
            payload=asdict(proj),
            key=proj.id,
            partition_key=proj.id,
        )

        logging.info("Processed evt")

        return Response(status_code=status.HTTP_200_OK)
    except Exception as e:
        logging.error(f"Error processing qry: {e}")

        return Response(
            content=json_dumps({"error": str(e)}),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
