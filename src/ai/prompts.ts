/**
 * Prompt Engineering Templates for AI Advisory
 * Based on PackSmart Master Specification Section 4.7
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { HazardWarning, StorageCondition } from '../shared/types/analysis.js';
import { CalculatedBarrierMetrics } from '../engine/barrier-calculator.js';

export class PromptTemplates {
  /**
   * Generates a prompt for packaging formulation optimization and sustainable alternatives.
   */
  public static buildAdvisoryPrompt(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    storage: StorageCondition,
    barrierMetrics: CalculatedBarrierMetrics,
    warnings: HazardWarning[],
    pfiScore: number,
    predictedShelfLife: number
  ): string {
    const warningsText = warnings.length > 0
      ? warnings.map(w => `[${w.severity} - ${w.category}] ${w.title}: ${w.message}`).join('\n')
      : 'None (All compatibility, barrier, and safety checks passed).';

    return `
You are an expert Food Packaging Technologist and Regulatory Specialist for the PackSmart platform.
Analyze the following evaluated packaging structure for the food commodity and provide precise optimization suggestions.

### Food Commodity Profile:
- Name: ${commodity.name} (${commodity.category})
- Physical State: ${commodity.physical_state}
- pH: ${commodity.ph_level} | Water Activity (aw): ${commodity.water_activity_aw}
- Moisture Content: ${commodity.moisture_content_pct}% | Fat/Lipid Content: ${commodity.fat_lipid_content_pct}%
- Oxidation Sensitivity: ${commodity.oxidation_sensitivity} | Light Sensitivity: ${commodity.light_sensitivity}
- Target Shelf Life: ${storage.target_shelf_life_days} days

### Packaging Material Profile:
- Material Name: ${material.name} (${material.commercial_designation})
- Material Class: ${material.material_class} | Primary Polymer: ${material.primary_polymer}
- Total Gauge: ${barrierMetrics.total_thickness_um} µm
- Effective OTR: ${barrierMetrics.effective_otr} cm³/m²·day·atm | Effective WVTR: ${barrierMetrics.effective_wvtr} g/m²·day
- Light Transmittance: ${barrierMetrics.light_transmittance_pct}% | Recyclability SPI: ${material.recyclability_code}
- Compostable: ${material.is_compostable} (Bio-based: ${material.bio_based_content_pct}%)

### Simulation & Analysis Results:
- Storage Regime: ${storage.atmosphere} at ${storage.temperature_c}°C, ${storage.relative_humidity_pct}% RH
- Predicted Shelf Life: ${predictedShelfLife} days (Target: ${storage.target_shelf_life_days} days)
- Packaging Fitness Index (PFI): ${pfiScore} / 100
- Detected Hazards / Warnings:
${warningsText}

### Output Requirements:
Respond strictly with valid JSON conforming to the following schema:
{
  "summary": "1-2 sentences summarizing overall suitability and barrier performance.",
  "optimization_suggestions": [
    "Specific engineering suggestions (e.g. down-gauging sealant, metallocene PE optimization, barrier coating adjustment)"
  ],
  "safe_handling_tips": "Practical processing/sealing advice (e.g. heat seal temperature, degassing valve, storage).",
  "eco_alternatives": [
    "Drop-in recyclable mono-material or bio-polymer alternatives (e.g. AlOx-PET, PLA/PBS, coated cellulose)"
  ]
}
`.trim();
  }
}
