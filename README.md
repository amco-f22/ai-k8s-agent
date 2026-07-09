<div align="center">
  
# 🤖 AI Kubernetes Troubleshooting Agent

![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![InsForge](https://img.shields.io/badge/InsForge-BaaS-orange?style=for-the-badge)

*Your AI-powered assistant for debugging and diagnosing Kubernetes clusters in real-time.*

</div>

---

## 🌟 Overview

The **AI Kubernetes Troubleshooting Agent** is an intelligent orchestration tool designed to streamline DevOps workflows. Instead of manually running dozens of `kubectl` commands to diagnose a failing cluster, this tool fetches the state of your Pods, Deployments, Services, and Events, and feeds them into an advanced Large Language Model (LLM). The LLM processes the data and provides a **Root Cause Analysis**, **Fix Recommendations**, and the exact **Kubectl Commands** needed to resolve the issue!

## ✨ Key Features

- **🧠 AI-Powered Diagnosis:** Powered by OpenRouter (Gemini 2.5 Flash), providing actionable insights.
- **⚡ Real-time Streaming:** Uses Server-Sent Events (SSE) to stream live progress from the cluster to the frontend dashboard.
- **🔒 Secure BaaS Integration:** Uses **InsForge** for user authentication and persistent investigation history.
- **🌐 Modern Tech Stack:** A blazing-fast FastAPI Python backend paired with a beautiful Next.js + Tailwind CSS frontend.
- **🐳 Dockerized:** Fully containerized for easy deployment and testing.
- **🛡️ Graceful Error Handling:** Automatically handles invalid kubeconfigs, transient network issues, and LLM parsing errors.

---

## 🏗️ Architecture

1. **Frontend (Next.js):** Provides a clean, modern UI for users to authenticate and trigger investigations.
2. **Backend (FastAPI):** Exposes an `/investigate` endpoint. Uses `subprocess` to execute local `kubectl` commands against the active context.
3. **LLM Engine:** Formats the raw Kubernetes JSON output into a targeted prompt and queries OpenRouter.
4. **Database (InsForge):** A customized BaaS platform handling PostgreSQL persistence and User Sessions.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- 🐳 [Docker](https://www.docker.com/) & Docker Compose
- ⎈ [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- 📦 [Node.js](https://nodejs.org/) (v18+)
- ☸️ A local cluster running (e.g., [Kind](https://kind.sigs.k8s.io/) or [Minikube](https://minikube.sigs.k8s.io/docs/start/))

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YourUsername/AI-Kubernetes-Troubleshooting-Agent.git
cd AI-Kubernetes-Troubleshooting-Agent
```

### 2️⃣ Start the Backend

The backend reads your local `~/.kube/config` to interact with your cluster. It is packaged via Docker Compose.

1. Ensure your `.env` variables (like `OPENROUTER_API_KEY`) are set in `backend/.env`.
2. Spin up the containers:
```bash
docker-compose up -d
```
3. The API will be available at `http://localhost:8000`.

### 3️⃣ Start the Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Run the development server:
```bash
npm run dev
```
4. Visit `http://localhost:3000` to access the dashboard!

---

## 🧪 Testing Scenarios

Want to see the AI in action? We've included test scenarios to purposely break your cluster!

Apply a failing deployment:
```bash
kubectl apply -f test_scenarios/crashing_pod.yaml
```
Apply a broken network service:
```bash
kubectl apply -f test_scenarios/network_mismatch.yaml
```

Run an investigation from the Dashboard and watch the AI pinpoint the exact problem. When finished, you can delete them using `kubectl delete -f <file>`.

---

## 🧗 Challenges Faced

During the development of this project, we encountered and overcame several complex challenges:

1. **LLM Hallucinations & Formatting 🧩:**
   - *Challenge:* The LLM would occasionally return raw markdown instead of valid JSON, breaking the backend parser.
   - *Solution:* We implemented strict prompt engineering with few-shot examples and integrated a fallback fallback parser to catch and handle `json.decoder.JSONDecodeError` gracefully.

2. **Schema Caching with InsForge (PostgREST) 🗄️:**
   - *Challenge:* When dynamically altering the `investigations` database table to include a `cluster_name` column, the backend was hit with a `400 Bad Request` because PostgREST cached the old schema.
   - *Solution:* Executed the `NOTIFY pgrst, 'reload schema'` command directly via the CLI to instantly refresh the cache without needing a hard database reboot.

3. **Real-time Streaming Over HTTP 🌊:**
   - *Challenge:* Providing natural, real-time feedback to the user while waiting for a 15-second LLM API response without timing out the browser.
   - *Solution:* Implemented **Server-Sent Events (SSE)** using Python's `yield` generators in FastAPI, streaming JSON progress ticks (`"status": "in_progress"`) sequentially to the React frontend.

4. **Dockerizing Kubeconfig 🐳:**
   - *Challenge:* Allowing a containerized FastAPI backend to securely run `kubectl` against the host machine's cluster.
   - *Solution:* Mounted the user's `~/.kube` directory and Docker API socket as volumes within the `docker-compose.yml` to give the backend seamless cluster access.

---

## 🏆 Best Practices Followed

- **Modularity:** The Kubernetes inspection logic is heavily decoupled (`pod_inspector.py`, `network_inspector.py`, `events_analyzer.py`), making it highly extensible.
- **Security:** We explicitly bypassed using the official Python K8s client in favor of executing `kubectl` binaries in a controlled subprocess environment, which forces strict adherence to existing RBAC and Context rules.
- **Error Boundaries:** The frontend intercepts `401 Unauthorized` responses natively, ensuring the user is cleanly redirected to the `/login` page instead of infinite rendering loops.
- **Authentication First:** Implemented InsForge SDK seamlessly to ensure that every AI investigation is tied to an authenticated session, preventing API abuse.

---

## 📚 Additional Documentation

To dive deeper into specific components of the project, check out these supplemental documentation files:

- 📖 **[API & Architecture Docs](docs/README.md)**: Details the FastAPI backend architecture, API endpoints (like `/investigate` and `/clusters`), and additional test scenarios (`k8s-test-scenarios.yaml`).
- 🎨 **[Frontend Documentation](frontend/README.md)**: The standard Next.js documentation for managing, building, and deploying the React-based dashboard.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#).

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Built with ❤️ for DevOps Engineers.*
