import logging
from typing import Awaitable, Dict, Any, List, Tuple
from dataclasses import asdict
from mndy_framework import Proj
from .cmd_builder import create_structure_cmd, create_gather_cmd, create_tag_cmd


def map_tag_gather_structure_cmds(proj: Proj) -> List[Dict[str, Any]]:
    root_node_id = proj.summary.root_node_id if proj.summary else None

    structure_cmd = create_structure_cmd(proj)
    gather_cmd = create_gather_cmd(proj)

    if not root_node_id:
        return [gather_cmd, structure_cmd]

    tag_cmd = create_tag_cmd(proj)

    return [tag_cmd, gather_cmd, structure_cmd]


def map_gather_structure_cmds(proj: Proj) -> List[Dict[str, Any]]:
    structure_cmd = create_structure_cmd(proj)
    gather_cmd = create_gather_cmd(proj)

    return [gather_cmd, structure_cmd]
