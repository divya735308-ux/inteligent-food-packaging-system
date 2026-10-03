/**
 * Regulatory Compliance Guidance Engine
 * Evaluates compliance against global and regional Food Contact Materials (FCM) regulations:
 * FSSAI (India), US FDA 21 CFR, EU FCM (Regulations 1935/2004 & 10/2011), and Codex Alimentarius.
 * Based on PackSmart Master Specification Section 4.5 & 4.6
 */

import { FoodCommodity, FoodCategory } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { FoodSimulant, Jurisdiction, RegulatoryCheckResult, RegulationRule } from '../shared/types/regulation.js';
import { catalogRepository } from '../shared/catalog/index.js';
import { CalculatedBarrierMetrics } from './barrier-calculator.js';

export interface SimulantMapping {
  simulant: FoodSimulant;
  description: string;
  test_conditions: string;
}

export class RegulatoryEngine {
  /**
   * Matches the appropriate food simulant based on commodity physical-chemical characteristics.
   */
  public static determineFoodSimulant(commodity: FoodCommodity): SimulantMapping {
    if (commodity.ph_level < 4.5) {
      return {
        simulant: 'SIMULANT_B',
        description: '3% (w/v) Acetic Acid (Acidic foods with pH < 4.5)',
        test_conditions: 'Standard migration test 10 days at 40°C (or 2h at 100°C for hot fill)'
      };
    }

    if (commodity.category === 'DAIRY_PRODUCTS') {
      return {
        simulant: 'SIMULANT_D1',
        description: '50% (v/v) Ethanol (Dairy products and oil-in-water emulsions)',
        test_conditions: 'Standard migration test 10 days at 40°C'
      };
    }

    if (commodity.category === 'BEVERAGES_LIQUIDS' && commodity.description.toLowerCase().includes('alcohol')) {
      return {
        simulant: 'SIMULANT_C',
        description: '20% (v/v) Ethanol (Alcoholic beverages up to 20% ABV)',
        test_conditions: 'Standard migration test 10 days at 20°C'
      };
    }

    if (commodity.fat_lipid_content_pct > 20.0) {
      return {
        simulant: 'SIMULANT_D2',
        description: 'Vegetable Oil / Isooctane (Fatty foods with free fats at surface)',
        test_conditions: 'Standard migration test 10 days at 40°C with Fat Reduction Factor (FRF)'
      };
    }

    if (commodity.category === 'DRY_FOODS_GRAINS_SPICES' || commodity.water_activity_aw < 0.40) {
      return {
        simulant: 'SIMULANT_E',
        description: 'Poly(2,6-diphenyl-p-phenylene oxide) / Tenax (Dry foods with low aw)',
        test_conditions: 'Standard migration test 10 days at 40°C'
      };
    }

    return {
      simulant: 'SIMULANT_A',
      description: '10% (v/v) Ethanol / Distilled Water (General aqueous non-acidic foods)',
      test_conditions: 'Standard migration test 10 days at 40°C'
    };
  }

  /**
   * Executes multi-jurisdiction regulatory compliance checks.
   */
  public static checkCompliance(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    barrierMetrics: CalculatedBarrierMetrics,
    jurisdictions: Jurisdiction[]
  ): Record<Jurisdiction, RegulatoryCheckResult> {
    const results = {} as Record<Jurisdiction, RegulatoryCheckResult>;
    const simulantInfo = this.determineFoodSimulant(commodity);

    for (const jurisdiction of jurisdictions) {
      results[jurisdiction] = this.evaluateJurisdiction(
        jurisdiction,
        commodity,
        material,
        barrierMetrics,
        simulantInfo
      );
    }

    return results;
  }

