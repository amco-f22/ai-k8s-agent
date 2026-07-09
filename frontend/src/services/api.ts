/**
 * API service placeholder for backend communication.
 * Provides typed wrappers around fetch/axios calls.
 */

import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchClusters(token: string) {
  const res = await axios.get(`${API_BASE}/clusters`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.clusters || [];
}

export async function fetchInvestigationHistory(token: string) {
  const res = await axios.get(`${API_BASE}/investigations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.ok;
}
