import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const PALETTE = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];

export default function MonteCarloDistributionChart({ simulationData, alternatives }) {
  if (!simulationData || !simulationData.distributionBins) {
    return (
      <div className="text-slate-500 text-sm p-8 text-center glass-panel rounded-xl">
        Run Monte Carlo Simulation to generate probabilistic outcome distribution curves.
      </div>
    );
  }

  const { distributionBins, results, iterations } = simulationData;

  // Map alternative id to alternative name for clean legend & tooltips
  const altMap = {};
  alternatives.forEach(a => {
    altMap[a.id] = a.name;
  });

  return (
    <div className="space-y-6">
      {/* Risk Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((r, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return (
            <div
              key={r.alternativeId}
              className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white text-sm truncate" title={r.name}>
                  {r.name}
                </h4>
                <span className={`badge-pill text-[10px] ${
                  r.winProbability >= 60 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' :
                  r.winProbability >= 30 ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                  'bg-rose-500/10 text-rose-300 border-rose-500/20'
                }`}>
                  {r.winProbability}% Dominance
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-center">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">P10 (Floor)</div>
                  <div className="text-sm font-mono font-bold text-slate-200">{r.p10}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">P50 (Median)</div>
                  <div className="text-sm font-mono font-bold text-white">{r.p50}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-400">P90 (Upside)</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">{r.p90}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Value at Risk (VaR 95%):</span>
                <span className="font-mono text-amber-400 font-semibold">{r.valueAtRisk95} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Probability Density Curve */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Stochastic Outcome Distribution</h4>
            <p className="text-xs text-slate-400">Score probability frequency density across {iterations} trials</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            {iterations.toLocaleString()} Iterations
          </span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distributionBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {results.map((r, idx) => {
                  const color = PALETTE[idx % PALETTE.length];
                  return (
                    <linearGradient key={r.alternativeId} id={`grad-${r.alternativeId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0.02}/>
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="bin"
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                unit="%"
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-panel p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
                        <div className="font-mono font-bold text-slate-200 border-b border-slate-700/60 pb-1">
                          Score Bracket: {label}
                        </div>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center justify-between space-x-4">
                            <span className="flex items-center space-x-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                              <span>{altMap[p.dataKey] || p.name}</span>
                            </span>
                            <span className="font-mono font-bold text-white">{p.value}% frequency</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(val) => <span className="text-xs text-slate-300">{altMap[val] || val}</span>}
              />
              {results.map((r, idx) => {
                const color = PALETTE[idx % PALETTE.length];
                return (
                  <Area
                    key={r.alternativeId}
                    type="monotone"
                    dataKey={r.alternativeId}
                    name={r.name}
                    stroke={color}
                    fillOpacity={1}
                    fill={`url(#grad-${r.alternativeId})`}
                    strokeWidth={2}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
