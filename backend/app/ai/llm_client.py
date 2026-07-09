"""OpenRouter API client for LLM reasoning."""

import asyncio
import httpx
from loguru import logger
from typing import Optional

from app.core.config import settings

# Transient HTTP status codes that are worth retrying
RETRYABLE_STATUS_CODES = {429, 500, 502, 503}
MAX_RETRIES = 3


async def call_openrouter(system_prompt: str, user_prompt: str) -> Optional[str]:
    """
    Calls OpenRouter API to perform LLM reasoning.
    Retries up to 3 times with exponential backoff on transient errors.
    Returns raw content string, or None if failed.
    """
    if not settings.openrouter_api_key:
        logger.error("OPENROUTER_API_KEY is not set.")
        return None

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": "http://localhost:3000", # Required by OpenRouter
        "X-Title": "AI Kubernetes Agent",
        "Content-Type": "application/json"
    }

    payload = {
        "model": settings.openrouter_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2, # Low temperature for more deterministic troubleshooting
    }

    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"Calling OpenRouter using model: {settings.openrouter_model} (attempt {attempt}/{MAX_RETRIES})")
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                response.raise_for_status()
                data = response.json()
                
                content = data["choices"][0]["message"]["content"]
                return content

        except httpx.TimeoutException:
            last_error = "OpenRouter API request timed out."
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES}: {last_error}")
        except httpx.HTTPStatusError as e:
            last_error = f"OpenRouter API returned HTTP error: {e.response.status_code} - {e.response.text}"
            if e.response.status_code not in RETRYABLE_STATUS_CODES:
                # Non-retryable error (e.g. 401 bad key, 400 bad request) — fail immediately
                logger.error(last_error)
                return None
            logger.warning(f"Attempt {attempt}/{MAX_RETRIES}: {last_error}")
        except Exception as e:
            last_error = f"Unexpected error calling OpenRouter: {e}"
            logger.error(last_error)
            return None  # Unknown errors are not retried

        # Exponential backoff before next retry (1s, 2s, 4s)
        if attempt < MAX_RETRIES:
            backoff = 2 ** (attempt - 1)
            logger.info(f"Retrying in {backoff}s...")
            await asyncio.sleep(backoff)

    logger.error(f"All {MAX_RETRIES} attempts failed. Last error: {last_error}")
    return None
