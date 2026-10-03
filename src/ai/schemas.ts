/**
 * AI Advisory & Recommendation Output Schemas
 * Based on PackSmart Master Specification Section 4.7 & 7.1
 */

import { z } from 'zod';
import { PackagingMaterialSchema } from '../shared/schemas/material-schema.js';

export const AIAdvisorySchema = z.object({
  summary: z.string().min(1),
  optimization_suggestions: z.array(z.string()).min(1),
  safe_handling_tips: z.string().min(1),
  eco_alternatives: z.array(z.string()).optional(),
  is_fallback_mode: z.boolean().default(false)
});

export type AIAdvisoryOutput = z.infer<typeof AIAdvisorySchema>;

export const MaterialRecommendationMatchSchema = z.object({
  material: PackagingMaterialSchema,
  match_score: z.number().min(0).max(100),
  predicted_shelf_life_days: z.number().min(0),
  suitability_rationale: z.string().min(1),
  trade_offs: z.array(z.string()),
  is_sustainable_alternative: z.boolean()
});

export type MaterialRecommendationMatch = z.infer<typeof MaterialRecommendationMatchSchema>;

export const RecommendationResponseSchema = z.object({
  commodity_id: z.string(),
  commodity_name: z.string(),
  target_shelf_life_days: z.number(),
  recommendations: z.array(MaterialRecommendationMatchSchema),
  top_recommendation: MaterialRecommendationMatchSchema.optional(),
  ai_summary: z.string()
});

export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
