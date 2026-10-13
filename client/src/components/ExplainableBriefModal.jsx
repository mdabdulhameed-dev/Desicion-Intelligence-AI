import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Key,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { aiApi } from '../api/client';

export default function ExplainableBriefModal({ isOpen, onClose, explanation, decisionTitle, decisionId }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('mcda'); // 'mcda' | 'gemini'
  
  // Gemini State
  const [aiStatus, setAiStatus] = useState({ configured: false, loading: true });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keySuccess, setKeySuccess] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  // Gemini Brief Generation
  const [geminiBrief, setGeminiBrief] = useState(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefError, setBriefError] = useState('');

  // Gemini Interactive Assistant
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkAiStatus();
    }
  }, [isOpen]);

  const checkAiStatus = async () => {
    try {
      setAiStatus(prev => ({ ...prev, loading: true }));
      const res = await aiApi.getStatus();
      setAiStatus({
        configured: res.data.data.configured,
        models: res.data.data.models,
        loading: false
      });
      if (!res.data.data.configured) {
        setShowKeyConfig(true);
      }
    } catch (err) {
      setAiStatus({ configured: false, loading: false });
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setKeyError('Please paste a valid Gemini API key.');
      return;
    }
    setIsSavingKey(true);
    setKeyError('');
    setKeySuccess('');

    try {
      const res = await aiApi.saveKey(apiKeyInput.trim());
      setKeySuccess('API Key connected and verified successfully!');
      setAiStatus(prev => ({ ...prev, configured: true }));
      setShowKeyConfig(false);
      setApiKeyInput('');
      // Auto-trigger brief generation if requested
      if (decisionId) {
        handleGenerateGeminiBrief();
      }
    } catch (err) {
      setKeyError(err.response?.data?.error || err.message || 'Failed to authenticate API key with Google Gemini.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleGenerateGeminiBrief = async () => {
    if (!decisionId) return;
    setIsGeneratingBrief(true);
    setBriefError('');
    try {
      const res = await aiApi.generateBrief(decisionId);
      setGeminiBrief(res.data.data);
    } catch (err) {
      setBriefError(err.response?.data?.error || err.message || 'Failed to generate Gemini executive brief.');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleAskAssistant = async (questionToAsk = null) => {
    const q = questionToAsk || assistantQuestion;
    if (!q.trim() || !decisionId) return;
    setIsAsking(true);
    try {
      const res = await aiApi.askAssistant(decisionId, q.trim());
      setAssistantAnswer({
        question: q.trim(),
        answer: res.data.data.answer,
        model: res.data.data.model
      });
      setAssistantQuestion('');
    } catch (err) {
      alert('Failed to query Gemini: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsAsking(false);
    }
  };

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
    let textContent = '';
    if (activeTab === 'gemini' && geminiBrief) {
      textContent = `
# STRATAGEM AI EXECUTIVE BRIEF (POWERED BY GOOGLE GEMINI)
Decision Framework: ${decisionTitle}
Model: ${geminiBrief.model}
Date: ${new Date(geminiBrief.generatedAt).toLocaleDateString()}

## Executive Strategic Verdict
${geminiBrief.executiveVerdict}

## Strategic Value Drivers
${geminiBrief.strategicAdvantages?.map(a => `- ${a}`).join('\n')}

## Accepted Trade-off Compromises
${geminiBrief.acceptedCompromises?.map(c => `- ${c}`).join('\n')}

## Downside Risk & Mitigation
${geminiBrief.riskAndDownsideMitigation}

## Sensitivity & Switch Alert
${geminiBrief.sensitivityAlert}

## Phased Execution Roadmap
${geminiBrief.phasedRoadmap?.map(p => `### ${p.phase}\n${p.action}`).join('\n\n')}
      `.trim();
    } else {
      textContent = `
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
    }

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-display">Executive Decision Brief</h3>
                {activeTab === 'gemini' && aiStatus.configured && (
                  <span className="badge-pill bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">
                    ✨ Gemini 2.5 Flash
                  </span>
                )}
              </div>
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

        {/* Engine Switcher Tabs */}
        <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('mcda')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'mcda'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Deterministic MCDA Brief</span>
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'gemini'
                  ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 text-white shadow-sm border border-purple-500/40'
                  : 'text-purple-300/80 hover:text-purple-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Google Gemini AI Brief</span>
              {aiStatus.configured && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {activeTab === 'gemini' && aiStatus.configured && (
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <Key className="w-3 h-3 text-purple-400" />
              <span>{showKeyConfig ? 'Hide Key Settings' : 'API Key Settings'}</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 flex-1">
          {/* TAB 1: STANDARD DETERMINISTIC MCDA BRIEF */}
          {activeTab === 'mcda' && (
            <>
              {/* Top Recommendation Headline Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border border-brand-500/30 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="badge-pill bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    TOPSIS & MCDA Synthesis Verdict
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
            </>
          )}

          {/* TAB 2: GOOGLE GEMINI AI BRIEF */}
          {activeTab === 'gemini' && (
            <div className="space-y-6">
              {/* API Key Setup Panel */}
              {(showKeyConfig || !aiStatus.configured) && (
                <div className="p-5 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Key className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-bold text-white">Connect Google Gemini API Key</h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        Enable neural AI executive briefs, blind-spot analysis, and strategic decision Q&A.
                      </p>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 underline"
                    >
                      <span>Get Free API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <form onSubmit={handleSaveApiKey} className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Paste your Gemini API key (AIzaSy...)"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isSavingKey}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {isSavingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>{isSavingKey ? 'Verifying...' : 'Save & Connect'}</span>
                      </button>
                    </div>

                    {keyError && (
                      <p className="text-xs text-rose-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{keyError}</span>
                      </p>
                    )}

                    {keySuccess && (
                      <p className="text-xs text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{keySuccess}</span>
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500">
                      Keys are safely stored on the local backend and never exposed to the client. You can also paste directly into <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">server/.env</code> under <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">GEMINI_API_KEY</code>.
                    </p>
                  </form>
                </div>
              )}

              {/* Gemini Trigger or Display */}
              {aiStatus.configured && (
                <div className="space-y-6">
                  {/* Generation Trigger Bar */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      <div>
                        <div className="text-xs font-bold text-white">Google Gemini Core Connected</div>
                        <div className="text-[11px] text-slate-400">Available models: Gemini 2.5 Flash, 2.0 Flash, 1.5 Flash</div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateGeminiBrief}
                      disabled={isGeneratingBrief}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow transition disabled:opacity-50"
                    >
                      {isGeneratingBrief ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                      )}
                      <span>{isGeneratingBrief ? 'Synthesizing with Gemini...' : geminiBrief ? 'Regenerate Gemini Brief' : 'Generate Gemini Executive Synthesis'}</span>
                    </button>
                  </div>

                  {briefError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{briefError}</span>
                    </div>
                  )}

                  {/* Gemini Rendered Brief */}
                  {geminiBrief && (
                    <div className="space-y-6 animate-fade-in">
                      {/* Verdict Banner */}
                      <div className="p-5 rounded-xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/30 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="badge-pill bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Gemini Neural Synthesis Verdict
                          </span>
                          <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                            {geminiBrief.confidenceTier || 'High Conviction'} ({geminiBrief.confidenceScore || 90}%)
                          </span>
                        </div>

                        <div className="text-sm text-slate-200 leading-relaxed font-medium">
                          {geminiBrief.executiveVerdict}
                        </div>
                      </div>

                      {/* Advantages & Compromises */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <TrendingUp className="w-4 h-4" />
                            <span>Primary Strategic Drivers</span>
                          </div>
                          <ul className="space-y-2 text-xs text-slate-200">
                            {geminiBrief.strategicAdvantages?.map((adv, i) => (
                              <li key={i} className="p-2.5 rounded-lg bg-emerald-900/20 border border-emerald-800/30">
                                {adv}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-3">
                          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Accepted Trade-Off Compromises</span>
                          </div>
                          <ul className="space-y-2 text-xs text-slate-200">
                            {geminiBrief.acceptedCompromises?.map((comp, i) => (
                              <li key={i} className="p-2.5 rounded-lg bg-amber-900/20 border border-amber-800/30">
                                {comp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Risk & Sensitivity Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Stochastic Risk Mitigation</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {geminiBrief.riskAndDownsideMitigation}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Sensitivity Trigger Warnings</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {geminiBrief.sensitivityAlert}
                          </p>
                        </div>
                      </div>

                      {/* Phased Roadmap */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Phased Strategic Roadmap
                        </h4>
                        <div className="space-y-2.5">
                          {geminiBrief.phasedRoadmap?.map((step, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-start space-x-3">
                              <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
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
                  )}

                  {/* Interactive Gemini Decision Assistant */}
                  <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Ask Gemini Strategic Questions
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        'What are the key blind spots in this decision?',
                        'How should we hedge against cost downside?',
                        'Why did the runner-up lose?'
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAskAssistant(prompt)}
                          disabled={isAsking}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 transition"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={assistantQuestion}
                        onChange={(e) => setAssistantQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
                        placeholder="Ask a strategic 'what-if' or sensitivity question..."
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleAskAssistant()}
                        disabled={isAsking || !assistantQuestion.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isAsking ? 'Thinking...' : 'Ask'}</span>
                      </button>
                    </div>

                    {assistantAnswer && (
                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2 text-xs">
                        <div className="font-semibold text-purple-300">Q: {assistantAnswer.question}</div>
                        <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                          {assistantAnswer.answer}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
