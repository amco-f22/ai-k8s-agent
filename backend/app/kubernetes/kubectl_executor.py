"""Kubectl command executor utility."""

import json
import subprocess
from typing import Optional, Dict, Any, Tuple
from loguru import logger
import os

from app.core.config import settings


import tempfile

def get_kubeconfig_path() -> str:
    """Returns a path to a kubeconfig. If the config uses 127.0.0.1, replaces it with host.docker.internal for Docker Desktop compatibility."""
    original_path = os.path.expanduser(settings.kubeconfig_path)
    if not os.path.exists(original_path):
        return original_path
        
    try:
        with open(original_path, 'r') as f:
            content = f.read()
            
        if "127.0.0.1:" in content or "localhost:" in content:
            new_content = content.replace("127.0.0.1:", "host.docker.internal:").replace("localhost:", "host.docker.internal:")
            tmp = tempfile.NamedTemporaryFile(delete=False, mode='w', suffix=".yaml")
            tmp.write(new_content)
            tmp.close()
            return tmp.name
    except Exception as e:
        logger.warning(f"Could not process kubeconfig: {e}")
        
    return original_path

def get_clusters() -> list[dict]:
    """Get a list of available cluster contexts and their server URLs from the kubeconfig."""
    success, config_data, _ = run_kubectl_json(["config", "view"])
    if not success or not config_data:
        # Fallback to names only if JSON view fails
        success_txt, output = run_kubectl_text(["config", "get-contexts", "-o", "name"])
        if not success_txt:
            return []
        names = [c.strip() for c in output.split('\n') if c.strip()]
        return [{"name": n, "server_url": "Unknown"} for n in names]
    
    # Map cluster names to their server URLs
    clusters_info = {}
    for c in config_data.get("clusters", []):
        clusters_info[c.get("name")] = c.get("cluster", {}).get("server", "Unknown")
        
    results = []
    for ctx in config_data.get("contexts", []):
        name = ctx.get("name")
        cluster_ref = ctx.get("context", {}).get("cluster")
        server_url = clusters_info.get(cluster_ref, "Unknown")
        results.append({
            "name": name,
            "server_url": server_url
        })
    return results


def run_kubectl_json(args: list[str], cluster_name: Optional[str] = None) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Run a kubectl command requesting JSON output.
    Returns (success, parsed_json, raw_error_text).
    """
    kubeconfig = get_kubeconfig_path()
    cmd = ["kubectl", "--kubeconfig", kubeconfig]
    if "tmp" in kubeconfig or "temp" in kubeconfig:
        cmd.append("--insecure-skip-tls-verify=true")
    if cluster_name:
        cmd.extend(["--context", cluster_name])
    cmd.extend([*args, "-o", "json"])
    
    try:
        logger.debug(f"Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            logger.warning(f"kubectl command failed: {result.stderr.strip()}")
            return False, None, result.stderr.strip()
            
        return True, json.loads(result.stdout), ""
        
    except subprocess.TimeoutExpired:
        logger.error(f"kubectl command timed out: {' '.join(cmd)}")
        return False, None, "Command timed out after 10s"
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse kubectl JSON output: {e}")
        return False, None, "Invalid JSON output from kubectl"
    except Exception as e:
        logger.error(f"Unexpected error executing kubectl: {e}")
        return False, None, str(e)


def run_kubectl_text(args: list[str], cluster_name: Optional[str] = None) -> Tuple[bool, str]:
    """
    Run a kubectl command and return raw text output.
    Returns (success, stdout_or_stderr).
    """
    kubeconfig = get_kubeconfig_path()
    cmd = ["kubectl", "--kubeconfig", kubeconfig]
    if "tmp" in kubeconfig or "temp" in kubeconfig:
        cmd.append("--insecure-skip-tls-verify=true")
    if cluster_name:
        cmd.extend(["--context", cluster_name])
    cmd.extend(args)
    
    try:
        logger.debug(f"Executing: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            logger.warning(f"kubectl command failed: {result.stderr.strip()}")
            return False, result.stderr.strip()
            
        return True, result.stdout.strip()
        
    except subprocess.TimeoutExpired:
        logger.error(f"kubectl command timed out: {' '.join(cmd)}")
        return False, "Command timed out after 10s"
    except Exception as e:
        logger.error(f"Unexpected error executing kubectl: {e}")
        return False, str(e)
