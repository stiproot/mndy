import logging
from typing import Awaitable, Dict, Any, List
from dataclasses import asdict
from mndy_framework import (
    RootCmd,
    ProjSummary,
    BaseUnit,
    UnitGroup,
    StructConfigs,
    ProcStatuses,
    utc_now_timestamp_str,
    build_uid,
    update_state,
    save_state,
    DaprConfigs,
    publish_event,
    UnitStatuses,
)
from .tree_builder import link_node
from .enrichers import enrich_with_child_aggregations
from .risk_enrichers import total_risk_impact
from .queries import get_grouped_units_of_work, get_root_node, build_unit_hash
from .persists import build_tree_struct


def get_teams_from_hash(unit_hash: Dict[str, Any]) -> List[str]:
    team_hash = {}

    for t in unit_hash.values():
        if t.area_path in team_hash:
            continue
        team_hash[t.area_path] = t.area_path

    return [x for x in list(team_hash.values()) if x != ""]


async def build_unit_tree(node_id: int, get_node_fn) -> BaseUnit:
    node = get_node_fn(node_id)
    tree = link_node(node=node, get_node_fn=get_node_fn)
    enrich_with_child_aggregations(tree)
    return tree


def total_no_units_in_state(hash: Dict[str, BaseUnit]) -> Dict[str, int]:
    total_active = 0
    total_closed = 0
    total_new = 0

    for unit in hash.values():
        if unit.state == UnitStatuses.ACTIVE.value:
            total_active += 1
        elif (
            unit.state == UnitStatuses.CLOSED.value
            or unit.state == UnitStatuses.RESOLVED.value
        ):
            total_closed += 1
        elif (
            unit.state == UnitStatuses.NEW.value
            or unit.state == UnitStatuses.APPROVED.value
        ):
            total_new += 1

    return {
        UnitStatuses.ACTIVE.value: total_active,
        UnitStatuses.CLOSED.value: total_closed,
        UnitStatuses.NEW.value: total_new,
    }


async def build_unit_tree_workflow(cmd: RootCmd) -> Awaitable:
    # await update_proc_status(cmd=cmd, status=ProcStatuses.RUNNING.value)

    grouped_units: List[UnitGroup] = await get_grouped_units_of_work(cmd)
    root_node: BaseUnit = get_root_node(grouped_units)
    root_node_id: str = root_node.id
    logging.debug(f"build_unit_tree_workflow() -> root node id: {root_node_id}")

    hash: Dict[str, BaseUnit] = build_unit_hash(grouped_units)
    logging.debug("build_unit_tree_workflow() -> unit hash built.")

    get_node_fn = lambda id: hash.get(id, {})

    logging.debug("build_unit_tree_workflow() -> building tree.")
    tree: BaseUnit = await build_unit_tree(root_node_id, get_node_fn)
    teams: List[str] = get_teams_from_hash(hash)
    units_in_states = total_no_units_in_state(hash)
    avg_risk_impact = total_risk_impact(hash)

    proj_summary_struct = ProjSummary(
        root_node_id=root_node_id,
        no_of_units=len(hash),
        no_of_active_units=units_in_states[UnitStatuses.ACTIVE.value],
        no_of_complete_units=units_in_states[UnitStatuses.CLOSED.value],
        no_of_new_units=units_in_states[UnitStatuses.NEW.value],
        risk_impact=avg_risk_impact["avg"],
        risk_impact_status=avg_risk_impact["status"],
        no_of_teams=len(teams),
        teams=teams,
        perc_complete=tree.perc_complete,
        perc_active=tree.perc_active,
        completed_work=tree.completed_work,
        assigned_to=tree.assigned_to,
        assigned_to_avatar_url=tree.assigned_to_avatar_url,
        utc_target_timestamp=tree.utc_target_timestamp,
    )

    logging.debug("build_unit_tree_workflow() -> tree built.")

    persistable_summary_struct: Dict[str, Any] = asdict(proj_summary_struct)
    await update_state(
        store_name=DaprConfigs.DAPR_PROJS_STATE_STORE_NAME.value,
        key=cmd._project_id_(),
        delta={
            "summary": persistable_summary_struct,
            "utc_updated_timestamp": utc_now_timestamp_str(),
        },
        partition_key="projs",
    )

    persistable_tree_struct: Dict[str, Any] = build_tree_struct(
        id=StructConfigs.UNIT_TREE_STRUCT_ID.value, tree=asdict(tree), cmd=cmd
    )
    await save_state(
        payload=persistable_tree_struct,
        store_name=DaprConfigs.DAPR_STRUCTS_STATE_STORE_NAME.value,
        partition_key=cmd._project_id_(),
        key=f"{cmd._project_id_()}-{StructConfigs.UNIT_TREE_STRUCT_ID.value}",
    )

    await publish_event(
        pubsub_name=DaprConfigs.DAPR_PUBSUB_NAME.value,
        topic_name=DaprConfigs.STRUCTURE_RECEIPT_TOPIC.value,
        data=cmd._serialize_(),
    )
