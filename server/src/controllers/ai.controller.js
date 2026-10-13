import {
  isGeminiConfigured,
  testGeminiConnection,
  saveGeminiApiKey,
  generateExecutiveBriefWithGemini,
  askDecisionAssistantWithGemini
} from '../services/gemini.service.js';
import * as db from '../db/store.js';
import { runMCDA } from '../engine/mcda.js';
import { runMonteCarloSimulation } from '../engine/monteCarlo.js';
import { runSensitivityAnalysis } from '../engine/sensitivity.js';

export async function getAiStatus(req, res, next) {
  try {
    const configured = isGeminiConfigured();
    return res.json({
      success: true,
      data: {
        provider: 'Google Gemini',
        configured,
        models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
        message: configured
          ? 'Google Gemini AI is connected and active.'
          : 'Google Gemini API key not configured. Add GEMINI_API_KEY in server/.env or save via the API.'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function testKey(req, res, next) {
  try {
    const { apiKey } = req.body || {};
    const result = await testGeminiConnection(apiKey);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function saveKey(req, res, next) {
  try {
    const { apiKey } = req.body || {};
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'apiKey is required.'
      });
    }

    const result = await saveGeminiApiKey(apiKey);
    return res.json({
      success: true,
      message: 'Gemini API key saved and verified successfully.',
      data: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

export async function generateGeminiBrief(req, res, next) {
  try {
    const { id } = req.params;
    const decision = await db.findDecisionById(id, req.user?.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Google Gemini API key is not configured. Add GEMINI_API_KEY to server/.env or save it in settings.',
        code: 'GEMINI_KEY_MISSING'
      });
    }

    const mcda = runMCDA(decision.criteria, decision.alternatives);
    const simulation = runMonteCarloSimulation(decision.criteria, decision.alternatives, {
      iterations: 1500,
      distribution: 'triangular'
    });
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);

    const brief = await generateExecutiveBriefWithGemini({
      decision,
      mcda,
      simulation,
      sensitivity
    });

    return res.json({
      success: true,
      data: brief
    });
  } catch (err) {
    next(err);
  }
}

export async function askDecisionAssistant(req, res, next) {
  try {
    const { id } = req.params;
    const { question } = req.body || {};

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A question string is required.'
      });
    }

    const decision = await db.findDecisionById(id, req.user?.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    if (!isGeminiConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Google Gemini API key is not configured. Add GEMINI_API_KEY to server/.env.',
        code: 'GEMINI_KEY_MISSING'
      });
    }

    const mcda = runMCDA(decision.criteria, decision.alternatives);
    const answer = await askDecisionAssistantWithGemini({
      decision,
      mcda,
      question
    });

    return res.json({
      success: true,
      data: answer
    });
  } catch (err) {
    next(err);
  }
}
