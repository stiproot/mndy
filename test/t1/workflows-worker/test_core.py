import unittest
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../src/workflows-worker/src")
    )
)

os.environ["API_KEY"] = "xyz"

from core.procs import process_cmd


class TestCore(unittest.TestCase):
    """Test core functions."""

    def test_placeholder(self):
        """Test placeholder."""
        self.assertIsNotNone({})


if __name__ == "__main__":
    unittest.main()
