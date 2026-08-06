import logging
from mndy_framework import (
    DaprConfigs,
    RootCmd,
    CmdTypes,
    ProcStatuses,
    Proj,
    utc_now_timestamp_str,
)


def add_proc_struct(cmd: RootCmd, topic_name: str) -> dict[str, any]:
    return {
        "cmd": cmd,
        "proc": {
            "target_topic_name": topic_name,
            "proc_status": ProcStatuses.PENDING.value,
            "proc_err": None,
            "utc_created_timestamp": utc_now_timestamp_str(),
        },
    }


def create_structure_cmd(proj: Proj) -> dict[str, any]:
    cmd = RootCmd(
        cmd_type=CmdTypes.BUILD_UNIT_OF_WORK_TREE.value,
        cmd_data={},
        cmd_metadata={
            "cmd_post_op": {
                "cmd_result_enrichment": {
                    "prop_map": [
                        {"key": "__metadata__", "val": {"project_id": proj.id}}
                    ]
                },
            },
            "project_id": proj.id,
            "user_id": proj.user_id,
        },
    )

    return add_proc_struct(cmd, DaprConfigs.STRUCTURE_TOPIC.value)


def create_gather_cmd(proj: Proj) -> dict[str, any]:
    cmd = RootCmd(
        cmd_type=CmdTypes.GATHER_PROJECT_UNITS_OF_WORK.value,
        cmd_data={"ql": proj.ql},
        cmd_metadata={
            "cmd_post_op": {
                "cmd_result_enrichment": {
                    "prop_map": [
                        {"key": "__metadata__", "val": {"project_id": proj.id}}
                    ]
                },
            },
            "project_id": proj.id,
            "user_id": proj.user_id,
        },
    )

    return add_proc_struct(cmd, DaprConfigs.GATHER_TOPIC.value)


def create_tag_cmd(proj: Proj) -> dict[str, any]:
    root_node_id = proj.summary.root_node_id if proj.summary else None
    if not root_node_id:
        raise ValueError("Root node id is required to tag the project")

    cmd = RootCmd(
        cmd_type=CmdTypes.UPDATE_UNIT_OF_WORK_HIERARCHY.value,
        cmd_data={"cmd": {"id": root_node_id, "tags": proj.tag}},
        cmd_metadata={
            "project_id": proj.id,
            "user_id": proj.user_id,
        },
    )

    return add_proc_struct(cmd, DaprConfigs.AZDO_PROXY_TOPIC.value)
