"""Orchestrates Kubernetes investigation components."""

from typing import Dict, Any, Optional, AsyncGenerator
import json
import asyncio
from loguru import logger

from app.kubernetes.pod_inspector import inspect_pods
from app.kubernetes.logs_collector import collect_logs
from app.kubernetes.events_analyzer import analyze_events
from app.kubernetes.deployment_inspector import inspect_deployments
from app.kubernetes.network_inspector import inspect_network


async def run_investigation_stream(cluster_name: Optional[str] = None) -> AsyncGenerator[str, None]:
    """
    Run the full Kubernetes investigation layer as a stream.
    Yields JSON strings of progress steps, then the final payload.
    """
    logger.info(f"Starting Kubernetes cluster investigation for cluster: {cluster_name or 'default'}...")
    
    yield json.dumps({"step": "Checking Pods", "status": "in_progress"})
    await asyncio.sleep(0.5)
    
    # 1. Pods
    pods_data = await asyncio.to_thread(inspect_pods, cluster_name)
    problematic_pods = pods_data.get("problematic_pods", [])
    
    yield json.dumps({"step": "Checking Pods", "status": "done"})
    await asyncio.sleep(0.3)
    
    # 2. Logs (only for problematic pods)
    yield json.dumps({"step": "Reading Logs", "status": "in_progress"})
    await asyncio.sleep(0.5)
    logs_data = await asyncio.to_thread(collect_logs, problematic_pods, cluster_name)
    yield json.dumps({"step": "Reading Logs", "status": "done"})
    await asyncio.sleep(0.3)
    
    # 3. Events
    yield json.dumps({"step": "Analyzing Events", "status": "in_progress"})
    await asyncio.sleep(0.5)
    events_data = await asyncio.to_thread(analyze_events, cluster_name)
    yield json.dumps({"step": "Analyzing Events", "status": "done"})
    await asyncio.sleep(0.3)
    
    # 4. Deployments
    yield json.dumps({"step": "Inspecting Deployments", "status": "in_progress"})
    await asyncio.sleep(0.5)
    deployments_data = await asyncio.to_thread(inspect_deployments, cluster_name)
    yield json.dumps({"step": "Inspecting Deployments", "status": "done"})
    await asyncio.sleep(0.3)
    
    # 5. Network
    yield json.dumps({"step": "Checking Networking", "status": "in_progress"})
    await asyncio.sleep(0.5)
    network_data = await asyncio.to_thread(inspect_network, cluster_name)
    yield json.dumps({"step": "Checking Networking", "status": "done"})
    
    investigation_payload = {
        "pods": pods_data,
        "logs": logs_data,
        "events": events_data,
        "deployments": deployments_data,
        "network": network_data
    }
    
    logger.info("Kubernetes investigation complete.")
    yield json.dumps({"step": "complete", "status": "done", "payload": investigation_payload})
