"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const ALL_STEPS = [
  "Checking Pods",
  "Reading Logs",
  "Analyzing Events",
  "Inspecting Deployments",
  "Checking Networking",
  "AI Reasoning",
  "Root Cause Found"
];

// --- Helpers ---

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 172800) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case "critical":
      return { label: "Critical", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400" };
    case "warning":
      return { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" };
    case "info":
      return { label: "Info", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" };
    default:
      return { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" };
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };
  return (
    <button onClick={handleCopy} className="ml-2 px-2 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all" title="Copy to clipboard">
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// --- Skeleton Loader ---

function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto animate-fade-in">
      <header className="flex justify-between items-center mb-12">
        <div>
          <div className="skeleton h-8 w-56 mb-2" />
          <div className="skeleton h-4 w-40" />
        </div>
        <div className="skeleton h-10 w-24 rounded-lg" />
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[#101726] rounded-2xl border border-[#1E293B] p-8 min-h-[500px]">
            <div className="skeleton h-5 w-32 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl p-5 bg-[#131B2F] border border-[#1E293B]">
                  <div className="skeleton h-10 w-10 rounded-xl mb-8" />
                  <div className="skeleton h-4 w-32 mb-2" />
                  <div className="skeleton h-3 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="skeleton h-6 w-40" />
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-5 bg-[#0f172a]/60 border border-slate-800">
              <div className="skeleton h-3 w-28 mb-3" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Diagnosis Card (shared between live and history) ---

function DiagnosisView({ diagnosis, onBack }: { diagnosis: any; onBack?: () => void }) {
  const severity = getSeverityConfig(diagnosis?.severity || "warning");
  const isHealthy = diagnosis?.severity === "info" || (
    diagnosis?.root_cause?.toLowerCase().includes('no issues') ||
    diagnosis?.root_cause?.toLowerCase().includes('no critical') ||
    diagnosis?.root_cause?.toLowerCase().includes('healthy') ||
    diagnosis?.root_cause?.toLowerCase().includes('no problems')
  );

  return (
    <div className={`w-full bg-[#101726] rounded-2xl border ${isHealthy ? 'border-emerald-500/30' : 'border-[#1E293B]'} overflow-hidden shadow-2xl animate-slide-up`}>
      {/* Header */}
      <div className={`${isHealthy ? 'bg-emerald-500/10 border-b border-emerald-500/20' : 'bg-[#1C1927] border-b border-[#2D1B2E]'} p-6 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {isHealthy ? (
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <h2 className="text-xl font-bold text-white">{isHealthy ? 'Cluster Healthy' : 'Diagnosis'}</h2>
          {/* Severity Badge */}
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${severity.bg} ${severity.color} ${severity.border} border`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${severity.dot} mr-1.5`} />
            {severity.label}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Confidence</div>
          <div className={`text-xl font-bold ${isHealthy ? 'text-emerald-400' : 'text-slate-200'}`}>{diagnosis?.confidence || 0}%</div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {isHealthy ? (
          <>
            <p className="text-sm text-emerald-300 mb-4">No critical Kubernetes issues detected.</p>
            <p className="text-sm text-slate-400 leading-relaxed">{diagnosis?.explanation || 'Cluster appears healthy.'}</p>
          </>
        ) : (
          <>
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Root Cause</h3>
              <p className="text-sm text-slate-200">{diagnosis?.root_cause || "No issues detected."}</p>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Explanation</h3>
              <p className="text-sm text-slate-400 leading-relaxed bg-[#131B2F] border border-[#1E293B] p-5 rounded-lg">
                {diagnosis?.explanation}
              </p>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Suggested Fix</h3>
              <p className="text-sm text-slate-200 bg-[#131B2F] border border-[#1E293B] p-5 rounded-lg">
                {diagnosis?.fix}
              </p>
            </div>

            {diagnosis?.kubectl_command && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kubectl Command</h3>
                  <CopyButton text={diagnosis.kubectl_command} />
                </div>
                <div className="bg-[#0B1120] border border-[#1E293B] p-5 rounded-lg font-mono text-[13px] text-cyan-400 overflow-x-auto">
                  {diagnosis.kubectl_command}
                </div>
              </div>
            )}

            {diagnosis?.prevention && (
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Prevention</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{diagnosis.prevention}</p>
              </div>
            )}
          </>
        )}

        {onBack && (
          <div className="flex justify-start pt-4">
            <button onClick={onBack} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to clusters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Dashboard ---

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<'select' | 'investigating' | 'complete' | 'history'>("select");
  const [investigationResult, setInvestigationResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [clusters, setClusters] = useState<{name: string, server_url: string}[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("insforge_token");
      const userData = localStorage.getItem("insforge_user");
      
      if (!token || !userData) {
        router.push("/login");
      } else {
        setUser(JSON.parse(userData));
        fetchHistory(token);
        fetchClusters(token);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const fetchHistory = async (token: string) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/investigations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setHistory(res.data);
    } catch (err: any) {
      console.error("Failed to fetch history", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchClusters = async (token: string) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/clusters`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setClusters(res.data.clusters || []);
      if (res.data.clusters && res.data.clusters.length > 0) {
        setSelectedCluster(res.data.clusters[0].name);
      }
    } catch (err: any) {
      console.error("Failed to fetch clusters", err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const startInvestigation = async () => {
    setViewState('investigating');
    setInvestigationResult(null);
    setError(null);
    setActiveStepIndex(0);
    setSelectedHistoryItem(null);

    try {
      const token = localStorage.getItem("insforge_token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/investigate`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ cluster_name: selectedCluster })
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to start investigation: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response body stream");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              
              if (data.error) {
                setError(data.error);
                setViewState('select');
                break;
              }
              
              if (data.step === 'complete') {
                setActiveStepIndex(ALL_STEPS.length);
                setInvestigationResult(data.result);
                fetchHistory(token);
                setViewState('complete');
              } else {
                const stepIdx = ALL_STEPS.indexOf(data.step);
                if (stepIdx !== -1) {
                  if (data.status === 'done') {
                    setActiveStepIndex(stepIdx + 1);
                  } else {
                    setActiveStepIndex(stepIdx);
                  }
                } else if (data.step === 'AI Reasoning') {
                  if (data.status === 'done') {
                    setActiveStepIndex(6);
                  } else {
                    setActiveStepIndex(5);
                  }
                }
                await new Promise(resolve => setTimeout(resolve, 400));
              }
            } catch(e) {
              console.error("Error parsing SSE JSON:", e);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Investigation failed", err);
      setError(err.message || "An unexpected error occurred connecting to the cluster.");
      setViewState('select');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("insforge_token");
    localStorage.removeItem("insforge_user");
    router.push("/login");
  };

  const viewHistoryItem = (item: any) => {
    setSelectedHistoryItem(item);
    setViewState('history');
  };

  const deleteHistoryItem = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this investigation from your history?")) {
      return;
    }
    try {
      const token = localStorage.getItem("insforge_token");
      if (!token) return;
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/investigations/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (selectedHistoryItem?.id === itemId) {
        setViewState('select');
        setSelectedHistoryItem(null);
      }
      fetchHistory(token);
    } catch (err) {
      console.error("Failed to delete history item", err);
      alert("Failed to delete the investigation history item.");
    }
  };


  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold">Cluster Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Logged in as {user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Cluster Selection */}
          {viewState === 'select' && (
            <div className="bg-[#101726] rounded-2xl border border-[#1E293B] shadow-2xl overflow-hidden flex flex-col relative h-auto min-h-[600px]">
              <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 rotate-45 bg-[#131B2F] border border-cyan-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-sm" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200">Select Cluster</h2>
                    <p className="text-xs text-slate-500">{clusters.length} clusters available</p>
                  </div>
                </div>

                <div className="w-full bg-[#0B1120] border border-[#1E293B] rounded-md p-3 text-xs text-slate-500 font-mono mb-8 flex items-center gap-2">
                  <span className="text-cyan-500">/tmp/k8s-agent-kubeconfig.json</span>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
                  {clusters.map((cluster) => {
                    const isSelected = selectedCluster === cluster.name;
                    return (
                      <div 
                        key={cluster.name}
                        onClick={() => setSelectedCluster(cluster.name)}
                        className={`relative rounded-xl p-5 cursor-pointer transition-all duration-200 border ${
                          isSelected 
                            ? 'bg-[#131C2D] border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.15)]' 
                            : 'bg-[#131B2F] border-transparent hover:border-[#1E293B]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-8">
                          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {isSelected && (
                              <>
                                <span className="text-[10px] font-medium bg-[#0B1120] text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase">Current</span>
                                <span className="text-[10px] font-medium bg-[#0B1120] text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase">Selected</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-sm text-slate-200 truncate">{cluster.name}</h3>
                          <p className="text-[10px] text-slate-600 font-mono truncate mt-2">{cluster.server_url}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0B1120] to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full p-8 flex items-center justify-center gap-6 z-10">
                <button
                  onClick={startInvestigation}
                  disabled={!selectedCluster}
                  className="bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white px-10 py-3 rounded-lg font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 transition-all disabled:opacity-50"
                >
                  Investigate Cluster
                </button>
                <button onClick={() => fetchClusters(localStorage.getItem('insforge_token') || '')} className="text-xs text-slate-400 hover:text-white transition-colors">
                  Refresh clusters
                </button>
              </div>
            </div>
          )}

          {/* Investigation Progress */}
          {(viewState === 'investigating' || viewState === 'complete') && (
            <div className="flex flex-col items-center">
              {/* Top Pill */}
              <div className="flex items-center gap-4 mb-10">
                <div className="bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white px-8 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-blue-500/20 flex items-center gap-3">
                  {viewState === 'investigating' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {viewState === 'investigating' ? 'Investigating...' : 'Investigation Complete'}
                </div>
                {viewState === 'complete' && (
                  <button onClick={() => setViewState('select')} className="text-xs text-slate-400 hover:text-white transition-colors">
                    Select new cluster
                  </button>
                )}
              </div>

              {/* Progress Card */}
              <div className="w-full bg-[#101726] rounded-2xl border border-[#1E293B] p-8 shadow-2xl mb-8">
                <div className="w-full bg-[#0B1120] border border-[#1E293B] rounded-lg p-3 flex items-center justify-center gap-3 mb-8">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Investigating Kubernetes Cluster...</span>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Investigation Status
                </div>

                <div className="space-y-5 px-2">
                  {ALL_STEPS.map((step, idx) => {
                    const isCompleted = idx < activeStepIndex;
                    const isActive = idx === activeStepIndex && viewState === 'investigating';
                    const isPending = idx > activeStepIndex || (idx === activeStepIndex && viewState === 'complete');
                    
                    return (
                      <div key={step} className="flex items-center gap-4">
                        {isCompleted && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {isActive && (
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                             <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {isPending && (
                          <div className="w-6 h-6 rounded-full bg-[#131B2F] border border-[#1E293B] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#1E293B]" />
                          </div>
                        )}
                        
                        <span className={`text-sm font-medium ${isCompleted ? 'text-slate-300' : isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-600'}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diagnosis Result */}
              {viewState === 'complete' && investigationResult && (
                <DiagnosisView diagnosis={investigationResult.diagnosis} onBack={() => setViewState('select')} />
              )}
            </div>
          )}

          {/* History Detail View */}
          {viewState === 'history' && selectedHistoryItem && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-6 w-full">
                <button onClick={() => { setViewState('select'); setSelectedHistoryItem(null); }} className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to clusters
                </button>
                <div className="flex-1" />
                <div className="text-xs text-slate-500">
                  {selectedHistoryItem.cluster_name && <span className="text-cyan-400/70 font-mono mr-3">{selectedHistoryItem.cluster_name}</span>}
                  {timeAgo(selectedHistoryItem.created_at)}
                </div>
              </div>
              <DiagnosisView diagnosis={selectedHistoryItem.diagnosis} />
            </div>
          )}

        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Past Investigations</h2>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-700 rounded-xl">
                <p className="text-slate-500 text-sm">No previous investigations found.</p>
              </div>
            ) : (
              history.map((item) => {
                const sev = getSeverityConfig(item.diagnosis?.severity || "warning");
                const isActive = selectedHistoryItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => viewHistoryItem(item)}
                    className={`glass-card p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group ${
                      isActive ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timeAgo(item.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${sev.bg} ${sev.color} ${sev.border} border`}>
                          <span className={`w-1 h-1 rounded-full ${sev.dot}`} />
                          {sev.label}
                        </span>
                        <button
                          onClick={(e) => deleteHistoryItem(e, item.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete investigation"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {item.cluster_name && (
                      <div className="text-[10px] text-cyan-400/70 font-mono mb-2 truncate">
                        {item.cluster_name}
                      </div>
                    )}
                    <div className="font-medium text-sm text-slate-200 line-clamp-2 mb-3 group-hover:text-cyan-400 transition-colors">
                      {item.diagnosis?.root_cause || "Unknown failure"}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded font-mono">
                        {item.diagnosis?.confidence}%
                      </span>
                      <span className="text-slate-500 group-hover:text-slate-300 transition-colors text-[10px]">
                        View details →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
