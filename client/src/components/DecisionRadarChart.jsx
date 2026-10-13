import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const PALETTE = ['#F43F5E', '#FF5E7E', '#BE123C', '#FDA4AF', '#F59E0B', '#10B981'];

export default function DecisionRadarChart({ criteria, alternatives }) {
  if (!criteria || criteria.length === 0 || !alternatives || alternatives.length === 0) {
    return <div className="text-slate-400 text-sm p-4 text-center">No criteria or alternatives available to plot radar.</div>;
  }

  // Transform into Recharts radar format
  const data = criteria.map(crit => {
    const entry = {
      criterion: crit.name.length > 20 ? crit.name.slice(0, 18) + '...' : crit.name,
      fullName: crit.name,
      type: crit.type,
      weight: crit.weight,
      unit: crit.unit
    };

    alternatives.forEach(alt => {
      const normScore = alt.criteriaNormalizedScores ? alt.criteriaNormalizedScores[crit.id] : 50;
      entry[alt.name] = normScore;
    });

    return entry;
  });

  return (
    <div className="w-full h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#451B29" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="criterion"
            tick={{ fill: '#FCA5B1', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            stroke="#6E3245"
            tick={{ fill: '#E598A4', fontSize: 10 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="glass-panel p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
                    <p className="font-bold text-white text-sm border-b border-slate-700/60 pb-1">
                      {item.fullName}
                    </p>
                    <p className="text-slate-400">
                      Type: <span className={item.type === 'benefit' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{item.type.toUpperCase()}</span> | Weight: {item.weight}%
                    </p>
                    <div className="pt-1 space-y-1">
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center justify-between space-x-4">
                          <span className="flex items-center space-x-1.5 text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                            <span>{p.name}</span>
                          </span>
                          <span className="font-mono font-bold text-white">{p.value}/100</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>}
          />
          {alternatives.map((alt, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            return (
              <Radar
                key={alt.id}
                name={alt.name}
                dataKey={alt.name}
                stroke={color}
                fill={color}
                fillOpacity={idx === 0 ? 0.35 : 0.15}
                strokeWidth={idx === 0 ? 2.5 : 1.5}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
