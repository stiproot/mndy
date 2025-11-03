import logging
import httpx
from typing import Optional
from .azdo_url_builder import AzdoUrlBuilder
from ..utils import EnvVarProvider


class HttpClient:

    def __init__(self, headers: dict[str, str]):
        self._headers = headers
        self._client = self.create_client()

    def create_client(self) -> httpx.Client:
        return httpx.Client(verify=False)

    def get(self, url: str, headers: Optional[dict[str, str]] = None):
        return self._client.get(url, headers=self._headers)

    def post(
        self, url: str, json: dict[str, str], headers: Optional[dict[str, str]] = None
    ):
        return self._client.post(url, headers=self._headers, json=json)


class AzdoHttpClient:
    def __init__(self):
        self._env_var_provider = EnvVarProvider()
        self._azdo_url_builder = AzdoUrlBuilder(
            base_url=self._env_var_provider.get_env_var("AZDO_BASE_URL")
        )

        headers = self.build_headers()
        self._client = HttpClient(headers=headers)

    def build_headers(self) -> dict[str, str]:
        key = self._env_var_provider.get_env_var("API_KEY")
        return {"Authorization": f"Basic {key}"}

    def get_workitem_detail(self, work_item_id: int):
        url = self._azdo_url_builder.build_workitem_detail_url(work_item_id)
        logging.debug(
            f"AzdoHttpClient.get_workitem_detail() -> url: {url}, work_item_id: {work_item_id}"
        )
        return self._client.get(url=url, headers=self.build_headers())

    async def get_wis_with_wiql(self, query: dict[str, str]):
        url = self._azdo_url_builder.build_wiql_url()
        logging.debug(
            f"AzdoHttpClient.get_wis_with_wiql() -> url: {url}, query: {query}"
        )
        return self._client.post(url=url, headers=self.build_headers(), json=query)

    def get_wis_list(self, ids: list[int]):
        url = self._azdo_url_builder.build_work_items_list_url(ids)
        logging.debug(f"AzdoHttpClient.get_wis_list() -> url: {url}, ids: {ids}")
        return self._client.get(url=url, headers=self.build_headers())
