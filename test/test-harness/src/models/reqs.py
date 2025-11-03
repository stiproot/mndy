from pydantic import BaseModel
from typing import Dict, Any


class PublishCmdReq(BaseModel):
    cmd_data: Dict[str, Any]


class QryProcStateReq(BaseModel):
    user_id: str
    project_id: str


class PersistProjStateReq(BaseModel):
    cmd_data: Dict[str, Any]
