def dependencies_formulae(base, multiplier, tags):
    if (
        "Number_of_Dependencies_1" in tags
        or "Number_of_Dependencies_2-3" in tags
        or "Number_of_Dependencies_3+" in tags
    ):
        return base * multiplier
    return base


def team_domain_formulae(base, multiplier, tags):
    if (
        "Team_Domain_Knowledge_High" in tags
        or "Team_Domain_Knowledge_Medium" in tags
        or "Team_Domain_Knowledge_Low" in tags
    ):
        return base * multiplier
    return base


def repo_maturity_formulae(base, multiplier, tags):
    if (
        "Repo_Maturity_Copper" in tags
        or "Repo_Maturity_Bronze" in tags
        or "Repo_Maturity_Copper" in tags
        or "Repo_Maturity_Silver" in tags
        or "Repo_Maturity_Electrum" in tags
        or "Repo_Maturity_Gold" in tags
    ):
        return base * multiplier
    return base


okr_fn = (
    lambda base, multiplier, **kwargs: base * multiplier
    if "OKR_Yes" in kwargs["tags"]
    else base
)
audacious_fn = (
    lambda base, multiplier, **kwargs: base * multiplier
    if "Audacious_Goal_Yes" in kwargs["tags"]
    else base
)
hard_date_fn = (
    lambda base, multiplier, **kwargs: base * multiplier
    if "Hard_Delivery_date_Yes" in kwargs["tags"]
    else base
)
no_dependencies_fn = lambda base, multiplier, **kwargs: dependencies_formulae(
    base, multiplier, **kwargs
)
team_domain_fn = lambda base, multiplier, **kwargs: team_domain_formulae(
    base, multiplier, **kwargs
)
individual_domain_fn = (
    lambda base, multiplier, **kwargs: base * multiplier
    if "Individual_Yes" in kwargs["tags"]
    else base
)
repo_maturity_fn = lambda base, multiplier, **kwargs: repo_maturity_formulae(
    base, multiplier, **kwargs
)

feature_hash = [
    {
        "feature_id": "contributes_to_okr",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "binary",
        "weighting": "risk_weighting",
        "formula": okr_fn,
    },
    {
        "feature_id": "audacious_goal",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "binary",
        "weighting": "risk_weighting",
        "formula": audacious_fn,
    },
    {
        "feature_id": "hard_delivery_date",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "binary",
        "weighting": "risk_weighting",
        "formula": hard_date_fn,
    },
    {
        "feature_id": "no_dependencies",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "set",
        "weighting": "risk_weighting",
        "formula": no_dependencies_fn,
    },
    {
        "feature_id": "team_domain",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "set",
        "weighting": "risk_weighting",
        "formula": team_domain_fn,
    },
    {
        "feature_id": "individual_domain",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "binary",
        "weighting": "risk_weighting",
        "formula": individual_domain_fn,
    },
    {
        "feature_id": "repo_maturity",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "set",
        "weighting": "risk_weighting",
        "formula": repo_maturity_fn,
    },
    {
        "feature_id": "rag_classification",
        "arg_props": ["tags"],
        "base_prop": "severity",
        "feature_data_type": "set",
        "weighting": "risk_weighting",
        "formula": repo_maturity_fn,
    },
]


def calc_risk_impact(summary: dict):
    risk_impact = 0
    for feature in feature_hash:
        risk_weighting = summary[feature["weighting"]]
        base_prop = feature["base_prop"]
        arg_props = feature["arg_props"]
        formula = feature["formula"]

        arg_dict = {}
        for p in arg_props:
            arg_dict[p] = summary[p]

        output = formula(base=summary[base_prop], multiplier=risk_weighting, **arg_dict)
        risk_impact += output

    return risk_impact
