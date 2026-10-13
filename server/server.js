/**
 * ==============================================================================
 * STRATAGEM AI DECISION INTELLIGENCE PLATFORM — ALL-IN-ONE STANDALONE SERVER
 * ==============================================================================
 * Production-ready single-file bundle for Render, Railway, Fly.io, or Docker.
 * Includes:
 *   1. Full Express API & Middleware
 *   2. TOPSIS MCDA Multi-Criteria Engine
 *   3. Monte Carlo Stochastic Risk Simulation
 *   4. Tornado Sensitivity & Critical Threshold Analysis
 *   5. Explainable AI (XAI) Synthesis
 *   6. Google Gemini GenAI SDK Integration (Gemini 2.5/2.0 Flash)
 *   7. Hybrid Supabase PostgreSQL + Local Atomic Store Fallback
 *   8. JWT Authentication & bcrypt Security
 *   9. Zod Runtime Schema Validation & CSV Ingestion
 * ==============================================================================
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z, ZodError } from 'zod';
import multer from 'multer';
import { parse as csvParse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// ------------------------------------------------------------------------------
// 1. ENVIRONMENT CONFIGURATION & PATH RESOLUTION
// ------------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Support both local development and Render runtime paths
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'stratagem-decision-intelligence-jwt-secret-2025-secure-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  env: process.env.NODE_ENV || 'production',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};

// ------------------------------------------------------------------------------
// 2. MATHEMATICAL DECISION INTELLIGENCE ENGINES
// ------------------------------------------------------------------------------

/**
 * Multi-Criteria Decision Analysis (TOPSIS & WSM Engine)
 */
function normalizeMatrix(criteria, alternatives) {
  const normSums = {};
  criteria.forEach(crit => {
    let sumSquares = 0;
    alternatives.forEach(alt => {
      const val = getNominalValue(alt, crit.id);
      sumSquares += Math.pow(val, 2);
    });
    normSums[crit.id] = Math.sqrt(sumSquares) || 1;
  });

  const normalized = {};
  alternatives.forEach(alt => {
    normalized[alt.id] = {};
    criteria.forEach(crit => {
      const val = getNominalValue(alt, crit.id);
      normalized[alt.id][crit.id] = val / normSums[crit.id];
    });
  });

  return normalized;
}

function getNominalValue(alt, critId) {
  const val = alt.rawScores ? alt.rawScores[critId] : alt.scores[critId];
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && typeof val.value === 'number') return val.value;
  return Number(val) || 0;
}

function calculateWeightedMatrix(criteria, alternatives, normMatrix, customWeights = null) {
  const weighted = {};
  const weightMap = {};
  let totalWeight = 0;
  criteria.forEach(c => {
    const w = (customWeights && customWeights[c.id] !== undefined) ? customWeights[c.id] : c.weight;
    weightMap[c.id] = w;
    totalWeight += w;
  });

  if (totalWeight === 0) totalWeight = 1;

  alternatives.forEach(alt => {
    weighted[alt.id] = {};
    criteria.forEach(c => {
      const normalizedWeight = weightMap[c.id] / totalWeight;
      weighted[alt.id][c.id] = normMatrix[alt.id][c.id] * normalizedWeight;
    });
  });

  return { weighted, weightMap, totalWeight };
}

function identifyIdeals(criteria, alternatives, weightedMatrix) {
  const idealPositive = {};
  const idealNegative = {};

  criteria.forEach(crit => {
    const values = alternatives.map(alt => weightedMatrix[alt.id][crit.id]);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);

    if (crit.type === 'benefit') {
      idealPositive[crit.id] = maxVal;
      idealNegative[crit.id] = minVal;
    } else {
      idealPositive[crit.id] = minVal;
      idealNegative[crit.id] = maxVal;
    }
  });

  return { idealPositive, idealNegative };
}

function calculateDistances(criteria, alternatives, weightedMatrix, idealPos, idealNeg) {
  const results = {};
  alternatives.forEach(alt => {
    let sumPos = 0;
    let sumNeg = 0;
    criteria.forEach(c => {
      const val = weightedMatrix[alt.id][c.id];
      sumPos += Math.pow(val - idealPos[c.id], 2);
      sumNeg += Math.pow(val - idealNeg[c.id], 2);
    });

    const distPos = Math.sqrt(sumPos);
    const distNeg = Math.sqrt(sumNeg);
    const closeness = (distPos + distNeg === 0) ? 0.5 : distNeg / (distPos + distNeg);

    results[alt.id] = {
      distPos,
      distNeg,
      closeness: Math.round(closeness * 10000) / 10000,
      topsisScore: Math.round(closeness * 1000) / 10
    };
  });
  return results;
}

function isDominating(altA, altB, criteria) {
  let atLeastOneBetter = false;
  for (const c of criteria) {
    const valA = getNominalValue(altA, c.id);
    const valB = getNominalValue(altB, c.id);

    if (c.type === 'benefit') {
      if (valA < valB) return false;
      if (valA > valB) atLeastOneBetter = true;
    } else {
      if (valA > valB) return false;
      if (valA < valB) atLeastOneBetter = true;
    }
  }
  return atLeastOneBetter;
}

function findParetoOptimal(criteria, alternatives) {
  const paretoSet = [];
  alternatives.forEach(candidate => {
    let isDominated = false;
    for (const other of alternatives) {
      if (candidate.id !== other.id && isDominating(other, candidate, criteria)) {
        isDominated = true;
        break;
      }
    }
    if (!isDominated) paretoSet.push(candidate.id);
  });
  return paretoSet;
}

