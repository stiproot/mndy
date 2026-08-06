import logging
from typing import Awaitable, Union
from dataclasses import asdict
from asyncio import gather
from mndy_framework import (
    DaprConfigs,
    PartitionKeys,
    RootCmd,
    Proj,
    get_state,
    query_state,
)
from .mappers import map_gather_structure_cmds, map_tag_gather_structure_cmds
from .cmd_builder import add_proc_struct
from .workflows import (
    build_workflow_struct,
    init_proc_actor_state,
    publish_cmd,
    exec_next_workflow_cmd,
)


async def process_cmd(cmd: RootCmd):
    proj_data: Dict[str, any] = await get_state(
        store_name=DaprConfigs.DAPR_PROJS_STATE_STORE_NAME.value,
        key=cmd._project_id_(),
        partition_key=PartitionKeys.PROJS.value,
    )
    proj = Proj.from_dict(proj_data)

    cmds = map_gather_structure_cmds(proj=proj)
    workflow_struct = build_workflow_struct(cmds=cmds)

    await init_proc_actor_state(workflow_struct, cmd._project_id_())
    await publish_cmd(cmd=cmds[0])


async def process_ext_cmd(cmd: RootCmd):
    cmd = add_proc_struct(cmd, DaprConfigs.AZDO_PROXY_TOPIC.value)

    workflow_struct = build_workflow_struct(cmds=[cmd])

    await init_proc_actor_state(workflow_struct, cmd["cmd"]._user_id_())
    await publish_cmd(cmd=cmd)


async def process_cron_cmd():
    projs: list[Proj] = await query_state(
        store_name=DaprConfigs.DAPR_PROJS_STATE_STORE_NAME.value,
        query={},
        partition_key=PartitionKeys.PROJS.value,
        default_factory=lambda x: Proj.from_dict(x),
    )

    cmds = [map_gather_structure_cmds(proj=proj) for proj in projs]
    workflow_structs = [build_workflow_struct(c) for c in cmds]
    tasks = [publish_cmd(cmd=w[0]) for w in workflow_structs]

    await gather(*tasks)


async def process_receipt_cmd(cmd: RootCmd) -> Awaitable:
    await exec_next_workflow_cmd(cmd=cmd)
