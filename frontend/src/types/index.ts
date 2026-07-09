/**
 * TypeScript interfaces for the AI Kubernetes Agent.
 */

export interface Cluster {
  name: string;
  server_url: string;
}

export interface Diagnosis {
  root_cause: string;
  explanation: string;
  fix: string;
  kubectl_command: string;
  prevention: string;
  confidence: number;
}

export interface InvestigationResult {
  status: string;
  investigation: Record<string, any>;
  diagnosis: Diagnosis;
}

export interface InvestigationHistory {
  id: string;
  user_id: string;
  cluster_name: string;
  investigation_data: Record<string, any>;
  diagnosis: Diagnosis;
  created_at: string;
}

export interface SSEProgressEvent {
  step: string;
  status: "in_progress" | "done";
  error?: string;
  result?: InvestigationResult;
}
