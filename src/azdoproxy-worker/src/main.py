from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
import logging
from mndy_framework import CmdTypes, RootCmd, CloudEvt, DaprConfigs
from core import process_azdoproxy_cmd_workflow
from endpoints import healthz

logging.basicConfig(level=logging.INFO)

app = FastAPI()
dapr_app = DaprApp(app)

# origins = [
#     "http://localhost",
#     "http://localhost:3000",
#     "http://localhost:8000",
# ]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

workflow_hash = {
    CmdTypes.CREATE_DASHBOARD: process_azdoproxy_cmd_workflow,
    CmdTypes.BULK_CREATE_UNITS_OF_WORK: process_azdoproxy_cmd_workflow,
    CmdTypes.CLONE_UNIT_OF_WORK: process_azdoproxy_cmd_workflow,
    CmdTypes.UPDATE_UNIT_OF_WORK: process_azdoproxy_cmd_workflow,
    CmdTypes.UPDATE_UNIT_OF_WORK_HIERARCHY: process_azdoproxy_cmd_workflow,
}

app.include_router(healthz.router)

@dapr_app.subscribe(pubsub=DaprConfigs.DAPR_CMD_EXT_PUBSUB_NAME.value, topic=DaprConfigs.AZDO_PROXY_TOPIC.value, route="/azdoproxy/worker/cmd")
async def process_evt(evt: CloudEvt):
    logging.info(f"Received evt: {evt}")
    cmd = RootCmd(**evt.data)
    await workflow_hash[cmd.cmd_type](cmd)
    logging.info(f"Processed evt: {evt}")
