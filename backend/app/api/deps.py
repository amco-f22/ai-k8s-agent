"""Authentication dependency for FastAPI."""

import httpx
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger
from typing import Dict, Any

from app.core.config import settings

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """
    Validates the Bearer token with InsForge's GoTrue Auth API.
    Returns the user object if valid.
    """
    token = credentials.credentials
    url = f"{settings.insforge_url}/api/auth/sessions/current"
    
    headers = {
        "apikey": settings.insforge_anon_key,
        "Authorization": f"Bearer {token}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.warning(f"Invalid token. Auth API returned {response.status_code}")
                raise HTTPException(status_code=401, detail="Invalid or expired token")
                
            user_data = response.json()
            # Also attach the raw token so we can use it to hit PostgREST on behalf of the user
            user_data["raw_token"] = token
            return user_data
            
    except httpx.RequestError as e:
        logger.error(f"Error connecting to InsForge Auth API: {e}")
        raise HTTPException(status_code=503, detail="Auth service unavailable")
