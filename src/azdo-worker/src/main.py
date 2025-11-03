from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
from pydantic import BaseModel
import logging
from core import gather_project_units_of_work_workflow
from mndy_framework import RootCmd, CloudEvt, DaprConfigs
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

app.include_router(healthz.router)


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_GATHER_PUBSUB_NAME.value,
    topic=DaprConfigs.GATHER_TOPIC.value,
    route="/azdo/worker/cmd",
)
async def process_evt(evt: CloudEvt):
    logging.info(f"Received evt: {evt}")
    cmd = RootCmd(**evt.data)
    await gather_project_units_of_work_workflow(cmd)
    logging.info(f"Processed evt: {cmd}")
