from dapr.clients import DaprClient
from dapr.clients.grpc._state import StateItem
from dataclasses import asdict
from json import dumps as json_dumps
from typing import List, Dict, Any, Awaitable
from mndy_framework import (
    RootCmd,
    DaprConfigs,
    ProcStatuses,
    get_nested_property,
    UnitGroup,
    BaseUnit,
    utc_now_timestamp_str,
    save_state,
    publish_event,
    GetWisByWiqlCmdProcessor,
    GetWisByWiqlCmd,
    GetWisListCmdProcessor,
    GetWisListCmd,
    compress,
    build_uid,
)
from .map import map_unit
import logging


MAX_UNITS_OF_WORK_PER_QUERY = 75
MAX_PERSIST_BATCH_SIZE = 45

wi_by_wiql_proc = GetWisByWiqlCmdProcessor()
wis_list_proc = GetWisListCmdProcessor()


async def get_batch_of_units(ids: List[int]) -> List[BaseUnit]:
    if len(ids) > MAX_UNITS_OF_WORK_PER_QUERY:
        raise ValueError(f"Too many work items: {len(ids)}")

    get_wis_list_cmd = GetWisListCmd(ids=ids)
    wis_list_resp: Dict[str, Any] = await wis_list_proc.process(cmd=get_wis_list_cmd)
    wis_list = wis_list_resp["value"]

    units: List[BaseUnit] = list(map(map_unit, wis_list))

    return units


async def get_units_in_batches(ids: List[int]) -> List[BaseUnit]:
    batches = []
    batch = []
    for id in ids:
        if len(batch) == MAX_UNITS_OF_WORK_PER_QUERY:
            batches.append(batch)
            batch = []
        batch.append(id)
    if len(batch) > 0:
        batches.append(batch)

    complete_wis_list: List[BaseUnit] = []
    for batch in batches:
        wi_list: List[BaseUnit] = await get_batch_of_units(batch)
        complete_wis_list.extend(wi_list)

    return complete_wis_list


async def get_units(wis: List[Dict]) -> List[BaseUnit]:
    ids = [int(wi["id"]) for wi in wis]

    if len(ids) == 0:
        return []

    if len(ids) > MAX_UNITS_OF_WORK_PER_QUERY:
        return await get_units_in_batches(ids)

    return await get_batch_of_units(ids)


async def gather_project_units_of_work_workflow(cmd: RootCmd) -> Awaitable:
    # await update_proc_status(cmd=cmd, status=ProcStatuses.RUNNING.value)

    project_id = cmd._project_id_()
    ql = cmd.cmd_data["ql"]
    get_by_wiql_cmd = GetWisByWiqlCmd(query=ql)

    wis_resp = await wi_by_wiql_proc.process(cmd=get_by_wiql_cmd)
    wis = list(wis_resp["workItems"])

    if len(wis) == 0:
        return

    units: List[BaseUnit] = await get_units(wis)

    persist_hash: Dict[str, UnitGroup] = {}
    for d in units:
        persist_hash_entry = persist_hash.get(d.type, None)
        if not persist_hash_entry:
            unit_group = UnitGroup(
                id=d.type,
                uid=build_uid(d.type, cmd),
                utc_created_timestamp=utc_now_timestamp_str(),
                __metadata__=cmd._build_post_op_enrichment_obj_().get(
                    "__metadata__", {}
                ),
                units=[d],
                unit_type=d.type,
            )
            persist_hash[d.type] = unit_group
        else:
            persist_hash_entry.units.append(d)

    for g in persist_hash.values():
        struct = asdict(g)
        compressed_struct = compress(struct)
        persist_struct = {
            "id": g.id,
            "uid": g.uid,
            "compressed_data": compressed_struct,
            "utc_created_timestamp": g.utc_created_timestamp,
            "__metadata__": g.__metadata__,
        }

        await save_state(
            payload=persist_struct,
            store_name=DaprConfigs.DAPR_AZDO_STATE_STORE_NAME.value,
            partition_key=cmd._project_id_(),
        )

    await publish_event(
        pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
        topic_name=DaprConfigs.GATHER_RECEIPT_TOPIC.value,
        data=cmd._serialize_(),
    )
