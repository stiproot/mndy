import unittest
import sys
import os
import time
import logging
import subprocess
from json import dumps as json_dumps
from json import loads as json_loads
from dataclasses import asdict

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__), "../../../src/modules/common/src/mndy-framework"
        )
    )
)

from mndy_framework.types import CmdTypes, DaprConfigs, Proj, ProcStatuses
from mndy_framework.comms.http_client import HttpClient
from mndy_framework.utils.env_var_provider import EnvVarProvider

os.environ["TEST_HARNESS_BASE_URL"] = "http://localhost:6010"

env_var_provider = EnvVarProvider()

TEST_HARNESS_BASE_URL = env_var_provider.get_env_var(
    "TEST_HARNESS_BASE_URL", "http://mndy-test-harness:6010"
)
print(f"TEST_HARNESS_BASE_URL: {TEST_HARNESS_BASE_URL}")

http_client = HttpClient(base_url=TEST_HARNESS_BASE_URL)

SERVICE_NAMES = [
    "mndy-mndy-workflows-worker-1",
    "mndy-mndy-azdo-worker-1",
    "mndy-mndy-insights-worker-1",
]


def run_bash_command(command):
    result = subprocess.run(
        command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    print(result.stdout.decode(), flush=True)
    if result.stderr:
        print(result.stderr.decode(), flush=True)


def build_compose_file_path() -> str:
    compose_file_path = os.path.join(
        os.getcwd(), "test", "t2", "core", "docker-compose.yml"
    )
    return compose_file_path


def print_container_info():
    run_bash_command(f"docker compose -p mndy -f {build_compose_file_path()} ps")

    for s in SERVICE_NAMES:
        print(f"Logs for {s}:")
        run_bash_command(f"docker logs {s}")


class TestCore(unittest.IsolatedAsyncioTestCase):
    """Test core workflows."""

    # async def asyncSetUp(self):
    #     run_bash_command(
    #         f"docker compose -p mndy -f {build_compose_file_path()} up --build -d"
    #     )
    #     time.sleep(15)

    async def asyncTearDown(self):
        run_bash_command(f"docker compose -p mndy -f {build_compose_file_path()} down")

    def test_refresh_proj_state_workflow(self):
        """Test (core) refresh project state workflow. This consists of the following steps. 1. Gather proj units of work. 2. Rebuild insights data structures."""

        USER_ID = "integration-tester"
        PROJECT_ID = "project-xyz"

        proj_data = {
            "color": "#457538",
            "description": None,
            "id": PROJECT_ID,
            "is_pinned": "false",
            "name": PROJECT_ID,
            "ql": "SELECT [System.Id], [System.WorkItemType], [System.Title], [System.AssignedTo], [System.State], [System.Tags]  FROM WorkItems WHERE [System.Tags] CONTAINS 'project-xyz'",
            "summary": None,
            "tag": PROJECT_ID,
            "user_id": USER_ID,
            "utc_created_timestamp": "2024-07-29T08:48:41Z",
            "utc_updated_timestamp": None,
        }
        proj = Proj.from_dict(proj_data)
        resp = http_client.post(
            json=json_dumps({"cmd_data": asdict(proj)}), url="cmds/state/persist"
        )
        self.assertEqual(resp.status_code, 200)
        print("Proj data persisted.")

        cmd = {
            "cmd_type": CmdTypes.BUILD_WORKFLOW.value,
            "cmd_data": {},
            "cmd_metadata": {
                "user_id": USER_ID,
                "project_id": PROJECT_ID,
            },
        }
        resp = http_client.post(
            json=json_dumps({"cmd_data": cmd}), url="cmds/workflow/publish"
        )
        self.assertEqual(resp.status_code, 200)
        print("Event published.")

        time.sleep(15)

        print_container_info()

        resp = http_client.post(
            json=json_dumps({"user_id": USER_ID, "project_id": PROJECT_ID}),
            url="qrys/state/proc",
        )
        self.assertEqual(resp.status_code, 200)
        print("State retrieved.")

        resp_data = resp.json()
        steps = resp_data.get("steps", [])

        self.assertEqual(len(steps), 2)
        for s in steps:
            proc_status = s.get("proc", {}).get("proc_status", ProcStatuses.ERROR.value)
            self.assertEqual(proc_status, ProcStatuses.COMPLETE.value)


if __name__ == "__main__":
    unittest.main()
