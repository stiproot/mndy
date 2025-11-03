from dapr.clients import DaprClient
from json import dumps as json_dumps
from json import loads as json_loads
from mndy_framework import (
    RootCmd,
    DaprConfigs,
    BaseUnit,
    UnitGroup,
    query_state,
    decompress,
)
import logging
from typing import List, Dict, Any, Tuple, T, Optional


WORK_ITEM_TYPE_HIERARCHY = [
    "Programme",
    "Large Project",
    "Medium Project",
    "Initiative",
    "Epic",
    "Feature",
    "User Story",
    "Task",
    "Bug",
    "Impediment",
]

WORK_ITEM_TYPE_NO_HASH = {
    "Programme": 0,
    "Large Project": 1,
    "Medium Project": 2,
    "Initiative": 3,
    "Epic": 4,
    "Feature": 5,
    "User Story": 6,
    "Task": 7,
    "Bug": 8,
    "Impediment": 9,
}


def first(lst: List[T]) -> Optional[T]:
    return lst[0] if lst else None


def get_units_by_unit_type(unit_groups: list[UnitGroup], unit_type: str) -> list[BaseUnit]:
    return next(
        (unit_group.units for unit_group in unit_groups if unit_group.unit_type == unit_type),
        []
    )


def find_unit_with_all_child_relations(items: list[BaseUnit]) -> BaseUnit:
    filtered_items = [item for item in items if item.relations and all(rel.relation_type == "child" for rel in item.relations)]
    if not filtered_items:
        raise ValueError("No unit with all child relations found.")
    return first(filtered_items)


def get_root_node(grouped_units: List[UnitGroup]) -> BaseUnit:
    root_node_type_no = 10
    root_node_type = None

    for group in grouped_units:
        node_type_no = WORK_ITEM_TYPE_NO_HASH.get(group.unit_type, None)
        if node_type_no is None:
            continue

        if node_type_no < root_node_type_no:
            root_node_type_no = node_type_no
            root_node_type = group.unit_type
    
    units = get_units_by_unit_type(grouped_units, root_node_type)
    root = first(units) if len(units) == 1 else find_unit_with_all_child_relations(units)
    return root


def build_unit_hash(grouped_units: List[UnitGroup]) -> Dict[str, BaseUnit]:
    hash = {}

    for group in grouped_units:
        for i in group.units:
            hash[i.id] = i

    logging.debug("build_unit_hash() -> hash built.")
    return hash


def build_statestore_query(project_id: str) -> str:
    query = json_dumps({"filter": {"EQ": {"__metadata__.project_id": project_id}}})
    return query


async def get_grouped_units_of_work(cmd: RootCmd) -> List[UnitGroup]:
    project_id = cmd._project_id_()
    statestore_query = build_statestore_query(project_id)

    with DaprClient() as client:
        results = await query_state(
            DaprConfigs.DAPR_AZDO_STATE_STORE_NAME.value,
            query=statestore_query,
            partition_key=project_id,
            default_factory=lambda j: UnitGroup.from_dict(
                decompress(j["compressed_data"])
            ),
        )

        return results
