from .root_cmd import RootCmd

def build_uid(id: str, cmd: RootCmd) -> str:
    return f"{cmd._project_id_()}-{id}"