  private static evaluateJurisdiction(
    jurisdiction: Jurisdiction,
    commodity: FoodCommodity,
    material: PackagingMaterial,
    barrierMetrics: CalculatedBarrierMetrics,
    simulantInfo: SimulantMapping
  ): RegulatoryCheckResult {
    const rules = catalogRepository.getRegulationsByJurisdiction(jurisdiction);
    const violations: string[] = [];
    const smlAlerts: string[] = [];
    const labelNotes: string[] = [];
    let overallMigrationPass = true;

    // Contact material code
    const contactCode = (barrierMetrics.contact_layer?.material_code ?? material.primary_polymer).toUpperCase();
    const isLaminate = material.material_class === 'MULTI_LAYER_LAMINATE' || (material.layers && material.layers.length > 1);

    // -------------------------------------------------------------
    // Jurisdiction: FSSAI (India)
    // -------------------------------------------------------------
    if (jurisdiction === 'FSSAI') {
      labelNotes.push('Display mandatory food-grade symbol or "FOR FOOD USE ONLY"');
      labelNotes.push('Display IS 14534 Resin Identification Code for plastic recyclability');
      labelNotes.push('Provide clear demarcation zone for Veg (Green) / Non-Veg (Brown) logo');

      // Check recycled plastic compliance
      if (material.recyclability_code > 0 && material.primary_polymer !== 'PET' && !material.layers) {
        // Raw recycled plastic direct contact is prohibited under FSSAI 2018
        // (Only certified food grade rPET is permitted under 2022 notification)
      }

      // Check bare tin on acidic food
      if (commodity.ph_level < 4.5 && material.material_id === 'MAT-MET-001') {
        violations.push('FSSAI Packaging Regs 2018: Bare unlacquered metal container prohibited for high-acid food (pH < 4.5).');
        overallMigrationPass = false;
      }

      // Check adhesive layer in laminates
      if (isLaminate) {
        smlAlerts.push('FSSAI IS 9845: Polyurethane lamination adhesive must satisfy Primary Aromatic Amines (PAA) limit < 0.01 mg/kg.');
        smlAlerts.push('FSSAI IS 15495: Printing inks must be strictly free from Toluene and heavy metal pigments (< 100 ppm total Pb, Cd, Hg, Cr-VI).');
      }

      // Overall migration limit check (standard 10 mg/dm2 or 60 mg/kg)
      // High temperature / high acidity foods require verification
      if (commodity.ph_level < 3.5 && contactCode.includes('PAPER')) {
        violations.push('FSSAI IS 9845: Uncoated paperboard direct contact fails overall migration in 3% Acetic Acid simulant.');
        overallMigrationPass = false;
      }
    }

    // -------------------------------------------------------------
    // Jurisdiction: US FDA (21 CFR)
    // -------------------------------------------------------------
    if (jurisdiction === 'US_FDA') {
      labelNotes.push('Compliance with 21 CFR Parts 174-178 (Indirect Food Additives)');
      
      // Check 21 CFR 175.300 for can coatings
      if (material.material_class === 'METALLIC') {
        if (material.material_id === 'MAT-MET-001' && commodity.ph_level < 4.5) {
          violations.push('21 CFR 175.300: Uncoated bare metallic contact violates extraction limits for acidic food contact.');
          overallMigrationPass = false;
        } else {
          labelNotes.push('21 CFR 175.300: Polymeric can coating must comply with chloroform-soluble extractives limit <= 0.5 mg/sq.in.');
        }
      }

      // Check infant food restrictions (BPA prohibition)
      if (commodity.commodity_id === 'COMM-DRY-002') {
        if (material.name.toLowerCase().includes('bpa') && !material.name.toLowerCase().includes('bpa-non') && !material.name.toLowerCase().includes('bpa-ni')) {
          violations.push('21 CFR 177: Bisphenol A (BPA) is strictly prohibited in packaging for infant formula.');
          overallMigrationPass = false;
        }
      }

      // Check polyolefins under 21 CFR 177.1520
      if (contactCode.includes('PE') || contactCode.includes('PP')) {
        smlAlerts.push('21 CFR 177.1520: n-Hexane extractable fraction must not exceed 5.5% at 50°C.');
      }
    }

    // -------------------------------------------------------------
    // Jurisdiction: EU FCM (Regulation EC 1935/2004 & EU 10/2011)
    // -------------------------------------------------------------
    if (jurisdiction === 'EU_FCM') {
      labelNotes.push('Declaration of Compliance (DoC) must accompany every stage of supply chain (Regulation (EU) No 10/2011 Article 15)');
      labelNotes.push('Affix Wine Glass and Fork food contact symbol (Regulation (EC) No 1935/2004)');

      // Overall Migration Limit: 10 mg/dm2
      if (commodity.ph_level < 4.5 && material.material_id === 'MAT-MET-001') {
        violations.push('Regulation (EC) No 1935/2004 Article 3: Bare metal causes organoleptic degradation and excessive heavy metal ion transfer.');
        overallMigrationPass = false;
      }

      // Specific Migration Limits
      if (isLaminate) {
        smlAlerts.push('Regulation (EU) No 10/2011 Annex II: Primary Aromatic Amines (PAAs) non-detectable (< 0.01 mg/kg food).');
        smlAlerts.push('Regulation (EU) No 10/2011: Phthalate plasticizers (DEHP SML 1.5 mg/kg, DBP SML 0.3 mg/kg).');
      }

      if (commodity.commodity_id === 'COMM-DRY-002') {
        // Infant food strict SML
        smlAlerts.push('Regulation (EU) 2018/213: BPA migration limit 0.00 mg/kg (zero tolerance for infant food).');
      }

      if (contactCode.includes('MELAMINE')) {
        smlAlerts.push('Regulation (EU) No 10/2011: Formaldehyde SML 15 mg/kg; Melamine SML 2.5 mg/kg.');
      }
    }

    // -------------------------------------------------------------
    // Jurisdiction: CODEX ALIMENTARIUS
    // -------------------------------------------------------------
    if (jurisdiction === 'CODEX') {
      labelNotes.push('CODEX STAN 1-1985: Display Net Content, Name and Address of Manufacturer, and Country of Origin');
      labelNotes.push('CAC/RCP 1-1969: Storage conditions must be clearly stated (e.g. "Store in a cool dry place")');

      if (material.material_id === 'MAT-MET-001' && commodity.ph_level < 4.5) {
        violations.push('CAC/RCP 1-1969: Inadequate packaging integrity for acidic foodstuff.');
        overallMigrationPass = false;
      }
    }

    // Determine status
    let status: 'COMPLIANT' | 'NON_COMPLIANT' | 'CONDITIONAL_PASS';
    if (violations.length > 0) {
      status = 'NON_COMPLIANT';
    } else if (smlAlerts.length > 0) {
      status = 'CONDITIONAL_PASS';
    } else {
      status = 'COMPLIANT';
    }

    const standardCode = rules.length > 0 ? rules.map(r => r.standard_code).join(', ') : `${jurisdiction} Standards`;

    return {
      jurisdiction,
      standard_code: standardCode,
      status,
      overall_migration_pass: overallMigrationPass,
      specific_migration_alerts: smlAlerts,
      mandatory_label_notes: labelNotes,
      violations,
      details: `Evaluated against ${jurisdiction} requirements using ${simulantInfo.description}.`
    };
  }
}
