/**
 * Explainable AI Reasoning Core
 * Synthesizes quantitative MCDA, Monte Carlo Risk, and Sensitivity results
 * into transparent, auditable, explainable decision intelligence briefs.
 */

export function generateDecisionExplanation(decision, mcdaResults, simulationResults = null, sensitivityResults = null) {
  const { criteria, alternatives, title } = decision;
  const winner = mcdaResults.rankedAlternatives[0];
  const runnerUp = mcdaResults.rankedAlternatives[1] || null;

  if (!winner) {
    return { summary: 'No alternatives evaluated.', recommendations: [] };
  }

  // 1. Identify Key Trade-Off Drivers (Where winner beat runner-up, and where runner-up beat winner)
  const competitiveAdvantages = [];
  const acceptedCompromises = [];

  const getNominal = (alt, critId) => {
    const entry = alt.rawScores ? alt.rawScores[critId] : alt.scores[critId];
    if (typeof entry === 'number') return entry;
    if (typeof entry === 'object' && typeof entry.value === 'number') return entry.value;
    return Number(entry) || 0;
  };

  criteria.forEach(c => {
    const winnerScore = getNominal(winner, c.id);
    const winnerNorm = winner.criteriaNormalizedScores[c.id] || 50;
    
    if (runnerUp) {
      const runnerScore = getNominal(runnerUp, c.id);
      const runnerNorm = runnerUp.criteriaNormalizedScores[c.id] || 50;
      const normDiff = winnerNorm - runnerNorm;

      if (normDiff > 8) {
        // Winner outperformed runner-up
        competitiveAdvantages.push({
          criterionId: c.id,
          criterionName: c.name,
          unit: c.unit,
          winnerValue: winnerScore,
          runnerUpValue: runnerScore,
          advantagePct: Math.round(normDiff * 10) / 10,
          weight: c.weight,
          type: c.type,
          insight: `${winner.name} outperforms ${runnerUp.name} in ${c.name} (${winnerScore}${c.unit} vs ${runnerScore}${c.unit}), providing a +${Math.round(normDiff)}% relative advantage.`
        });
      } else if (normDiff < -8) {
        // Runner-up was actually better on this criterion
        acceptedCompromises.push({
          criterionId: c.id,
          criterionName: c.name,
          unit: c.unit,
          winnerValue: winnerScore,
          runnerUpValue: runnerScore,
          dragPct: Math.round(Math.abs(normDiff) * 10) / 10,
          weight: c.weight,
          type: c.type,
          insight: `${runnerUp.name} leads in ${c.name} (${runnerScore}${c.unit} vs ${winnerScore}${c.unit}). Choosing ${winner.name} incurs this explicit trade-off compromise.`
        });
      }
    }
  });

  // Sort advantages and compromises by criterion weight descending
  competitiveAdvantages.sort((a, b) => b.weight - a.weight);
  acceptedCompromises.sort((a, b) => b.weight - a.weight);

  // 2. Risk Simulation Synthesis
  let riskSummary = {
    winProbability: null,
    riskTier: 'Not simulated',
    downsideP10: null,
    upsideP90: null,
    valueAtRisk: null,
    riskStatement: 'Monte Carlo risk simulation pending.'
  };

  if (simulationResults && simulationResults.dominantAlternative) {
    const simWinner = simulationResults.results.find(r => r.alternativeId === winner.id);
    if (simWinner) {
      riskSummary = {
        winProbability: simWinner.winProbability,
        riskTier: simWinner.riskTier,
        downsideP10: simWinner.p10,
        upsideP90: simWinner.p90,
        valueAtRisk: simWinner.valueAtRisk95,
        riskStatement: simWinner.winProbability >= 70
          ? `High statistical stability: Under ${simulationResults.iterations} simulated volatility trials, ${winner.name} achieved a ${simWinner.winProbability}% dominant win rate with an expected score of ${simWinner.meanScore}/100 and a 90% confidence downside floor of ${simWinner.p10}.`
          : `Contested margin: ${winner.name} achieved a ${simWinner.winProbability}% win rate in stochastic simulation trials. Downside volatility (VaR 95% = ${simWinner.valueAtRisk95}) suggests close competition.`
      };
    }
  }

  // 3. Sensitivity & Vulnerability Analysis
  let sensitivitySummary = {
    criticalSwitchPoints: [],
    mostSensitiveFactor: null,
    isFragile: false,
    stabilityStatement: 'Sensitivity analysis indicates robust weight distribution.'
  };

  if (sensitivityResults) {
    sensitivitySummary.criticalSwitchPoints = sensitivityResults.switchingThresholds || [];
    sensitivitySummary.mostSensitiveFactor = sensitivityResults.mostSensitiveCriterion || null;

    if (sensitivityResults.switchingThresholds.length > 0) {
      const topFlip = sensitivityResults.switchingThresholds[0];
      sensitivitySummary.isFragile = Math.abs(topFlip.weightShiftPercent) <= 30;
      sensitivitySummary.stabilityStatement = `Caution: Shifting the weight of "${topFlip.criterionName}" by ${topFlip.weightShiftPercent > 0 ? '+' : ''}${topFlip.weightShiftPercent}% switches the optimal choice to ${topFlip.overtakingAlternativeName}.`;
    } else {
      sensitivitySummary.stabilityStatement = `High structural resilience: No single criterion weight swing within tested ranges flips the dominant ranking.`;
    }
  }

  // 4. Recommendation Confidence Assessment
  let confidenceScore = 85;
  if (riskSummary.winProbability) {
    if (riskSummary.winProbability >= 80) confidenceScore = 92;
    else if (riskSummary.winProbability >= 60) confidenceScore = 78;
    else confidenceScore = 65;
  }
  if (sensitivitySummary.isFragile) {
    confidenceScore -= 10;
  }
  confidenceScore = Math.max(50, Math.min(99, confidenceScore));

  const confidenceTier = confidenceScore >= 85 ? 'High Conviction' : confidenceScore >= 70 ? 'Moderate Conviction' : 'Speculative / Sensitive';

  // 5. Strategic Executive Brief
  const executiveVerdict = `Recommend selecting **${winner.name}** (Overall TOPSIS Score: ${winner.topsisScore}/100, Conviction: ${confidenceTier} ${confidenceScore}%).`;

  const strategicActionPlan = [
    {
      phase: 'Phase 1: Risk Containment & Validation (Days 1–30)',
      action: acceptedCompromises.length > 0 
        ? `Establish explicit service-level hedges to mitigate the deficit in ${acceptedCompromises[0].criterionName}.`
        : `Formalize technical requirements and baseline benchmark audits.`
    },
    {
      phase: 'Phase 2: Pilot Rollout & Metric Tracking (Days 31–90)',
      action: `Deploy pilot environment leveraging ${winner.name}'s key advantage in ${competitiveAdvantages[0]?.criterionName || 'core architecture'}. Track real-world divergence from model estimates.`
    },
    {
      phase: 'Phase 3: Production Scale & Governance (Day 90+)',
      action: `Execute full enterprise cutover with automated telemetry and quarterly decision intelligence review cycles.`
    }
  ];

  return {
    topRecommendation: {
      alternativeId: winner.id,
      name: winner.name,
      topsisScore: winner.topsisScore,
      wsmScore: winner.wsmScore,
      confidenceScore,
      confidenceTier,
      isParetoOptimal: winner.isParetoOptimal
    },
    executiveVerdict,
    competitiveAdvantages,
    acceptedCompromises,
    riskSummary,
    sensitivitySummary,
    strategicActionPlan,
    generatedAt: new Date().toISOString()
  };
}
