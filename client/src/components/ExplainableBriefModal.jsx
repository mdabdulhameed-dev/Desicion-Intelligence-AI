import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

export default function ExplainableBriefModal({ isOpen, onClose, explanation, decisionTitle }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !explanation) return null;

  const {
    topRecommendation,
    executiveVerdict,
    competitiveAdvantages,
    acceptedCompromises,
    riskSummary,
    sensitivitySummary,
    strategicActionPlan,
    generatedAt
  } = explanation;

  const handleCopy = () => {
    const textContent = `
# STRATAGEM AI EXECUTIVE DECISION BRIEF
Decision Framework: ${decisionTitle}
Date: ${new Date(generatedAt).toLocaleDateString()}
Recommendation: ${topRecommendation.name} (TOPSIS Score: ${topRecommendation.topsisScore}/100, Conviction: ${topRecommendation.confidenceTier} ${topRecommendation.confidenceScore}%)

## Executive Verdict
${executiveVerdict.replace(/\*\*/g, '')}

## Key Value Drivers & Competitive Advantages
${competitiveAdvantages.map(a => `- ${a.insight}`).join('\n')}

## Accepted Trade-off Compromises
${acceptedCompromises.map(c => `- ${c.insight}`).join('\n')}

## Risk Simulation & Downside Summary
${riskSummary.riskStatement}

## Sensitivity Stability
${sensitivitySummary.stabilityStatement}

## Phased Strategic Action Plan
${strategicActionPlan.map(p => `### ${p.phase}\n${p.action}`).join('\n\n')}
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Executive Decision Intelligence Brief</h3>
              <p className="text-xs text-slate-400">{decisionTitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Copy Brief to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Print Brief"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Top Recommendation Headline Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border border-brand-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="badge-pill bg-brand-500/20 text-brand-300 border border-brand-500/30">
                AI Synthesis Verdict
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Conviction Level:</span>
                <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  {topRecommendation.confidenceTier} ({topRecommendation.confidenceScore}%)
                </span>
              </div>
            </div>

            <div className="text-lg font-bold text-white leading-relaxed">
              Recommend: <span className="text-accent-cyan">{topRecommendation.name}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Achieved highest composite TOPSIS closeness score of{' '}
              <span className="font-mono text-emerald-400 font-bold">{topRecommendation.topsisScore}/100</span>.
              {topRecommendation.isParetoOptimal && ' Formally verified as Pareto non-dominated across all multi-variable tradeoffs.'}
            </p>
          </div>

          {/* Trade-off Deep Dive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Competitive Advantages */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Primary Strategic Advantages</span>
              </div>
              <div className="space-y-2 text-xs">
                {competitiveAdvantages.length > 0 ? (
                  competitiveAdvantages.map((a, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30 text-slate-200">
                      {a.insight}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Even performance margin across criteria.</p>
                )}
              </div>
            </div>

            {/* Accepted Compromises */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Accepted Trade-Off Compromises</span>
              </div>
              <div className="space-y-2 text-xs">
                {acceptedCompromises.length > 0 ? (
                  acceptedCompromises.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-amber-900/20 border border-amber-800/30 text-slate-200">
                      {c.insight}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Zero major criteria deficits identified.</p>
                )}
              </div>
            </div>
          </div>

          {/* Risk & Sensitivity Synthesis */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Stochastic Risk & Weight Resilience</span>
            </div>
            <div className="text-xs space-y-2 text-slate-300">
              <p>• {riskSummary.riskStatement}</p>
              <p>• {sensitivitySummary.stabilityStatement}</p>
            </div>
          </div>

          {/* Implementation Roadmap */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phased Execution Plan</h4>
            <div className="space-y-2.5">
              {strategicActionPlan.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-slate-200">{step.phase}</div>
                    <div className="text-slate-400">{step.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition shadow-glow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
