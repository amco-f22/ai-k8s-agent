"""Extracts confidence score from LLM output."""

from typing import Dict, Any


def extract_confidence(llm_response_json: Dict[str, Any]) -> int:
    """
    Validates and extracts confidence score.
    Returns an integer between 0 and 100.
    """
    try:
        conf = int(llm_response_json.get("confidence", 0))
        return max(0, min(100, conf))
    except (ValueError, TypeError):
        return 0
