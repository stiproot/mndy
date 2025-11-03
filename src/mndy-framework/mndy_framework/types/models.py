from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional


@dataclass
class ProjSummary:
    root_node_id: str
    no_of_units: int
    no_of_active_units: int
    no_of_complete_units: int
    no_of_new_units: int
    risk_impact: int
    risk_impact_status: str
    no_of_teams: int
    teams: List[str]
    perc_complete: int
    perc_active: int
    completed_work: int
    assigned_to: Optional[str] = ""
    assigned_to_avatar_url: Optional[str] = ""
    utc_target_timestamp: Optional[str] = ""


@dataclass
class Proj:
    id: str
    name: str
    tag: str
    utc_created_timestamp: str
    color: str
    is_pinned: str
    ql: str
    description: str
    user_id: str
    summary: ProjSummary
    utc_updated_timestamp: str

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Proj":
        obj = cls(**d)
        obj.summary = None

        summary = d.get("summary", None)
        if summary:
            obj.summary = ProjSummary(**summary)

        return obj
