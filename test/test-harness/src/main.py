from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dapr.ext.fastapi import DaprApp
import logging
from endpoints import healthz, cmds, qrys

logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(healthz.router)
app.include_router(cmds.router, prefix="/cmds")
app.include_router(qrys.router, prefix="/qrys")
