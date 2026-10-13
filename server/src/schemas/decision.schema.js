import { z } from 'zod';

export const criterionSchema = z.object({
  id: z.string().min(1, 'Criterion ID is required'),
  name: z.string().min(1, 'Criterion name is required').max(100),
  description: z.string().optional().default(''),
  type: z.enum(['benefit', 'cost'], {
    errorMap: () => ({ message: 'Criterion type must be benefit or cost' })
  }),
  weight: z.number().min(0, 'Weight must be non-negative').max(100),
  unit: z.string().optional().default('pts'),
  uncertaintyPct: z.number().min(0).max(100).optional().default(10)
});

export const alternativeScoreSchema = z.record(
  z.string(),
  z.union([
    z.number(),
    z.object({
      value: z.number(),
      min: z.number().optional(),
      max: z.number().optional()
    })
  ])
);

export const alternativeSchema = z.object({
  id: z.string().min(1, 'Alternative ID is required'),
  name: z.string().min(1, 'Alternative name is required').max(100),
  description: z.string().optional().default(''),
  scores: alternativeScoreSchema,
  pros: z.array(z.string()).optional().default([]),
  cons: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([])
});

export const simulationConfigSchema = z.object({
  iterations: z.number().int().min(100).max(10000).default(1000),
  confidenceLevel: z.number().min(50).max(99.9).default(95),
  distribution: z.enum(['gaussian', 'triangular', 'beta']).default('triangular')
});

export const createDecisionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().max(1000).optional().default(''),
  category: z.string().min(1).default('Strategic Technology'),
  tags: z.array(z.string()).optional().default([]),
  criteria: z.array(criterionSchema).min(1, 'At least 1 criterion is required'),
  alternatives: z.array(alternativeSchema).min(2, 'At least 2 alternatives are required for decision intelligence'),
  simulationConfig: simulationConfigSchema.optional().default({
    iterations: 1000,
    confidenceLevel: 95,
    distribution: 'triangular'
  })
});

export const updateDecisionSchema = createDecisionSchema.partial().extend({
  status: z.enum(['draft', 'evaluated', 'simulated', 'approved', 'archived']).optional(),
  decisionOutcome: z.object({
    selectedAlternativeId: z.string(),
    rationale: z.string().min(5, 'Rationale must be at least 5 characters'),
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
