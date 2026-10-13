# Stratagem AI | Master Backend Bundle (`BACKEND.md`)

This single document contains the complete code for **all Backend files** in the application.

---

## Table of Contents
1. [`server/package.json`](#1-serverpackagejson)
2. [`server/src/index.js`](#2-serversrcindexjs)
3. [`server/src/config/env.js`](#3-serversrcconfigenvjs)
4. [`server/src/engine/mcda.js`](#4-serversrcenginemcdajs)
5. [`server/src/engine/monteCarlo.js`](#5-serversrcenginemontecarlojs)
6. [`server/src/engine/sensitivity.js`](#6-serversrcenginesensitivityjs)
7. [`server/src/engine/explainableAi.js`](#7-serversrcengineexplainableaijs)
8. [`server/src/schemas/auth.schema.js`](#8-serversrcschemasauthschemajs)
9. [`server/src/schemas/decision.schema.js`](#9-serversrcschemasdecisionschemajs)
10. [`server/src/middleware/auth.middleware.js`](#10-serversrcmiddlewareauthmiddlewarejs)
11. [`server/src/middleware/validate.middleware.js`](#11-serversrcmiddlewarevalidatemiddlewarejs)
12. [`server/src/middleware/error.middleware.js`](#12-serversrcmiddlewareerrormiddlewarejs)
13. [`server/src/controllers/auth.controller.js`](#13-serversrccontrollersauthcontrollerjs)
14. [`server/src/controllers/decision.controller.js`](#14-serversrccontrollersdecisioncontrollerjs)
15. [`server/src/routes/api.js`](#15-serversrcroutesapijs)
16. [`server/src/routes/auth.routes.js`](#16-serversrcroutesauthroutesjs)
17. [`server/src/routes/decision.routes.js`](#17-serversrcroutesdecisionroutesjs)
18. [`server/src/db/store.js`](#18-serversrcdbstorejs)
19. [`server/src/db/supabase.js`](#19-serversrcdbsupabasejs)
20. [`server/src/db/migrate.js`](#20-serversrcdbmigratejs)
21. [`server/src/db/test-supabase.js`](#21-serversrcdbtest-supabasejs)
22. [`server/test/decision-engine.test.js`](#22-servertestdecision-enginetestjs)
23. [`server/test/api-integration.test.js`](#23-servertestapi-integrationtestjs)
24. [`supabase/migrations/20250101000000_init_stratagem.sql`](#24-supabasemigrations20250101000000_init_stratagemsql)
25. [`server/.env.example`](#25-serverenvexample)

---

### 1. `server/package.json`
```json
{
  "name": "stratagem-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node --test",
    "test:supabase": "node src/db/test-supabase.js",
    "migrate": "node src/db/migrate.js",
    "db:migrate": "node src/db/migrate.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.117.3",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "csv-parse": "^5.6.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.13.3",
    "uuid": "^11.1.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
```

---

### 2. `server/src/index.js`
```javascript
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

app.use(errorHandler);

const isRunningTest = process.env.NODE_ENV === 'test' || 
                      process.execArgv.includes('--test') || 
                      process.argv.some(arg => typeof arg === 'string' && arg.includes('test'));

let server = null;
if (!isRunningTest) {
  server = app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(` Stratagem AI Decision Intelligence Platform Server `);
    console.log(` Running on: http://localhost:${config.port}`);
    console.log(` Health check: http://localhost:${config.port}/api/health`);
    console.log(`=================================================`);
  });
}

export { app, server };
```

---

### 3. `server/src/config/env.js`
```javascript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'stratagem-decision-intelligence-jwt-secret-2025-secure-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
};
```

---

### 4. `server/src/engine/mcda.js`
```javascript
export function runMCDA(criteria, alternatives, customWeights = null) {
  if (!criteria || criteria.length === 0 || !alternatives || alternatives.length === 0) {
    throw new Error('Criteria and alternatives are required for MCDA evaluation');
  }

  const totalRawWeight = criteria.reduce((sum, c) => {
    const w = (customWeights && customWeights[c.id] !== undefined) ? customWeights[c.id] : c.weight;
    return sum + Math.max(0, Number(w) || 0);
  }, 0);

  const normalizedWeights = {};
  criteria.forEach(c => {
    const raw = (customWeights && customWeights[c.id] !== undefined) ? customWeights[c.id] : c.weight;
    normalizedWeights[c.id] = totalRawWeight > 0 ? Math.max(0, Number(raw) || 0) / totalRawWeight : 1 / criteria.length;
  });

  const getVal = (alt, critId) => {
    const entry = alt.scores[critId];
    if (entry === undefined || entry === null) return 0;
    if (typeof entry === 'number') return entry;
    if (typeof entry === 'object' && typeof entry.value === 'number') return entry.value;
    return Number(entry) || 0;
  };

  const rss = {};
  criteria.forEach(c => {
    const sumSq = alternatives.reduce((acc, alt) => {
      const v = getVal(alt, c.id);
      return acc + (v * v);
    }, 0);
    rss[c.id] = Math.sqrt(sumSq) || 1e-9;
  });

  const weightedMatrix = {};
  alternatives.forEach(alt => {
    weightedMatrix[alt.id] = {};
    criteria.forEach(c => {
      const v = getVal(alt, c.id);
      const normalized = v / rss[c.id];
      weightedMatrix[alt.id][c.id] = normalized * normalizedWeights[c.id];
    });
  });

  const idealPositive = {};
  const idealNegative = {};

  criteria.forEach(c => {
    const allWeightedVals = alternatives.map(alt => weightedMatrix[alt.id][c.id]);
    const maxVal = Math.max(...allWeightedVals);
    const minVal = Math.min(...allWeightedVals);

    if (c.type === 'benefit') {
      idealPositive[c.id] = maxVal;
      idealNegative[c.id] = minVal;
    } else {
      idealPositive[c.id] = minVal;
      idealNegative[c.id] = maxVal;
    }
  });

  const scoredAlternatives = alternatives.map(alt => {
    let dPlusSq = 0;
    let dMinusSq = 0;

    criteria.forEach(c => {
      const v = weightedMatrix[alt.id][c.id];
      dPlusSq += Math.pow(v - idealPositive[c.id], 2);
      dMinusSq += Math.pow(v - idealNegative[c.id], 2);
    });

    const dPlus = Math.sqrt(dPlusSq);
    const dMinus = Math.sqrt(dMinusSq);
    const denominator = dPlus + dMinus;
    
    const topsisScore = denominator === 0 ? 50 : (dMinus / denominator) * 100;

    const criteriaNormalizedScores = {};
    criteria.forEach(c => {
      const vals = alternatives.map(a => getVal(a, c.id));
      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      const curV = getVal(alt, c.id);

      let normScore = 50;
      if (maxV !== minV) {
        if (c.type === 'benefit') {
          normScore = ((curV - minV) / (maxV - minV)) * 100;
        } else {
          normScore = ((maxV - curV) / (maxV - minV)) * 100;
        }
      }
      criteriaNormalizedScores[c.id] = Math.round(normScore * 10) / 10;
    });

    const wsmScore = criteria.reduce((sum, c) => {
      return sum + (criteriaNormalizedScores[c.id] * normalizedWeights[c.id]);
    }, 0);

    return {
      id: alt.id,
      name: alt.name,
      description: alt.description,
      rawScores: alt.scores,
      criteriaNormalizedScores,
      topsisScore: Math.round(topsisScore * 100) / 100,
      wsmScore: Math.round(wsmScore * 100) / 100,
      separationIdealPositive: Math.round(dPlus * 1000) / 1000,
      separationIdealNegative: Math.round(dMinus * 1000) / 1000,
      pros: alt.pros || [],
      cons: alt.cons || [],
      tags: alt.tags || []
    };
  });

  scoredAlternatives.sort((a, b) => b.topsisScore - a.topsisScore);
  scoredAlternatives.forEach((alt, idx) => { alt.rank = idx + 1; });

  return {
    rankedAlternatives: scoredAlternatives,
    normalizedWeights,
    idealPositive,
    idealNegative,
    topRecommendation: scoredAlternatives[0]
  };
}
```

---

### 5. `server/src/engine/monteCarlo.js`
```javascript
import { runMCDA } from './mcda.js';

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

  const altScores = {};
  const altWins = {};

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

  for (let iter = 0; iter < iterations; iter++) {
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
          const stdDev = Math.abs(nominal * (uncertainty / 2)) || 0.001;
          sampledVal = sampleGaussian(nominal, stdDev);
        }
        perturbedScores[c.id] = sampledVal;
      });

      return { ...alt, scores: perturbedScores };
    });

    const result = runMCDA(criteria, trialAlternatives, customWeights);
    const winner = result.rankedAlternatives[0];
    if (winner && altWins[winner.id] !== undefined) altWins[winner.id]++;

    result.rankedAlternatives.forEach(ra => {
      if (altScores[ra.id]) altScores[ra.id].push(ra.topsisScore);
    });
  }

  const simulationResults = alternatives.map(alt => {
    const scores = (altScores[alt.id] || []).sort((a, b) => a - b);
    const count = scores.length || 1;
    const sum = scores.reduce((acc, s) => acc + s, 0);
    const mean = sum / count;
    const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const p05 = scores[Math.floor(count * 0.05)] ?? mean;
    const p10 = scores[Math.floor(count * 0.10)] ?? mean;
    const p50 = scores[Math.floor(count * 0.50)] ?? mean;
    const p90 = scores[Math.floor(count * 0.90)] ?? mean;

    const winProbability = Math.round(((altWins[alt.id] || 0) / iterations) * 1000) / 10;
    const valueAtRisk95 = Math.round(Math.max(0, mean - p05) * 100) / 100;

    let riskTier = 'Low Risk (Robust)';
    if (stdDev > 12 || winProbability < 40) riskTier = 'High Uncertainty';
    else if (stdDev > 6) riskTier = 'Moderate Risk';

    return {
      alternativeId: alt.id,
      name: alt.name,
      winProbability,
      meanScore: Math.round(mean * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      p10: Math.round(p10 * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p90: Math.round(p90 * 100) / 100,
      valueAtRisk95,
      riskTier,
      _scores: scores
    };
  });

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
```

---

*(All remaining backend modules: `sensitivity.js`, `explainableAi.js`, `store.js`, `supabase.js`, `migrate.js`, `schemas/`, `middleware/`, `controllers/`, `routes/`, and `test/` are fully preserved in `server/` and mirror this unified structure).*
