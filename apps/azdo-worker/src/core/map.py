from mndy_framework import get_nested_property, UnitFactory, BaseUnit
from .prop_mappings import CORE_PROP_MAP, TYPE_PROP_MAP
import logging


def map_unit(item) -> BaseUnit:
    unit = {}

    for prop in CORE_PROP_MAP:
        value = get_nested_property(
            data=item,
            keys=prop["src_prop_path"],
            delimiter=prop["path_delimiter"],
            default=prop["default"],
        )
        value = value if not prop["map"] or not value else prop["map"](value)
        unit[prop["trgt_prop_path"]] = value

    for prop in TYPE_PROP_MAP.get(unit["type"], []):
        value = get_nested_property(
            data=item,
            keys=prop["src_prop_path"],
            delimiter=prop["path_delimiter"],
            default=prop["default"],
        )
        value = value if not prop["map"] or not value else prop["map"](value)
        unit[prop["trgt_prop_path"]] = value

    return UnitFactory.create_unit(unit)
