from typing import Optional
from requests import request
from json import dumps as json_dumps


class AzdoProxyHttpClient:
    _default_headers = {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
    }

    def __init__(self, base_url: Optional[str] = ""):
        self._base_url = base_url

    def post(
        self,
        data: dict,
        url: Optional[str] = "",
        headers: Optional[dict[str, str]] = _default_headers,
    ):
        json = json_dumps(data)
        print("json", json)
        return request(
            "POST", url=f"{self._base_url}/{url}", headers=headers, data=json
        )

    def patch(
        self,
        data: dict,
        url: Optional[str] = "",
        headers: Optional[dict[str, str]] = _default_headers,
    ):
        json = json_dumps(data)
        print("json", json)
        return request(
            "PATCH", url=f"{self._base_url}/{url}", headers=headers, data=json
        )

    def createDashboard(self, data: dict):
        return self.post(url="azdo/dashboard", data=data)

    def bulkCreateWi(
        self,
        data: dict,
    ):
        return self.post(url="azdo/bulk/create", data=data)

    def cloneWi(
        self,
        data: dict,
    ):
        return self.post(url="azdo/clone", data=data)

    def updateWi(
        self,
        data: dict,
    ):
        return self.patch(url="azdo/workitems/update", data=data)

    def updateWiHierarchy(
        self,
        data: dict,
    ):
        return self.patch(url="azdo/workitems/update/hierarchy", data=data)
