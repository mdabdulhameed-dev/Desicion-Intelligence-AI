import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, '../../.env');

// Preferred Gemini models in fallback order
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

/**
 * Check if a valid Gemini API key is configured
 */
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

/**
 * Get active API key
 */
export function getActiveApiKey() {
  return config.geminiApiKey || '';
}

/**
 * Initialize Google GenAI client
 */
export function getGeminiClient(customKey = null) {
  const apiKey = customKey || config.geminiApiKey;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Test a Gemini API key
 */
export async function testGeminiConnection(keyToTest = null) {
  const apiKey = keyToTest || config.geminiApiKey;
  if (!apiKey) {
    return {
      success: false,
      error: 'No Gemini API key provided. Please supply an API key or configure GEMINI_API_KEY in server/.env.'
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Confirm that you are operational. Reply in under 5 words.'
      });

      const replyText = response?.text || 'Operational';
      return {
        success: true,
        model,
        message: 'Google Gemini API connection verified successfully.',
        sampleResponse: replyText.trim()
      };
    } catch (err) {
      // Continue to next candidate model if this one is not available on key's quota
      if (model === CANDIDATE_MODELS[CANDIDATE_MODELS.length - 1]) {
        return {
          success: false,
          error: err.message || 'Failed to authenticate with Google Gemini API.'
        };
      }
    }
  }

  return {
    success: false,
    error: 'Unable to connect to any Gemini models with the provided API key.'
  };
}

/**
 * Save / Update Gemini API key to server/.env and runtime config
 */
