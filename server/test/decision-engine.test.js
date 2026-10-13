import test from 'node:test';
import assert from 'node:assert/strict';
import { runMCDA } from '../src/engine/mcda.js';
import { runMonteCarloSimulation } from '../src/engine/monteCarlo.js';
import { runSensitivityAnalysis } from '../src/engine/sensitivity.js';
import { generateDecisionExplanation } from '../src/engine/explainableAi.js';

const mockCriteria = [
  { id: 'c1', name: 'Cost', type: 'cost', weight: 40, unit: '$', uncertaintyPct: 10 },
  { id: 'c2', name: 'Speed', type: 'benefit', weight: 35, unit: 'req/s', uncertaintyPct: 15 },
  { id: 'c3', name: 'Security', type: 'benefit', weight: 25, unit: 'pts', uncertaintyPct: 5 }
];

const mockAlternatives = [
  {
    id: 'a1',
    name: 'Option Alpha',
    scores: { c1: 100, c2: 85, c3: 90 },
    pros: ['High speed'],
    cons: ['Moderate cost']
  },
  {
    id: 'a2',
    name: 'Option Beta',
    scores: { c1: 60, c2: 70, c3: 95 },
    pros: ['Very cost effective', 'High security'],
    cons: ['Slightly lower throughput']
  },
  {
    id: 'a3',
    name: 'Option Gamma',
    scores: { c1: 150, c2: 95, c3: 80 },
    pros: ['Maximum speed'],
    cons: ['Expensive']
  }
];

test('MCDA TOPSIS Engine scores and ranks alternatives correctly', () => {
  const result = runMCDA(mockCriteria, mockAlternatives);

  assert.ok(result.rankedAlternatives, 'Should return ranked alternatives');
  assert.equal(result.rankedAlternatives.length, 3, 'Should rank all 3 alternatives');
  
  // Verify rank ordering
  assert.equal(result.rankedAlternatives[0].rank, 1);
  assert.equal(result.rankedAlternatives[1].rank, 2);
  assert.equal(result.rankedAlternatives[2].rank, 3);

  // Scores should be between 0 and 100
  result.rankedAlternatives.forEach(alt => {
    assert.ok(alt.topsisScore >= 0 && alt.topsisScore <= 100, `Score ${alt.topsisScore} should be in [0, 100]`);
    assert.ok(alt.criteriaNormalizedScores, 'Should include criteriaNormalizedScores');
  });

  // Top recommendation
  assert.equal(result.topRecommendation.id, result.rankedAlternatives[0].id);
});

test('Monte Carlo Simulation executes stochastic trials with percentiles', () => {
  const sim = runMonteCarloSimulation(mockCriteria, mockAlternatives, {
    iterations: 300,
    distribution: 'triangular'
  });

  assert.equal(sim.iterations, 300);
  assert.equal(sim.results.length, 3);
  
  sim.results.forEach(res => {
    assert.ok(res.winProbability >= 0 && res.winProbability <= 100);
    assert.ok(res.meanScore > 0);
    assert.ok(res.p10 <= res.p50);
    assert.ok(res.p50 <= res.p90);
    assert.ok(res.riskTier);
  });

  // Total win probabilities should sum to approximately 100%
  const totalWinProb = sim.results.reduce((acc, r) => acc + r.winProbability, 0);
  assert.ok(Math.abs(totalWinProb - 100) < 2, `Total win prob ${totalWinProb} should approximate 100%`);

  assert.ok(sim.distributionBins.length > 5, 'Should produce histogram bins');
});

test('Sensitivity Analysis computes Tornado swings and switching thresholds', () => {
  const sens = runSensitivityAnalysis(mockCriteria, mockAlternatives);

  assert.ok(sens.baselineWinner);
  assert.equal(sens.tornadoChart.length, mockCriteria.length);
  
  sens.tornadoChart.forEach(tc => {
    assert.ok(tc.swing >= 0);
    assert.ok(tc.minScore <= tc.maxScore);
    assert.ok(tc.curvePoints.length > 0);
  });
});

test('Explainable AI generates structured transparent verdict and trade-offs', () => {
  const mcda = runMCDA(mockCriteria, mockAlternatives);
  const sim = runMonteCarloSimulation(mockCriteria, mockAlternatives, { iterations: 200 });
  const sens = runSensitivityAnalysis(mockCriteria, mockAlternatives);
  
  const explanation = generateDecisionExplanation(
    { title: 'Test Decision', criteria: mockCriteria, alternatives: mockAlternatives },
    mcda,
    sim,
    sens
  );

  assert.ok(explanation.executiveVerdict);
  assert.ok(explanation.topRecommendation.confidenceScore >= 50);
  assert.ok(Array.isArray(explanation.strategicActionPlan));
  assert.ok(explanation.strategicActionPlan.length >= 2);
});
