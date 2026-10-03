import { describe, it, expect } from 'vitest';
import { HazardAssessmentEngine } from '../../src/engine/hazard-assessment-engine.js';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { StorageCondition } from '../../src/shared/types/analysis.js';

describe('Phase 3: HazardAssessmentEngine HACCP Safety Tests', () => {
  const defaultStorage: StorageCondition = {
    temperature_c: 25.0,
    relative_humidity_pct: 60.0,
    atmosphere: 'AIR',
    target_shelf_life_days: 180,
    package_surface_area_dm2: 2.0,
    package_weight_grams: 250.0
  };

  it('should flag MOSH/MOAH risk for recycled paperboard in direct food contact', () => {
    const flour = catalogRepository.getCommodityById('COMM-DRY-005')!;
    const paperboard = catalogRepository.getMaterialById('MAT-PPR-001')!; // SBS Paperboard
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(paperboard);

    const hazards = HazardAssessmentEngine.analyzeHazards(flour, paperboard, defaultStorage, barrierMetrics);
    const moshHazard = hazards.find(h => h.id === 'HAZ-CHEM-MOSH-MOAH');

    expect(moshHazard).toBeDefined();
    expect(moshHazard?.severity).toBe('HIGH');
  });

  it('should flag puncture risk for sharp frozen crustaceans in thin film', () => {
    const prawns = catalogRepository.getCommodityById('COMM-MEAT-005')!; // Frozen raw tiger prawns
    const ldpe = catalogRepository.getMaterialById('MAT-MONO-001')!; // Puncture resistance 0.8 J (< 1.0 J)
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(ldpe);

    const hazards = HazardAssessmentEngine.analyzeHazards(prawns, ldpe, defaultStorage, barrierMetrics);
    const punctureHazard = hazards.find(h => h.id === 'HAZ-PHYS-PUNCTURE');

    expect(punctureHazard).toBeDefined();
    expect(punctureHazard?.severity).toBe('HIGH');
  });

  it('should flag critical anaerobic fermentation hazard for fresh produce in airtight MAP without perforation', () => {
    const broccoli = catalogRepository.getCommodityById('COMM-PROD-008')!; // High respiration produce
    const foilLaminate = catalogRepository.getMaterialById('MAT-LAM-001')!; // OTR 0.01 (airtight)
    const mapStorage: StorageCondition = {
      ...defaultStorage,
      atmosphere: 'MAP_NITROGEN_FLUSH'
    };
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(foilLaminate);

    const hazards = HazardAssessmentEngine.analyzeHazards(broccoli, foilLaminate, mapStorage, barrierMetrics);
    const anaerobicHazard = hazards.find(h => h.id === 'HAZ-MICRO-ANAEROBIC');

    expect(anaerobicHazard).toBeDefined();
    expect(anaerobicHazard?.severity).toBe('CRITICAL');
  });
});
