import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

const SAMPLE_TEMPLATES = [
  {
    name: 'Cloud Infrastructure Migration',
    category: 'Cloud & Infrastructure',
    csv: `Provider,MonthlyCostK,P95LatencyMs,AiScaleScore,SecurityPts\nAWS Multi-Region,420,32,92,95\nGCP AI-Native,375,27,97,89\nHybrid Sovereign,510,44,73,99`
  },
  {
    name: 'Database Engine Selection',
    category: 'Architecture & Tech Stack',
    csv: `Database,WriteThroughputK,ReadLatencyMs,MonthlyCostK,DevSimplicityScore\nPostgreSQL Distributed,65,4.2,18,92\nScyllaDB Cassandra,240,1.8,32,68\nClickHouse Realtime,180,2.1,24,75`
  },
  {
    name: 'Cybersecurity SIEM Procurement',
    category: 'Vendor & Procurement',
    csv: `Platform,LicenseCostK,IngestionSpeedGB,MttdMinutes,ComplianceScore\nSplunk Enterprise,480,2500,4.2,96\nDatadog Cloud SIEM,390,3200,3.8,88\nElastic Security,310,2900,5.5,91`
  }
];

export default function IngestModal({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'paste' | 'upload'
  const [csvText, setCsvText] = useState(SAMPLE_TEMPLATES[0].csv);
  const [title, setTitle] = useState('New Ingested Decision Scenario');
  const [category, setCategory] = useState('Strategic Technology');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl) => {
    setTitle(`${tpl.name} Analysis`);
    setCategory(tpl.category);
    setCsvText(tpl.csv);
    setPreviewData(null);
    setError('');
  };

  const handlePreview = async () => {
    if (!csvText.trim()) {
      setError('Please provide CSV data');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/decisions/ingest', { csvText });
      setPreviewData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse CSV data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') + ' Evaluation');
      setActiveTab('paste');
    };
    reader.readAsText(file);
  };

  const handleCreateDecision = async () => {
    if (!previewData) {
      await handlePreview();
    }
    setLoading(true);
    setError('');
    try {
      // Ingest if not already previewed
      let dataToSave = previewData;
      if (!dataToSave) {
        const res = await api.post('/decisions/ingest', { csvText });
        dataToSave = res.data.data;
      }

      const createRes = await api.post('/decisions', {
        title: title.trim() || 'Ingested Decision',
        description: `Ingested data evaluation with ${dataToSave.alternatives.length} alternatives and ${dataToSave.criteria.length} criteria parameters.`,
        category,
        criteria: dataToSave.criteria,
        alternatives: dataToSave.alternatives
      });

      if (onCreated) onCreated(createRes.data.data);
      onClose();
      navigate(`/decision/${createRes.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create decision scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-accent-cyan border border-cyan-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Ingest Decision Parameters</h3>
              <p className="text-xs text-slate-400">Import structured CSV/JSON data into decision intelligence engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 flex space-x-2 border-b border-slate-800 bg-slate-900/30 text-xs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'templates'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Starter Templates
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'paste'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste CSV / Text
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 font-semibold transition border-b-2 ${
              activeTab === 'upload'
                ? 'border-brand-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File (.csv)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Category inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Scenario Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                placeholder="e.g. Multi-Cloud Migration Strategy"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white"
              >
                <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                <option value="Architecture & Tech Stack">Architecture & Tech Stack</option>
                <option value="Vendor & Procurement">Vendor & Procurement</option>
                <option value="Strategic Capital Allocation">Strategic Capital Allocation</option>
                <option value="Talent & Engineering">Talent & Engineering</option>
              </select>
            </div>
          </div>

          {activeTab === 'templates' && (
            <div className="space-y-3">
              <label className="block text-slate-400 font-medium">Select a Verified Template:</label>
              <div className="grid grid-cols-1 gap-2.5">
                {SAMPLE_TEMPLATES.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectTemplate(t)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      title.startsWith(t.name)
                        ? 'bg-brand-500/10 border-brand-500/40 text-white shadow-glow'
                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.category}</div>
                    </div>
                    <span className="badge-pill bg-slate-800 text-slate-300 border border-slate-700">
                      Use Template
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="block text-slate-400 font-medium">
                Paste CSV (Row 1: Entity Name, Criterion 1, Criterion 2, ...)
              </label>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  setPreviewData(null);
                }}
                className="w-full p-3 rounded-xl font-mono glass-input text-xs leading-relaxed"
                placeholder="Alternative,Cost,Latency,Throughput..."
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center space-y-3 hover:border-brand-500 transition">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="font-semibold text-slate-200">Drag & drop CSV file here, or click to browse</p>
                <p className="text-[11px] text-slate-500">Supports standard RFC 4180 CSV exports</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="inline-block px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer font-semibold"
              >
                Choose File
              </label>
            </div>
          )}

          {/* Ingested Preview Table */}
          {previewData && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Parsed {previewData.alternatives.length} Alternatives & {previewData.criteria.length} Parameters</span>
                </span>
              </div>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-1 px-2">Alternative</th>
                      {previewData.criteria.map(c => (
                        <th key={c.id} className="py-1 px-2">
                          {c.name} ({c.type})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.alternatives.map(alt => (
                      <tr key={alt.id} className="border-b border-slate-800/40 text-slate-200">
                        <td className="py-1.5 px-2 font-medium">{alt.name}</td>
                        {previewData.criteria.map(c => (
                          <td key={c.id} className="py-1.5 px-2 font-mono">{alt.scores[c.id]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {loading ? 'Processing...' : 'Validate & Preview'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateDecision}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow transition disabled:opacity-50"
            >
              <span>Initialize Intelligence Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
