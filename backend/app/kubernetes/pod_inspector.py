"""Inspects pod status across the cluster."""

from typing import Dict, Any, List, Optional
from loguru import logger

from app.kubernetes.kubectl_executor import run_kubectl_json


def inspect_pods(cluster_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Get pod status and detect unhealthy pods.
    Returns structured JSON with healthy/unhealthy status.
    """
    logger.info(f"Inspecting pods in cluster {cluster_name or 'default'}...")
    success, data, error = run_kubectl_json(["get", "pods", "-A"], cluster_name=cluster_name)
    
    if not success or not data:
        return {
            "healthy": False,
            "error": f"Failed to fetch pods: {error}",
            "problematic_pods": []
        }
        
    problematic_pods: List[Dict[str, Any]] = []
    
    # States that indicate a problem
    problem_states = [
        "CrashLoopBackOff",
        "ImagePullBackOff",
        "ErrImagePull",
        "Pending",
        "Error",
        "OOMKilled"
    ]
    
    for item in data.get("items", []):
        metadata = item.get("metadata", {})
        status = item.get("status", {})
        
        name = metadata.get("name", "unknown")
        namespace = metadata.get("namespace", "unknown")
        phase = status.get("phase", "Unknown")
        
        # Check container statuses for specific failure reasons
        container_statuses = status.get("containerStatuses", [])
        pod_issue = None
        
        for container in container_statuses:
            state = container.get("state", {})
            waiting = state.get("waiting", {})
            terminated = state.get("terminated", {})
            
            reason = waiting.get("reason") or terminated.get("reason")
            if reason in problem_states:
                pod_issue = reason
                break
                
            # Also check if it's stuck in ContainerCreating while pod is Pending
            if waiting.get("reason") == "ContainerCreating" and not container.get("ready"):
                if phase == "Pending":
                    pod_issue = "ContainerCreating"
                    break
                
        if not pod_issue:
            # If no container status issue found, check pod phase
            if phase in ["Pending", "Failed", "Unknown"]:
                pod_issue = phase
                
        if pod_issue:
            problematic_pods.append({
                "name": name,
                "namespace": namespace,
                "status": pod_issue
            })
            
    return {
        "healthy": len(problematic_pods) == 0,
        "problematic_pods": problematic_pods
    }
