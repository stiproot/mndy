import unittest
import sys
import os
from data import test_unit

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../src/azdo-worker")
    )
)

os.environ["API_KEY"] = "xyz"
os.environ["AZDO_BASE_URL"] = "https://dev.azure.com/CompanyX/ProjectY/_apis"

from src.core.map import map_unit


class TestMap(unittest.TestCase):
    """Test dict functions."""

    def test_get_nested_property(self):
        """Tests get_nested_property function."""
        mapped = map_unit(item=test_unit)
        self.assertIsNotNone(mapped)


if __name__ == "__main__":
    unittest.main()
