from typing import Optional, Dict
from mndy_framework import BaseUnit, UnitTypes, RagStatuses
from .critical_tags import CRITICAL_TAGS


def is_critical(node: BaseUnit) -> None:
    node.is_critical = any(tag in CRITICAL_TAGS for tag in node.tags)


def risk_impact_calc(node: BaseUnit) -> int:
    return int(node.risk_weighting) * int(node.severity)


def risk_impact(node: BaseUnit) -> None:
    node.defaulted = not node.risk_weighting or not node.severity
    node.risk_impact = risk_impact_calc(node)


def rag_status_calc(risk_impact: int) -> str:
    if risk_impact < 15:
        return RagStatuses.GREEN.value
    elif risk_impact >= 15 and risk_impact < 39:
        return RagStatuses.AMBER.value
    else:
        return RagStatuses.RED.value


def rag_status(node: BaseUnit) -> None:
    node.rag_status = rag_status_calc(node.risk_impact)


def enrich_with_risk(node: BaseUnit) -> None:
    is_critical(node)
    risk_impact(node)
    rag_status(node)


def total_risk_impact(hash: Dict[str, BaseUnit]) -> Dict:
    tasks = [unit for unit in hash.values() if unit.type == UnitTypes.TASK.value]
    avg = sum([risk_impact_calc(task) for task in tasks]) / len(tasks)
    return {"avg": round(avg, 2), "status": rag_status_calc(avg)}
