import { describe, it, expect } from 'vitest';
import { RegulatoryEngine } from '../../src/engine/regulatory-engine.js';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';

describe('Phase 3: RegulatoryEngine & Simulant Matching Tests', () => {
  it('should match Simulant B (3% Acetic Acid) for acidic foods with pH < 4.5', () => {
    const tomatoPaste = catalogRepository.getCommodityById('COMM-RTE-002')!; // pH 3.9
    const mapping = RegulatoryEngine.determineFoodSimulant(tomatoPaste);

    expect(mapping.simulant).toBe('SIMULANT_B');
    expect(mapping.description).toContain('Acetic Acid');
  });

  it('should match Simulant D2 (Vegetable Oil) for high fat foods (> 20% fat)', () => {
    const potatoChips = catalogRepository.getCommodityById('COMM-BAKE-001')!; // 35% fat
    const mapping = RegulatoryEngine.determineFoodSimulant(potatoChips);

    expect(mapping.simulant).toBe('SIMULANT_D2');
    expect(mapping.description).toContain('Vegetable Oil');
  });

  it('should match Simulant D1 (50% Ethanol) for dairy products with fat > 3%', () => {
    const cheese = catalogRepository.getCommodityById('COMM-DAIRY-003')!; // Cheddar cheese
    const mapping = RegulatoryEngine.determineFoodSimulant(cheese);

    expect(mapping.simulant).toBe('SIMULANT_D1');
    expect(mapping.description).toContain('50% (v/v) Ethanol');
  });

  it('should match Simulant E (Tenax) for dry granular foods with low aw', () => {
    const flour = catalogRepository.getCommodityById('COMM-DRY-005')!; // Wheat flour
    const mapping = RegulatoryEngine.determineFoodSimulant(flour);

    expect(mapping.simulant).toBe('SIMULANT_E');
    expect(mapping.description).toContain('Tenax');
  });

  it('should detect FSSAI and FDA violation for acidic food in bare metal can', () => {
    const tomatoPaste = catalogRepository.getCommodityById('COMM-RTE-002')!; // pH 3.9
    const bareTin = catalogRepository.getMaterialById('MAT-MET-001')!; // Bare unlacquered tin
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(bareTin);

    const compliance = RegulatoryEngine.checkCompliance(
      tomatoPaste,
      bareTin,
      barrierMetrics,
      ['FSSAI', 'US_FDA', 'EU_FCM']
    );

    expect(compliance.FSSAI.status).toBe('NON_COMPLIANT');
    expect(compliance.FSSAI.overall_migration_pass).toBe(false);
    expect(compliance.US_FDA.status).toBe('NON_COMPLIANT');
    expect(compliance.EU_FCM.status).toBe('NON_COMPLIANT');
  });

  it('should return CONDITIONAL_PASS with PAA / DoC alerts for multi-layer laminates', () => {
    const milkPowder = catalogRepository.getCommodityById('COMM-DAIRY-001')!;
    const retortFoil = catalogRepository.getMaterialById('MAT-LAM-001')!; // 3-ply PET/AL/CPP
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(retortFoil);

    const compliance = RegulatoryEngine.checkCompliance(
      milkPowder,
      retortFoil,
      barrierMetrics,
      ['FSSAI', 'EU_FCM']
    );

    expect(compliance.FSSAI.status).toBe('CONDITIONAL_PASS');
    expect(compliance.FSSAI.specific_migration_alerts.length).toBeGreaterThan(0);
    expect(compliance.EU_FCM.mandatory_label_notes).toContain(
      'Declaration of Compliance (DoC) must accompany every stage of supply chain (Regulation (EU) No 10/2011 Article 15)'
    );
  });
});
