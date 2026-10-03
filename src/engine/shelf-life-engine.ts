/**
 * Storage Conditions & Shelf-Life Estimation Engine
 * Implements physics-based kinetic equations for moisture diffusion, oxygen permeation,
 * lipid oxidation, produce respiration in MAP, and Arrhenius/Q10 temperature dependency.
 * Based on PackSmart Master Specification Section 4.4 & 4.8
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { DegradationPoint, StorageCondition } from '../shared/types/analysis.js';
import { CalculatedBarrierMetrics } from './barrier-calculator.js';

export interface ShelfLifePrediction {
  predicted_shelf_life_days: number;
  shelf_life_score: number; // 0 - 100 vs target
  limiting_failure_mode: string;
  moisture_predicted_days: number;
  oxidation_predicted_days: number;
  microbial_predicted_days: number;
  degradation_timeline: DegradationPoint[];
}

export class ShelfLifeEngine {
  /**
   * Estimates shelf-life and degradation kinetics under specific packaging and storage parameters.
   */
  public static predictShelfLife(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    storage: StorageCondition,
    barrierMetrics: CalculatedBarrierMetrics
  ): ShelfLifePrediction {
    const areaDm2 = storage.package_surface_area_dm2 ?? 2.0; // default 2 dm2 (0.02 m2)
    const areaM2 = areaDm2 / 100.0;
    const foodWeightG = storage.package_weight_grams ?? 250.0;
    const foodWeightKg = foodWeightG / 1000.0;

    // -------------------------------------------------------------
    // 1. Temperature Acceleration Factor (Arrhenius / Q10 Model)
    // -------------------------------------------------------------
    const refTempC = commodity.recommended_storage_temp_c;
    const actualTempC = storage.temperature_c;
    const deltaT = actualTempC - refTempC;

    // Q10 = 2.2 for chemical/oxidation degradation, 3.0 for microbial
    const q10Chemical = 2.2;
    const q10Microbial = 3.0;

    const tempAccelChemical = Math.pow(q10Chemical, deltaT / 10.0);
    const tempAccelMicrobial = Math.pow(q10Microbial, deltaT / 10.0);

    // -------------------------------------------------------------
    // 2. Moisture Sorption / Desorption Kinetics
    // -------------------------------------------------------------
    let moistureDays = 9999;
    const foodInternalRh = commodity.water_activity_aw * 100.0;
    const externalRh = storage.relative_humidity_pct;
    const rhGradient = Math.abs(externalRh - foodInternalRh) / 100.0; // 0.0 to 1.0

    // Effective WVTR adjusted for RH driving force
    const effectiveWvtr = barrierMetrics.effective_wvtr * Math.max(rhGradient, 0.05) * tempAccelChemical;
    const dailyWaterFluxGrams = effectiveWvtr * areaM2;

    if (commodity.water_activity_aw < 0.40) {
      // Dry foods susceptible to moisture gain (caking/loss of crispness)
      const maxAllowedMoistureGainPct = commodity.critical_moisture_gain_pct ?? 2.0;
      const maxWaterGainGrams = (maxAllowedMoistureGainPct / 100.0) * foodWeightG;
      if (dailyWaterFluxGrams > 0.0001) {
        moistureDays = Math.round(maxWaterGainGrams / dailyWaterFluxGrams);
      }
    } else if (commodity.water_activity_aw > 0.85 && commodity.category !== 'BEVERAGES_LIQUIDS') {
      // High moisture food susceptible to desiccation / moisture loss
      const maxAllowedLossPct = commodity.critical_moisture_loss_pct ?? 4.0;
      const maxWaterLossGrams = (maxAllowedLossPct / 100.0) * foodWeightG;
      if (dailyWaterFluxGrams > 0.0001 && externalRh < foodInternalRh) {
        moistureDays = Math.round(maxWaterLossGrams / dailyWaterFluxGrams);
      }
    }

    // -------------------------------------------------------------
    // 3. Oxygen Ingress & Lipid Oxidation Kinetics
    // -------------------------------------------------------------
    let oxidationDays = 9999;
    if (commodity.oxidation_sensitivity !== 'NONE') {
      // Headspace O2 driving force
      let partialPressureO2 = 0.209; // standard air
      if (storage.atmosphere === 'VACUUM') {
        partialPressureO2 = 0.02;
      } else if (storage.atmosphere === 'MAP_NITROGEN_FLUSH') {
        partialPressureO2 = (storage.map_gas_ratio?.o2_pct ?? 0.5) / 100.0;
      } else if (storage.atmosphere === 'MAP_HIGH_OXYGEN') {
        partialPressureO2 = (storage.map_gas_ratio?.o2_pct ?? 80.0) / 100.0;
      }

      // Daily O2 ingress in cm3
      const dailyO2VolumeCc = barrierMetrics.effective_otr * areaM2 * Math.max(0.209 - partialPressureO2, 0.01) * tempAccelChemical;
      // 1 cc O2 at STP = 1.428 mg O2
      const dailyO2Mg = dailyO2VolumeCc * 1.428;
      const dailyO2Ppm = dailyO2Mg / foodWeightKg;

      const criticalO2Ppm = commodity.critical_o2_uptake_ppm ?? (commodity.oxidation_sensitivity === 'CRITICAL' ? 30.0 : 80.0);

      if (dailyO2Ppm > 0.0001) {
        oxidationDays = Math.round(criticalO2Ppm / dailyO2Ppm);
      }
    }

    // -------------------------------------------------------------
    // 4. Microbial & Baseline Biological Kinetics
    // -------------------------------------------------------------
    let microbialDays = 9999;
    if (commodity.water_activity_aw >= 0.60 && commodity.microbial_risk_level !== 'NONE') {
      const baseShelfLife = commodity.target_shelf_life_days;
      
      // If MAP with CO2 or N2 flush is used, microbial shelf life is extended
      let mapMultiplier = 1.0;
      if (storage.atmosphere === 'MAP_BALANCED_CO2_N2' || (storage.map_gas_ratio && storage.map_gas_ratio.co2_pct >= 20)) {
        mapMultiplier = 1.6; // 60% shelf-life extension from dissolved CO2
      } else if (storage.atmosphere === 'MAP_NITROGEN_FLUSH' || storage.atmosphere === 'VACUUM') {
        mapMultiplier = 1.4; // 40% shelf-life extension from oxygen displacement
      }

      microbialDays = Math.round((baseShelfLife * mapMultiplier) / tempAccelMicrobial);
    }

    // -------------------------------------------------------------
    // 5. Fresh Produce Respiration & MAP Dynamic
    // -------------------------------------------------------------
    if (commodity.category === 'FRESH_PRODUCE') {
      const respRate = commodity.respiration_metrics?.rate_mg_co2_kg_hr ?? 30.0;
      // High respiration produce shelf life depends on gas equilibrium and transpiration
      const baseProduceDays = commodity.target_shelf_life_days;
      const produceAccel = Math.pow(2.0, deltaT / 10.0);
      
      // If active ethylene scrubber is present, extend shelf-life by 35%
      const activeScrubMultiplier = material.active_smart_features?.type === 'ETHYLENE_SCRUBBER' ? 1.35 : 1.0;
      
      const produceDays = Math.round((baseProduceDays * activeScrubMultiplier) / produceAccel);
      microbialDays = Math.min(microbialDays, produceDays);
    }

    // -------------------------------------------------------------
    // 6. Determine Limiting Failure Mode & Final Shelf Life
    // -------------------------------------------------------------
    const candidateDays: { mode: string; days: number }[] = [
      { mode: 'MOISTURE_SORPTION_LIMIT', days: moistureDays },
      { mode: 'LIPID_OXIDATION_RANCIDITY', days: oxidationDays },
      { mode: 'MICROBIAL_ORGANOLEPTIC_EXPIRATION', days: microbialDays }
    ];

    // Filter out invalid or infinite values
    const validCandidates = candidateDays.filter(c => c.days > 0 && c.days < 5000);
    validCandidates.sort((a, b) => a.days - b.days);

    const limiting = validCandidates.length > 0 ? validCandidates[0] : { mode: 'GENERAL_EXPIRATION', days: commodity.target_shelf_life_days };
    
    // Bounds check
    const finalShelfLifeDays = Math.max(1, Math.min(limiting.days, 1825)); // Cap at 5 years max

    // Shelf life score relative to target (0 - 100)
    const targetDays = storage.target_shelf_life_days;
    let shelfLifeScore = Math.min(100, Math.round((finalShelfLifeDays / targetDays) * 100));
    if (finalShelfLifeDays < targetDays) {
      shelfLifeScore = Math.max(10, Math.round((finalShelfLifeDays / targetDays) * 100));
    }

    // -------------------------------------------------------------
    // 7. Generate Degradation Timeline Data Points
    // -------------------------------------------------------------
    const timeline: DegradationPoint[] = [];
    const stepCount = 10;
    const maxDay = Math.max(finalShelfLifeDays, targetDays);
    const dayStep = Math.max(1, Math.round(maxDay / stepCount));

    for (let day = 0; day <= maxDay; day += dayStep) {
      const progressFraction = Math.min(day / finalShelfLifeDays, 1.5);
      
      // Moisture curve
      let currentMoisture = commodity.moisture_content_pct;
      if (moistureDays < 9999) {
        const delta = (day * dailyWaterFluxGrams / foodWeightG) * 100.0;
        currentMoisture = externalRh > foodInternalRh ? commodity.moisture_content_pct + delta : commodity.moisture_content_pct - delta;
      }

      // Oxygen headspace curve
      let currentHeadspaceO2 = 20.9;
      if (storage.atmosphere === 'MAP_NITROGEN_FLUSH') {
        currentHeadspaceO2 = (storage.map_gas_ratio?.o2_pct ?? 0.5) + (day * 0.05 * barrierMetrics.effective_otr / 100);
      } else if (storage.atmosphere === 'VACUUM') {
        currentHeadspaceO2 = 1.0 + (day * 0.04 * barrierMetrics.effective_otr / 100);
      }

      // Quality retention %
      const quality = Math.max(0, Math.round(100 - (progressFraction * 60) - (day > finalShelfLifeDays ? 40 : 0)));

      timeline.push({
        day,
        moisture_content_pct: parseFloat(currentMoisture.toFixed(2)),
        dissolved_headspace_o2_pct: parseFloat(Math.min(currentHeadspaceO2, 21.0).toFixed(2)),
        quality_retention_pct: quality
      });
    }

    return {
      predicted_shelf_life_days: finalShelfLifeDays,
      shelf_life_score: shelfLifeScore,
      limiting_failure_mode: limiting.mode,
      moisture_predicted_days: moistureDays,
      oxidation_predicted_days: oxidationDays,
      microbial_predicted_days: microbialDays,
      degradation_timeline: timeline
    };
  }
}
