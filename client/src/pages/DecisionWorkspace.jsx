import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import DecisionRadarChart from '../components/DecisionRadarChart';
import MonteCarloDistributionChart from '../components/MonteCarloDistributionChart';
import TornadoChart from '../components/TornadoChart';
import SensitivitySliders from '../components/SensitivitySliders';
import ExplainableBriefModal from '../components/ExplainableBriefModal';
import {
  Brain,
  Sliders,
  Cpu,
  Table,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Award,
  ShieldCheck,
  ChevronRight,
  Save,
  Check,
  Download
} from 'lucide-react';

export default function DecisionWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [sensitivity, setSensitivity] = useState(null);
  const [explanation, setExplanation] = useState(null);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sensitivity' | 'simulation' | 'matrix' | 'audit'
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  // Dynamic sensitivity slider state
  const [sliderWeights, setSliderWeights] = useState({});
  const [isLiveRecalculating, setIsLiveRecalculating] = useState(false);

  // Formal approval state
  const [selectedWinnerId, setSelectedWinnerId] = useState('');
  const [approvalRationale, setApprovalRationale] = useState('');
  const [approvalSaved, setApprovalSaved] = useState(false);

  const fetchDecisionData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/decisions/${id}`);
      const data = res.data.data;
      setDecision(data);

      if (data.baselineAnalysis) {
        setAnalysis(data.baselineAnalysis.mcda);
        setSensitivity(data.baselineAnalysis.sensitivity);
        setExplanation(data.baselineAnalysis.explanation);

        // Initialize slider weights
        const weights = {};
        data.criteria.forEach(c => {
          weights[c.id] = c.weight;
        });
        setSliderWeights(weights);

        // Initialize approval fields if already approved
        if (data.decisionOutcome) {
          setSelectedWinnerId(data.decisionOutcome.selectedAlternativeId);
          setApprovalRationale(data.decisionOutcome.rationale);
          setApprovalSaved(true);
        } else if (data.baselineAnalysis.mcda.topRecommendation) {
          setSelectedWinnerId(data.baselineAnalysis.mcda.topRecommendation.id);
        }
      }
    } catch (err) {
      console.error('Failed to load decision:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisionData();
  }, [id]);

  // Handle live slider weight changes
  const handleWeightChange = async (newWeights) => {
    setSliderWeights(newWeights);
    setIsLiveRecalculating(true);
    try {
      const res = await api.post(`/decisions/${id}/analyze`, { customWeights: newWeights });
      setAnalysis(res.data.data.mcda);
      setSensitivity(res.data.data.sensitivity);
      setExplanation(res.data.data.explanation);
    } catch (err) {
      console.error('Live analysis failed:', err);
    } finally {
      setIsLiveRecalculating(false);
    }
  };

  const handleResetWeights = () => {
    if (!decision) return;
    const baseWeights = {};
    decision.criteria.forEach(c => {
      baseWeights[c.id] = c.weight;
    });
    handleWeightChange(baseWeights);
  };

  // Run Monte Carlo simulation
  const handleRunSimulation = async (iterations = 2000, distribution = 'triangular') => {
    setIsSimulating(true);
    try {
      const res = await api.post(`/decisions/${id}/simulate`, {
        iterations,
        distribution,
        customWeights: sliderWeights
      });
      setSimulation(res.data.data.simulation);
      setAnalysis(res.data.data.mcda);
      setSensitivity(res.data.data.sensitivity);
      setExplanation(res.data.data.explanation);
      setActiveTab('simulation');
    } catch (err) {
      alert('Monte Carlo simulation failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  // Save matrix edits
  const handleSaveMatrix = async () => {
    if (!decision) return;
    setIsSaving(true);
    try {
      await api.put(`/decisions/${id}`, {
        title: decision.title,
        description: decision.description,
        category: decision.category,
        criteria: decision.criteria,
        alternatives: decision.alternatives
      });
      // Refresh calculations
      const res = await api.post(`/decisions/${id}/analyze`, { customWeights: sliderWeights });
      setAnalysis(res.data.data.mcda);
      setSensitivity(res.data.data.sensitivity);
      setExplanation(res.data.data.explanation);
      alert('Decision matrix updated successfully!');
    } catch (err) {
      alert('Failed to save matrix: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Formal Decision Sign-off
  const handleFormalApproval = async (e) => {
    e.preventDefault();
    if (!selectedWinnerId || !approvalRationale.trim()) {
      alert('Please select the winning alternative and enter formal justification rationale.');
      return;
    }
    setIsSaving(true);
    try {
      await api.put(`/decisions/${id}`, {
        status: 'approved',
        decisionOutcome: {
          selectedAlternativeId: selectedWinnerId,
          rationale: approvalRationale.trim(),
          decidedAt: new Date().toISOString()
        }
      });
      setApprovalSaved(true);
      fetchDecisionData();
      alert('Decision formally approved and recorded in audit trail!');
    } catch (err) {
      alert('Failed to record approval: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8 space-y-3">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading Multi-Criteria Decision Framework...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!decision || !analysis) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
            <p className="text-rose-400 text-sm font-semibold">Decision Scenario not found.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topWinner = analysis.topRecommendation;
  const isApproved = Boolean(decision.decisionOutcome?.selectedAlternativeId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link to="/" className="hover:text-white transition flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300 font-medium truncate max-w-xs">{decision.title}</span>
        </div>

        {/* Studio Header Bar */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="badge-pill bg-slate-800 text-accent-cyan border border-slate-700 text-[10px]">
                  {decision.category}
                </span>
                <span className={`badge-pill text-[10px] ${
                  isApproved ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                  'bg-brand-500/10 text-brand-300 border-brand-500/20'
                }`}>
                  {isApproved ? 'Formally Approved' : 'Active Intelligence Studio'}
                </span>
                {simulation && (
                  <span className="badge-pill bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px]">
                    Monte Carlo Simulated ({simulation.iterations} runs)
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                {decision.title}
              </h1>
              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                {decision.description || 'Evaluating multi-variable tradeoffs across competing alternative configurations.'}
              </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <button
                id="btn-run-sim"
                onClick={() => handleRunSimulation(2000, 'triangular')}
                disabled={isSimulating}
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 text-accent-cyan ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Simulating...' : 'Run Monte Carlo Risk'}</span>
              </button>

              <button
                id="btn-open-brief"
                onClick={() => setIsBriefModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow transition"
              >
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                <span>Executive AI Brief</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-800/80 pt-3 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'overview'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Executive Scorecard</span>
            </button>

            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'sensitivity'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>What-If Sandbox & Tornado</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'simulation'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Monte Carlo Risk Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'matrix'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Parameter Matrix Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition ${
                activeTab === 'audit'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-glow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Trail & Sign-off</span>
            </button>
          </div>
        </div>

        {/* TAB 1: EXECUTIVE SCORECARD & OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Recommendation Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-950/70 via-slate-900 to-slate-900 border border-brand-500/30 shadow-glow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="badge-pill bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs">
                    Optimal AI Recommendation
                  </span>
                  {topWinner.isParetoOptimal && (
                    <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
                      Pareto Optimal
                    </span>
                  )}
                </div>

                <div className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  {topWinner.name}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {explanation?.executiveVerdict.replace(/\*\*/g, '') || `Ranked #1 with the highest multi-criteria TOPSIS proximity score.`}
                </p>
              </div>

              <div className="flex items-center space-x-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex-shrink-0 text-center">
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">TOPSIS Score</div>
                  <div className="text-3xl font-bold font-display text-emerald-400 mt-1">
                    {topWinner.topsisScore}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-800"></div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold">WSM Baseline</div>
                  <div className="text-xl font-bold font-display text-white mt-1">
                    {topWinner.wsmScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Analytics Grid: Radar & Trade-offs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Multi-Criteria Performance Radar</h3>
                    <p className="text-xs text-slate-400">Normalized attribute footprint across candidates</p>
                  </div>
                  <span className="badge-pill bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                    0-100 Scale
                  </span>
                </div>
                <DecisionRadarChart
                  criteria={decision.criteria}
                  alternatives={analysis.rankedAlternatives}
                />
              </div>

              {/* Trade-off Breakdown & Value Drivers */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Explainable Trade-Off Analysis</h3>
                    <p className="text-xs text-slate-400">Competitive drivers and accepted compromises</p>
                  </div>
                  <span className="badge-pill bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[10px]">
                    XAI Core
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Key Competitive Advantages</span>
                    </div>
                    {explanation?.competitiveAdvantages && explanation.competitiveAdvantages.length > 0 ? (
                      explanation.competitiveAdvantages.slice(0, 2).map((a, i) => (
                        <p key={i} className="text-slate-200 leading-relaxed">
                          • {a.insight}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-400">Consistent performance across all criteria dimensions.</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Accepted Trade-Off Compromises</span>
                    </div>
                    {explanation?.acceptedCompromises && explanation.acceptedCompromises.length > 0 ? (
                      explanation.acceptedCompromises.slice(0, 2).map((c, i) => (
                        <p key={i} className="text-slate-200 leading-relaxed">
                          • {c.insight}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-400">No significant structural trade-off deficits detected.</p>
                    )}
                  </div>

                  {explanation?.strategicActionPlan && (
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <div className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                        Tactical Next Step (Phase 1)
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {explanation.strategicActionPlan[0]?.action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ranked Alternatives Leaderboard Table */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Ranked Alternatives Leaderboard</h3>
                  <p className="text-xs text-slate-400">Comprehensive multi-criteria scoring and Euclidean separation</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {analysis.rankedAlternatives.length} Alternatives Evaluated
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Rank</th>
                      <th className="py-3 px-4">Alternative Name</th>
                      <th className="py-3 px-4 text-center">TOPSIS Score</th>
                      <th className="py-3 px-4 text-center">WSM Score</th>
                      <th className="py-3 px-4 text-center">Dist to Ideal (S+)</th>
                      <th className="py-3 px-4 text-center">Pareto Status</th>
                      <th className="py-3 px-4">Core Strengths</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/20">
                    {analysis.rankedAlternatives.map((alt) => (
                      <tr
                        key={alt.id}
                        className={`hover:bg-slate-800/40 transition ${
                          alt.rank === 1 ? 'bg-brand-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold font-mono">
                          {alt.rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center justify-center">
                              #1
                            </span>
                          ) : (
                            <span className="text-slate-400">#{alt.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{alt.name}</div>
                          {alt.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-1">{alt.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                          {alt.topsisScore}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300">
                          {alt.wsmScore}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {alt.separationIdealPositive}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {alt.isParetoOptimal ? (
                            <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                              Non-Dominated
                            </span>
                          ) : (
                            <span className="badge-pill bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                              Dominated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-300 line-clamp-1">
                            {alt.pros && alt.pros.length > 0 ? alt.pros.join(', ') : 'Balanced criteria profile'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHAT-IF SENSITIVITY SANDBOX & TORNADO */}
        {activeTab === 'sensitivity' && (
          <div className="space-y-6">
            <SensitivitySliders
              criteria={decision.criteria}
              currentWeights={sliderWeights}
              onChange={handleWeightChange}
              onReset={handleResetWeights}
              isAnalyzing={isLiveRecalculating}
            />

            {sensitivity && (
              <TornadoChart sensitivityData={sensitivity} />
            )}
          </div>
        )}

        {/* TAB 3: MONTE CARLO RISK SIMULATOR */}
        {activeTab === 'simulation' && (
          <div className="space-y-6">
            {/* Simulation Control Toolbar */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-accent-cyan" />
                  <span>Stochastic Monte Carlo Risk Engine</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Runs thousands of randomized market trials testing criteria uncertainty bounds to calculate Value at Risk (VaR).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRunSimulation(1000, 'triangular')}
                  disabled={isSimulating}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  1,000 Runs
                </button>
                <button
                  onClick={() => handleRunSimulation(3000, 'triangular')}
                  disabled={isSimulating}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
                >
                  3,000 Runs (Deep Trial)
                </button>
              </div>
            </div>

            {simulation ? (
              <MonteCarloDistributionChart
                simulationData={simulation}
                alternatives={decision.alternatives}
              />
            ) : (
              <div className="glass-panel p-12 rounded-2xl text-center space-y-3 border border-dashed border-slate-800">
                <Cpu className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="font-bold text-white text-sm">No Simulation Run for this Session</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click below to execute 2,000 stochastic trials and evaluate downside volatility and confidence intervals.
                </p>
                <button
                  onClick={() => handleRunSimulation(2000, 'triangular')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
                >
                  Run 2,000 Stochastic Iterations
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PARAMETER MATRIX EDITOR */}
        {activeTab === 'matrix' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Decision Matrix Parameters</h3>
                <p className="text-xs text-slate-400">Live adjust criteria, uncertainty variances, and raw alternative scores</p>
              </div>

              <button
                onClick={handleSaveMatrix}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Matrix Updates'}</span>
              </button>
            </div>

            {/* Criteria Definition Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Criteria & Uncertainty Variance</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Criterion Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Base Weight (%)</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Uncertainty Variance (±%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                    {decision.criteria.map((c, idx) => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-semibold text-white">
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const updated = [...decision.criteria];
                              updated[idx].name = e.target.value;
                              setDecision({ ...decision, criteria: updated });
                            }}
                            className="px-2 py-1 rounded glass-input text-xs w-full max-w-[220px]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={c.type}
                            onChange={(e) => {
                              const updated = [...decision.criteria];
                              updated[idx].type = e.target.value;
                              setDecision({ ...decision, criteria: updated });
                            }}
                            className="px-2 py-1 rounded glass-input text-xs bg-slate-900 text-white"
                          >
                            <option value="benefit">Benefit (High is good)</option>
                            <option value="cost">Cost (Low is good)</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={c.weight}
                            onChange={(e) => {
                              const updated = [...decision.criteria];
                              updated[idx].weight = Number(e.target.value);
                              setDecision({ ...decision, criteria: updated });
                            }}
                            className="px-2 py-1 rounded glass-input text-xs font-mono w-20"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={c.unit}
                            onChange={(e) => {
                              const updated = [...decision.criteria];
                              updated[idx].unit = e.target.value;
                              setDecision({ ...decision, criteria: updated });
                            }}
                            className="px-2 py-1 rounded glass-input text-xs w-16"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={c.uncertaintyPct || 10}
                            onChange={(e) => {
                              const updated = [...decision.criteria];
                              updated[idx].uncertaintyPct = Number(e.target.value);
                              setDecision({ ...decision, criteria: updated });
                            }}
                            className="px-2 py-1 rounded glass-input text-xs font-mono w-20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alternatives Scoring Table */}
            <div className="space-y-3 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Alternative Raw Scores</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Alternative</th>
                      {decision.criteria.map(c => (
                        <th key={c.id} className="py-2.5 px-3">
                          {c.name} ({c.unit})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                    {decision.alternatives.map((alt, altIdx) => (
                      <tr key={alt.id}>
                        <td className="py-2 px-3 font-semibold text-white">
                          <input
                            type="text"
                            value={alt.name}
                            onChange={(e) => {
                              const updated = [...decision.alternatives];
                              updated[altIdx].name = e.target.value;
                              setDecision({ ...decision, alternatives: updated });
                            }}
                            className="px-2 py-1 rounded glass-input text-xs w-full max-w-[200px]"
                          />
                        </td>
                        {decision.criteria.map(c => (
                          <td key={c.id} className="py-2 px-3">
                            <input
                              type="number"
                              value={alt.scores[c.id] ?? 0}
                              onChange={(e) => {
                                const updated = [...decision.alternatives];
                                updated[altIdx].scores[c.id] = Number(e.target.value);
                                setDecision({ ...decision, alternatives: updated });
                              }}
                              className="px-2 py-1 rounded glass-input text-xs font-mono w-24"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL & FORMAL SIGN-OFF */}
        {activeTab === 'audit' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Formal Strategic Sign-off & Audit Trail</h3>
                  <p className="text-xs text-slate-400">Lock in executive choice, record justification, and establish audit history</p>
                </div>
                {isApproved && (
                  <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">
                    Approved & Recorded
                  </span>
                )}
              </div>

              <form onSubmit={handleFormalApproval} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Approved Alternative</label>
                  <select
                    value={selectedWinnerId}
                    onChange={(e) => setSelectedWinnerId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg glass-input text-xs bg-slate-900 text-white font-semibold"
                  >
                    {decision.alternatives.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} (TOPSIS Score: {analysis.rankedAlternatives.find(ra => ra.id === a.id)?.topsisScore || 0})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Executive Justification & Rationale *</label>
                  <textarea
                    rows={4}
                    required
                    value={approvalRationale}
                    onChange={(e) => setApprovalRationale(e.target.value)}
                    placeholder="Document the strategic justification, accepted trade-offs, and governance mandate..."
                    className="w-full p-3 rounded-lg glass-input text-xs leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow-emerald transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Recording Sign-off...' : 'Formally Record Decision'}</span>
                  </button>
                </div>
              </form>

              {decision.decisionOutcome && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 pt-4">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Audit Record Signature</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(decision.decisionOutcome.decidedAt || decision.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic">
                    "{decision.decisionOutcome.rationale}"
                  </p>
                  <div className="text-[11px] text-accent-cyan font-medium pt-1">
                    Signatory: {decision.decisionOutcome.decidedBy || 'Chief Decision Architect'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Executive Brief Export Modal */}
      <ExplainableBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        explanation={explanation}
        decisionTitle={decision.title}
        decisionId={id}
      />
    </div>
  );
}
