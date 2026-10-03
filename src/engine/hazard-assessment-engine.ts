/**
 * Food Safety, Hazard Analysis and Risk Assessment Engine
 * HACCP-aligned evaluation of chemical migration, NIAS, toxic substances, and physical failure risks.
 * Based on PackSmart Master Specification Section 4.5
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { HazardWarning, StorageCondition } from '../shared/types/analysis.js';
import { CalculatedBarrierMetrics } from './barrier-calculator.js';

export class HazardAssessmentEngine {
  /**
   * Conducts comprehensive hazard analysis and returns structured risk warnings.
   */
  public static analyzeHazards(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    storage: StorageCondition,
    barrierMetrics: CalculatedBarrierMetrics
  ): HazardWarning[] {
    const warnings: HazardWarning[] = [];
    const isLaminate = material.material_class === 'MULTI_LAYER_LAMINATE' || (material.layers && material.layers.length > 1);

    // -------------------------------------------------------------
    // 1. Chemical Migration & Toxic Substance Hazards
    // -------------------------------------------------------------
    
    // Primary Aromatic Amines (PAAs) in multi-layer laminates
    if (isLaminate) {
      warnings.push({
        id: 'HAZ-CHEM-PAA',
        severity: 'ADVISORY',
        category: 'CHEMICAL_MIGRATION',
        title: 'Primary Aromatic Amines (PAA) Cure Verification Required',
        message: 'Solventless polyurethane lamination adhesives can generate carcinogenic PAAs if aromatic isocyanates are under-cured. Ensure full curing cycle (minimum 3-5 days at 40°C) prior to food packing.',
        remediation_suggestion: 'Perform spectrophotometric / HPLC migration testing per IS 9845 / EU 10/2011 to verify PAA is non-detectable (< 0.01 mg/kg).'
      });
    }

    // Bisphenol A (BPA) Risk in canned food & infant nutrition
    if (commodity.commodity_id === 'COMM-DRY-002' || commodity.category === 'PROCESSED_RETORT_RTE') {
      if (material.material_class === 'METALLIC' && !material.commercial_designation.toLowerCase().includes('bpa-non') && !material.commercial_designation.toLowerCase().includes('bpa-ni')) {
        warnings.push({
          id: 'HAZ-CHEM-BPA',
          severity: 'HIGH',
          category: 'CHEMICAL_MIGRATION',
          title: 'Bisphenol A (BPA) Potential Leaching',
          message: 'Traditional epoxy-phenolic can lacquers may release trace BPA monomer under retort sterilization (121°C). BPA is an endocrine disruptor strictly restricted in sensitive foods.',
          remediation_suggestion: 'Specify certified BPA-NI (BPA Non-Intent) polyester or oleoresinous internal coating.'
        });
      }
    }

    // Phthalate Plasticizer Leaching in Fatty Foods
    if (commodity.fat_lipid_content_pct > 25.0) {
      if (material.primary_polymer === 'PVC' || material.primary_polymer === 'PVDC') {
        warnings.push({
          id: 'HAZ-CHEM-PHTHALATE',
          severity: 'HIGH',
          category: 'CHEMICAL_MIGRATION',
          title: 'Phthalate Plasticizer Extraction Risk',
          message: `Lipophilic fatty matrix (${commodity.fat_lipid_content_pct}% fat) enhances extraction of plasticizers from vinyl polymers into the food.`,
          remediation_suggestion: 'Replace with non-plasticized polyolefin (HDPE/PP) or PET barrier structure.'
        });
      }
    }

    // Mineral Oil (MOSH/MOAH) Migration in Recycled Paperboard
    if (material.material_class === 'PAPER_BOARD' && !material.layers && material.bio_based_content_pct < 100) {
      warnings.push({
        id: 'HAZ-CHEM-MOSH-MOAH',
        severity: 'HIGH',
        category: 'CHEMICAL_MIGRATION',
        title: 'MOSH / MOAH Mineral Oil Hydrocarbon Migration Risk',
        message: 'Recycled paperboard may contain printing ink hydrocarbon residues (MOSH/MOAH) that migrate into dry or fatty foods in vapor phase.',
        remediation_suggestion: 'Use 100% virgin fiber SBS board or incorporate a functional polymer/bio-barrier inner bag.'
      });
    }

    // -------------------------------------------------------------
    // 2. Non-Intentionally Added Substances (NIAS)
    // -------------------------------------------------------------
    if (isLaminate && material.layers && material.layers.length >= 3) {
      warnings.push({
        id: 'HAZ-NIAS-PRINT-INK',
        severity: 'ADVISORY',
        category: 'CHEMICAL_MIGRATION',
        title: 'NIAS Photoinitiator Set-Off Evaluation',
        message: 'During roll reel winding, outer surface printing inks can transfer (set-off) to the inner food-contact sealant layer.',
        remediation_suggestion: 'Use low-migration energy-curable inks with Benzophenone migration below SML (0.6 mg/kg) and verify absence of set-off.'
      });
    }

    // -------------------------------------------------------------
    // 3. Physical Failure & Package Integrity Hazards
    // -------------------------------------------------------------

    // Puncture Risk from Sharp Food Edges
    const isPunctureProne =
      commodity.commodity_id === 'COMM-MEAT-005' || // Frozen prawns with sharp shells/rostrum
      commodity.commodity_id === 'COMM-MEAT-001' || // Bone-in meats
      commodity.commodity_id === 'COMM-BAKE-001';   // Crisp chips

    if (isPunctureProne && (material.puncture_resistance_j ?? 1.0) < 1.0) {
      warnings.push({
        id: 'HAZ-PHYS-PUNCTURE',
        severity: 'HIGH',
        category: 'CHEMICAL_MIGRATION',
        title: 'Physical Puncture & Micro-Leakage Hazard',
        message: `Sharp food particulate or crustacean shells may puncture thin packaging (puncture resistance ${material.puncture_resistance_j ?? '< 1.0'} J), destroying vacuum/MAP integrity and leading to rapid spoilage.`,
        remediation_suggestion: 'Incorporate biaxially oriented polyamide (BOPA Nylon) or high-gauge metallocene LLDPE puncture-resistant layer.'
      });
    }

    // Pinholing Risk in Low-Gauge Aluminum Foil
    if (material.layers) {
      const foilLayer = material.layers.find(l => l.material_code.includes('AL_FOIL'));
      if (foilLayer && foilLayer.thickness_um <= 7.0) {
        warnings.push({
          id: 'HAZ-PHYS-PINHOLE',
          severity: 'ADVISORY',
          category: 'CHEMICAL_MIGRATION',
          title: 'Aluminum Foil Micro-Pinhole Risk',
          message: `Ultra-thin aluminum foil (${foilLayer.thickness_um} µm) is susceptible to flex-crack pinholing during high-speed vertical form fill seal (VFFS) packing.`,
          remediation_suggestion: 'Increase foil gauge to minimum 9.0 µm or laminate with BOPA nylon.'
        });
      }
    }

    // MAP Anaerobic Toxin Hazard for Fresh Produce
    if (commodity.category === 'FRESH_PRODUCE' && barrierMetrics.effective_otr < 50.0 && storage.atmosphere !== 'AIR') {
      warnings.push({
        id: 'HAZ-MICRO-ANAEROBIC',
        severity: 'CRITICAL',
        category: 'REGULATORY_BREACH',
        title: 'Anaerobic Produce Fermentation Hazard',
        message: `Produce respiration in an ultra-high barrier package (OTR ${barrierMetrics.effective_otr} cm³/m²·day·atm) will deplete O2 below 1%, triggering anaerobic alcoholic fermentation, tissue breakdown, and potential Clostridium botulinum proliferation.`,
        remediation_suggestion: 'Use micro-perforated breathable films or tailored Equilibrium MAP (EMAP) with high gas transmission.'
      });
    }

    return warnings;
  }
}
