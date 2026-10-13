import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function TornadoChart({ sensitivityData }) {
  if (!sensitivityData || !sensitivityData.tornadoChart) {
    return <div className="text-slate-500 text-sm p-4 text-center">No sensitivity data available.</div>;
  }

  const { tornadoChart, switchingThresholds, baselineWinner } = sensitivityData;

  const chartData = tornadoChart.map(tc => ({
    name: tc.criterionName.length > 22 ? tc.criterionName.slice(0, 20) + '...' : tc.criterionName,
    fullName: tc.criterionName,
    baseWeight: tc.baseWeight,
    swing: tc.swing,
    impactTier: tc.impactTier,
    minScore: tc.minScore,
    maxScore: tc.maxScore,
    baselineScore: tc.baselineScore
  }));

  return (
    <div className="space-y-6">
      {/* Critical Tipping Points Warning */}
      {switchingThresholds && switchingThresholds.length > 0 ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Sensitivity Tipping Point Detected</span>
          </div>
          <div className="text-xs space-y-1 text-slate-300">
            {switchingThresholds.map((st, i) => (
              <p key={i}>
                • Shifting weight of <span className="font-semibold text-white">"{st.criterionName}"</span> by{' '}
                <span className="font-mono text-amber-400 font-bold">{st.weightShiftPercent > 0 ? '+' : ''}{st.weightShiftPercent}%</span>{' '}
                switches the #1 ranking to <span className="font-semibold text-emerald-300">{st.overtakingAlternativeName}</span>.
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center space-x-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>High Structural Robustness: No single criterion weight swing flips the optimal decision.</span>
        </div>
      )}

      {/* Tornado Bar Chart */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Criterion Leverage & Volatility (Tornado)</h4>
            <p className="text-xs text-slate-400">Score swing volatility impact on {baselineWinner?.name || 'Optimal Alternative'}</p>
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            Sorted by Volatility Swing
          </span>
        </div>

        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2A0E19" horizontal={false} />
              <XAxis
                type="number"
                unit=" pts"
                tick={{ fill: '#FDA4AF', fontSize: 10 }}
                axisLine={{ stroke: '#451B29' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#FFF1F2', fontSize: 11, fontWeight: 500 }}
                width={120}
                axisLine={{ stroke: '#451B29' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
                        <p className="font-bold text-white text-sm border-b border-slate-700 pb-1">{item.fullName}</p>
                        <p className="text-slate-400">Base Weight: <span className="font-mono text-white">{item.baseWeight}%</span></p>
                        <p className="text-slate-400">Score Range: <span className="font-mono text-white">{item.minScore} - {item.maxScore} pts</span></p>
                        <p className="text-slate-400">Total Swing: <span className="font-mono text-accent-cyan font-bold">{item.swing} pts</span></p>
                        <p className="text-slate-400">Sensitivity: <span className="text-amber-400 font-semibold">{item.impactTier}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="swing" name="Volatility Swing" radius={[0, 6, 6, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.swing > 14 ? '#E11D48' : entry.swing > 7 ? '#FB7185' : '#F43F5E'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
