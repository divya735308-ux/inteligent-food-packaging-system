import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIService } from '../../src/ai/ai-service.js';
import { AIAdvisorySchema } from '../../src/ai/schemas.js';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { StorageCondition } from '../../src/shared/types/analysis.js';

describe('Phase 4: AIService Zero-Secret & Fallback Tests', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey) {
      process.env.GEMINI_API_KEY = originalApiKey;
    }
  });

  const defaultStorage: StorageCondition = {
    temperature_c: 25.0,
    relative_humidity_pct: 60.0,
    atmosphere: 'AIR',
    target_shelf_life_days: 180,
    package_surface_area_dm2: 2.0,
    package_weight_grams: 250.0
  };

  it('should seamlessly execute heuristic fallback when GEMINI_API_KEY is not set', async () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!;
    const retortFoil = catalogRepository.getMaterialById('MAT-LAM-001')!;
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(retortFoil);

    const advisory = await AIService.generateAdvisory(
      milkPowder,
      retortFoil,
      defaultStorage,
      barrierMetrics,
      [],
      90,
      365
    );

    expect(advisory).toBeDefined();
    expect(advisory.is_fallback_mode).toBe(true);
    expect(advisory.summary.length).toBeGreaterThan(0);
    expect(advisory.optimization_suggestions.length).toBeGreaterThan(0);

    const parsed = AIAdvisorySchema.safeParse(advisory);
    expect(parsed.success).toBe(true);
  });
});
