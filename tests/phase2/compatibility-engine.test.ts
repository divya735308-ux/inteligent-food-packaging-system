import { describe, it, expect } from 'vitest';
import { CompatibilityEngine } from '../../src/engine/compatibility-engine.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { StorageCondition } from '../../src/shared/types/analysis.js';

describe('Phase 2: CompatibilityEngine Tests', () => {
  const ambientStorage: StorageCondition = {
    temperature_c: 25.0,
    relative_humidity_pct: 60.0,
    atmosphere: 'AIR',
    target_shelf_life_days: 180,
    package_surface_area_dm2: 2.0,
    package_weight_grams: 250.0
  };

  it('should flag CRITICAL incompatibility for high acid food in raw bare metal', () => {
    const tomatoPaste = catalogRepository.getCommodityById('COMM-RTE-002')!; // pH 3.9
    const bareTin = catalogRepository.getMaterialById('MAT-MET-001')!; // Bare Uncoated Tinplate

    const result = CompatibilityEngine.evaluate(tomatoPaste, bareTin, ambientStorage);

    expect(result.status).toBe('INCOMPATIBLE');
    expect(result.compatibility_score).toBeLessThan(70);
    const acidWarning = result.warnings.find(w => w.id === 'WARN-ACID-CORROSION');
    expect(acidWarning).toBeDefined();
    expect(acidWarning?.severity).toBe('CRITICAL');
  });

  it('should PASS high acid food in internal lacquered tinplate can', () => {
    const tomatoPaste = catalogRepository.getCommodityById('COMM-RTE-002')!; // pH 3.9
    const lacqueredCan = catalogRepository.getMaterialById('MAT-MET-002')!; // Lacquered ETP Can

    const result = CompatibilityEngine.evaluate(tomatoPaste, lacqueredCan, ambientStorage);

    const acidWarning = result.warnings.find(w => w.id === 'WARN-ACID-CORROSION');
    expect(acidWarning).toBeUndefined();
    expect(result.compatibility_score).toBeGreaterThanOrEqual(90);
  });

  it('should flag HIGH warning for high lipid food in non-polar thin LDPE film', () => {
    const potatoChips = catalogRepository.getCommodityById('COMM-BAKE-001')!; // 35% fat
    const ldpe = catalogRepository.getMaterialById('MAT-MONO-001')!; // LDPE film (kit 3)

    const result = CompatibilityEngine.evaluate(potatoChips, ldpe, ambientStorage);

    const lipidWarning = result.warnings.find(w => w.id === 'WARN-LIPID-GREASE');
    expect(lipidWarning).toBeDefined();
    expect(lipidWarning?.severity).toBe('HIGH');
  });

  it('should flag CRITICAL/HIGH warning for dry hygroscopic food in high WVTR packaging', () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!; // aw 0.20
    const ldpe = catalogRepository.getMaterialById('MAT-MONO-001')!; // WVTR 18.0

    const result = CompatibilityEngine.evaluate(milkPowder, ldpe, ambientStorage);

    const moistureWarning = result.warnings.find(w => w.id === 'WARN-MOISTURE-GAIN');
    expect(moistureWarning).toBeDefined();
    expect(moistureWarning?.severity).toBe('CRITICAL');
  });

  it('should flag HIGH warning for light-sensitive oil in clear packaging', () => {
    const oliveOil = catalogRepository.getCommodityById('COMM-OIL-001')!; // Critical light sensitivity
    const clearGlass = catalogRepository.getMaterialById('MAT-GLS-001')!; // Clear flint glass (91% transmittance)

    const result = CompatibilityEngine.evaluate(oliveOil, clearGlass, ambientStorage);

    const lightWarning = result.warnings.find(w => w.id === 'WARN-LIGHT-DEGRADATION');
    expect(lightWarning).toBeDefined();
    expect(lightWarning?.severity).toBe('HIGH');
  });

  it('should PASS light-sensitive oil in amber UV-blocking glass', () => {
    const oliveOil = catalogRepository.getCommodityById('COMM-OIL-001')!; // Critical light sensitivity
    const amberGlass = catalogRepository.getMaterialById('MAT-GLS-002')!; // Amber glass (2.5% transmittance)

    const result = CompatibilityEngine.evaluate(oliveOil, amberGlass, ambientStorage);

    const lightWarning = result.warnings.find(w => w.id === 'WARN-LIGHT-DEGRADATION');
    expect(lightWarning).toBeUndefined();
    expect(result.status).toBe('OPTIMAL');
  });

  it('should flag CRITICAL warning if thermal processing temperature exceeds material max temperature', () => {
    const retortMeal = catalogRepository.getCommodityById('COMM-RTE-001')!;
    const ldpe = catalogRepository.getMaterialById('MAT-MONO-001')!; // Max temp 80°C

    const retortStorage: StorageCondition = {
      ...ambientStorage,
      temperature_c: 121.0 // Retort autoclave temperature
    };

    const result = CompatibilityEngine.evaluate(retortMeal, ldpe, retortStorage);

    const thermalWarning = result.warnings.find(w => w.id === 'WARN-THERMAL-OVERHEAT');
    expect(thermalWarning).toBeDefined();
    expect(thermalWarning?.severity).toBe('CRITICAL');
    expect(result.status).toBe('INCOMPATIBLE');
  });
});
