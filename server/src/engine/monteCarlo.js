import { runMCDA } from './mcda.js';

// Random sampling utilities
function sampleTriangular(min, mode, max) {
  if (min === max) return min;
  const u = Math.random();
  const c = (mode - min) / (max - min);
  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

function sampleGaussian(mean, stdDev) {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

export function runMonteCarloSimulation(criteria, alternatives, options = {}) {
  const iterations = Math.min(Math.max(options.iterations || 1500, 100), 10000);
  const distribution = options.distribution || 'triangular';
  const customWeights = options.customWeights || null;

  // Initialize tracking containers
  const altScores = {}; // altId -> array of scores
  const altWins = {}; // altId -> count of #1 ranks

  alternatives.forEach(a => {
    altScores[a.id] = [];
    altWins[a.id] = 0;
  });

  const getNominal = (alt, critId) => {
    const entry = alt.scores[critId];
    if (typeof entry === 'number') return entry;
    if (typeof entry === 'object' && typeof entry.value === 'number') return entry.value;
    return Number(entry) || 0;
  };

  // Run stochastic simulation loop
  for (let iter = 0; iter < iterations; iter++) {
    // Generate perturbed alternatives for this trial
    const trialAlternatives = alternatives.map(alt => {
      const perturbedScores = {};
      criteria.forEach(c => {
        const nominal = getNominal(alt, c.id);
        const uncertainty = (c.uncertaintyPct || 10) / 100;
        let sampledVal = nominal;

        if (distribution === 'triangular') {
          const min = nominal * (1 - uncertainty);
          const max = nominal * (1 + uncertainty);
          sampledVal = sampleTriangular(Math.min(min, max), nominal, Math.max(min, max));
        } else {
          // Gaussian
          const stdDev = Math.abs(nominal * (uncertainty / 2)) || 0.001;
          sampledVal = sampleGaussian(nominal, stdDev);
        }

        perturbedScores[c.id] = sampledVal;
      });

      return {
        ...alt,
        scores: perturbedScores
      };
    });

    // Evaluate iteration using MCDA
    const result = runMCDA(criteria, trialAlternatives, customWeights);
    const winner = result.rankedAlternatives[0];
    if (winner && altWins[winner.id] !== undefined) {
      altWins[winner.id]++;
    }

    result.rankedAlternatives.forEach(ra => {
      if (altScores[ra.id]) {
        altScores[ra.id].push(ra.topsisScore);
      }
    });
  }

  // Calculate descriptive statistics and risk parameters for each alternative
  const simulationResults = alternatives.map(alt => {
    const scores = (altScores[alt.id] || []).sort((a, b) => a - b);
    const count = scores.length || 1;

    const sum = scores.reduce((acc, s) => acc + s, 0);
    const mean = sum / count;

    const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // Percentiles
    const p05 = scores[Math.floor(count * 0.05)] ?? mean;
    const p10 = scores[Math.floor(count * 0.10)] ?? mean;
    const p50 = scores[Math.floor(count * 0.50)] ?? mean;
    const p90 = scores[Math.floor(count * 0.90)] ?? mean;
    const p95 = scores[Math.floor(count * 0.95)] ?? mean;

    const winProbability = Math.round(((altWins[alt.id] || 0) / iterations) * 1000) / 10;
    const valueAtRisk95 = Math.round(Math.max(0, mean - p05) * 100) / 100;

    // Assess risk category
    let riskTier = 'Low Risk (Robust)';
    if (stdDev > 12 || winProbability < 40) {
      riskTier = 'High Uncertainty';
    } else if (stdDev > 6) {
      riskTier = 'Moderate Risk';
    }

    return {
      alternativeId: alt.id,
      name: alt.name,
      winProbability,
      winCount: altWins[alt.id] || 0,
      meanScore: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      p10: Math.round(p10 * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p90: Math.round(p90 * 100) / 100,
      valueAtRisk95,
      riskTier,
      minScore: Math.round(scores[0] * 100) / 100,
      maxScore: Math.round(scores[count - 1] * 100) / 100,
      _scores: scores
    };
  });

  // Build unified histogram distribution bins for Recharts Area/Bar visualization
  const allScores = simulationResults.flatMap(r => r._scores);
  const globalMin = Math.floor(Math.min(...allScores));
  const globalMax = Math.ceil(Math.max(...allScores));
  const numBins = 14;
  const binWidth = Math.max(1, (globalMax - globalMin) / numBins);

  const distributionBins = [];
  for (let i = 0; i < numBins; i++) {
    const rangeStart = globalMin + (i * binWidth);
    const rangeEnd = rangeStart + binWidth;
    const binLabel = `${Math.round(rangeStart)}-${Math.round(rangeEnd)}`;

    const entry = {
      bin: binLabel,
      rangeStart: Math.round(rangeStart),
      rangeEnd: Math.round(rangeEnd)
    };

    simulationResults.forEach(r => {
      const inBin = r._scores.filter(s => s >= rangeStart && (i === numBins - 1 ? s <= rangeEnd : s < rangeEnd)).length;
      entry[r.alternativeId] = Math.round((inBin / iterations) * 1000) / 10; // % frequency
    });

    distributionBins.push(entry);
  }

  // Clean out raw arrays for JSON efficiency
  simulationResults.forEach(r => {
    delete r._scores;
  });

  // Sort simulation results by winProbability descending
  simulationResults.sort((a, b) => b.winProbability - a.winProbability);

  return {
    iterations,
    distribution,
    results: simulationResults,
    distributionBins,
    dominantAlternative: simulationResults[0]
  };
}
