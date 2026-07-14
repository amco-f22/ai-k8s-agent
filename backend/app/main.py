"""AI Kubernetes Troubleshooting Agent - FastAPI Backend."""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from loguru import logger
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json
import asyncio

from app.core.logging import setup_logging
from app.services.investigation_service import run_investigation_stream
from app.services.diagnosis_service import generate_diagnosis
from app.services.insforge_service import save_investigation, delete_investigation
from app.kubernetes.kubectl_executor import get_clusters
from app.api.deps import get_current_user
import httpx
from app.core.config import settings

# Initialize logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title="AI Kubernetes Troubleshooting Agent",
    description="AI-powered Kubernetes troubleshooting platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Application startup."""
    logger.info("AI Kubernetes Agent starting up...")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-kubernetes-agent",
    }


class InvestigateRequest(BaseModel):
    cluster_name: Optional[str] = None


@app.get("/clusters")
async def list_clusters(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, List[Dict[str, str]]]:
    """
    List available Kubernetes clusters (contexts from kubeconfig).
    """
    clusters = get_clusters()
    return {"clusters": clusters}


@app.post("/investigate")
async def investigate(req: Optional[InvestigateRequest] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Trigger Kubernetes investigation and AI root cause analysis using SSE (Server-Sent Events).
    """
    logger.info(f"Investigation endpoint called by user {current_user.get('user', {}).get('id')}.")
    
    cluster_name = req.cluster_name if req else None
    
    async def event_generator():
        try:
            investigation_data = None
            
            # 1. Collect Evidence (Stream progress)
            async for progress_json in run_investigation_stream(cluster_name):
                data = json.loads(progress_json)
                if data.get("step") == "complete":
                    investigation_data = data.get("payload")
                else:
                    yield f"data: {progress_json}\n\n"
                    
            if not investigation_data:
                yield f"data: {json.dumps({'error': 'Investigation failed to collect data. Please verify: kubeconfig path, cluster access, kubectl permissions.'})}\n\n"
                return
                
            # 2. AI Reasoning
            yield f"data: {json.dumps({'step': 'AI Reasoning', 'status': 'in_progress'})}\n\n"
            diagnosis = await generate_diagnosis(investigation_data)
            yield f"data: {json.dumps({'step': 'AI Reasoning', 'status': 'done'})}\n\n"
            
            # 3. Persist to InsForge
            await save_investigation(
                token=current_user["raw_token"],
                user_id=current_user["user"]["id"],
                cluster_name=cluster_name or "default",
                investigation_data=investigation_data,
                diagnosis=diagnosis
            )
            
            final_payload = {
                "status": "success",
                "investigation": investigation_data,
                "diagnosis": diagnosis
            }
            
            yield f"data: {json.dumps({'step': 'complete', 'status': 'done', 'result': final_payload})}\n\n"
            
        except Exception as e:
            logger.error(f"Investigation stream error: {e}")
            error_msg = str(e)
            if "connection refused" in error_msg.lower() or "unreachable" in error_msg.lower():
                friendly = "Unable to connect to Kubernetes cluster. Please verify: kubeconfig path, cluster access, kubectl permissions."
            elif "timeout" in error_msg.lower():
                friendly = "The investigation timed out. The cluster may be under heavy load. Please try again."
            else:
                friendly = f"An unexpected error occurred during investigation: {error_msg}"
            yield f"data: {json.dumps({'error': friendly})}\n\n"
        
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/investigations")
async def get_investigations(current_user: Dict[str, Any] = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """
    Fetch investigation history for the current user.
    """
    url = f"{settings.insforge_url}/api/database/records/investigations?order=created_at.desc"
    
    headers = {
        "apikey": settings.insforge_anon_key,
        "Authorization": f"Bearer {current_user['raw_token']}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()


@app.delete("/investigations/{investigation_id}")
async def delete_user_investigation(investigation_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Delete an investigation by ID for the current user.
    """
    logger.info(f"Delete investigation {investigation_id} called by user {current_user.get('user', {}).get('id')}.")
    success = await delete_investigation(current_user["raw_token"], investigation_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete investigation.")
    return {"status": "success", "message": f"Investigation {investigation_id} deleted."}

