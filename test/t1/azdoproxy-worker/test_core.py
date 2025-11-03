import unittest
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../src/azdoproxy-worker/src")
    )
)

os.environ["API_KEY"] = "xyz"
os.environ["AZDO_PROXY_BASE_URL"] = "xyz"

from core.procs import process_azdoproxy_cmd_workflow


class TestCore(unittest.TestCase):
    """Test core functions."""

    def test_placeholder(self):
        """Test placeholder."""
        self.assertIsNotNone({})


if __name__ == "__main__":
    unittest.main()
