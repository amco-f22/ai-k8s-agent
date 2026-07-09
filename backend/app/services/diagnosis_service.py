"""Orchestrates AI diagnosis pipeline."""

import json
from typing import Dict, Any
from loguru import logger

from app.ai.prompt_builder import build_system_prompt, build_user_prompt
from app.ai.llm_client import call_openrouter
from app.ai.root_cause_analyzer import extract_root_cause
from app.ai.fix_recommender import extract_fix
from app.ai.confidence_engine import extract_confidence


async def generate_diagnosis(investigation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Consumes investigation evidence, calls LLM, and structures the diagnosis.
    """
    logger.info("Starting AI reasoning pipeline...")
    
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(investigation_data)
    
    # Check if there are any problematic pods, events, deployments, network
    # Just to give context to the logger
    
    llm_output = await call_openrouter(system_prompt, user_prompt)
    
    if not llm_output:
        logger.error("LLM reasoning failed to return a response.")
        return get_fallback_diagnosis("AI service unavailable or timed out.")
        
    try:
        # The prompt forces a JSON response, but sometimes LLMs wrap it in Markdown blocks (```json)
        cleaned_output = llm_output.strip()
        if cleaned_output.startswith("```json"):
            cleaned_output = cleaned_output[7:]
        if cleaned_output.startswith("```"):
            cleaned_output = cleaned_output[3:]
        if cleaned_output.endswith("```"):
            cleaned_output = cleaned_output[:-3]
            
        parsed_json = json.loads(cleaned_output.strip())
        
        # Build final structured response
        diagnosis = {}
        diagnosis.update(extract_root_cause(parsed_json))
        diagnosis.update(extract_fix(parsed_json))
        diagnosis["confidence"] = extract_confidence(parsed_json)
        
        logger.info("AI reasoning complete and successfully parsed.")
        return diagnosis
        
    except json.JSONDecodeError:
        logger.error(f"Failed to parse LLM JSON output. Raw output: {llm_output}")
        return get_fallback_diagnosis("AI returned an invalid response format.")
    except Exception as e:
        logger.error(f"Error structuring diagnosis: {e}")
        return get_fallback_diagnosis("An error occurred while processing the AI response.")


def get_fallback_diagnosis(reason: str) -> Dict[str, Any]:
    """Returns a safe fallback diagnosis when AI fails."""
    return {
        "root_cause": "Diagnosis unavailable",
        "explanation": reason,
        "fix": "Check backend logs for API errors.",
        "kubectl_command": "",
        "prevention": "Ensure OpenRouter API key is valid and model is accessible.",
        "confidence": 0
    }
