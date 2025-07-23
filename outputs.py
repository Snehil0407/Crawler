# crawler/outputs.py

import json
from typing import Any, List

def format_json(results: List[Any]) -> str:
    """
    Pretty‑print scan results as JSON.
    """
    return json.dumps(results, indent=2)
