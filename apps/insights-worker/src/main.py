from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
import logging
from core import build_unit_tree_workflow
from mndy_framework import CmdTypes, RootCmd, CloudEvt, DaprConfigs
from endpoints import healthz

logging.basicConfig(level=logging.DEBUG)

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

# app.include_router(cmd.router, prefix="/store")
# app.include_router(qry.router, prefix="/store")

workflow_hash = {
    CmdTypes.BUILD_UNIT_OF_WORK_TREE: build_unit_tree_workflow,
}

app.include_router(healthz.router)


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_STRUCTURE_PUBSUB_NAME.value,
    topic=DaprConfigs.STRUCTURE_TOPIC.value,
    route="/insights/worker/cmd",
)
async def process_evt(evt: CloudEvt):
    logging.info(f"Received evt: {evt}")
    cmd = RootCmd(**evt.data)
    await workflow_hash[cmd.cmd_type](cmd)
    logging.info(f"Processed evt: {evt}")
