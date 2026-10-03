/**
 * Food-Packaging Compatibility Analysis Engine
 * Evaluates chemical, physical, thermal, and barrier compatibility between food commodities and packaging.
 * Based on PackSmart Master Specification Section 4.3 & 4.8
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { MaterialLayer, PackagingMaterial } from '../shared/types/material.js';
import { HazardWarning, StorageCondition } from '../shared/types/analysis.js';
import { BarrierCalculator, CalculatedBarrierMetrics } from './barrier-calculator.js';

export interface CompatibilityEvaluation {
  status: 'OPTIMAL' | 'COMPATIBLE_WITH_CONDITIONS' | 'SUB_OPTIMAL' | 'INCOMPATIBLE';
  compatibility_score: number; // 0 - 100
  barrier_metrics: CalculatedBarrierMetrics;
  warnings: HazardWarning[];
}

export class CompatibilityEngine {
  /**
   * Performs exhaustive multi-factor compatibility evaluation.
   */
  public static evaluate(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    storage: StorageCondition,
    customLayers?: MaterialLayer[]
  ): CompatibilityEvaluation {
    const warnings: HazardWarning[] = [];
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(material, customLayers);

    // Identify food contact material code
    const contactCode = (barrierMetrics.contact_layer?.material_code ?? material.primary_polymer).toUpperCase();

    // -------------------------------------------------------------
    // 1. Acidity & Corrosion Evaluation
    // -------------------------------------------------------------
    if (commodity.ph_level < 4.5) {
      const isExplicitlyLacquered =
        material.name.toLowerCase().includes('lacquer') ||
        material.commercial_designation.toLowerCase().includes('lacquer') ||
        material.commercial_designation.toLowerCase().includes('coated') ||
        (barrierMetrics.contact_layer && !barrierMetrics.contact_layer.material_code.includes('TINPLATE') && !barrierMetrics.contact_layer.material_code.includes('AL_FOIL'));

      const isBareMetal =
        material.material_id === 'MAT-MET-001' || // Raw Uncoated Tinplate
        (material.material_class === 'METALLIC' && !isExplicitlyLacquered);

      if (isBareMetal) {
        warnings.push({
          id: 'WARN-ACID-CORROSION',
          severity: 'CRITICAL',
          category: 'ACID_CORROSION',
          title: 'Severe Acid Corrosion Risk',
          message: `Acidic food (pH ${commodity.ph_level}) will react aggressively with uncoated metal contact surface, causing pinholing, hydrogen swelling, and toxic metallic ion leaching.`,
          remediation_suggestion: 'Use internal BPA-NI polyester/epoxy lacquer coated cans or glass containers with acid-resistant closures.'
        });
      }
    }

    // -------------------------------------------------------------
    // 2. Lipid & Grease Resistance Evaluation
    // -------------------------------------------------------------
    if (commodity.fat_lipid_content_pct > 15.0) {
      if (material.grease_resistance_kit < 6 && (contactCode.includes('LDPE') || contactCode.includes('PAPER'))) {
        warnings.push({
          id: 'WARN-LIPID-GREASE',
          severity: 'HIGH',
          category: 'LIPID_SCALPING',
          title: 'Lipid Permeation & Grease Scalping Risk',
          message: `High fat content (${commodity.fat_lipid_content_pct}%) exceeds the grease resistance threshold (Kit rating ${material.grease_resistance_kit}). Potential oil bleed-through and environmental stress cracking.`,
          remediation_suggestion: 'Incorporate a grease-resistant barrier such as Cast PP, HDPE, or fluorochemical-free high-density bio-coatings.'
        });
      }
    }

    // -------------------------------------------------------------
    // 3. Moisture Sorption & Water Activity Dynamics
    // -------------------------------------------------------------
    if (commodity.water_activity_aw < 0.30) {
      // Crisp dry foods, milk powders, crackers
      if (barrierMetrics.effective_wvtr > 2.0) {
        const severity = barrierMetrics.effective_wvtr > 10.0 ? 'CRITICAL' : 'HIGH';
        warnings.push({
          id: 'WARN-MOISTURE-GAIN',
          severity,
          category: 'MOISTURE_DEGRADATION',
          title: 'Critical Moisture Sorption Risk',
          message: `Dry hygroscopic product (aw ${commodity.water_activity_aw}) requires WVTR <= 2.0 g/m²·day. Current package WVTR is ${barrierMetrics.effective_wvtr} g/m²·day, causing rapid caking, sogginess, and loss of crispness.`,
          remediation_suggestion: 'Use high-barrier metallized film (Met-BOPP), aluminum foil laminate, or AlOx-coated barrier substrate.'
        });
      }
    } else if (commodity.water_activity_aw > 0.85) {
      // High moisture food
      if (material.material_class === 'PAPER_BOARD' && !material.layers && material.grease_resistance_kit < 8) {
        warnings.push({
          id: 'WARN-MOISTURE-SOFTENING',
          severity: 'CRITICAL',
          category: 'MOISTURE_DEGRADATION',
          title: 'Package Structural Softening Hazard',
          message: `High water activity (${commodity.water_activity_aw}) in direct contact with unlined paperboard will cause water saturation, delamination, and microbial collapse.`,
          remediation_suggestion: 'Use polyolefin-lined liquid packaging board (Tetra-type) or thermoformed plastic trays.'
        });
      }
    }

    // -------------------------------------------------------------
    // 4. Oxygen Sensitivity & Lipid Oxidation
    // -------------------------------------------------------------
    if (commodity.oxidation_sensitivity === 'CRITICAL' || commodity.oxidation_sensitivity === 'HIGH') {
      if (barrierMetrics.effective_otr > 15.0) {
        const severity = barrierMetrics.effective_otr > 100.0 ? 'CRITICAL' : 'HIGH';
        warnings.push({
          id: 'WARN-OXYGEN-OXIDATION',
          severity,
          category: 'OXIDATION',
          title: 'Oxygen Permeation & Rancidity Risk',
          message: `Food commodity is highly sensitive to oxygen autoxidation. Package OTR (${barrierMetrics.effective_otr} cm³/m²·day·atm) exceeds safe threshold (<= 15.0 cm³/m²·day·atm), leading to off-flavors, nutrient destruction, and premature rancidity.`,
          remediation_suggestion: 'Switch to a 3-ply foil laminate (PET/AL/PE), EVOH barrier core, or integrate an active oxygen scavenging sachet/film.'
        });
      }
    }

    // -------------------------------------------------------------
    // 5. Light Sensitivity & Photo-Oxidation
    // -------------------------------------------------------------
    if (commodity.light_sensitivity === 'CRITICAL' || commodity.light_sensitivity === 'HIGH') {
      if (barrierMetrics.light_transmittance_pct > 5.0) {
        warnings.push({
          id: 'WARN-LIGHT-DEGRADATION',
          severity: 'HIGH',
          category: 'OXIDATION',
          title: 'Photo-Oxidation & Light Induced Breakdown',
          message: `Light-sensitive food exposed to package transmittance of ${barrierMetrics.light_transmittance_pct}%. Risk of riboflavin degradation (milk), chlorophyll photo-oxidation (virgin olive oil), or hop skunking (beer).`,
          remediation_suggestion: 'Select amber glass, opaque foil laminates, metallized substrate, or UV-absorbing outer masterbatch.'
        });
      }
    }

    // -------------------------------------------------------------
    // 6. Thermal Processing & Storage Temperature Bounds
    // -------------------------------------------------------------
    if (storage.temperature_c > material.max_temperature_c) {
      warnings.push({
        id: 'WARN-THERMAL-OVERHEAT',
        severity: 'CRITICAL',
        category: 'THERMAL_FAILURE',
        title: 'Thermal Threshold Exceeded',
        message: `Storage/Process temperature (${storage.temperature_c}°C) exceeds material maximum continuous operating temperature (${material.max_temperature_c}°C). Risk of polymer melting, pouch seal blowout, and chemical thermal breakdown.`,
        remediation_suggestion: 'For retort/hot-fill (> 100°C), use Retort Cast PP (CPP), aluminum cans, or glass.'
      });
    }

    if (storage.temperature_c < material.min_temperature_c) {
      warnings.push({
        id: 'WARN-THERMAL-FREEZE',
        severity: 'HIGH',
        category: 'THERMAL_FAILURE',
        title: 'Low Temperature Embrittlement Hazard',
        message: `Storage temperature (${storage.temperature_c}°C) is below polymer glass transition / embrittlement temperature (${material.min_temperature_c}°C). Package may crack or shatter during distribution.`,
        remediation_suggestion: 'Use high-impact cold-resistant metallocene LLDPE or BOPA nylon engineered for deep-freeze (-40°C).'
      });
    }

    // -------------------------------------------------------------
    // 7. Aroma / Flavor Scalping Check
    // -------------------------------------------------------------
    if (commodity.category === 'BEVERAGES_LIQUIDS' && commodity.acidity_type === 'CITRIC') {
      if (contactCode === 'LDPE' || contactCode === 'LLDPE') {
        warnings.push({
          id: 'WARN-AROMA-SCALPING',
          severity: 'ADVISORY',
          category: 'LIPID_SCALPING',
          title: 'Citrus Essential Oil Scalping Advisory',
          message: 'd-Limonene and volatile citrus aromatics can be absorbed by standard polyethylene contact layers, causing flavor fading over time.',
          remediation_suggestion: 'Utilize specialized cyclic olefin copolymer (COC) or EVOH contact blends for high citrus terpene retention.'
        });
      }
    }

    // -------------------------------------------------------------
    // Calculate Compatibility Score (0 - 100) & Verdict Status
    // -------------------------------------------------------------
    let score = 100;
    let hasCritical = false;
    let highCount = 0;

    for (const w of warnings) {
      if (w.severity === 'CRITICAL') {
        hasCritical = true;
        score -= 40;
      } else if (w.severity === 'HIGH') {
        highCount++;
        score -= 15;
      } else if (w.severity === 'ADVISORY') {
        score -= 5;
      }
    }

    score = Math.max(0, Math.min(100, score));

    let status: 'OPTIMAL' | 'COMPATIBLE_WITH_CONDITIONS' | 'SUB_OPTIMAL' | 'INCOMPATIBLE';
    if (hasCritical || score < 40) {
      status = 'INCOMPATIBLE';
    } else if (highCount > 0 || score < 75) {
      status = 'COMPATIBLE_WITH_CONDITIONS';
    } else if (score < 90) {
      status = 'SUB_OPTIMAL';
    } else {
      status = 'OPTIMAL';
    }

    return {
      status,
      compatibility_score: score,
      barrier_metrics: barrierMetrics,
      warnings
    };
  }
}
