"""InsForge service for persisting investigations via PostgREST."""

import httpx
from typing import Dict, Any
from loguru import logger

from app.core.config import settings


async def save_investigation(token: str, user_id: str, cluster_name: str, investigation_data: Dict[str, Any], diagnosis: Dict[str, Any]) -> bool:
    """
    Saves the investigation and AI diagnosis to the InsForge database.
    Uses the user's Bearer token so RLS policies are applied automatically.
    """
    url = f"{settings.insforge_url}/api/database/records/investigations"
    
    headers = {
        "apikey": settings.insforge_anon_key,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    payload = {
        "user_id": user_id,
        "cluster_name": cluster_name,
        "investigation_data": investigation_data,
        "diagnosis": diagnosis
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            logger.info("Investigation saved to InsForge successfully.")
            return True
    except Exception as e:
        logger.error(f"Failed to save investigation to InsForge: {e}")
        if isinstance(e, httpx.HTTPStatusError):
            logger.error(f"Response: {e.response.text}")
        return False
