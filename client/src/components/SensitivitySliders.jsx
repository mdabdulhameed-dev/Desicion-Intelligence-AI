import React from 'react';
import { Sliders, RotateCcw, Sparkles } from 'lucide-react';

export default function SensitivitySliders({ criteria, currentWeights, onChange, onReset, isAnalyzing }) {
  const handleSliderChange = (critId, value) => {
    onChange({
      ...currentWeights,
      [critId]: Number(value)
    });
  };

  const totalWeight = Object.values(currentWeights).reduce((sum, w) => sum + (Number(w) || 0), 0);

  const normalizeWeights = () => {
    if (totalWeight <= 0) return;
    const normalized = {};
    Object.keys(currentWeights).forEach(id => {
      normalized[id] = Math.round((currentWeights[id] / totalWeight) * 100);
    });
    onChange(normalized);
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            <h4 className="text-sm font-bold text-white">Live "What-If" Sensitivity Sandbox</h4>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Drag sliders to simulate strategic priority shifts. Engine re-scores alternatives in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={normalizeWeights}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Normalize sum of weights to 100"
          >
            Sum: <span className="font-mono font-bold text-brand-300">{totalWeight}%</span> (Normalize)
          </button>
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {criteria.map(crit => {
          const weight = currentWeights[crit.id] !== undefined ? currentWeights[crit.id] : crit.weight;
          const isHigherThanBase = weight > crit.weight;
          const isLowerThanBase = weight < crit.weight;

          return (
            <div
              key={crit.id}
              className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate pr-2" title={crit.name}>
                  {crit.name}
                </span>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    crit.type === 'benefit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {crit.type}
                  </span>
                  <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {weight}%
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={weight}
                  onChange={(e) => handleSliderChange(crit.id, e.target.value)}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Base: {crit.weight}%</span>
                {isHigherThanBase && <span className="text-emerald-400 font-semibold">+{weight - crit.weight}% heavier</span>}
                {isLowerThanBase && <span className="text-rose-400 font-semibold">-{crit.weight - weight}% lighter</span>}
                {!isHigherThanBase && !isLowerThanBase && <span>Default</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
