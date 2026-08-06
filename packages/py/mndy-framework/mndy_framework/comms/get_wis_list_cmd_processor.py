from .azdo_http_client import AzdoHttpClient
from .azdo_url_builder import AzdoUrlBuilder
import json
import logging


class GetWisListCmd:
    ids: list[int]

    def __init__(self, ids: list[int]):
        self.ids = ids


class GetWisListCmdProcessor:
    def __init__(self):
        self._client = AzdoHttpClient()

    async def process(self, cmd: GetWisListCmd) -> dict:
        try:
            logging.debug(f"GetWisListCmdProcessor.process() -> cmd.ids: {cmd.ids}")
            resp = self._client.get_wis_list(cmd.ids)
            dic = json.loads(resp.text)
            return dic
        except Exception as e:
            logging.error(f"GetWisListCmdProcessor.process() -> error: {e}")
            raise e
