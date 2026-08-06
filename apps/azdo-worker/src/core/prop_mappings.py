from mndy_framework import UnitTypes

SEVERITY_HASH = {
    "(1) Negligible": 1,
    "(2) Minor": 3,
    "(3) Moderate": 2,
    "(4) Major": 4,
    "(5) Catastrophic": 5,
}

RELATION_HASH = {
    "System.LinkTypes.Hierarchy-Forward": "child",
    "System.LinkTypes.Hierarchy-Reverse": "parent",
}

TRGT_DATE_PROP_MAP = {
    "src_prop_path": "fields_Microsoft.VSTS.Scheduling.TargetDate",
    "trgt_prop_path": "utc_target_timestamp",
    "path_delimiter": "_",
    "map": None,
    "default": "",
}

ORIGINAL_ESTIMATE_PROP_MAP = {
    "src_prop_path": "fields_Microsoft.VSTS.Scheduling.OriginalEstimate",
    "trgt_prop_path": "original_estimate",
    "path_delimiter": "_",
    "map": None,
    "default": None,
}

COMPLETED_WORK_PROP_MAP = {
    "src_prop_path": "fields_Microsoft.VSTS.Scheduling.CompletedWork",
    "trgt_prop_path": "completed_work",
    "path_delimiter": "_",
    "map": None,
    "default": None,
}

REMAINING_WORK_PROP_MAP = {
    "src_prop_path": "fields_Microsoft.VSTS.Scheduling.RemainingWork",
    "trgt_prop_path": "remaining_work",
    "path_delimiter": "_",
    "map": None,
    "default": None,
}


def strip_relation_id(url):
    return str(url.split("/")[-1])


def map_children(relations):
    relations_of_interest = filter(
        lambda x: x.get("rel", None) in RELATION_HASH, relations
    )
    return list(
        map(
            lambda x: {
                "relation_type": RELATION_HASH[x["rel"]],
                "id": strip_relation_id(x["url"]),
            },
            relations_of_interest,
        )
    )


CORE_PROP_MAP = [
    {
        "src_prop_path": "id",
        "trgt_prop_path": "id",
        "path_delimiter": "_",
        "map": lambda x: str(x),
        "default": "",
    },
    {
        "src_prop_path": "fields_System.Title",
        "trgt_prop_path": "title",
        "path_delimiter": "_",
        "map": lambda x: x.strip(),
        "default": "",
    },
    {
        "src_prop_path": "fields_System.WorkItemType",
        "trgt_prop_path": "type",
        "type": "string",
        "path_delimiter": "_",
        "map": None,
        "default": "",
    },
    {
        "src_prop_path": "fields_System.State",
        "trgt_prop_path": "state",
        "path_delimiter": "_",
        "map": None,
        "default": "",
    },
    {
        "src_prop_path": "fields_System.Tags",
        "trgt_prop_path": "tags",
        "path_delimiter": "_",
        "map": lambda x: list(map(lambda t: t.strip(), x.split(";"))),
        "default": [],
    },
    {
        "src_prop_path": "fields_System.Description",
        "trgt_prop_path": "description",
        "path_delimiter": "_",
        "map": lambda x: x.strip(),
        "default": "",
    },
    {
        "src_prop_path": "fields_Custom.IsBlocked",
        "trgt_prop_path": "is_blocked",
        "path_delimiter": "_",
        "map": None,
        "default": False,
    },
    {
        "src_prop_path": "fields_System.AssignedTo_displayName",
        "trgt_prop_path": "assigned_to",
        "path_delimiter": "_",
        "map": None,
        "default": None,
    },
    {
        "src_prop_path": "fields~System.AssignedTo~_links~avatar~href",
        "trgt_prop_path": "assigned_to_avatar_url",
        "path_delimiter": "~",
        "map": None,
        "default": None,
    },
    {
        "src_prop_path": "relations",
        "trgt_prop_path": "relations",
        "path_delimiter": "_",
        "map": lambda x: map_children(x),
        "default": [],
    },
    {
        "src_prop_path": "fields_System.Id",
        "trgt_prop_path": "ext_url",
        "path_delimiter": "_",
        "map": lambda id: f"https://dev.azure.com/CompanyX/ProjectY/_workitems/edit/{id}",
        "default": "",
    },
    {
        "src_prop_path": "fields_System.AreaPath",
        "trgt_prop_path": "area_path",
        "path_delimiter": "_",
        "map": None,
        "default": "",
    },
    {
        "src_prop_path": "fields_System.CreatedDate",
        "trgt_prop_path": "utc_created_timestamp",
        "path_delimiter": "_",
        "map": None,
        "default": None,
    },
    {
        "src_prop_path": "fields_System.ChangedDate",
        "trgt_prop_path": "utc_changed_timestamp",
        "path_delimiter": "_",
        "map": None,
        "default": None,
    },
]


TYPE_PROP_MAP = {
    UnitTypes.PROGRAMME.value: [TRGT_DATE_PROP_MAP],
    UnitTypes.LARGE_PROJECT.value: [TRGT_DATE_PROP_MAP],
    UnitTypes.MEDIUM_PROJECT.value: [TRGT_DATE_PROP_MAP],
    UnitTypes.INITIATIVE.value: [TRGT_DATE_PROP_MAP],
    UnitTypes.EPIC.value: [TRGT_DATE_PROP_MAP],
    UnitTypes.FEATURE.value: [TRGT_DATE_PROP_MAP],
    UnitTypes.USER_STORY.value: [
        TRGT_DATE_PROP_MAP,
        {
            "src_prop_path": "fields_Microsoft.VSTS.Common.AcceptanceCriteria",
            "trgt_prop_path": "ac",
            "path_delimiter": "_",
            "map": lambda x: x.strip(),
            "default": "",
        },
    ],
    UnitTypes.TASK.value: [
        ORIGINAL_ESTIMATE_PROP_MAP,
        COMPLETED_WORK_PROP_MAP,
        REMAINING_WORK_PROP_MAP,
        {
            "src_prop_path": "fields_Custom.SeverityOptionList",
            "trgt_prop_path": "severity",
            "path_delimiter": "_",
            "map": lambda x: x if not x else SEVERITY_HASH.get(x.strip(), None),
            "default": "(5) Catastrophic",
        },
        {
            "src_prop_path": "fields_Custom.RiskWeighting",
            "trgt_prop_path": "risk_weighting",
            "path_delimiter": "_",
            "map": lambda x: x if not x else int(x),
            "default": 10,
        },
    ],
    UnitTypes.BUG.value: [
        ORIGINAL_ESTIMATE_PROP_MAP,
        COMPLETED_WORK_PROP_MAP,
        REMAINING_WORK_PROP_MAP,
    ],
    UnitTypes.IMPEDIMENT.value: [
        {
            "src_prop_path": "fields_Custom.Category",
            "trgt_prop_path": "category",
            "path_delimiter": "_",
            "map": lambda x: x if not x else x.strip(),
            "default": None,
        },
        {
            "src_prop_path": "fields_Custom.HoursImpacted",
            "trgt_prop_path": "hours_impacted",
            "path_delimiter": "_",
            "map": lambda x: x if not x else int(x),
            "default": None,
        },
    ],
}
