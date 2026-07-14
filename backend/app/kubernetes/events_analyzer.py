"""Analyzes Kubernetes events for warnings and errors."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from loguru import logger

from app.kubernetes.kubectl_executor import run_kubectl_json


# Only consider events from the last N minutes to avoid stale noise
EVENT_RECENCY_MINUTES = 5


def _parse_event_time(item: Dict[str, Any]) -> Optional[datetime]:
    """Extract the most relevant timestamp from an event."""
    for field in ("lastTimestamp", "firstTimestamp"):
        ts = item.get(field)
        if ts:
            try:
                return datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                continue
    # Fall back to metadata.creationTimestamp
    ts = item.get("metadata", {}).get("creationTimestamp")
    if ts:
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass
    return None


def analyze_events(cluster_name: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Read Kubernetes events across all namespaces.
    Filter for Warning events related to scheduling, pulling, backing off, etc.
    Only includes events from the last EVENT_RECENCY_MINUTES to avoid stale noise.
    Returns summarized findings.
    """
    logger.info(f"Analyzing Kubernetes events in cluster {cluster_name or 'default'}...")
    success, data, error = run_kubectl_json(["get", "events", "-A"], cluster_name=cluster_name)
    
    if not success or not data:
        logger.warning(f"Failed to fetch events: {error}")
        return [{"error": "Failed to fetch events"}]
        
    problematic_events = []
    cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=EVENT_RECENCY_MINUTES)
    
    # Event reasons to flag
    target_reasons = [
        "FailedScheduling",
        "BackOff",
        "FailedMount",
        "FailedPull",
        "ErrImagePull",
        "Unhealthy",
        "Failed",
        "OOMKilling",
        "Evicted",
    ]
    
    for item in data.get("items", []):
        type_ = item.get("type", "")
        reason = item.get("reason", "")
        
        # Only care about warnings or specific targeted error reasons
        if type_ != "Warning" and reason not in target_reasons:
            continue

        # Skip events older than the recency cutoff
        event_time = _parse_event_time(item)
        if event_time and event_time < cutoff_time:
            continue
            
        metadata = item.get("metadata", {})
        involved_obj = item.get("involvedObject", {})
        
        age_label = ""
        if event_time:
            age_seconds = (datetime.now(timezone.utc) - event_time).total_seconds()
            if age_seconds < 60:
                age_label = f"{int(age_seconds)}s ago"
            else:
                age_label = f"{int(age_seconds // 60)}m ago"
        
        problematic_events.append({
            "namespace": involved_obj.get("namespace", "unknown"),
            "kind": involved_obj.get("kind", "unknown"),
            "name": involved_obj.get("name", "unknown"),
            "reason": reason,
            "message": item.get("message", ""),
            "count": item.get("count", 1),
            "age": age_label,
        })
            
    # Sort by count descending (most frequent issues first), take top 20
    problematic_events.sort(key=lambda x: x.get("count", 0), reverse=True)
    
    logger.info(f"Found {len(problematic_events)} recent problematic events (last {EVENT_RECENCY_MINUTES}m).")
    return problematic_events[:20]
