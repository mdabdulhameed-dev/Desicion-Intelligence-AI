import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { runMCDA } from '../engine/mcda.js';
import { runMonteCarloSimulation } from '../engine/monteCarlo.js';
import { runSensitivityAnalysis } from '../engine/sensitivity.js';
import { generateDecisionExplanation } from '../engine/explainableAi.js';
import { parse as csvParse } from 'csv-parse/sync';

export async function listDecisions(req, res, next) {
  try {
    const decisions = await db.findDecisionsByUser(req.user.id);
    return res.json({
      success: true,
      data: decisions
    });
  } catch (err) {
    next(err);
  }
}

export async function getDecisionById(req, res, next) {
  try {
    const { id } = req.params;
    const decision = await db.findDecisionById(id, req.user.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    // Run baseline MCDA to return immediate current rankings
    const mcdaResults = runMCDA(decision.criteria, decision.alternatives);
    const sensitivityResults = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const explanation = generateDecisionExplanation(decision, mcdaResults, null, sensitivityResults);

    return res.json({
      success: true,
      data: {
        ...decision,
        baselineAnalysis: {
          mcda: mcdaResults,
          sensitivity: sensitivityResults,
          explanation
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createDecision(req, res, next) {
  try {
    const payload = req.body;
    const newDecision = {
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
      simulationConfig: payload.simulationConfig || {
        iterations: 1000,
        confidenceLevel: 95,
        distribution: 'triangular'
      }
    };

    await db.createDecision(newDecision);

    return res.status(201).json({
      success: true,
      message: 'Decision created successfully',
      data: newDecision
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDecision(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await db.updateDecision(id, req.user.id, updates);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    return res.json({
      success: true,
      message: 'Decision updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDecision(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await db.deleteDecision(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    return res.json({
      success: true,
      message: 'Decision deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

export async function duplicateDecision(req, res, next) {
  try {
    const { id } = req.params;
    const original = await db.findDecisionById(id, req.user.id);

    if (!original) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

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

    return res.status(201).json({
      success: true,
      message: 'Decision duplicated successfully',
      data: cloned
    });
  } catch (err) {
    next(err);
  }
}

export async function runAnalysis(req, res, next) {
  try {
    const { id } = req.params;
    const { customWeights } = req.body || {};
    const decision = await db.findDecisionById(id, req.user.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    const mcda = runMCDA(decision.criteria, decision.alternatives, customWeights);
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const explanation = generateDecisionExplanation(decision, mcda, null, sensitivity);

    return res.json({
      success: true,
      data: {
        mcda,
        sensitivity,
        explanation
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function runSimulation(req, res, next) {
  try {
    const { id } = req.params;
    const { iterations, distribution, customWeights } = req.body || {};
    const decision = await db.findDecisionById(id, req.user.id);

    if (!decision) {
      return res.status(404).json({
        success: false,
        error: 'Decision not found'
      });
    }

    const mcda = runMCDA(decision.criteria, decision.alternatives, customWeights);
    const simulation = runMonteCarloSimulation(decision.criteria, decision.alternatives, {
      iterations: iterations || decision.simulationConfig?.iterations || 1500,
      distribution: distribution || decision.simulationConfig?.distribution || 'triangular',
      customWeights
    });
    const sensitivity = runSensitivityAnalysis(decision.criteria, decision.alternatives);
    const explanation = generateDecisionExplanation(decision, mcda, simulation, sensitivity);

    return res.json({
      success: true,
      data: {
        mcda,
        simulation,
        sensitivity,
        explanation
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function ingestData(req, res, next) {
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
      return res.status(400).json({
        success: false,
        error: 'Please provide CSV or JSON data parameter'
      });
    }

    let parsedAlternatives = [];
    let parsedCriteria = [];

    if (format === 'csv') {
      const records = csvParse(rawContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      if (records.length === 0) {
        return res.status(400).json({ success: false, error: 'CSV file is empty' });
      }

      // First column is alternative name / id
      const headers = Object.keys(records[0]);
      const nameCol = headers[0];
      const criteriaCols = headers.slice(1);

      parsedCriteria = criteriaCols.map((colName, idx) => {
        const lower = colName.toLowerCase();
        const isCost = lower.includes('cost') || lower.includes('price') || lower.includes('latency') || lower.includes('risk') || lower.includes('time') || lower.includes('capex') || lower.includes('opex') || lower.includes('downtime');
        let unit = 'pts';
        if (lower.includes('$') || lower.includes('cost') || lower.includes('price')) unit = '$';
        else if (lower.includes('ms') || lower.includes('latency')) unit = 'ms';
        else if (lower.includes('%')) unit = '%';
        else if (lower.includes('month') || lower.includes('time')) unit = 'mo';

        return {
          id: `crit-${idx + 1}`,
          name: colName,
          description: `Auto-ingested criterion: ${colName}`,
          type: isCost ? 'cost' : 'benefit',
          weight: Math.round(100 / criteriaCols.length),
          unit,
          uncertaintyPct: 12
        };
      });

      parsedAlternatives = records.map((row, idx) => {
        const scores = {};
        parsedCriteria.forEach((crit, critIdx) => {
          const colName = criteriaCols[critIdx];
          const valStr = String(row[colName] || '0').replace(/[^0-9.-]/g, '');
          scores[crit.id] = Number(valStr) || 0;
        });

        return {
          id: `alt-${idx + 1}`,
          name: row[nameCol] || `Alternative ${idx + 1}`,
          description: `Ingested entity: ${row[nameCol]}`,
          scores,
          pros: [],
          cons: [],
          tags: ['Ingested']
        };
      });
    } else {
      // JSON format
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        // array of alternatives with attributes
        const sample = parsed[0] || {};
        const keys = Object.keys(sample).filter(k => k !== 'name' && k !== 'id' && k !== 'description');
        parsedCriteria = keys.map((k, idx) => ({
          id: `crit-${idx + 1}`,
          name: k.charAt(0).toUpperCase() + k.slice(1),
          description: `Ingested parameter: ${k}`,
          type: (k.toLowerCase().includes('cost') || k.toLowerCase().includes('latency')) ? 'cost' : 'benefit',
          weight: Math.round(100 / keys.length),
          unit: 'pts',
          uncertaintyPct: 10
        }));

        parsedAlternatives = parsed.map((item, idx) => {
          const scores = {};
          parsedCriteria.forEach(c => {
            scores[c.id] = Number(item[c.name.toLowerCase()] ?? item[c.name] ?? 0);
          });
          return {
            id: `alt-${idx + 1}`,
            name: item.name || `Alternative ${idx + 1}`,
            description: item.description || '',
            scores,
            pros: [],
            cons: [],
            tags: ['Ingested']
          };
        });
      } else if (parsed.criteria && parsed.alternatives) {
        parsedCriteria = parsed.criteria;
        parsedAlternatives = parsed.alternatives;
      }
    }

    return res.json({
      success: true,
      message: `Successfully ingested ${parsedAlternatives.length} alternatives across ${parsedCriteria.length} decision parameters`,
      data: {
        criteria: parsedCriteria,
        alternatives: parsedAlternatives
      }
    });
  } catch (err) {
    next(err);
  }
}
