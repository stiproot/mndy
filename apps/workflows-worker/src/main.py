from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
from dapr.ext.fastapi import DaprActor
from dapr.actor.runtime.config import (
    ActorRuntimeConfig,
    ActorTypeConfig,
    ActorReentrancyConfig,
)
from dapr.actor.runtime.runtime import ActorRuntime
import logging
from core import process_cron_cmd, route_cmd, process_receipt_cmd
from mndy_framework import (
    RootCmd,
    CloudEvt,
    DaprConfigs,
    MndyProcActor,
)
from endpoints import healthz

logging.basicConfig(level=logging.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    config = ActorRuntimeConfig()
    config.update_actor_type_configs(
        [
            ActorTypeConfig(
                actor_type=MndyProcActor.__name__,
                reentrancy=ActorReentrancyConfig(enabled=True),
            )
        ]
    )
    ActorRuntime.set_actor_config(config)
    actor = DaprActor(app)
    logging.info("registering actors...")
    await actor.register_actor(MndyProcActor)
    yield


app = FastAPI(lifespan=lifespan)
dapr_app = DaprApp(app)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(healthz.router)


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_WORKFLOW_PUBSUB_NAME.value,
    topic=DaprConfigs.WORKFLOW_TOPIC.value,
    route="/workflows/cmd",
)
async def process_evt(evt: CloudEvt):
    logging.info(f"process_evt START. evt: {evt}")
    cmd = RootCmd(**evt.data)
    await route_cmd(cmd)
    logging.info(f"process_evt END. evt: {evt}")


@app.post("/cron-workflows-cmd")
async def process_cron_evt():
    logging.info("process_cron_evt START.")
    await process_cron_cmd()
    logging.info("process_cron_evt END.")


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_RECEIPT_PUBSUB_NAME.value,
    topic=DaprConfigs.GATHER_RECEIPT_TOPIC.value,
    route="/receipts/cmd/gather",
)
async def process_gather_receipt_evt(evt: CloudEvt):
    logging.info(f"process_gather_receipt_evt START. evt: {evt}")
    cmd = RootCmd(**evt.data)
    await process_receipt_cmd(cmd)
    logging.info(f"process_gather_receipt_evt END. evt: {evt}")


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_RECEIPT_PUBSUB_NAME.value,
    topic=DaprConfigs.STRUCTURE_RECEIPT_TOPIC.value,
    route="/receipts/cmd/structure",
)
async def process_structure_receipt_evt(evt: CloudEvt):
    logging.info(f"process_structure_receipt_evt START. evt: {evt}")
    cmd = RootCmd(**evt.data)
    await process_receipt_cmd(cmd)
    logging.info(f"process_structure_receipt_evt END. evt: {evt}")


@dapr_app.subscribe(
    pubsub=DaprConfigs.DAPR_CMD_RECEIPT_PUBSUB_NAME.value,
    topic=DaprConfigs.AZDO_PROXY_RECEIPT_TOPIC.value,
    route="/receipts/cmd/proxy",
)
async def process_proxy_receipt_evt(evt: CloudEvt):
    logging.info(f"process_proxy_receipt_evt START. evt: {evt}")
    cmd = RootCmd(**evt.data)
    await process_receipt_cmd(cmd)
    logging.info(f"process_proxy_receipt_evt END. evt: {evt}")
