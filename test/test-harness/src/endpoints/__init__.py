from fastapi import APIRouter

from . import healthz
from . import cmds
from . import qrys

router = APIRouter()

router.include_router(healthz.router)
router.include_router(cmds.router)
router.include_router(qrys.router)

__all__ = ["router"]
