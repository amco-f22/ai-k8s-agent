"""Inspects deployment status for rollout failures."""

from typing import Dict, Any, List, Optional
from loguru import logger

from app.kubernetes.kubectl_executor import run_kubectl_json


def inspect_deployments(cluster_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Check deployments for unavailable replicas or rollout failures.
    Returns a list of unhealthy deployments.
    """
    logger.info(f"Inspecting deployments in cluster {cluster_name or 'default'}...")
    success, data, error = run_kubectl_json(["get", "deployments", "-A"], cluster_name=cluster_name)
    
    if not success or not data:
        logger.warning(f"Failed to fetch deployments: {error}")
        return [{"error": "Failed to fetch deployments"}]
        
    problematic_deployments = []
    
    for item in data.get("items", []):
        metadata = item.get("metadata", {})
        status = item.get("status", {})
        
        name = metadata.get("name", "unknown")
        namespace = metadata.get("namespace", "unknown")
        
        # Check replica counts
        replicas = status.get("replicas", 0)
        available = status.get("availableReplicas", 0)
        unavailable = status.get("unavailableReplicas", 0)
        
        # Check conditions for Progressing -> False or ReplicaFailure -> True
        conditions = status.get("conditions", [])
        failure_condition = None
        
        for cond in conditions:
            if cond.get("type") == "Progressing" and cond.get("status") == "False":
                failure_condition = f"Rollout failed: {cond.get('reason')} - {cond.get('message')}"
            elif cond.get("type") == "ReplicaFailure" and cond.get("status") == "True":
                failure_condition = f"Replica failure: {cond.get('reason')} - {cond.get('message')}"
                
        # A deployment is problematic if it has unavailable replicas or a failure condition
        if unavailable > 0 or failure_condition or (replicas > 0 and available == 0):
            problematic_deployments.append({
                "name": name,
                "namespace": namespace,
                "replicas_desired": replicas,
                "replicas_available": available,
                "replicas_unavailable": unavailable,
                "issue": failure_condition or "Unavailable replicas detected"
            })
            
    return problematic_deployments
