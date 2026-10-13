import { runMCDA } from './mcda.js';

export function runSensitivityAnalysis(criteria, alternatives) {
  const baseline = runMCDA(criteria, alternatives);
  const baselineWinner = baseline.rankedAlternatives[0];
  const baselineWinnerId = baselineWinner.id;

  const tornadoChart = [];
  const switchingThresholds = [];

  // For each criterion, perturb weight and measure impact
  criteria.forEach(crit => {
    const baseWeight = crit.weight;
    let minObservedScore = baselineWinner.topsisScore;
    let maxObservedScore = baselineWinner.topsisScore;
    let flipFound = null;

    // Test a spread of relative multipliers: 0.1x to 3.0x
    const multipliers = [0.1, 0.3, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
    const curvePoints = [];

    multipliers.forEach(m => {
      const customWeights = {};
      criteria.forEach(c => {
        customWeights[c.id] = c.id === crit.id ? baseWeight * m : c.weight;
      });

      const trial = runMCDA(criteria, alternatives, customWeights);
      const winnerScore = trial.rankedAlternatives.find(a => a.id === baselineWinnerId)?.topsisScore || 0;
      const trialWinner = trial.rankedAlternatives[0];

      if (winnerScore < minObservedScore) minObservedScore = winnerScore;
      if (winnerScore > maxObservedScore) maxObservedScore = winnerScore;

      curvePoints.push({
        multiplier: m,
        weight: Math.round(baseWeight * m * 10) / 10,
        score: winnerScore,
        currentWinnerId: trialWinner.id,
        currentWinnerName: trialWinner.name
      });

      // Detect if rank #1 changed
      if (trialWinner.id !== baselineWinnerId && !flipFound) {
        flipFound = {
          criterionId: crit.id,
          criterionName: crit.name,
          overtakingAlternativeId: trialWinner.id,
          overtakingAlternativeName: trialWinner.name,
          criticalWeight: Math.round(baseWeight * m * 10) / 10,
          weightShiftPercent: Math.round((m - 1) * 100)
        };
      }
    });

    const swing = Math.round((maxObservedScore - minObservedScore) * 100) / 100;
    const impactTier = swing > 15 ? 'High Sensitivity' : swing > 7 ? 'Moderate Sensitivity' : 'Low Sensitivity';

    tornadoChart.push({
      criterionId: crit.id,
      criterionName: crit.name,
      baseWeight,
      minScore: Math.round(minObservedScore * 100) / 100,
      maxScore: Math.round(maxObservedScore * 100) / 100,
      baselineScore: baselineWinner.topsisScore,
      swing,
      impactTier,
      curvePoints
    });

    if (flipFound) {
      switchingThresholds.push(flipFound);
    }
  });

  // Sort tornado chart by swing descending (highest leverage at top)
  tornadoChart.sort((a, b) => b.swing - a.swing);

  return {
    baselineWinner,
    tornadoChart,
    switchingThresholds,
    mostSensitiveCriterion: tornadoChart[0] || null
  };
}
