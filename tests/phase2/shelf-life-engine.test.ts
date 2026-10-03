import { describe, it, expect } from 'vitest';
import { ShelfLifeEngine } from '../../src/engine/shelf-life-engine.js';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { StorageCondition } from '../../src/shared/types/analysis.js';

describe('Phase 2: ShelfLifeEngine Kinetic & Math Modeling Tests', () => {
  it('should predict shortened shelf life and moisture failure for potato chips in high WVTR film', () => {
    const potatoChips = catalogRepository.getCommodityById('COMM-BAKE-001')!; // 180 target days
    const ldpe = catalogRepository.getMaterialById('MAT-MONO-001')!; // WVTR = 18.0

    const ambientStorage: StorageCondition = {
      temperature_c: 25.0,
      relative_humidity_pct: 60.0,
      atmosphere: 'AIR',
      target_shelf_life_days: 180,
      package_surface_area_dm2: 2.0,
      package_weight_grams: 150.0
    };

    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(ldpe);
    const prediction = ShelfLifeEngine.predictShelfLife(potatoChips, ldpe, ambientStorage, barrierMetrics);

    // Potato chips will get soggy in LDPE in under 30 days
    expect(prediction.predicted_shelf_life_days).toBeLessThan(60);
    expect(prediction.moisture_predicted_days).toBeLessThan(30);
    expect(prediction.shelf_life_score).toBeLessThan(50);
  });

  it('should predict extended shelf life exceeding target for potato chips in metallized barrier film', () => {
    const potatoChips = catalogRepository.getCommodityById('COMM-BAKE-001')!; // Target 180 days
    const snackLaminate = catalogRepository.getMaterialById('MAT-LAM-002')!; // Met-BOPP WVTR = 0.8

    const mapStorage: StorageCondition = {
      temperature_c: 25.0,
      relative_humidity_pct: 55.0,
      atmosphere: 'MAP_NITROGEN_FLUSH',
      map_gas_ratio: { o2_pct: 0.5, co2_pct: 0.0, n2_pct: 99.5 },
      target_shelf_life_days: 180,
      package_surface_area_dm2: 2.0,
      package_weight_grams: 150.0
    };

    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(snackLaminate);
    const prediction = ShelfLifeEngine.predictShelfLife(potatoChips, snackLaminate, mapStorage, barrierMetrics);

    expect(prediction.predicted_shelf_life_days).toBeGreaterThanOrEqual(180);
    expect(prediction.shelf_life_score).toBe(100);
    expect(prediction.degradation_timeline.length).toBeGreaterThan(5);
  });

  it('should reflect Arrhenius temperature acceleration (lower shelf life at 40°C ASLT vs 20°C)', () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!;
    const standupPouch = catalogRepository.getMaterialById('MAT-LAM-008')!; // PET/PE
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(standupPouch);

    const normalStorage: StorageCondition = {
      temperature_c: 20.0,
      relative_humidity_pct: 50.0,
      atmosphere: 'AIR',
      target_shelf_life_days: 365,
      package_surface_area_dm2: 2.0,
      package_weight_grams: 250.0
    };

    const acceleratedStorage: StorageCondition = {
      ...normalStorage,
      temperature_c: 40.0,
      relative_humidity_pct: 75.0
    };

    const normalPred = ShelfLifeEngine.predictShelfLife(milkPowder, standupPouch, normalStorage, barrierMetrics);
    const accelPred = ShelfLifeEngine.predictShelfLife(milkPowder, standupPouch, acceleratedStorage, barrierMetrics);

    expect(accelPred.predicted_shelf_life_days).toBeLessThan(normalPred.predicted_shelf_life_days);
  });

  it('should calculate degradation timeline points with decreasing quality retention', () => {
    const produce = catalogRepository.getCommodityById('COMM-PROD-001')!; // Strawberries
    const bioFilm = catalogRepository.getMaterialById('MAT-BIO-001')!;
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(bioFilm);

    const coldStorage: StorageCondition = {
      temperature_c: 2.0,
      relative_humidity_pct: 90.0,
      atmosphere: 'AIR',
      target_shelf_life_days: 7,
      package_surface_area_dm2: 1.5,
      package_weight_grams: 250.0
    };

    const prediction = ShelfLifeEngine.predictShelfLife(produce, bioFilm, coldStorage, barrierMetrics);

    expect(prediction.degradation_timeline.length).toBeGreaterThan(0);
    const firstPoint = prediction.degradation_timeline[0];
    const lastPoint = prediction.degradation_timeline[prediction.degradation_timeline.length - 1];

    expect(firstPoint.quality_retention_pct).toBe(100);
    expect(lastPoint.quality_retention_pct).toBeLessThan(firstPoint.quality_retention_pct);
  });
});
