from .azdo_http_client import AzdoHttpClient
from .azdo_url_builder import AzdoUrlBuilder
import json
import logging


class GetWiDetailsCmd:
    id: int

    def __init__(self, id: int):
        self.id = id


class GetWiDetailsCmdProcessor:
    def __init__(self):
        self._client = AzdoHttpClient()

    def process(self, cmd: GetWiDetailsCmd) -> dict:
        try:
            logging.debug(f"GetWiDetailsCmdProcessor.process() -> cmd.id: {cmd.id}")
            resp = self._client.get_workitem_detail(work_item_id=cmd.id)
            dic = json.loads(resp.text)
            return dic
        except Exception as e:
            logging.error(f"GetWiDetailsCmdProcessor.process() -> error: {e}")
            raise e
