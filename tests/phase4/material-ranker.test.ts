import { describe, it, expect } from 'vitest';
import { MaterialRanker } from '../../src/ai/material-ranker.js';
import { RecommendationResponseSchema } from '../../src/ai/schemas.js';

describe('Phase 4: MaterialRanker Recommendation Engine Tests', () => {
  it('should rank top barrier materials for fried Potato Chips', () => {
    const response = MaterialRanker.recommendMaterials({
      commodity_id: 'COMM-BAKE-001', // Potato chips
      limit: 5
    });

    const parsed = RecommendationResponseSchema.safeParse(response);
    expect(parsed.success).toBe(true);

    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.top_recommendation).toBeDefined();

    // Top recommendation should have high match score (> 70) and positive predicted shelf life
    expect(response.top_recommendation?.match_score).toBeGreaterThan(70);
    expect(response.top_recommendation?.predicted_shelf_life_days).toBeGreaterThan(60);

    // Bare metal cans or unlaminated paper should not be the top pick for potato chips
    expect(response.top_recommendation?.material.material_id).not.toBe('MAT-MET-001');
    expect(response.top_recommendation?.material.material_id).not.toBe('MAT-PPR-002');
  });

  it('should prioritize sustainable and recyclable options when prefer_sustainable is enabled', () => {
    const response = MaterialRanker.recommendMaterials({
      commodity_id: 'COMM-PROD-001', // Strawberries
      prefer_sustainable: true,
      limit: 5
    });

    expect(response.recommendations.length).toBeGreaterThan(0);
    const sustainablePicks = response.recommendations.filter(r => r.is_sustainable_alternative);
    expect(sustainablePicks.length).toBeGreaterThan(0);
  });

  it('should filter materials by max_cost_index', () => {
    const maxCost = 2.0;
    const response = MaterialRanker.recommendMaterials({
      commodity_id: 'COMM-DAIRY-001',
      max_cost_index: maxCost,
      limit: 10
    });

    for (const match of response.recommendations) {
      expect(match.material.relative_cost_index).toBeLessThanOrEqual(maxCost);
    }
  });
});
