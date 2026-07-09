"""Extracts fix recommendations from LLM output."""

from typing import Dict, Any


def extract_fix(llm_response_json: Dict[str, Any]) -> Dict[str, str]:
    """
    Validates and extracts fix recommendations.
    """
    return {
        "fix": llm_response_json.get("fix", "No fix available."),
        "kubectl_command": llm_response_json.get("kubectl_command", ""),
        "prevention": llm_response_json.get("prevention", "")
    }
