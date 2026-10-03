import { describe, it, expect } from 'vitest';
import { HeuristicRecommender } from '../../src/ai/heuristic-recommender.js';
import { AIAdvisorySchema } from '../../src/ai/schemas.js';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { StorageCondition } from '../../src/shared/types/analysis.js';

describe('Phase 4: HeuristicRecommender Tests', () => {
  const defaultStorage: StorageCondition = {
    temperature_c: 25.0,
    relative_humidity_pct: 60.0,
    atmosphere: 'MAP_NITROGEN_FLUSH',
    map_gas_ratio: { o2_pct: 0.5, co2_pct: 0.0, n2_pct: 99.5 },
    target_shelf_life_days: 180,
    package_surface_area_dm2: 2.0,
    package_weight_grams: 250.0
  };

  it('should generate schema-compliant advisory output for multi-layer laminates', () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!;
    const retortFoil = catalogRepository.getMaterialById('MAT-LAM-001')!;
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(retortFoil);

    const advisory = HeuristicRecommender.generateAdvisory(
      milkPowder,
      retortFoil,
      defaultStorage,
      barrierMetrics,
      [],
      85,
      365
    );

    const parsed = AIAdvisorySchema.safeParse(advisory);
    expect(parsed.success).toBe(true);
    expect(advisory.is_fallback_mode).toBe(true);
    expect(advisory.summary).toContain('predicted shelf life');
    expect(advisory.optimization_suggestions.length).toBeGreaterThan(0);
    expect(advisory.safe_handling_tips.length).toBeGreaterThan(0);
  });

  it('should suggest sustainable mono-material alternatives for non-recyclable multi-layer pouches', () => {
    const potatoChips = catalogRepository.getCommodityById('COMM-BAKE-001')!;
    const coffeeFoil = catalogRepository.getMaterialById('MAT-LAM-007')!; // Multi-material code 0
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(coffeeFoil);

    const advisory = HeuristicRecommender.generateAdvisory(
      potatoChips,
      coffeeFoil,
      defaultStorage,
      barrierMetrics,
      [],
      78,
      270
    );

    expect(advisory.eco_alternatives?.some(alt => alt.toLowerCase().includes('mono-material') || alt.toLowerCase().includes('compostable'))).toBe(true);
  });

  it('should provide specific down-gauging suggestions for thick sealant layers (>50um)', () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!;
    const foilPouch = catalogRepository.getMaterialById('MAT-LAM-001')!; // 84um Cast PP sealant
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(foilPouch);

    const advisory = HeuristicRecommender.generateAdvisory(
      milkPowder,
      foilPouch,
      defaultStorage,
      barrierMetrics,
      [],
      85,
      365
    );

    expect(advisory.optimization_suggestions.some(s => s.toLowerCase().includes('down-gauge'))).toBe(true);
  });
});