export function runMCDA(criteria, alternatives, customWeights = null) {
  if (!criteria || criteria.length === 0 || !alternatives || alternatives.length === 0) {
    throw new Error('Criteria and Alternatives must be provided.');
  }

  const normMatrix = normalizeMatrix(criteria, alternatives);
  const { weighted, weightMap, totalWeight } = calculateWeightedMatrix(criteria, alternatives, normMatrix, customWeights);
  const { idealPositive, idealNegative } = identifyIdeals(criteria, alternatives, weighted);
  const distances = calculateDistances(criteria, alternatives, weighted, idealPositive, idealNegative);
  const paretoOptimalIds = findParetoOptimal(criteria, alternatives);

  // Linear WSM calculation for comparison
  const wsmScores = {};
  criteria.forEach(c => {
    const vals = alternatives.map(a => getNominalValue(a, c.id));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = (max - min) === 0 ? 1 : (max - min);

    alternatives.forEach(alt => {
      const v = getNominalValue(alt, c.id);
      const linNorm = c.type === 'benefit' ? (v - min) / range : (max - v) / range;
      const weightNorm = weightMap[c.id] / totalWeight;
      wsmScores[alt.id] = (wsmScores[alt.id] || 0) + (linNorm * weightNorm * 100);
    });
  });

  const rankedAlternatives = alternatives.map(alt => {
    const topsis = distances[alt.id];
    const wsm = Math.round((wsmScores[alt.id] || 0) * 10) / 10;
    const isPareto = paretoOptimalIds.includes(alt.id);

    // Compute normalized 0-100 radar scores per criterion
    const criteriaNormalized = {};
    criteria.forEach(c => {
      const vals = alternatives.map(a => getNominalValue(a, c.id));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = (max - min) === 0 ? 1 : (max - min);
      const raw = getNominalValue(alt, c.id);
      const scaled = c.type === 'benefit'
        ? Math.round(((raw - min) / range) * 100)
        : Math.round(((max - raw) / range) * 100);
      criteriaNormalized[c.id] = Math.max(0, Math.min(100, scaled));
    });

    return {
      ...alt,
      topsisScore: topsis.topsisScore,
      closeness: topsis.closeness,
      wsmScore: wsm,
      distancePositive: Math.round(topsis.distPos * 1000) / 1000,
      distanceNegative: Math.round(topsis.distNeg * 1000) / 1000,
      isParetoOptimal: isPareto,
      criteriaNormalizedScores: criteriaNormalized
    };
  });

  rankedAlternatives.sort((a, b) => b.topsisScore - a.topsisScore);

  return {
    rankedAlternatives,
    topRecommendation: rankedAlternatives[0],
    runnerUp: rankedAlternatives[1] || null,
    paretoOptimalIds,
    idealPositive,
    idealNegative
  };
}

/**
 * Monte Carlo Stochastic Risk Engine
 */
function sampleTriangular(min, mode, max) {
  const u = Math.random();
  const f = (mode - min) / (max - min);
  if (u <= f) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }
}

