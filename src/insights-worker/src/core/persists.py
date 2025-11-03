from typing import Dict, Any
from mndy_framework import (
    RootCmd,
    utc_now_timestamp_str,
    compress,
)


def build_tree_struct(id: str, tree: Dict[str, Any], cmd: RootCmd) -> Dict[str, Any]:
    tree_struct = {
        "id": id,
        "uid": id,
        "type": "root",
        "children": [tree],
        "utc_created_timestamp": utc_now_timestamp_str(),
    }

    struct = {"id": id, "compressed_data": compress(tree_struct)}
    cmd._apply_cmd_post_op_enrichment_prop_map_(struct)
    return struct
