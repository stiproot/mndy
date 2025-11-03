from typing import Optional
from mndy_framework import BaseUnit, UnitTypes, UnitStatuses
from .critical_tags import CRITICAL_TAGS
from .risk_enrichers import enrich_with_risk


def enrich_with_child_aggregations(
    node: BaseUnit, opt_out_of_risk_fields: Optional[bool] = False
) -> None:

    no_of_children = len(node.children or [])

    if node.type == UnitTypes.TASK.value:
        enrich_with_risk(node)

    if no_of_children == 0:
        node.perc_complete = (
            100
            if node.state
            in [
                UnitStatuses.CLOSED.value,
                UnitStatuses.RESOLVED.value,
                UnitStatuses.REMOVED.value,
                UnitStatuses.BACK_BURNER.value,
            ]
            else 0
        )
        node.perc_active = 100 if node.state == UnitStatuses.ACTIVE.value else 0
        node.completed_work = int(node.completed_work or 0)
    else:
        perc_complete_numerator = 0
        perc_active_numerator = 0
        denominator = no_of_children * 100
        completed_work = 0

        for child in node.children or []:
            enrich_with_child_aggregations(child)

            perc_complete_numerator += child.perc_complete
            perc_active_numerator += child.perc_active
            completed_work += child.completed_work

        node.perc_complete = round(perc_complete_numerator / denominator * 100, 2)
        node.perc_active = round(perc_active_numerator / denominator * 100, 2)
        node.completed_work = completed_work
