"""Collects logs for problematic pods."""

from typing import Dict, Any, List, Optional
from loguru import logger

from app.kubernetes.kubectl_executor import run_kubectl_text


def collect_logs(problematic_pods: List[Dict[str, Any]], cluster_name: Optional[str] = None) -> Dict[str, str]:
    """
    Fetch logs for a list of problematic pods.
    Returns a dictionary mapping 'namespace/pod_name' to log output.
    Truncates logs to the last 50 lines to avoid massive payloads.
    """
    logger.info(f"Collecting logs for {len(problematic_pods)} pods...")
    
    logs_data = {}
    
    for pod in problematic_pods:
        name = pod.get("name")
        namespace = pod.get("namespace")
        
        if not name or not namespace:
            continue
            
        # We use --tail=50 and --previous (in case the pod crashed and restarted)
        # First try to get logs from previous crashed container
        success_prev, logs_prev = run_kubectl_text([
            "logs", name, "-n", namespace, "--tail=50", "--previous"
        ], cluster_name=cluster_name)
        
        # Then get current logs
        success_curr, logs_curr = run_kubectl_text([
            "logs", name, "-n", namespace, "--tail=50"
        ], cluster_name=cluster_name)
        
        pod_key = f"{namespace}/{name}"
        combined_logs = ""
        
        if success_prev and logs_prev:
            combined_logs += f"--- PREVIOUS CONTAINER LOGS ---\n{logs_prev}\n"
            
        if success_curr and logs_curr:
            combined_logs += f"--- CURRENT CONTAINER LOGS ---\n{logs_curr}\n"
            
        if not combined_logs:
            combined_logs = "No logs available or unable to fetch logs."
            
        logs_data[pod_key] = combined_logs
        
    return logs_data