export async function saveGeminiApiKey(newKey) {
  if (!newKey || typeof newKey !== 'string') {
    throw new Error('Invalid API key provided.');
  }

  const cleanedKey = newKey.trim();

  // 1. Verify key before saving
  const testResult = await testGeminiConnection(cleanedKey);
  if (!testResult.success) {
    throw new Error(`Gemini API key validation failed: ${testResult.error}`);
  }

  // 2. Update runtime memory config
  config.geminiApiKey = cleanedKey;
  process.env.GEMINI_API_KEY = cleanedKey;

  // 3. Persist to server/.env
  try {
    if (fs.existsSync(ENV_PATH)) {
      let content = fs.readFileSync(ENV_PATH, 'utf-8');
      if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanedKey}`);
      } else {
        content += `\nGEMINI_API_KEY=${cleanedKey}\n`;
      }
      fs.writeFileSync(ENV_PATH, content, 'utf-8');
    }
  } catch (fsErr) {
    console.warn('[Gemini Service] Could not write to .env file:', fsErr.message);
  }

  return {
    success: true,
    message: 'Gemini API key saved and verified successfully.',
    model: testResult.model
  };
}

/**
 * Generate an Executive Decision Brief using Google Gemini
 */
export async function generateExecutiveBriefWithGemini({ decision, mcda, simulation, sensitivity }) {
  if (!isGeminiConfigured()) {
    throw new Error('Google Gemini API key is not configured. Add GEMINI_API_KEY to server/.env or configure it via the UI.');
  }

  const ai = getGeminiClient();
  const winner = mcda?.rankedAlternatives?.[0];
  const runnerUp = mcda?.rankedAlternatives?.[1];

  const prompt = `
You are the Chief Decision Intelligence Officer & Strategic Advisor for Stratagem AI.
Analyze the following decision model and synthesize an authoritative, actionable, and mathematically grounded Executive Decision Brief.

### Decision Context:
- **Title**: "${decision.title}"
- **Description / Objective**: "${decision.description || 'Not provided'}"
- **Category**: ${decision.category || 'Strategic'}

### Criteria & Weights Evaluated:
${decision.criteria.map(c => `- **${c.name}** (${c.type.toUpperCase()}, Weight: ${Math.round(c.weight * 100)}%, Unit: ${c.unit})`).join('\n')}

### Alternatives & TOPSIS Scores:
${mcda.rankedAlternatives.map((alt, i) => `${i + 1}. **${alt.name}** — TOPSIS Score: ${alt.topsisScore}/100, WSM Score: ${alt.wsmScore}/100, Pareto Optimal: ${alt.isParetoOptimal ? 'Yes' : 'No'}`).join('\n')}

### Monte Carlo Risk Simulation (1,500 stochastic trials):
${simulation ? `
- Dominant Win Probability: ${simulation.results?.find(r => r.alternativeId === winner?.id)?.winProbability || 'N/A'}%
- Downside P10 Floor: ${simulation.results?.find(r => r.alternativeId === winner?.id)?.p10 || 'N/A'}
- Median P50: ${simulation.results?.find(r => r.alternativeId === winner?.id)?.p50 || 'N/A'}
- Upside P90: ${simulation.results?.find(r => r.alternativeId === winner?.id)?.p90 || 'N/A'}
- Value at Risk (VaR 95%): ${simulation.results?.find(r => r.alternativeId === winner?.id)?.valueAtRisk95 || 'N/A'}
` : 'Risk simulation not yet executed.'}

### Sensitivity & Switching Points:
${sensitivity?.switchingThresholds?.length > 0 
  ? sensitivity.switchingThresholds.map(s => `- If "${s.criterionName}" weight shifts by ${s.weightShiftPercent > 0 ? '+' : ''}${s.weightShiftPercent}%, ranking flips to **${s.overtakingAlternativeName}**.`).join('\n')
  : 'High structural resilience: No single criterion weight swing flips the top alternative within tested bounds.'}

### Required JSON Output:
Respond ONLY with a valid, parseable JSON object matching this schema (no markdown fences, no extra text):
{
  "executiveVerdict": "Clear 2-3 sentence strategic declaration recommending the top alternative with conviction rating.",
  "topAlternative": "${winner?.name || 'Top Alternative'}",
  "confidenceScore": 92,
  "confidenceTier": "High Conviction",
  "strategicAdvantages": [
    "High-impact bullet point explaining why this alternative won based on vector weights and criteria"
  ],
  "acceptedCompromises": [
    "Honest bullet point describing unavoidable trade-offs or weaknesses compared to alternatives"
  ],
  "riskAndDownsideMitigation": "Analysis of the Monte Carlo risk and specific hedging tactics to protect against downside volatility.",
  "sensitivityAlert": "Interpretation of sensitivity thresholds and trigger points for re-evaluating the decision.",
  "phasedRoadmap": [
    { "phase": "Phase 1: Validation & Risk Containment (Days 1–30)", "action": "Specific tactical action" },
    { "phase": "Phase 2: Pilot Deployment & Metric Tracking (Days 31–90)", "action": "Specific tactical action" },
    { "phase": "Phase 3: Scale, Governance & Continuous Review (Day 90+)", "action": "Specific tactical action" }
  ]
}
`.trim();

  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const rawText = response?.text || '';
      // Clean potential JSON markdown code block formatting
      const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        ...parsed,
        source: 'Google Gemini AI',
        model,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      lastError = err;
      // Try next model if JSON parsing or quota issue
    }
  }

  throw new Error(`Failed to generate brief with Gemini: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Ask Google Gemini a strategic question about the decision model
 */
export async function askDecisionAssistantWithGemini({ decision, mcda, simulation, question }) {
  if (!isGeminiConfigured()) {
    throw new Error('Google Gemini API key is not configured.');
  }

  const ai = getGeminiClient();
  const winner = mcda?.rankedAlternatives?.[0];

  const prompt = `
You are the Stratagem AI Decision Intelligence Co-Pilot.
Assist the decision-maker with clear, rigorous, data-driven advice based on this mathematical decision model:

Decision: "${decision.title}"
Top Recommendation: "${winner?.name}" (TOPSIS Score: ${winner?.topsisScore}/100)
Alternatives: ${decision.alternatives.map(a => a.name).join(', ')}
Criteria: ${decision.criteria.map(c => `${c.name} (${c.type}, weight: ${Math.round(c.weight * 100)}%)`).join(', ')}

User Question: "${question}"

Provide a direct, concise, high-impact executive response (under 200 words). Use bullet points where appropriate for readability.
`.trim();

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return {
        answer: response.text?.trim() || 'No response generated.',
        model,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      if (model === CANDIDATE_MODELS[CANDIDATE_MODELS.length - 1]) {
        throw err;
      }
    }
  }
}
