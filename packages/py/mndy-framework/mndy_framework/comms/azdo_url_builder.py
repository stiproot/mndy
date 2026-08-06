from .url_builder import UrlBuilder
from typing import Optional


class AzdoUrlBuilder:
    def __init__(
        self,
        base_url,
        default_api_version: Optional[str] = "7.0",
    ):
        self._default_api_version = default_api_version
        self._base_url = f"{base_url}/"

    def base_url_builder(self):
        return UrlBuilder(self._base_url)

    def build_workitem_detail_url(self, work_item_id: int) -> str:
        builder = (
            self.base_url_builder()
            .add_path_segment("wit")
            .add_path_segment("workitems")
            .add_path_segment(str(work_item_id))
            .add_query_param("$expand", "all")
            .add_query_param("api-version", self._default_api_version)
        )
        return builder.build()

    def build_wiql_url(self) -> str:
        builder = (
            self.base_url_builder()
            .add_path_segment("wit")
            .add_path_segment("wiql")
            .add_query_param("api-version", self._default_api_version)
        )
        return builder.build()

    def build_work_items_list_url(self, ids: list[int]) -> str:
        builder = (
            self.base_url_builder()
            .add_path_segment("wit")
            .add_path_segment("workitems")
            .add_query_param("ids", ",".join([str(id) for id in ids]))
            .add_query_param("$expand", "all")
            .add_query_param("api-version", self._default_api_version)
        )
        return builder.build()
