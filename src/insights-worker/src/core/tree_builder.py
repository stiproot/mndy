import logging
from mndy_framework import get_nested_property_with_default, BaseUnit
from .raw_inspectors import (
    get_relation_type_from_relation_structure,
    get_id_from_relation_structure,
)


def link_node(node: BaseUnit, get_node_fn) -> BaseUnit:
    if not node:
        return node

    relations = node.relations

    if len(relations) == 0:
        return node

    parent_id = -1

    for relation in relations:
        relation_id = relation.id
        relation_type = relation.relation_type

        if relation_type == "parent":
            parent_id = relation_id

        if relation_type == "child":
            child_node = get_node_fn(relation_id)
            if not child_node:
                logging.warning(
                    f"link_node() -> Could not find child node. Node id: {relation_id}."
                )
                continue

            child = link_node(
                child_node,
                get_node_fn=get_node_fn,
            )
            if child:
                if not node.children:
                    node.children = []
                node.children.append(child)

    node.parent_id = parent_id

    return node
