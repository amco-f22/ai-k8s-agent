/**
 * DiagnosisCard component placeholder.
 * Displays root cause, explanation, fix, kubectl command, and confidence.
 * Can be extracted from the dashboard page for reusability.
 */

import React from "react";

interface DiagnosisCardProps {
  rootCause: string;
  explanation: string;
  fix: string;
  kubectlCommand?: string;
  prevention?: string;
  confidence: number;
}

export default function DiagnosisCard({
  rootCause,
  explanation,
  fix,
  kubectlCommand,
  prevention,
  confidence,
}: DiagnosisCardProps) {
  return (
    <div className="bg-[#101726] rounded-2xl border border-[#1E293B] overflow-hidden shadow-2xl">
      <div className="bg-[#1C1927] border-b border-[#2D1B2E] p-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Diagnosis</h2>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5">Confidence</div>
          <div className="text-xl font-bold text-slate-200">{confidence}%</div>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Root Cause</h3>
          <p className="text-sm text-slate-200">{rootCause}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Explanation</h3>
          <p className="text-sm text-slate-400 leading-relaxed">{explanation}</p>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Suggested Fix</h3>
          <p className="text-sm text-slate-200">{fix}</p>
        </div>
        {kubectlCommand && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Kubectl Command</h3>
            <div className="bg-[#0B1120] border border-[#1E293B] p-4 rounded-lg font-mono text-sm text-cyan-400">
              {kubectlCommand}
            </div>
          </div>
        )}
        {prevention && (
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Prevention</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{prevention}</p>
          </div>
        )}
      </div>
    </div>
  );
}
