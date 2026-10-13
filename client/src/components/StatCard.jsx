import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, badge, glowColor = 'brand' }) {
  const glowMap = {
    brand: 'border-brand-500/20 hover:border-brand-500/40 shadow-glow',
    cyan: 'border-cyan-500/20 hover:border-cyan-500/40 shadow-glow-cyan',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 shadow-glow-emerald',
    amber: 'border-amber-500/20 hover:border-amber-500/40'
  };

  return (
    <div className={`glass-panel rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${glowMap[glowColor] || glowMap.brand}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold font-display text-white mt-1.5">{value}</h3>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Icon className="w-5 h-5 text-accent-cyan" />
          </div>
        )}
      </div>
      {badge && (
        <div className="mt-3">
          <span className="badge-pill bg-brand-500/10 text-brand-300 border border-brand-500/20">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}
