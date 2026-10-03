/**
 * Packaging Material Recommendation & Optimization Engine
 * Evaluates, ranks, and recommends optimal packaging materials for a given food commodity.
 * Based on PackSmart Master Specification Section 4.7 & 7.1
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { StorageCondition } from '../shared/types/analysis.js';
import { catalogRepository } from '../shared/catalog/index.js';
import { BarrierCalculator } from '../engine/barrier-calculator.js';
import { CompatibilityEngine } from '../engine/compatibility-engine.js';
import { ShelfLifeEngine } from '../engine/shelf-life-engine.js';
import { MaterialRecommendationMatch, RecommendationResponse } from './schemas.js';

export interface RecommendationOptions {
  commodity_id: string;
  storage_conditions?: Partial<StorageCondition>;
  prefer_sustainable?: boolean;
  max_cost_index?: number;
  limit?: number;
}

export class MaterialRanker {
  /**
   * Evaluates all catalog materials and returns ranked recommendations.
   */
  public static recommendMaterials(options: RecommendationOptions): RecommendationResponse {
    const commodity = catalogRepository.getCommodityById(options.commodity_id);
    if (!commodity) {
      throw new Error(`Commodity '${options.commodity_id}' not found in catalog.`);
    }

    const defaultStorage: StorageCondition = {
      temperature_c: commodity.recommended_storage_temp_c,
      relative_humidity_pct: commodity.recommended_storage_rh_pct,
      atmosphere: 'AIR',
      target_shelf_life_days: commodity.target_shelf_life_days,
      package_surface_area_dm2: 2.0,
      package_weight_grams: 250.0,
      ...options.storage_conditions
    };

    const allMaterials = catalogRepository.getAllMaterials();
    const evaluatedMatches: MaterialRecommendationMatch[] = [];

    for (const material of allMaterials) {
      // Cost index filter
      if (options.max_cost_index && material.relative_cost_index > options.max_cost_index) {
        continue;
      }

      const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(material);
      const compat = CompatibilityEngine.evaluate(commodity, material, defaultStorage);

      // Skip hard incompatibilities
      if (compat.status === 'INCOMPATIBLE') {
        continue;
      }

      const shelfLife = ShelfLifeEngine.predictShelfLife(commodity, material, defaultStorage, barrierMetrics);

      // Calculate matching score (0 - 100)
      let matchScore = 0.40 * compat.compatibility_score + 0.35 * shelfLife.shelf_life_score + 0.25 * (100 - (material.relative_cost_index - 1) * 20);

      const isSustainable = material.is_compostable || (material.recyclability_code >= 1 && material.recyclability_code <= 5);

      if (options.prefer_sustainable && isSustainable) {
        matchScore += 10;
      }

      matchScore = Math.min(100, Math.max(0, Math.round(matchScore)));

      // Generate suitability rationale & trade-offs
      const tradeOffs: string[] = [];
      let rationale = '';

      if (shelfLife.predicted_shelf_life_days >= defaultStorage.target_shelf_life_days) {
        rationale = `Meets target shelf-life (${shelfLife.predicted_shelf_life_days} days achieved) with high chemical inertness.`;
      } else {
        rationale = `Provides ${shelfLife.predicted_shelf_life_days} days shelf-life; suitable for shorter distribution cycles.`;
        tradeOffs.push('Shelf life is shorter than baseline target.');
      }

      if (material.relative_cost_index >= 3.5) {
        tradeOffs.push('Higher material cost index compared to standard polymers.');
      }

      if (material.is_compostable) {
        tradeOffs.push('Requires dry storage to avoid premature compostable bio-degradation.');
      }

      if (tradeOffs.length === 0) {
        tradeOffs.push('Balanced cost-to-barrier performance with standard municipal recyclability.');
      }

      evaluatedMatches.push({
        material,
        match_score: matchScore,
        predicted_shelf_life_days: shelfLife.predicted_shelf_life_days,
        suitability_rationale: rationale,
        trade_offs: tradeOffs,
        is_sustainable_alternative: isSustainable
      });
    }

    // Sort descending by match score
    evaluatedMatches.sort((a, b) => b.match_score - a.match_score);

    const limit = options.limit ?? 5;
    const topMatches = evaluatedMatches.slice(0, limit);
    const topPick = topMatches.length > 0 ? topMatches[0] : undefined;

    const aiSummary = topPick
      ? `Top recommended packaging for ${commodity.name} is ${topPick.material.name} (Match Score: ${topPick.match_score}/100, Predicted Shelf Life: ${topPick.predicted_shelf_life_days} days).`
      : `No compatible packaging materials matched the specified constraints for ${commodity.name}.`;

    return {
      commodity_id: commodity.commodity_id,
      commodity_name: commodity.name,
      target_shelf_life_days: defaultStorage.target_shelf_life_days,
      recommendations: topMatches,
      top_recommendation: topPick,
      ai_summary: aiSummary
    };
  }
}