function sampleGaussian(mean, stdDev) {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export function runMonteCarloSimulation(criteria, alternatives, config = {}) {
  const iterations = Math.min(10000, Math.max(100, config.iterations || 1500));
  const distribution = config.distribution || 'triangular';
  const customWeights = config.customWeights || null;

  const winCounts = {};
  const scoresAccumulator = {};
  alternatives.forEach(alt => {
    winCounts[alt.id] = 0;
    scoresAccumulator[alt.id] = [];
  });

  for (let i = 0; i < iterations; i++) {
    const perturbedAlternatives = alternatives.map(alt => {
      const perturbedScores = {};
      criteria.forEach(c => {
        const nominal = getNominalValue(alt, c.id);
        const uncertainty = (c.uncertaintyPct || 10) / 100;
        let sampled = nominal;

        if (distribution === 'triangular') {
          const min = nominal * (1 - uncertainty);
          const max = nominal * (1 + uncertainty);
          sampled = sampleTriangular(min, nominal, max);
        } else {
          const stdDev = nominal * (uncertainty / 2);
          sampled = sampleGaussian(nominal, stdDev);
        }

        perturbedScores[c.id] = Math.max(0.0001, sampled);
      });

      return {
        ...alt,
        scores: perturbedScores,
        rawScores: perturbedScores
      };
    });

    const trialResults = runMCDA(criteria, perturbedAlternatives, customWeights);
    const trialWinner = trialResults.rankedAlternatives[0];
    if (trialWinner) {
      winCounts[trialWinner.id] = (winCounts[trialWinner.id] || 0) + 1;
    }

    trialResults.rankedAlternatives.forEach(ra => {
      scoresAccumulator[ra.id].push(ra.topsisScore);
    });
  }

  const simulationResults = alternatives.map(alt => {
    const scores = scoresAccumulator[alt.id].sort((a, b) => a - b);
    const n = scores.length;
    const mean = scores.reduce((sum, v) => sum + v, 0) / n;
    const variance = scores.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const p10 = scores[Math.floor(n * 0.10)];
    const p50 = scores[Math.floor(n * 0.50)];
    const p90 = scores[Math.floor(n * 0.90)];
    const p95 = scores[Math.floor(n * 0.05)];
    const valueAtRisk95 = Math.round((mean - p95) * 10) / 10;
    const winRate = Math.round((winCounts[alt.id] / iterations) * 1000) / 10;

    return {
      alternativeId: alt.id,
      name: alt.name,
      winProbability: winRate,
      meanScore: Math.round(mean * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      p10: Math.round(p10 * 10) / 10,
      p50: Math.round(p50 * 10) / 10,
      p90: Math.round(p90 * 10) / 10,
      valueAtRisk95: Math.max(0, valueAtRisk95),
      riskTier: stdDev > 12 ? 'High Volatility' : stdDev > 6 ? 'Moderate Risk' : 'High Stability',
      _scores: scores
    };
  });

  // Calculate 14-bin frequency density curves
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
    const entry = { bin: binLabel, rangeStart: Math.round(rangeStart), rangeEnd: Math.round(rangeEnd) };

    simulationResults.forEach(r => {
      const inBin = r._scores.filter(s => s >= rangeStart && (i === numBins - 1 ? s <= rangeEnd : s < rangeEnd)).length;
      entry[r.alternativeId] = Math.round((inBin / iterations) * 1000) / 10;
    });
    distributionBins.push(entry);
  }

  simulationResults.forEach(r => delete r._scores);
  simulationResults.sort((a, b) => b.winProbability - a.winProbability);

  return {
    iterations,
    distribution,
    results: simulationResults,
    distributionBins,
    dominantAlternative: simulationResults[0]
  };
}

/**
 * Sensitivity & Tornado Analysis Engine
 */
export function runSensitivityAnalysis(criteria, alternatives) {
  const baseline = runMCDA(criteria, alternatives);
  const baselineWinner = baseline.rankedAlternatives[0];

  const multipliers = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];
  const tornadoChart = [];
  const switchingThresholds = [];

  criteria.forEach(crit => {
    let minScore = 100;
    let maxScore = 0;
    let switchPoint = null;

    multipliers.forEach(mult => {
      const customWeights = {};
      criteria.forEach(c => {
        customWeights[c.id] = c.id === crit.id ? c.weight * mult : c.weight;
      });

      const trial = runMCDA(criteria, alternatives, customWeights);
      const winnerInTrial = trial.rankedAlternatives[0];
      const targetScore = trial.rankedAlternatives.find(a => a.id === baselineWinner.id)?.topsisScore || 0;

      if (targetScore < minScore) minScore = targetScore;
      if (targetScore > maxScore) maxScore = targetScore;

      if (winnerInTrial.id !== baselineWinner.id && !switchPoint) {
        const weightShiftPercent = Math.round((mult - 1.0) * 100);
        switchPoint = {
          criterionId: crit.id,
          criterionName: crit.name,
          multiplier: mult,
          weightShiftPercent,
          overtakingAlternativeId: winnerInTrial.id,
          overtakingAlternativeName: winnerInTrial.name
        };
      }
    });

    const swing = Math.round((maxScore - minScore) * 10) / 10;
    tornadoChart.push({
      criterionId: crit.id,
      criterionName: crit.name,
      baseWeight: crit.weight,
      swing,
      minScore: Math.round(minScore * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
      baselineScore: baselineWinner.topsisScore,
      impactTier: swing > 15 ? 'Critical' : swing > 8 ? 'Moderate' : 'Low'
    });

    if (switchPoint) {
      switchingThresholds.push(switchPoint);
    }
  });

  tornadoChart.sort((a, b) => b.swing - a.swing);

  return {
    tornadoChart,
    switchingThresholds,
    mostSensitiveCriterion: tornadoChart[0] || null,
    baselineWinner
  };
}

/**
 * Explainable AI Reasoning Core
 */
export function generateDecisionExplanation(decision, mcdaResults, simulationResults = null, sensitivityResults = null) {
  const { criteria } = decision;
  const winner = mcdaResults.rankedAlternatives[0];
  const runnerUp = mcdaResults.rankedAlternatives[1] || null;

  if (!winner) {
    return { summary: 'No alternatives evaluated.', recommendations: [] };
  }

  const competitiveAdvantages = [];
  const acceptedCompromises = [];

  criteria.forEach(c => {
    const winnerScore = getNominalValue(winner, c.id);
    const winnerNorm = winner.criteriaNormalizedScores[c.id] || 50;

    if (runnerUp) {
      const runnerScore = getNominalValue(runnerUp, c.id);
      const runnerNorm = runnerUp.criteriaNormalizedScores[c.id] || 50;
      const normDiff = winnerNorm - runnerNorm;

      if (normDiff > 8) {
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

  competitiveAdvantages.sort((a, b) => b.weight - a.weight);
  acceptedCompromises.sort((a, b) => b.weight - a.weight);

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

  let confidenceScore = 85;
  if (riskSummary.winProbability) {
    if (riskSummary.winProbability >= 80) confidenceScore = 92;
    else if (riskSummary.winProbability >= 60) confidenceScore = 78;
    else confidenceScore = 65;
  }
  if (sensitivitySummary.isFragile) confidenceScore -= 10;
  confidenceScore = Math.max(50, Math.min(99, confidenceScore));

  const confidenceTier = confidenceScore >= 85 ? 'High Conviction' : confidenceScore >= 70 ? 'Moderate Conviction' : 'Speculative / Sensitive';
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

// ------------------------------------------------------------------------------
// 3. GOOGLE GEMINI AI SDK SERVICE
// ------------------------------------------------------------------------------
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export function isGeminiConfigured() {
  const key = config.geminiApiKey;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim().length > 10 &&
    !key.includes('your-gemini') &&
    !key.includes('your_gemini')
  );
}

export function getGeminiClient(customKey = null) {
  const apiKey = customKey || config.geminiApiKey;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function testGeminiConnection(keyToTest = null) {
  const apiKey = keyToTest || config.geminiApiKey;
  if (!apiKey) {
    return { success: false, error: 'No Gemini API key provided.' };
  }

  const ai = new GoogleGenAI({ apiKey });
  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Confirm that you are operational. Reply in under 5 words.'
      });
      return {
        success: true,
        model,
        message: 'Google Gemini API connection verified successfully.',
        sampleResponse: (response?.text || 'Operational').trim()
      };
    } catch (err) {
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
        return { success: false, error: err.message || 'Failed to authenticate with Google Gemini.' };
      }
    }
  }
}

export async function saveGeminiApiKey(newKey) {
  if (!newKey || typeof newKey !== 'string') throw new Error('Invalid API key.');
  const cleaned = newKey.trim();
  const test = await testGeminiConnection(cleaned);
  if (!test.success) throw new Error(`Gemini validation failed: ${test.error}`);

  config.geminiApiKey = cleaned;
  process.env.GEMINI_API_KEY = cleaned;

  // Persist locally if .env writable
  try {
    const envFile = path.resolve(__dirname, '.env');
    if (fs.existsSync(envFile)) {
      let content = fs.readFileSync(envFile, 'utf-8');
      if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleaned}`);
      } else {
        content += `\nGEMINI_API_KEY=${cleaned}\n`;
      }
      fs.writeFileSync(envFile, content, 'utf-8');
    }
  } catch (e) {
    // Read-only filesystem on Render containers is safely ignored
  }

  return { success: true, model: test.model };
}

export async function generateExecutiveBriefWithGemini({ decision, mcda, simulation, sensitivity }) {
  if (!isGeminiConfigured()) throw new Error('Gemini API key not configured.');
  const ai = getGeminiClient();
  const winner = mcda?.rankedAlternatives?.[0];

  const prompt = `
You are the Chief Decision Intelligence Officer & Strategic Advisor for Stratagem AI.
Analyze this mathematical decision model and synthesize an authoritative Executive Decision Brief.

Decision: "${decision.title}"
Objective: "${decision.description || 'Not provided'}"
Criteria: ${decision.criteria.map(c => `${c.name} (${c.type.toUpperCase()}, Weight: ${c.weight}%)`).join(', ')}
Alternatives: ${mcda.rankedAlternatives.map(a => `${a.name} (TOPSIS Score: ${a.topsisScore}/100, Pareto: ${a.isParetoOptimal ? 'Yes' : 'No'})`).join('; ')}
Monte Carlo Win Rate: ${simulation?.dominantAlternative?.winProbability || 'N/A'}%

Respond ONLY with valid JSON (no markdown formatting):
{
  "executiveVerdict": "Clear 2-sentence declaration recommending top alternative with conviction level.",
  "topAlternative": "${winner?.name || 'Top Alternative'}",
  "confidenceScore": 92,
  "confidenceTier": "High Conviction",
  "strategicAdvantages": ["Key advantage based on criteria"],
  "acceptedCompromises": ["Trade-off deficit incurred"],
  "riskAndDownsideMitigation": "Analysis of downside volatility and hedging tactics.",
  "sensitivityAlert": "Key weight shift tipping point alert.",
  "phasedRoadmap": [
    { "phase": "Phase 1: Risk Containment (Days 1–30)", "action": "Actionable step" },
    { "phase": "Phase 2: Pilot Deployment (Days 31–90)", "action": "Actionable step" },
    { "phase": "Phase 3: Enterprise Scale (Day 90+)", "action": "Actionable step" }
  ]
}
`.trim();

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      const rawText = (response?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      return {
        ...JSON.parse(rawText),
        source: 'Google Gemini AI',
        model,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw err;
    }
  }
}

export async function askDecisionAssistantWithGemini({ decision, mcda, question }) {
  if (!isGeminiConfigured()) throw new Error('Gemini API key not configured.');
  const ai = getGeminiClient();
  const winner = mcda?.rankedAlternatives?.[0];

  const prompt = `
You are Stratagem AI Co-Pilot. Answer the decision-maker concisely (<180 words):
Decision: "${decision.title}"
Top Alternative: "${winner?.name}" (Score: ${winner?.topsisScore}/100)
Alternatives: ${decision.alternatives.map(a => a.name).join(', ')}
Question: "${question}"
`.trim();

  for (const model of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      return {
        answer: (response?.text || '').trim(),
        model,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) throw err;
    }
  }
}

// ------------------------------------------------------------------------------
// 4. ZOD VALIDATION SCHEMAS
// ------------------------------------------------------------------------------
export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  organization: z.string().optional().default('Enterprise Analytics Inc.')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const criterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional().default(''),
  type: z.enum(['benefit', 'cost']),
  weight: z.number().min(0).max(100),
  unit: z.string().optional().default('pts'),
  uncertaintyPct: z.number().min(0).max(100).optional().default(10)
});

export const alternativeScoreSchema = z.record(
  z.string(),
  z.union([z.number(), z.object({ value: z.number(), min: z.number().optional(), max: z.number().optional() })])
);

export const alternativeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional().default(''),
  scores: alternativeScoreSchema,
  pros: z.array(z.string()).optional().default([]),
  cons: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([])
});

export const createDecisionSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(1000).optional().default(''),
  category: z.string().min(1).default('Strategic Technology'),
  tags: z.array(z.string()).optional().default([]),
  criteria: z.array(criterionSchema).min(1),
  alternatives: z.array(alternativeSchema).min(2),
  simulationConfig: z.object({
    iterations: z.number().int().min(100).max(10000).default(1000),
    confidenceLevel: z.number().min(50).max(99.9).default(95),
    distribution: z.enum(['gaussian', 'triangular', 'beta']).default('triangular')
  }).optional().default({ iterations: 1000, confidenceLevel: 95, distribution: 'triangular' })
});

export const updateDecisionSchema = createDecisionSchema.partial().extend({
  status: z.enum(['draft', 'evaluated', 'simulated', 'approved', 'archived']).optional(),
  decisionOutcome: z.object({
    selectedAlternativeId: z.string(),
    rationale: z.string().min(5),
    decidedBy: z.string().optional(),
    decidedAt: z.string().optional()
  }).optional()
});

export const simulateDecisionSchema = z.object({
  iterations: z.number().int().min(100).max(10000).optional().default(1000),
  confidenceLevel: z.number().min(50).max(99.9).optional().default(95),
  distribution: z.enum(['gaussian', 'triangular', 'beta']).optional().default('triangular'),
  customWeights: z.record(z.string(), z.number()).optional()
});

// ------------------------------------------------------------------------------
// 5. HYBRID DATABASE & PERSISTENCE (SUPABASE + LOCAL ATOMIC STORE)
// ------------------------------------------------------------------------------
let supabaseClient = null;
export function isSupabaseConfigured() {
  return Boolean(config.supabaseUrl && (config.supabaseServiceKey || config.supabaseAnonKey));
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseClient) {
    const key = config.supabaseServiceKey || config.supabaseAnonKey;
    supabaseClient = createClient(config.supabaseUrl, key, { auth: { persistSession: false } });
  }
  return supabaseClient;
}

const defaultDecisions = [
  {
    id: 'dec-cloud-infra-2025',
    userId: 'usr-demo-001',
    title: 'Enterprise Cloud Architecture Modernization',
    description: 'Strategic evaluation of cloud infrastructure migration for core microservices handling 45M daily requests.',
    category: 'Cloud & Infrastructure',
    tags: ['Cloud', 'Infrastructure', 'FinOps', 'Architecture'],
    status: 'evaluated',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    criteria: [
      { id: 'crit-tco', name: '3-Year TCO CapEx/OpEx', description: 'Compute, networking, and egress', type: 'cost', weight: 22, unit: '$k', uncertaintyPct: 15 },
      { id: 'crit-latency', name: 'Global P95 Network Latency', description: 'Round-trip latency', type: 'cost', weight: 18, unit: 'ms', uncertaintyPct: 12 },
      { id: 'crit-aiml', name: 'AI/ML Ecosystem & GPU Availability', description: 'Accelerator instances and vector DBs', type: 'benefit', weight: 25, unit: 'pts', uncertaintyPct: 10 },
      { id: 'crit-compliance', name: 'Regulatory Compliance & Data Sovereignty', description: 'SOC2 Type II, ISO 27001, HIPAA', type: 'benefit', weight: 20, unit: 'pts', uncertaintyPct: 8 },
      { id: 'crit-lockin', name: 'Vendor Lock-in Resistance', description: 'Portability using open standards', type: 'benefit', weight: 15, unit: 'pts', uncertaintyPct: 18 }
    ],
    alternatives: [
      { id: 'alt-aws', name: 'AWS Enterprise Multi-Region', description: 'Amazon Web Services with EKS and Bedrock.', scores: { 'crit-tco': 420, 'crit-latency': 32, 'crit-aiml': 92, 'crit-compliance': 95, 'crit-lockin': 48 }, pros: ['Global footprint'], cons: ['High egress fees'], tags: ['AWS'] },
      { id: 'alt-gcp', name: 'Google Cloud Platform (GCP) AI-First', description: 'Google Cloud with GKE Autopilot and Vertex AI.', scores: { 'crit-tco': 375, 'crit-latency': 27, 'crit-aiml': 97, 'crit-compliance': 89, 'crit-lockin': 65 }, pros: ['Leading AI infrastructure'], cons: ['Smaller partner network'], tags: ['GCP'] },
      { id: 'alt-azure', name: 'Microsoft Azure Hybrid Enterprise', description: 'Microsoft Azure with AKS and Azure OpenAI.', scores: { 'crit-tco': 395, 'crit-latency': 35, 'crit-aiml': 90, 'crit-compliance': 96, 'crit-lockin': 52 }, pros: ['Enterprise EA bundling'], cons: ['Portal complexity'], tags: ['Azure'] }
    ]
  }
];

class StandaloneStore {
  constructor() {
    this.dataDir = path.resolve(__dirname, 'data');
    this.dbFile = path.join(this.dataDir, 'db.json');
    this.users = [];
    this.decisions = [];
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.decisions = parsed.decisions || [];
      } else {
        this.seed();
      }
    } catch (e) {
      this.seed();
    }
  }

  seed() {
    const salt = bcrypt.genSaltSync(10);
    this.users = [
      {
        id: 'usr-demo-001',
        name: 'Alex Vance',
        email: 'demo@stratagem.ai',
        password: bcrypt.hashSync('StratagemDemo2025!', salt),
        organization: 'Apex Decision Technologies',
        role: 'Chief Decision Architect',
        createdAt: new Date().toISOString()
      }
    ];
    this.decisions = defaultDecisions;
    this.save();
  }

  save() {
    try {
      if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(this.dbFile, JSON.stringify({ users: this.users, decisions: this.decisions }, null, 2), 'utf-8');
    } catch (e) {
      // Memory state persists even if filesystem is read-only
    }
  }

  async findUserByEmail(email) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.from('users').select('*').ilike('email', email).maybeSingle();
        if (data) return data;
      } catch (e) {}
    }
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.from('users').select('*').eq('id', id).maybeSingle();
        if (data) return data;
      } catch (e) {}
    }
    return this.users.find(u => u.id === id);
  }

  async createUser(user) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('users').insert({
          id: user.id, name: user.name, email: user.email.toLowerCase(),
          password: user.password, organization: user.organization,
          role: user.role, created_at: user.createdAt
        });
      } catch (e) {}
    }
    this.users.push(user);
    this.save();
    return user;
  }

  async findDecisionsByUser(userId) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.from('decisions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (data && data.length > 0) {
          return data.map(r => ({
            id: r.id, userId: r.user_id, title: r.title, description: r.description,
            category: r.category, tags: r.tags, status: r.status, criteria: r.criteria,
            alternatives: r.alternatives, simulationConfig: r.simulation_config,
            decisionOutcome: r.decision_outcome, createdAt: r.created_at, updatedAt: r.updated_at
          }));
        }
      } catch (e) {}
    }
    return this.decisions.filter(d => d.userId === userId);
  }

  async findDecisionById(id, userId) {
    const client = getSupabaseClient();
    if (client) {
      try {
        let q = client.from('decisions').select('*').eq('id', id);
        if (userId) q = q.eq('user_id', userId);
        const { data } = await q.maybeSingle();
        if (data) {
          return {
            id: data.id, userId: data.user_id, title: data.title, description: data.description,
            category: data.category, tags: data.tags, status: data.status, criteria: data.criteria,
            alternatives: data.alternatives, simulationConfig: data.simulation_config,
            decisionOutcome: data.decision_outcome, createdAt: data.created_at, updatedAt: data.updated_at
          };
        }
      } catch (e) {}
    }
    return this.decisions.find(d => d.id === id && (!userId || d.userId === userId));
  }

  async createDecision(d) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('decisions').insert({
          id: d.id, user_id: d.userId, title: d.title, description: d.description,
          category: d.category, tags: d.tags, status: d.status, criteria: d.criteria,
          alternatives: d.alternatives, simulation_config: d.simulationConfig,
          decision_outcome: d.decisionOutcome, created_at: d.createdAt, updated_at: d.updatedAt
        });
      } catch (e) {}
    }
    this.decisions.unshift(d);
    this.save();
    return d;
  }

  async updateDecision(id, userId, updates) {
    const existing = await this.findDecisionById(id, userId);
    if (!existing) return null;
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('decisions').update({
          title: merged.title, description: merged.description, category: merged.category,
          tags: merged.tags, status: merged.status, criteria: merged.criteria,
          alternatives: merged.alternatives, simulation_config: merged.simulationConfig,
          decision_outcome: merged.decisionOutcome, updated_at: merged.updatedAt
        }).eq('id', id).eq('user_id', userId);
      } catch (e) {}
    }

    const idx = this.decisions.findIndex(d => d.id === id && d.userId === userId);
    if (idx !== -1) {
      this.decisions[idx] = merged;
      this.save();
    }
    return merged;
  }

  async deleteDecision(id, userId) {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('decisions').delete().eq('id', id).eq('user_id', userId);
      } catch (e) {}
    }
    const len = this.decisions.length;
    this.decisions = this.decisions.filter(d => !(d.id === id && d.userId === userId));
    const deleted = this.decisions.length < len;
    if (deleted) this.save();
    return deleted;
  }
}

export const db = new StandaloneStore();

// ------------------------------------------------------------------------------
// 6. MIDDLEWARE
// ------------------------------------------------------------------------------
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      next(err);
    }
  };
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await db.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }
    req.user = { id: user.id, name: user.name, email: user.email, organization: user.organization, role: user.role };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ------------------------------------------------------------------------------
// 7. EXPRESS APPLICATION SETUP & ROUTE AGGREGATION
// ------------------------------------------------------------------------------
const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Stratagem AI Decision Intelligence Platform (Render Standalone)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    geminiActive: isGeminiConfigured(),
    supabaseActive: isSupabaseConfigured()
  });
});

// AUTH ROUTES
app.post('/api/auth/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, organization } = req.body;
    const existing = await db.findUserByEmail(email);
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      name, email: email.toLowerCase(), password: hashedPassword,
      organization: organization || 'Enterprise Decision Team',
      role: 'Decision Analyst', createdAt: new Date().toISOString()
    };

    await db.createUser(newUser);
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return res.status(201).json({
      success: true, token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, organization: newUser.organization, role: newUser.role }
    });
  } catch (err) { next(err); }
});

app.post('/api/auth/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, organization: user.organization, role: user.role }
    });
  } catch (err) { next(err); }
});

app.post('/api/auth/demo-login', async (req, res, next) => {
  try {
    const demo = await db.findUserByEmail('demo@stratagem.ai');
    if (!demo) return res.status(404).json({ success: false, error: 'Demo user not seeded' });
    const token = jwt.sign({ userId: demo.id, email: demo.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return res.json({
      success: true, token,
      user: { id: demo.id, name: demo.name, email: demo.email, organization: demo.organization, role: demo.role }
    });
  } catch (err) { next(err); }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

// DECISION ROUTES
app.get('/api/decisions', authenticate, async (req, res, next) => {
  try {
    const list = await db.findDecisionsByUser(req.user.id);
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
});

app.post('/api/decisions', authenticate, validate(createDecisionSchema), async (req, res, next) => {
  try {
    const payload = req.body;
    const newDec = {
      id: `dec-${uuidv4().slice(0, 8)}`,
      userId: req.user.id,
      title: payload.title,
      description: payload.description || '',
      category: payload.category || 'Strategic',
      tags: payload.tags || [],
      status: 'evaluated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      criteria: payload.criteria,
      alternatives: payload.alternatives,
      simulationConfig: payload.simulationConfig || { iterations: 1000, confidenceLevel: 95, distribution: 'triangular' }
    };
    await db.createDecision(newDec);
    res.status(201).json({ success: true, data: newDec });
  } catch (err) { next(err); }
});

app.post('/api/decisions/ingest', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    let rawContent = '';
    let format = 'json';
    if (req.file) {
      rawContent = req.file.buffer.toString('utf-8');
      format = req.file.originalname.endsWith('.csv') ? 'csv' : 'json';
    } else if (req.body.csvText) {
      rawContent = req.body.csvText;
      format = 'csv';
    } else if (req.body.jsonData) {
      rawContent = typeof req.body.jsonData === 'string' ? req.body.jsonData : JSON.stringify(req.body.jsonData);
      format = 'json';
    } else {
      return res.status(400).json({ success: false, error: 'Provide CSV or JSON parameter' });
    }

    let parsedAlternatives = [];
    let parsedCriteria = [];

    if (format === 'csv') {
      const records = csvParse(rawContent, { columns: true, skip_empty_lines: true, trim: true });
      if (records.length === 0) return res.status(400).json({ success: false, error: 'CSV file is empty' });
      const headers = Object.keys(records[0]);
      const nameCol = headers[0];
      const criteriaCols = headers.slice(1);

      parsedCriteria = criteriaCols.map((colName, idx) => {
        const lower = colName.toLowerCase();
        const isCost = lower.includes('cost') || lower.includes('price') || lower.includes('latency') || lower.includes('risk');
        return {
          id: `crit-${idx + 1}`, name: colName,
          description: `Auto-ingested criterion: ${colName}`,
          type: isCost ? 'cost' : 'benefit',
          weight: Math.round(100 / criteriaCols.length),
          unit: lower.includes('$') ? '$' : lower.includes('ms') ? 'ms' : 'pts',
          uncertaintyPct: 12
        };
      });

      parsedAlternatives = records.map((row, idx) => {
        const scores = {};
        parsedCriteria.forEach((crit, cIdx) => {
          const col = criteriaCols[cIdx];
          scores[crit.id] = Number(String(row[col] || '0').replace(/[^0-9.-]/g, '')) || 0;
        });
        return {
          id: `alt-${idx + 1}`, name: row[nameCol] || `Alternative ${idx + 1}`,
          description: `Ingested entity: ${row[nameCol]}`, scores, pros: [], cons: [], tags: ['Ingested']
        };
      });
    } else {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        const sample = parsed[0] || {};
        const keys = Object.keys(sample).filter(k => k !== 'name' && k !== 'id');
        parsedCriteria = keys.map((k, idx) => ({
          id: `crit-${idx + 1}`, name: k.charAt(0).toUpperCase() + k.slice(1),
          description: `Parameter: ${k}`,
          type: (k.toLowerCase().includes('cost') || k.toLowerCase().includes('latency')) ? 'cost' : 'benefit',
          weight: Math.round(100 / keys.length), unit: 'pts', uncertaintyPct: 10
        }));
        parsedAlternatives = parsed.map((item, idx) => {
          const scores = {};
          parsedCriteria.forEach(c => { scores[c.id] = Number(item[c.name.toLowerCase()] ?? item[c.name] ?? 0); });
          return { id: `alt-${idx + 1}`, name: item.name || `Alternative ${idx + 1}`, description: '', scores, pros: [], cons: [], tags: ['Ingested'] };
        });
      }
    }

    res.json({ success: true, data: { criteria: parsedCriteria, alternatives: parsedAlternatives } });
  } catch (err) { next(err); }
});

app.get('/api/decisions/:id', authenticate, async (req, res, next) => {
  try {
    const decision = await db.findDecisionById(req.params.id, req.user.id);
    if (!decision) return res.status(404).json({ success: false, error: 'Decision not found' });
    const mcda = runMCDA(decision.criteria, decision.alternatives);
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const explanation = generateDecisionExplanation(decision, mcda, null, sensitivity);
    res.json({ success: true, data: { ...decision, baselineAnalysis: { mcda, sensitivity, explanation } } });
  } catch (err) { next(err); }
});

app.put('/api/decisions/:id', authenticate, validate(updateDecisionSchema), async (req, res, next) => {
  try {
    const updated = await db.updateDecision(req.params.id, req.user.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'Decision not found' });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

app.delete('/api/decisions/:id', authenticate, async (req, res, next) => {
  try {
    const ok = await db.deleteDecision(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Decision not found' });
    res.json({ success: true, message: 'Decision deleted' });
  } catch (err) { next(err); }
});

app.post('/api/decisions/:id/duplicate', authenticate, async (req, res, next) => {
  try {
    const original = await db.findDecisionById(req.params.id, req.user.id);
    if (!original) return res.status(404).json({ success: false, error: 'Decision not found' });
    const cloned = {
      ...JSON.parse(JSON.stringify(original)),
      id: `dec-${uuidv4().slice(0, 8)}`,
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete cloned.decisionOutcome;
    await db.createDecision(cloned);
    res.status(201).json({ success: true, data: cloned });
  } catch (err) { next(err); }
});

app.post('/api/decisions/:id/analyze', authenticate, async (req, res, next) => {
  try {
    const decision = await db.findDecisionById(req.params.id, req.user.id);
    if (!decision) return res.status(404).json({ success: false, error: 'Decision not found' });
    const mcda = runMCDA(decision.criteria, decision.alternatives, req.body?.customWeights);
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const explanation = generateDecisionExplanation(decision, mcda, null, sensitivity);
    res.json({ success: true, data: { mcda, sensitivity, explanation } });
  } catch (err) { next(err); }
});

app.post('/api/decisions/:id/simulate', authenticate, validate(simulateDecisionSchema), async (req, res, next) => {
  try {
    const decision = await db.findDecisionById(req.params.id, req.user.id);
    if (!decision) return res.status(404).json({ success: false, error: 'Decision not found' });
    const mcda = runMCDA(decision.criteria, decision.alternatives, req.body?.customWeights);
    const simulation = runMonteCarloSimulation(decision.criteria, decision.alternatives, {
      iterations: req.body?.iterations || 1500,
      distribution: req.body?.distribution || 'triangular',
      customWeights: req.body?.customWeights
    });
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const explanation = generateDecisionExplanation(decision, mcda, simulation, sensitivity);
    res.json({ success: true, data: { mcda, simulation, sensitivity, explanation } });
  } catch (err) { next(err); }
});

// AI & GEMINI ROUTES
app.get('/api/ai/status', (req, res) => {
  const configured = isGeminiConfigured();
  res.json({
    success: true,
    data: {
      provider: 'Google Gemini',
      configured,
      models: GEMINI_MODELS,
      message: configured ? 'Google Gemini AI connected and active.' : 'Gemini API key not configured.'
    }
  });
});

app.post('/api/ai/test-key', async (req, res, next) => {
  try {
    const result = await testGeminiConnection(req.body?.apiKey);
    if (!result.success) return res.status(400).json({ success: false, error: result.error });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

app.post('/api/ai/save-key', authenticate, async (req, res) => {
  try {
    const result = await saveGeminiApiKey(req.body?.apiKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/decision/:id/brief', authenticate, async (req, res, next) => {
  try {
    const decision = await db.findDecisionById(req.params.id, req.user?.id);
    if (!decision) return res.status(404).json({ success: false, error: 'Decision not found' });
    const mcda = runMCDA(decision.criteria, decision.alternatives);
    const simulation = runMonteCarloSimulation(decision.criteria, decision.alternatives, { iterations: 1500, distribution: 'triangular' });
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const brief = await generateExecutiveBriefWithGemini({ decision, mcda, simulation, sensitivity });
    res.json({ success: true, data: brief });
  } catch (err) { next(err); }
});

app.post('/api/ai/decision/:id/ask', authenticate, async (req, res, next) => {
  try {
    const decision = await db.findDecisionById(req.params.id, req.user?.id);
    if (!decision) return res.status(404).json({ success: false, error: 'Decision not found' });
    const mcda = runMCDA(decision.criteria, decision.alternatives);
    const answer = await askDecisionAssistantWithGemini({ decision, mcda, question: req.body?.question });
    res.json({ success: true, data: answer });
  } catch (err) { next(err); }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const code = err.statusCode || 500;
  res.status(code).json({ success: false, error: err.message || 'Internal Server Error' });
});

// ------------------------------------------------------------------------------
// 8. SERVER BOOTSTRAP (RENDER PRODUCTION ENTRYPOINT)
// ------------------------------------------------------------------------------
const isTestEnv = process.env.NODE_ENV === 'test' || 
                  process.execArgv.includes('--test') || 
                  process.argv.some(a => typeof a === 'string' && a.includes('test'));

if (!isTestEnv) {
  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(` Stratagem AI Standalone Server (Render Ready) `);
    console.log(` Running on: http://localhost:${config.port}`);
    console.log(` Environment: ${config.env}`);
    console.log(` Health check: http://localhost:${config.port}/api/health`);
    console.log(` Gemini AI: ${isGeminiConfigured() ? 'Active (Ready)' : 'Pending API Key'}`);
    console.log(` Supabase DB: ${isSupabaseConfigured() ? 'Connected' : 'Local Fallback'}`);
    console.log(`=================================================`);
  });
}

export default app;
