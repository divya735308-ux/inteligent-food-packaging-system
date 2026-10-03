import { describe, it, expect } from 'vitest';
import { PromptTemplates } from '../../src/ai/prompts.js';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { StorageCondition } from '../../src/shared/types/analysis.js';

describe('Phase 4: PromptTemplates Engineering Tests', () => {
  it('should construct rich, structured prompt including commodity, material, and warnings', () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!;
    const retortFoil = catalogRepository.getMaterialById('MAT-LAM-001')!;
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(retortFoil);

    const storage: StorageCondition = {
      temperature_c: 25.0,
      relative_humidity_pct: 60.0,
      atmosphere: 'MAP_NITROGEN_FLUSH',
      target_shelf_life_days: 365,
      package_surface_area_dm2: 2.0,
      package_weight_grams: 500.0
    };

    const prompt = PromptTemplates.buildAdvisoryPrompt(
      milkPowder,
      retortFoil,
      storage,
      barrierMetrics,
      [],
      88.5,
      365
    );

    expect(prompt).toContain('Whole Milk Powder (Full Cream)');
    expect(prompt).toContain('3-Ply High Retort Pouch');
    expect(prompt).toContain('MAP_NITROGEN_FLUSH');
    expect(prompt).toContain('optimization_suggestions');
    expect(prompt).toContain('safe_handling_tips');
    expect(prompt).toContain('eco_alternatives');
  });
});
