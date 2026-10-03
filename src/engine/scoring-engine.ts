/**
 * Packaging Fitness Index (PFI) & Multi-Attribute Scoring Engine
 * Computes weighted multi-factor fitness score and alert severity levels.
 * Based on PackSmart Master Specification Section 4.8
 */

import { PackagingMaterial } from '../shared/types/material.js';
import { FitnessScores, HazardWarning } from '../shared/types/analysis.js';
import { Jurisdiction, RegulatoryCheckResult } from '../shared/types/regulation.js';

export class ScoringEngine {
  /**
   * Computes the Packaging Fitness Index (PFI) and component scores.
   * Formula: PFI = 0.35 * C_compat + 0.30 * S_shelflife + 0.20 * R_reg + 0.15 * E_eco
   */
  public static calculateScores(
    compatibilityScore: number,
    shelfLifeScore: number,
    regulatoryResults: Record<Jurisdiction, RegulatoryCheckResult>,
    material: PackagingMaterial,
    allWarnings: HazardWarning[]
  ): FitnessScores {
    // -------------------------------------------------------------
    // 1. Regulatory Compliance Score (R_reg: 0 - 100)
    // -------------------------------------------------------------
    let regScore = 100;
    const jurisdictionEntries = Object.values(regulatoryResults);

    for (const res of jurisdictionEntries) {
      if (res.status === 'NON_COMPLIANT' || res.violations.length > 0) {
        regScore = 0; // Hard zero on any critical legal violation
        break;
      } else if (res.status === 'CONDITIONAL_PASS' || res.specific_migration_alerts.length > 0) {
        regScore = Math.min(regScore, 80);
      }
    }

    // -------------------------------------------------------------
    // 2. Sustainability & Eco Score (E_eco: 0 - 100)
    // -------------------------------------------------------------
    let ecoScore = 20; // baseline

    // Recyclability component
    if (material.is_compostable) {
      ecoScore += 45;
    } else if (material.recyclability_code >= 1 && material.recyclability_code <= 5) {
      ecoScore += 40;
    } else if (material.material_class === 'GLASS' || material.material_class === 'METALLIC') {
      ecoScore += 35; // infinitely recyclable materials
    } else {
      ecoScore += 5; // multi-layer composite code 0 or 7
    }

    // Bio-based content component (0 - 100%)
    ecoScore += Math.round((material.bio_based_content_pct / 100) * 35);
    ecoScore = Math.min(100, Math.max(10, ecoScore));

    // -------------------------------------------------------------
    // 3. Composite PFI Calculation
    // -------------------------------------------------------------
    const cCompat = Math.min(100, Math.max(0, compatibilityScore));
    const sShelfLife = Math.min(100, Math.max(0, shelfLifeScore));
    const rReg = Math.min(100, Math.max(0, regScore));
    const eEco = ecoScore;

    let overallPfi = 0.35 * cCompat + 0.30 * sShelfLife + 0.20 * rReg + 0.15 * eEco;

    // Safety Gate: If any critical hazard or legal violation exists, PFI is capped below 40 (Incompatible)
    const hasCriticalHazard = allWarnings.some(w => w.severity === 'CRITICAL');
    if (hasCriticalHazard || rReg === 0) {
      overallPfi = Math.min(38.0, overallPfi);
    }

    return {
      overall_pfi: parseFloat(overallPfi.toFixed(1)),
      compatibility_score: parseFloat(cCompat.toFixed(1)),
      shelf_life_score: parseFloat(sShelfLife.toFixed(1)),
      regulatory_score: parseFloat(rReg.toFixed(1)),
      sustainability_score: parseFloat(eEco.toFixed(1))
    };
  }

  /**
   * Determines overall compatibility status from scores and warnings.
   */
  public static determineFinalStatus(
    scores: FitnessScores,
    warnings: HazardWarning[]
  ): 'OPTIMAL' | 'COMPATIBLE_WITH_CONDITIONS' | 'SUB_OPTIMAL' | 'INCOMPATIBLE' {
    if (warnings.some(w => w.severity === 'CRITICAL') || scores.regulatory_score === 0 || scores.overall_pfi < 40) {
      return 'INCOMPATIBLE';
    }

    if (warnings.some(w => w.severity === 'HIGH') || scores.overall_pfi < 75) {
      return 'COMPATIBLE_WITH_CONDITIONS';
    }

    if (scores.overall_pfi < 90) {
      return 'SUB_OPTIMAL';
    }

    return 'OPTIMAL';
  }
}
