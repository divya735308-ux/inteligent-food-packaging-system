/**
 * Zero-API-Key Heuristic Recommendation & Advisory Engine
 * Provides deterministic offline advisory logic and formulation optimization.
 * Based on PackSmart Master Specification Section 4.7 & 9.2
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { HazardWarning, StorageCondition } from '../shared/types/analysis.js';
import { CalculatedBarrierMetrics } from '../engine/barrier-calculator.js';
import { AIAdvisoryOutput } from './schemas.js';

export class HeuristicRecommender {
  /**
   * Generates comprehensive advisory output using domain-grounded heuristics.
   */
  public static generateAdvisory(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    storage: StorageCondition,
    barrierMetrics: CalculatedBarrierMetrics,
    warnings: HazardWarning[],
    pfiScore: number,
    predictedShelfLife: number
  ): AIAdvisoryOutput {
    const optimizationSuggestions: string[] = [];
    const ecoAlternatives: string[] = [];
    let safeHandlingTips = '';

    const hasCritical = warnings.some(w => w.severity === 'CRITICAL');
    const targetDays = storage.target_shelf_life_days;

    // -------------------------------------------------------------
    // 1. Core Summary Generation
    // -------------------------------------------------------------
    let summary = '';
    if (hasCritical) {
      summary = `The evaluated packaging (${material.name}) is not suitable for ${commodity.name} due to critical compatibility/safety risks. Remediation or material substitution is required.`;
    } else if (predictedShelfLife >= targetDays && pfiScore >= 80) {
      summary = `The proposed packaging structure provides robust barrier protection, achieving a predicted shelf life of ${predictedShelfLife} days (exceeding the ${targetDays}-day target) with high structural integrity.`;
    } else if (predictedShelfLife < targetDays) {
      summary = `The proposed packaging provides partial protection (${predictedShelfLife} days predicted vs ${targetDays} days required). Barrier enhancement is recommended to prevent premature quality deterioration.`;
    } else {
      summary = `The packaging meets baseline barrier criteria for ${commodity.name} with a Packaging Fitness Index of ${pfiScore}/100. Minor material and sustainability optimizations are available.`;
    }

    // -------------------------------------------------------------
    // 2. Down-gauging & Thickness Optimization Heuristics
    // -------------------------------------------------------------
    if (material.layers && material.layers.length >= 3) {
      const sealantLayer = material.layers.find(l => l.role === 'SEALANT_CONTACT');
      if (sealantLayer && sealantLayer.thickness_um > 50) {
        const downGauged = Math.max(35, sealantLayer.thickness_um - 15);
        optimizationSuggestions.push(
          `Down-gauge the inner sealant layer (${sealantLayer.material_code}) from ${sealantLayer.thickness_um}µm to ${downGauged}µm using high-melt-strength metallocene PE to reduce material weight by ~15% without compromising hot-tack seal strength.`
        );
      }

      if (material.layers.some(l => l.material_code.includes('AL_FOIL')) && barrierMetrics.effective_otr <= 0.01) {
        optimizationSuggestions.push(
          'For non-retort shelf-stable applications, evaluate high-barrier vacuum metallized film (Met-BOPP / Met-PET) or AlOx coating to reduce carbon footprint while maintaining adequate O2 and moisture barriers.'
        );
      }
    } else if (material.material_class === 'THERMOPLASTIC_MONO' && barrierMetrics.total_thickness_um > 60) {
      optimizationSuggestions.push(
        `Optimize film gauge from ${barrierMetrics.total_thickness_um}µm to ${Math.round(barrierMetrics.total_thickness_um * 0.8)}µm using bimodal extrusion resins to improve yield and cost efficiency.`
      );
    }

    // -------------------------------------------------------------
    // 3. Oxygen & Moisture Barrier Tuning
    // -------------------------------------------------------------
    if (commodity.oxidation_sensitivity === 'CRITICAL' && barrierMetrics.effective_otr > 2.0) {
      optimizationSuggestions.push(
        'Incorporate an integrated EVOH core layer or active iron-based oxygen scavenging masterbatch to absorb residual headspace oxygen and prevent hexanal off-flavor formation.'
      );
    }

    if (commodity.water_activity_aw < 0.25 && barrierMetrics.effective_wvtr > 1.5) {
      optimizationSuggestions.push(
        'Apply a high-density PVDC or AlOx barrier coating to suppress water vapor permeation below 1.0 g/m²·day and extend product crispness.'
      );
    }

    if (optimizationSuggestions.length === 0) {
      optimizationSuggestions.push('Current layer gauges are well-balanced for the specified shelf-life requirements.');
    }

    // -------------------------------------------------------------
    // 4. Sustainable & Eco-Friendly Drop-in Alternatives
    // -------------------------------------------------------------
    if (!material.is_compostable && material.recyclability_code === 0) {
      // Multi-layer non-recyclable structure
      ecoAlternatives.push(
        'Recycle-Ready Mono-Material: Switch to an all-PE (AlOx-BOPE / MDO-PE / LLDPE) or all-PP pouch for 100% circular kerbside recyclability (RIC #4 or #5).'
      );
      ecoAlternatives.push(
        'Home Compostable Laminate: Evaluate NatureFlex coated cellulose laminated with bio-based PBS sealant (EN 13432 certified).'
      );
    } else if (material.primary_polymer === 'PET' || material.primary_polymer === 'BOPET') {
      ecoAlternatives.push(
        'Circularity Upgrade: Incorporate 30%–50% post-consumer certified food-grade rPET (subject to local FSSAI/FDA Letter of No Objection approval).'
      );
    } else if (commodity.category === 'FRESH_PRODUCE') {
      ecoAlternatives.push(
        'Bio-Polymer Option: Utilize thermoformed PLA or sugarcane bagasse pulp punnets with micro-perforated bio-film lidding for enhanced transpiration.'
      );
    }

    if (ecoAlternatives.length === 0) {
      ecoAlternatives.push('Material already exhibits favorable environmental attributes (recyclable or bio-compostable).');
    }

    // -------------------------------------------------------------
    // 5. Safe Handling & Sealing Tips
    // -------------------------------------------------------------
    if (commodity.ph_level < 4.5 && material.material_class === 'METALLIC') {
      safeHandlingTips = 'Ensure 100% internal lacquer film continuity (minimum 8–10 g/m² dry film weight) to eliminate micro-cracks and acidic electrochemical pitting.';
    } else if (storage.atmosphere === 'MAP_NITROGEN_FLUSH') {
      safeHandlingTips = 'Maintain gas flushing residual headspace oxygen below 0.5% at the nozzle sealing jaw; calibrate sealing temperature to 160°C–175°C with 0.3s dwell time to prevent micro-channel leaks.';
    } else if (commodity.fat_lipid_content_pct > 20) {
      safeHandlingTips = 'Wipe sealing jaws regularly to avoid fat contamination in the heat seal zone, which can cause intermittent hermetic pouch seal failures.';
    } else if (storage.temperature_c <= 0) {
      safeHandlingTips = 'Use cold-crack resistant metallocene sealants and ensure slow deep-freeze pallet stacking to prevent vibration-induced film micro-fracturing.';
    } else {
      safeHandlingTips = 'Maintain standard food-grade clean packaging handling in accordance with GMP (Good Manufacturing Practice) standards; store unsealed film reels in a controlled dry environment (20°C, 50% RH).';
    }

    return {
      summary,
      optimization_suggestions: optimizationSuggestions,
      safe_handling_tips: safeHandlingTips,
      eco_alternatives: ecoAlternatives,
      is_fallback_mode: true
    };
  }
}
