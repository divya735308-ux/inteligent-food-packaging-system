import { describe, it, expect } from 'vitest';
import { BarrierCalculator } from '../../src/engine/barrier-calculator.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { MaterialLayer } from '../../src/shared/types/material.js';

describe('Phase 2: BarrierCalculator Engine Tests', () => {
  it('should calculate monolithic material properties accurately', () => {
    const ldpe = catalogRepository.getMaterialById('MAT-MONO-001')!;
    const metrics = BarrierCalculator.calculateEffectiveBarrier(ldpe);

    expect(metrics.total_thickness_um).toBe(50);
    expect(metrics.effective_otr).toBe(2500);
    expect(metrics.effective_wvtr).toBe(18.0);
    expect(metrics.light_transmittance_pct).toBe(88);
  });

  it('should calculate 3-ply foil laminate series resistance (near-zero OTR and WVTR)', () => {
    const retortFoil = catalogRepository.getMaterialById('MAT-LAM-001')!;
    const metrics = BarrierCalculator.calculateEffectiveBarrier(retortFoil);

    expect(metrics.total_thickness_um).toBe(105);
    // Aluminum foil provides absolute barrier
    expect(metrics.effective_otr).toBeLessThanOrEqual(0.01);
    expect(metrics.effective_wvtr).toBeLessThanOrEqual(0.01);
    expect(metrics.light_transmittance_pct).toBe(0.0);
    expect(metrics.contact_layer?.material_code).toBe('CAST_PP');
  });

  it('should calculate series resistance for custom user-defined multi-layer structures', () => {
    const baseMaterial = catalogRepository.getMaterialById('MAT-LAM-008')!; // Base 2-ply PET/PE

    const customLayers: MaterialLayer[] = [
      { layer_order: 1, material_code: 'BOPET', name: 'Print Layer', role: 'OUTER_PRINT', thickness_um: 12, otr_contribution: 110, wvtr_contribution: 25.0 },
      { layer_order: 2, material_code: 'EVOH', name: 'EVOH Barrier', role: 'BARRIER', thickness_um: 10, otr_contribution: 1.5, wvtr_contribution: 35.0 },
      { layer_order: 3, material_code: 'LLDPE', name: 'Sealant', role: 'SEALANT_CONTACT', thickness_um: 50, otr_contribution: 2000, wvtr_contribution: 5.0 }
    ];

    const metrics = BarrierCalculator.calculateEffectiveBarrier(baseMaterial, customLayers);

    expect(metrics.total_thickness_um).toBe(72);
    // 1/OTR = 1/110 + 1/1.5 + 1/2000 => OTR ~ 1.48
    expect(metrics.effective_otr).toBeLessThan(1.5);
    expect(metrics.effective_otr).toBeGreaterThan(1.0);
    // 1/WVTR = 1/25 + 1/35 + 1/5 => WVTR ~ 3.7
    expect(metrics.effective_wvtr).toBeLessThan(5.0);
    expect(metrics.contact_layer?.role).toBe('SEALANT_CONTACT');
  });

  it('should account for active oxygen scavengers by drastically lowering effective OTR', () => {
    const activeMaterial = catalogRepository.getMaterialById('MAT-ACT-001')!;
    const metrics = BarrierCalculator.calculateEffectiveBarrier(activeMaterial);

    expect(metrics.effective_otr).toBeLessThanOrEqual(0.05);
  });
});
