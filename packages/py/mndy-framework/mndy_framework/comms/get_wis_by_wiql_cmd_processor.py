from .azdo_http_client import AzdoHttpClient
from .azdo_url_builder import AzdoUrlBuilder
import json
import logging


class GetWisByWiqlCmd:
    query: str

    def __init__(self, query: str):
        self.query = query

    def _to_dict_(self) -> dict:
        return {"query": self.query}


class GetWisByWiqlCmdProcessor:
    def __init__(self):
        self._client = AzdoHttpClient()

    async def process(self, cmd: GetWisByWiqlCmd) -> dict:
        try:
            qry = cmd._to_dict_()
            logging.debug(f"GetWisByWiqlCmdProcessor.process() -> qry: {qry}")
            resp = await self._client.get_wis_with_wiql(qry)
            dic = json.loads(resp.text)
            return dic
        except Exception as e:
            logging.error(f"GetWisByWiqlCmdProcessor.process() -> error: {e}")
            raise e
