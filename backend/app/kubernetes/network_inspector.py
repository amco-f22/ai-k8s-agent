"""Inspects Kubernetes services and endpoints for networking issues."""

from typing import Dict, Any, List, Optional
from loguru import logger

from app.kubernetes.kubectl_executor import run_kubectl_json


def inspect_network(cluster_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Check services and endpoints.
    A common issue is a Service with no Endpoints (often due to selector mismatch).
    Returns a list of problematic networking configurations.
    """
    logger.info(f"Inspecting networking in cluster {cluster_name or 'default'}...")
    
    # Get all services
    success_svc, data_svc, error_svc = run_kubectl_json(["get", "svc", "-A"], cluster_name=cluster_name)
    if not success_svc or not data_svc:
        logger.warning(f"Failed to fetch services: {error_svc}")
        return [{"error": "Failed to fetch services"}]
        
    # Get all endpoints
    success_ep, data_ep, error_ep = run_kubectl_json(["get", "endpoints", "-A"], cluster_name=cluster_name)
    if not success_ep or not data_ep:
        logger.warning(f"Failed to fetch endpoints: {error_ep}")
        return [{"error": "Failed to fetch endpoints"}]
        
    problematic_network = []
    
    # Map endpoints by namespace/name for quick lookup
    endpoints_map = {}
    for ep in data_ep.get("items", []):
        meta = ep.get("metadata", {})
        key = f"{meta.get('namespace')}/{meta.get('name')}"
        endpoints_map[key] = ep
        
    # Check services against their endpoints
    for svc in data_svc.get("items", []):
        meta = svc.get("metadata", {})
        spec = svc.get("spec", {})
        
        name = meta.get("name", "unknown")
        namespace = meta.get("namespace", "unknown")
        svc_type = spec.get("type", "ClusterIP")
        selector = spec.get("selector", {})
        
        # ExternalName services don't have standard endpoints
        if svc_type == "ExternalName":
            continue
            
        # Services without selectors (e.g. manually managed endpoints) are ignored for this basic check
        if not selector:
            continue
            
        key = f"{namespace}/{name}"
        ep = endpoints_map.get(key, {})
        subsets = ep.get("subsets", [])
        
        # If a service has a selector but no endpoint subsets, it's not routing traffic anywhere
        # This usually means selector mismatch or pod crashing before ready.
        if not subsets:
            problematic_network.append({
                "name": name,
                "namespace": namespace,
                "type": "Service without endpoints",
                "issue": "Service has a selector but no active endpoints. This could be a selector mismatch or pods are failing readiness probes.",
                "selector": selector
            })
            
    return problematic_network
