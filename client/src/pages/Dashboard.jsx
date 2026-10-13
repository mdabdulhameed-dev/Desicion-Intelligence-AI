import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import IngestModal from '../components/IngestModal';
import NewDecisionModal from '../components/NewDecisionModal';
import {
  Brain,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  PlusCircle,
  Upload,
  ArrowRight,
  Copy,
  Trash2,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Search
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isNewDecisionOpen, setIsNewDecisionOpen] = useState(false);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/decisions');
      setDecisions(res.data.data || []);
    } catch (err) {
      setError('Failed to load decision scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    try {
      await api.post(`/decisions/${id}/duplicate`);
      fetchDecisions();
    } catch (err) {
      alert('Failed to duplicate decision');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this decision scenario?')) return;
    try {
      await api.delete(`/decisions/${id}`);
      fetchDecisions();
    } catch (err) {
      alert('Failed to delete decision');
    }
  };

  const categories = ['All', 'Cloud & Infrastructure', 'Architecture & Tech Stack', 'Vendor & Procurement'];

  const filteredDecisions = decisions.filter(d => {
    const matchesCat = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.tags && d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  // Calculate aggregates for stats
  const totalCriteria = decisions.reduce((acc, d) => acc + (d.criteria?.length || 0), 0);
  const totalAlternatives = decisions.reduce((acc, d) => acc + (d.alternatives?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenNewDecision={() => setIsNewDecisionOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-accent-cyan uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Criteria Decision Intelligence & Risk Simulation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
              Strategic Decision Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Ingest fragmented parameters, evaluate multi-variable trade-offs via TOPSIS algorithms, simulate stochastic downside risks, and generate auditable executive briefs.
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              id="btn-dash-ingest"
              onClick={() => setIsIngestOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition shadow-sm"
            >
              <Upload className="w-4 h-4 text-accent-cyan" />
              <span>Ingest Parameters</span>
            </button>

            <button
              id="btn-dash-new"
              onClick={() => setIsNewDecisionOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Decision Framework</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Decision Frameworks"
            value={decisions.length}
            subtext="Active multi-variable projects"
            icon={Layers}
            badge="Enterprise Ready"
            glowColor="brand"
          />
          <StatCard
            title="Ingested Alternatives"
            value={totalAlternatives}
            subtext="Scored against ideal solutions"
            icon={TrendingUp}
            badge="Normalized MCDA"
            glowColor="cyan"
          />
          <StatCard
            title="Evaluation Criteria"
            value={totalCriteria}
            subtext="Cost & Benefit parameters"
            icon={Sliders}
            badge="Pareto Verified"
            glowColor="emerald"
          />
          <StatCard
            title="Risk Simulation Engine"
            value="10,000"
            subtext="Stochastic Monte Carlo trials"
            icon={Cpu}
            badge="VaR & P10/P90"
            glowColor="amber"
          />
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Categories */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decisions or tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg glass-input text-xs"
            />
          </div>
        </div>

        {/* Decision Cards Grid */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Loading strategic decision frameworks...</p>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center space-y-4 border border-dashed border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No Decision Scenarios Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Create a new decision framework or ingest a CSV dataset to begin multi-variable trade-off analysis.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setIsIngestOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Ingest Parameters
              </button>
              <button
                onClick={() => setIsNewDecisionOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow"
              >
                Create New Framework
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDecisions.map(decision => {
              const hasOutcome = Boolean(decision.decisionOutcome?.selectedAlternativeId);
              const criteriaCount = decision.criteria?.length || 0;
              const altCount = decision.alternatives?.length || 0;

              return (
                <div
                  key={decision.id}
                  onClick={() => navigate(`/decision/${decision.id}`)}
                  className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Category & Status Pill */}
                    <div className="flex items-center justify-between">
                      <span className="badge-pill bg-slate-800/80 text-accent-cyan border border-slate-700/80 text-[10px]">
                        {decision.category}
                      </span>
                      <span className={`badge-pill text-[10px] ${
                        hasOutcome ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                        decision.status === 'evaluated' ? 'bg-brand-500/10 text-brand-300 border-brand-500/20' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {hasOutcome ? 'Approved Decision' : decision.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-display font-bold text-base text-white group-hover:text-accent-cyan transition-colors line-clamp-1">
                        {decision.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {decision.description || 'Multi-variable decision support model.'}
                      </p>
                    </div>

                    {/* Tags */}
                    {decision.tags && decision.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {decision.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom / Metrics & Action */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400">Criteria</div>
                        <div className="font-mono font-bold text-white text-sm mt-0.5">{criteriaCount}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400">Alternatives</div>
                        <div className="font-mono font-bold text-accent-cyan text-sm mt-0.5">{altCount}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => handleDuplicate(e, decision.id)}
                          title="Duplicate Scenario"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, decision.id)}
                          title="Delete Scenario"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="flex items-center space-x-1 text-xs font-semibold text-brand-400 group-hover:text-accent-cyan transition-colors">
                        <span>Open Studio</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onCreated={() => fetchDecisions()}
      />
      <NewDecisionModal
        isOpen={isNewDecisionOpen}
        onClose={() => setIsNewDecisionOpen(false)}
        onCreated={() => fetchDecisions()}
      />
    </div>
  );
}
