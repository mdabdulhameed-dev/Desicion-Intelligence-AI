import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { X, Plus, Trash2, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function NewDecisionModal({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Architecture & Tech Stack');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [criteria, setCriteria] = useState([
    { id: 'crit-1', name: 'Operational Cost', type: 'cost', weight: 30, unit: '$', uncertaintyPct: 15 },
    { id: 'crit-2', name: 'Performance & Latency', type: 'benefit', weight: 35, unit: 'pts', uncertaintyPct: 10 },
    { id: 'crit-3', name: 'Compliance & Security', type: 'benefit', weight: 35, unit: 'pts', uncertaintyPct: 5 }
  ]);

  const [alternatives, setAlternatives] = useState([
    { id: 'alt-1', name: 'Option Alpha (Managed)', scores: { 'crit-1': 120, 'crit-2': 90, 'crit-3': 95 }, pros: ['Managed SLA'], cons: ['Higher cost'] },
    { id: 'alt-2', name: 'Option Beta (Self-Hosted)', scores: { 'crit-1': 45, 'crit-2': 85, 'crit-3': 80 }, pros: ['Lowest cost'], cons: ['Operational overhead'] }
  ]);

  if (!isOpen) return null;

  const handleAddCriterion = () => {
    const newId = `crit-${Date.now().toString().slice(-4)}`;
    setCriteria([...criteria, {
      id: newId,
      name: `Criterion ${criteria.length + 1}`,
      type: 'benefit',
      weight: 20,
      unit: 'pts',
      uncertaintyPct: 10
    }]);

    // Add default score for all alternatives
    setAlternatives(alternatives.map(a => ({
      ...a,
      scores: { ...a.scores, [newId]: 50 }
    })));
  };

  const handleRemoveCriterion = (id) => {
    if (criteria.length <= 1) {
      setError('At least one criterion is required');
      return;
    }
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleAddAlternative = () => {
    const newId = `alt-${Date.now().toString().slice(-4)}`;
    const scores = {};
    criteria.forEach(c => {
      scores[c.id] = 50;
    });

    setAlternatives([...alternatives, {
      id: newId,
      name: `Alternative ${alternatives.length + 1}`,
      scores,
      pros: [],
      cons: []
    }]);
  };

  const handleRemoveAlternative = (id) => {
    if (alternatives.length <= 2) {
      setError('At least two alternatives are required to compare');
      return;
    }
    setAlternatives(alternatives.filter(a => a.id !== id));
  };

  const handleScoreChange = (altId, critId, val) => {
    setAlternatives(alternatives.map(a => {
      if (a.id === altId) {
        return {
          ...a,
          scores: { ...a.scores, [critId]: Number(val) || 0 }
        };
      }
      return a;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a decision framework title');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/decisions', {
        title: title.trim(),
        description: description.trim(),
        category,
        criteria,
        alternatives
      });

      if (onCreated) onCreated(res.data.data);
      onClose();
      navigate(`/decision/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create decision framework');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">New Decision Framework</h3>
              <p className="text-xs text-slate-400">Configure parameters, criteria weights, and candidate alternatives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Decision Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Core Payment Gateway Architecture Selection"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white"
              >
                <option value="Architecture & Tech Stack">Architecture & Tech Stack</option>
                <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                <option value="Vendor & Procurement">Vendor & Procurement</option>
                <option value="Strategic Capital Allocation">Strategic Capital Allocation</option>
                <option value="Talent & Engineering">Talent & Engineering</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Context & Strategic Rationale</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the core trade-offs, constraints, and business goals..."
              className="w-full px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>

          {/* Criteria Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Decision Criteria</h4>
                <p className="text-[11px] text-slate-400">Define weighted evaluation variables</p>
              </div>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Criterion</span>
              </button>
            </div>

            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div key={c.id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].name = e.target.value;
                        setCriteria(updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded glass-input text-xs"
                      placeholder="Criterion Name"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      value={c.type}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].type = e.target.value;
                        setCriteria(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded glass-input text-xs bg-slate-900 text-white"
                    >
                      <option value="benefit">Benefit (High is Good)</option>
                      <option value="cost">Cost (Low is Good)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500">Weight</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={c.weight}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].weight = Number(e.target.value);
                        setCriteria(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded glass-input text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500">Unit</span>
                    <input
                      type="text"
                      value={c.unit}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].unit = e.target.value;
                        setCriteria(updated);
                      }}
                      className="w-full px-2 py-1.5 rounded glass-input text-xs"
                      placeholder="$, ms, pts"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(c.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternatives & Parameter Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Alternatives & Parameter Matrix</h4>
                <p className="text-[11px] text-slate-400">Score each alternative against the criteria</p>
              </div>
              <button
                type="button"
                onClick={handleAddAlternative}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alternative</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Alternative Name</th>
                    {criteria.map(c => (
                      <th key={c.id} className="py-2.5 px-3">
                        {c.name} ({c.unit})
                      </th>
                    ))}
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                  {alternatives.map((alt, altIdx) => (
                    <tr key={alt.id}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={alt.name}
                          onChange={(e) => {
                            const updated = [...alternatives];
                            updated[altIdx].name = e.target.value;
                            setAlternatives(updated);
                          }}
                          className="px-2.5 py-1.5 rounded glass-input text-xs w-full max-w-[200px]"
                        />
                      </td>
                      {criteria.map(c => (
                        <td key={c.id} className="py-2 px-3">
                          <input
                            type="number"
                            value={alt.scores[c.id] ?? 0}
                            onChange={(e) => handleScoreChange(alt.id, c.id, e.target.value)}
                            className="px-2 py-1.5 rounded glass-input text-xs font-mono w-24"
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveAlternative(alt.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/70 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow transition disabled:opacity-50"
          >
            <span>{loading ? 'Evaluating...' : 'Create & Analyze'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
