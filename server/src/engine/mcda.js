/**
 * Multi-Criteria Decision Analysis (MCDA) Core
 * Implements TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)
 * and Weighted Sum Model (WSM) with Pareto Dominance detection.
 */

export function runMCDA(criteria, alternatives, customWeights = null) {
  if (!criteria || criteria.length === 0 || !alternatives || alternatives.length === 0) {
    throw new Error('Criteria and alternatives are required for MCDA evaluation');
  }

  // 1. Calculate and normalize criteria weights
  const totalRawWeight = criteria.reduce((sum, c) => {
    const w = (customWeights && customWeights[c.id] !== undefined) ? customWeights[c.id] : c.weight;
    return sum + Math.max(0, Number(w) || 0);
  }, 0);

  const normalizedWeights = {};
  criteria.forEach(c => {
    const raw = (customWeights && customWeights[c.id] !== undefined) ? customWeights[c.id] : c.weight;
    normalizedWeights[c.id] = totalRawWeight > 0 ? Math.max(0, Number(raw) || 0) / totalRawWeight : 1 / criteria.length;
  });

  // Extract score value helper
  const getVal = (alt, critId) => {
    const entry = alt.scores[critId];
    if (entry === undefined || entry === null) return 0;
    if (typeof entry === 'number') return entry;
    if (typeof entry === 'object' && typeof entry.value === 'number') return entry.value;
    return Number(entry) || 0;
  };

  // 2. Vector Normalization for TOPSIS
  // Calculate root sum of squares for each criterion: sqrt(sum(x_ij^2))
  const rss = {};
  criteria.forEach(c => {
    const sumSq = alternatives.reduce((acc, alt) => {
      const v = getVal(alt, c.id);
      return acc + (v * v);
    }, 0);
    rss[c.id] = Math.sqrt(sumSq) || 1e-9;
  });

  // Normalized and Weighted Normalized Matrix
  const weightedMatrix = {}; // altId -> { critId: weightedVal }
  alternatives.forEach(alt => {
    weightedMatrix[alt.id] = {};
    criteria.forEach(c => {
      const v = getVal(alt, c.id);
      const normalized = v / rss[c.id];
      weightedMatrix[alt.id][c.id] = normalized * normalizedWeights[c.id];
    });
  });

  // 3. Determine Ideal Positive (A+) and Ideal Negative (A-) Solutions
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
      // cost criterion: lower is better
      idealPositive[c.id] = minVal;
      idealNegative[c.id] = maxVal;
    }
  });

  // 4. Calculate Euclidean Separation Distances (S+ and S-) and Relative Closeness (C*)
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
    
    // Relative closeness (0 to 1) -> scaled to 0-100
    const topsisScore = denominator === 0 ? 50 : (dMinus / denominator) * 100;

    // Linear Min-Max normalized score for each criterion for transparent radar display
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

    // Weighted Sum Model (WSM) composite score
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

  // Sort by topsisScore descending
  scoredAlternatives.sort((a, b) => b.topsisScore - a.topsisScore);

  // Add ranks
  scoredAlternatives.forEach((alt, idx) => {
    alt.rank = idx + 1;
  });

  // 5. Pareto Dominance Check
  const paretoDominatedIds = new Set();
  for (let i = 0; i < alternatives.length; i++) {
    for (let j = 0; j < alternatives.length; j++) {
      if (i === j) continue;
      const altA = alternatives[i];
      const altB = alternatives[j];

      // Does altB strictly dominate altA?
      let bBetterOrEqualInAll = true;
      let bStrictlyBetterInAtLeastOne = false;

      for (const c of criteria) {
        const valA = getVal(altA, c.id);
        const valB = getVal(altB, c.id);
        const bIsBetter = c.type === 'benefit' ? valB > valA : valB < valA;
        const bIsWorse = c.type === 'benefit' ? valB < valA : valB > valA;

        if (bIsWorse) {
          bBetterOrEqualInAll = false;
          break;
        }
        if (bIsBetter) {
          bStrictlyBetterInAtLeastOne = true;
        }
      }

      if (bBetterOrEqualInAll && bStrictlyBetterInAtLeastOne) {
        paretoDominatedIds.add(altA.id);
      }
    }
  }

  scoredAlternatives.forEach(alt => {
    alt.isParetoOptimal = !paretoDominatedIds.has(alt.id);
  });

  return {
    rankedAlternatives: scoredAlternatives,
    normalizedWeights,
    idealPositive,
    idealNegative,
    topRecommendation: scoredAlternatives[0]
  };
}
