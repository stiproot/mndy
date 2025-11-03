from enum import Enum


class UnitTypes(Enum):
    PROGRAMME = "Programme"
    LARGE_PROJECT = "Large Project"
    MEDIUM_PROJECT = "Medium Project"
    INITIATIVE = "Initiative"
    EPIC = "Epic"
    FEATURE = "Feature"
    USER_STORY = "User Story"
    TASK = "Task"
    BUG = "Bug"
    IMPEDIMENT = "Impediment"


class ImpedimentCategorys(Enum):
    ENV_ISSUE = "Environment Issue"
    SUPPORT = "Support"
    UNCLEAR_REQUIREMENTS = "Unclear Requirements"
    OTHER = "Other"
    UNPLANNED_LEAVE = "Unplanned Leave"


class UnitStatuses(Enum):
    NEW = "New"
    APPROVED = "Approved"
    BACK_BURNER = "Back Burner"
    ACTIVE = "Active"
    RESOLVED = "Resolved"
    CLOSED = "Closed"
    REMOVED = "Removed"
