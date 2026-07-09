# AI Kubernetes Troubleshooting Agent — Documentation

## Architecture

```text
Frontend (Next.js)
    ↓
FastAPI Backend (Orchestrator)
    ↓
Kubernetes Investigation Layer
    ├── Pod Inspector
    ├── Logs Collector
    ├── Events Analyzer
    ├── Deployment Inspector
    └── Network Inspector
    ↓
AI Kubernetes Agent
    ├── Prompt Builder
    ├── LLM Client (OpenRouter)
    ├── Root Cause Analyzer
    ├── Fix Recommender
    └── Confidence Engine
    ↓
InsForge (Auth + History + Realtime)
    ↓
Frontend Diagnosis Display
```

## Quick Start

```bash
# Clone and configure
cp .env.example .env
# Fill in OPENROUTER_API_KEY, INSFORGE_URL, INSFORGE_ANON_KEY

# Run with Docker
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health

## Test Scenarios

Apply test failure scenarios to your cluster:

```bash
kubectl apply -f k8s-test-scenarios.yaml
```

This deploys 4 intentional failure scenarios:
1. **CrashLoopBackOff** — Missing environment variable
2. **ImagePullBackOff** — Invalid image tag
3. **OOMKilled** — Memory limit exceeded
4. **Service Selector Mismatch** — Wrong labels

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/clusters` | List kubeconfig clusters |
| POST | `/investigate` | Run investigation (SSE stream) |
| GET | `/investigations` | Fetch investigation history |
