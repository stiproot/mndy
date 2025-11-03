import logging
from typing import Awaitable
from mndy_framework import (
    RootCmd,
    CmdTypes,
)
from .procs import process_cmd, process_ext_cmd


async def route_cmd(cmd: RootCmd) -> Awaitable:

    if cmd.cmd_type.value == CmdTypes.BUILD_WORKFLOW.value:
        await process_cmd(cmd)
        return

    if cmd.cmd_type.value in [
        CmdTypes.BULK_CREATE_UNITS_OF_WORK.value,
        CmdTypes.CLONE_UNIT_OF_WORK.value,
        CmdTypes.CREATE_DASHBOARD.value,
        CmdTypes.UPDATE_UNIT_OF_WORK.value,
        CmdTypes.UPDATE_UNIT_OF_WORK_HIERARCHY.value,
    ]:
        await process_ext_cmd(cmd)
        return

    raise ValueError(f"Unsupported cmd_type: {cmd.cmd_type.value}")
