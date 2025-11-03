from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from abc import abstractmethod
from .unit_types import UnitTypes


@dataclass
class Relation:
    id: str
    relation_type: str


@dataclass
class BaseUnit:
    id: str
    title: str
    type: str
    state: str
    tags: List[str]
    description: str
    ext_url: str
    area_path: str
    utc_created_timestamp: str
    is_blocked: bool = False
    relations: List[Relation] = field(default_factory=list)
    utc_changed_timestamp: Optional[str] = None
    utc_target_timestamp: Optional[str] = None
    parent_id: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_avatar_url: Optional[str] = None
    completed_work: Optional[int] = 0
    perc_complete: Optional[int] = 0
    perc_active: Optional[int] = 0
    children: Optional[List["BaseUnit"]] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "BaseUnit":
        fields = {
            field.name: d.get(field.name) for field in cls.__dataclass_fields__.values()
        }
        obj = cls(**fields)
        obj.relations = [Relation(**r) for r in d.get("relations", [])]
        return obj


@dataclass
class UserStoryUnit(BaseUnit):
    ac: Optional[str] = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> BaseUnit:
        fields = {
            field.name: d.get(field.name) for field in cls.__dataclass_fields__.values()
        }
        obj = cls(**fields)
        obj.relations = [Relation(**r) for r in d.get("relations", [])]
        return obj


@dataclass
class TaskUnit(BaseUnit):
    original_estimate: Optional[str] = None
    completed_work: Optional[str] = None
    remaining_work: Optional[str] = None
    severity: Optional[int] = None
    risk_weighting: Optional[str] = None
    risk_impact: Optional[int] = None
    defaulted: Optional[bool] = True
    is_critical: Optional[bool] = False
    rag_status: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> BaseUnit:
        fields = {
            field.name: d.get(field.name) for field in cls.__dataclass_fields__.values()
        }
        obj = cls(**fields)
        obj.relations = [Relation(**r) for r in d.get("relations", [])]
        return obj


@dataclass
class BugUnit(BaseUnit):
    original_estimate: Optional[str] = None
    completed_work: Optional[str] = None
    remaining_work: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> BaseUnit:
        fields = {
            field.name: d.get(field.name) for field in cls.__dataclass_fields__.values()
        }
        obj = cls(**fields)
        obj.relations = [Relation(**r) for r in d.get("relations", [])]
        return obj


@dataclass
class ImpedimentUnit(BaseUnit):
    hours_impacted: Optional[int] = None
    category: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> BaseUnit:
        fields = {
            field.name: d.get(field.name) for field in cls.__dataclass_fields__.values()
        }
        obj = cls(**fields)
        obj.relations = [Relation(**r) for r in d.get("relations", [])]
        return obj


UNIT_TYPE_MAP = {
    UnitTypes.USER_STORY.value: UserStoryUnit,
    UnitTypes.TASK.value: TaskUnit,
    UnitTypes.BUG.value: BugUnit,
    UnitTypes.IMPEDIMENT.value: ImpedimentUnit,
}


class UnitFactory:
    @staticmethod
    def create_unit(d: Dict[str, Any]) -> BaseUnit:
        unit = UNIT_TYPE_MAP.get(d["type"], BaseUnit).from_dict(d)
        return unit


@dataclass
class PersistBase:
    id: str
    uid: str
    utc_created_timestamp: str
    __metadata__: Dict[str, Any]


@dataclass
class UnitGroup(PersistBase):
    unit_type: str
    units: List[BaseUnit] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "UnitGroup":
        obj = cls(**d)
        obj.units = [UnitFactory.create_unit(u) for u in d.get("units", [])]
        return obj
