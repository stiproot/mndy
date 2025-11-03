import unittest
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../src/insights-worker")
    )
)

os.environ["API_KEY"] = "xyz"

from src.core.build_unit_of_work_tree import build_unit_tree_workflow


class TestCore(unittest.TestCase):
    """Test core functions."""

    def test_placeholder(self):
        """Test placeholder."""
        self.assertIsNotNone({})


if __name__ == "__main__":
    unittest.main()
