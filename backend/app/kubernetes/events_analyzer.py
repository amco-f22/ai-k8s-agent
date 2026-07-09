"""Analyzes Kubernetes events for warnings and errors."""

from typing import Dict, Any, List, Optional
from loguru import logger

from app.kubernetes.kubectl_executor import run_kubectl_json


def analyze_events(cluster_name: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Read Kubernetes events across all namespaces.
    Filter for Warning events related to scheduling, pulling, backing off, etc.
    Returns summarized findings.
    """
    logger.info(f"Analyzing Kubernetes events in cluster {cluster_name or 'default'}...")
    success, data, error = run_kubectl_json(["get", "events", "-A"], cluster_name=cluster_name)
    
    if not success or not data:
        logger.warning(f"Failed to fetch events: {error}")
        return [{"error": "Failed to fetch events"}]
        
    problematic_events = []
    
    # Event reasons to flag
    target_reasons = [
        "FailedScheduling",
        "BackOff",
        "FailedMount",
        "FailedPull",
        "ErrImagePull",
        "Unhealthy",
        "Failed"
    ]
    
    for item in data.get("items", []):
        type_ = item.get("type", "")
        reason = item.get("reason", "")
        
        # Only care about warnings or specific targeted error reasons
        if type_ == "Warning" or reason in target_reasons:
            metadata = item.get("metadata", {})
            involved_obj = item.get("involvedObject", {})
            
            problematic_events.append({
                "namespace": involved_obj.get("namespace", "unknown"),
                "kind": involved_obj.get("kind", "unknown"),
                "name": involved_obj.get("name", "unknown"),
                "reason": reason,
                "message": item.get("message", ""),
                "count": item.get("count", 1)
            })
            
    # Sort by count descending (most frequent issues first), take top 20
    problematic_events.sort(key=lambda x: x.get("count", 0), reverse=True)
    return problematic_events[:20]
