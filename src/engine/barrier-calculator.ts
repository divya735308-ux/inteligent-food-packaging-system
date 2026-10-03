/**
 * Barrier Properties and Composite Laminate Calculation Engine
 * Implements series resistance permeation modeling for multi-layer packaging structures.
 * Based on PackSmart Master Specification Section 4.2 & 4.3
 */

import { MaterialLayer, PackagingMaterial } from '../shared/types/material.js';

export interface CalculatedBarrierMetrics {
  total_thickness_um: number;
  effective_otr: number;   // cm3 / m2 · day · atm
  effective_wvtr: number;  // g / m2 · day
  effective_co2tr: number; // cm3 / m2 · day · atm
  light_transmittance_pct: number;
  contact_layer?: MaterialLayer;
  outer_layer?: MaterialLayer;
}

export class BarrierCalculator {
  /**
   * Calculates overall barrier metrics for a single or multi-layer packaging material.
   * If custom layers are provided, uses series resistance permeation: 1/P_tot = Sum(1/P_i)
   */
  public static calculateEffectiveBarrier(
    baseMaterial: PackagingMaterial,
    customLayers?: MaterialLayer[]
  ): CalculatedBarrierMetrics {
    const layers = customLayers && customLayers.length > 0 ? customLayers : baseMaterial.layers;

    if (!layers || layers.length === 0) {
      // Single monolithic material
      let effectiveOtr = baseMaterial.otr;
      
      // If active O2 scavenger is present, effectively reduce OTR
      if (baseMaterial.active_smart_features?.type === 'OXYGEN_SCAVENGER') {
        effectiveOtr = Math.min(effectiveOtr, 0.05);
      }

      return {
        total_thickness_um: baseMaterial.default_thickness_um,
        effective_otr: Math.max(effectiveOtr, 0.001),
        effective_wvtr: Math.max(baseMaterial.wvtr, 0.001),
        effective_co2tr: Math.max(baseMaterial.co2tr, 0.001),
        light_transmittance_pct: baseMaterial.light_transmittance_pct
      };
    }

    // Multi-layer structure calculation
    let totalThickness = 0;
    let invOtrSum = 0;
    let invWvtrSum = 0;
    let invCo2trSum = 0;
    let lightTransmittanceFactor = 1.0;

    // Sort layers by layer_order
    const sortedLayers = [...layers].sort((a, b) => a.layer_order - b.layer_order);
    const outerLayer = sortedLayers[0];
    const contactLayer = sortedLayers[sortedLayers.length - 1];

    for (const layer of sortedLayers) {
      totalThickness += layer.thickness_um;

      // Estimate layer OTR and WVTR based on material type if not explicitly supplied
      const layerOtr = layer.otr_contribution ?? this.estimateLayerOtr(layer.material_code, layer.thickness_um);
      const layerWvtr = layer.wvtr_contribution ?? this.estimateLayerWvtr(layer.material_code, layer.thickness_um);
      const layerCo2tr = layerOtr * 4.0; // Typical polymer CO2/O2 permeation ratio ~4:1

      // 1 / P_total = 1 / P_1 + 1 / P_2 + ...
      if (layerOtr > 0) {
        invOtrSum += 1 / layerOtr;
      } else {
        invOtrSum += 1000; // Absolute barrier (e.g. aluminum foil)
      }

      if (layerWvtr > 0) {
        invWvtrSum += 1 / layerWvtr;
      } else {
        invWvtrSum += 1000;
      }

      if (layerCo2tr > 0) {
        invCo2trSum += 1 / layerCo2tr;
      } else {
        invCo2trSum += 1000;
      }

      // Estimate optical opacity
      if (layer.material_code.includes('AL_FOIL') || layer.material_code.includes('METALLIZED')) {
        lightTransmittanceFactor = 0.0;
      } else if (layer.material_code.includes('PAPER')) {
        lightTransmittanceFactor *= 0.01;
      } else {
        lightTransmittanceFactor *= 0.95;
      }
    }

    const calculatedOtr = invOtrSum > 0 ? 1 / invOtrSum : baseMaterial.otr;
    const calculatedWvtr = invWvtrSum > 0 ? 1 / invWvtrSum : baseMaterial.wvtr;
    const calculatedCo2tr = invCo2trSum > 0 ? 1 / invCo2trSum : baseMaterial.co2tr;

    return {
      total_thickness_um: totalThickness,
      effective_otr: Math.max(parseFloat(calculatedOtr.toFixed(3)), 0.001),
      effective_wvtr: Math.max(parseFloat(calculatedWvtr.toFixed(3)), 0.001),
      effective_co2tr: Math.max(parseFloat(calculatedCo2tr.toFixed(3)), 0.001),
      light_transmittance_pct: parseFloat((lightTransmittanceFactor * 100).toFixed(1)),
      contact_layer: contactLayer,
      outer_layer: outerLayer
    };
  }

  /**
   * Helper to estimate layer OTR for known polymer types normalized to thickness.
   */
  private static estimateLayerOtr(materialCode: string, thicknessUm: number): number {
    const code = materialCode.toUpperCase();
    const t = Math.max(thicknessUm, 1);

    if (code.includes('AL_FOIL')) return 0.01;
    if (code.includes('EVOH')) return 1.5 * (15 / t);
    if (code.includes('METALLIZED') || code.includes('ALOX')) return 0.8 * (15 / t);
    if (code.includes('PVDC')) return 6.0 * (20 / t);
    if (code.includes('BOPET') || code.includes('PET')) return 110.0 * (12 / t);
    if (code.includes('PA') || code.includes('NYLON')) return 30.0 * (15 / t);
    if (code.includes('PLA')) return 550.0 * (25 / t);
    if (code.includes('BOPP') || code.includes('PP')) return 1600.0 * (20 / t);
    if (code.includes('HDPE')) return 1200.0 * (40 / t);
    if (code.includes('LDPE') || code.includes('LLDPE')) return 2200.0 * (40 / t);
    if (code.includes('CELLULOSE')) return 15.0 * (20 / t);
    return 2000.0 * (25 / t);
  }

  /**
   * Helper to estimate layer WVTR for known polymer types normalized to thickness.
   */
  private static estimateLayerWvtr(materialCode: string, thicknessUm: number): number {
    const code = materialCode.toUpperCase();
    const t = Math.max(thicknessUm, 1);

    if (code.includes('AL_FOIL')) return 0.01;
    if (code.includes('METALLIZED') || code.includes('ALOX')) return 0.5 * (15 / t);
    if (code.includes('HDPE')) return 4.5 * (40 / t);
    if (code.includes('BOPP') || code.includes('PP')) return 4.0 * (20 / t);
    if (code.includes('PVDC')) return 2.0 * (20 / t);
    if (code.includes('LLDPE') || code.includes('LDPE')) return 16.0 * (40 / t);
    if (code.includes('BOPET') || code.includes('PET')) return 25.0 * (12 / t);
    if (code.includes('EVOH')) return 45.0 * (15 / t);
    if (code.includes('PBS')) return 65.0 * (35 / t);
    if (code.includes('PA') || code.includes('NYLON')) return 150.0 * (15 / t);
    if (code.includes('PLA')) return 175.0 * (25 / t);
    if (code.includes('CELLULOSE')) return 20.0 * (23 / t);
    if (code.includes('PAPER')) return 350.0 * (80 / t);
    return 20.0 * (25 / t);
  }
}
