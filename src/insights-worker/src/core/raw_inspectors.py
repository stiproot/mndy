
def get_id_from_relation_structure(relation: dict) -> int:
    return int(relation["url"].split("/")[-1])


def get_relation_type_from_relation_structure(relation: dict) -> str:
    return relation["attributes"]["name"].lower()
