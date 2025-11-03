from fastapi import APIRouter, Response, status
from fastapi.encoders import jsonable_encoder
import logging
from json import dumps as json_dumps
from mndy_framework.actors import create_proc_proxy
from models.reqs import QryProcStateReq


router = APIRouter()


@router.post("/state/proc")
async def qry_proc_state(req: QryProcStateReq):
    logging.info(f"Received evt.")

    try:
        proxy = create_proc_proxy(actor_id=req.user_id)
        state = await proxy.get_state()
        steps = state.get(req.project_id, {}).get("steps", [])

        for s in steps:
            s["proc"]["utc_created_timestamp"] = None

        logging.info(f"Processed evt. Steps: {steps}")

        return Response(
            content=json_dumps({"steps": steps}), status_code=status.HTTP_200_OK
        )
    except Exception as e:
        logging.error(f"Error processing qry: {e}")

        return Response(
            content=json_dumps({"error": str(e)}),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
