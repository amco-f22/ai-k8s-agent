"""Extracts root cause from LLM output."""

from typing import Dict, Any


def extract_root_cause(llm_response_json: Dict[str, Any]) -> Dict[str, str]:
    """
    Validates and extracts root cause, severity, and explanation.
    """
    severity = llm_response_json.get("severity", "warning")
    if severity not in ("critical", "warning", "info"):
        severity = "warning"
    
    return {
        "root_cause": llm_response_json.get("root_cause", "Unknown failure"),
        "severity": severity,
        "explanation": llm_response_json.get("explanation", "The system could not determine the exact explanation from the evidence.")
    }
