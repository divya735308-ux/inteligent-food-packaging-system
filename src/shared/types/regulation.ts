/**
 * Regulatory Compliance Domain Types
 * Based on PackSmart Master Specification Section 4.5 & 4.6
 */

export type Jurisdiction = 'FSSAI' | 'US_FDA' | 'EU_FCM' | 'CODEX';

export type FoodSimulant =
  | 'SIMULANT_A'   // 10% Ethanol (Aqueous/General)
  | 'SIMULANT_B'   // 3% Acetic Acid (Acidic foods pH < 4.5)
  | 'SIMULANT_C'   // 20% Ethanol (Alcoholic foods up to 20%)
  | 'SIMULANT_D1'  // 50% Ethanol (Dairy/fat-in-water emulsions)
  | 'SIMULANT_D2'  // Vegetable Oil / Isooctane (Fatty foods with free fats)
  | 'SIMULANT_E';  // Tenax (Dry foods)

export interface SpecificMigrationLimit {
  substance_name: string;
  cas_number?: string;
  sml_mg_per_kg: number; // in mg/kg food or food simulant
  description: string;
  restriction_condition?: string;
}

export interface RegulationRule {
  rule_id: string;
  jurisdiction: Jurisdiction;
  standard_code: string; // e.g. "IS 9845", "21 CFR 177.1520", "Regulation (EU) No 10/2011"
  standard_title: string;
  applicable_materials: string[]; // Material classes or specific polymers
  applicable_food_categories: string[];
  
  // Migration Limits
  overall_migration_limit_mg_dm2: number; // standard 10.0 mg/dm2
  overall_migration_limit_mg_kg: number;  // standard 60.0 mg/kg
  specific_migration_limits: SpecificMigrationLimit[];
  
  // Rules & Bans
  is_recycled_plastic_prohibited: boolean;
  requires_declaration_of_compliance: boolean;
  mandatory_labelling_clauses: string[];
  prohibited_substances: string[];
  specific_conditions: string[];
}

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'CONDITIONAL_PASS' | 'NOT_APPLICABLE';

export interface RegulatoryCheckResult {
  jurisdiction: Jurisdiction;
  standard_code: string;
  status: ComplianceStatus;
  overall_migration_pass: boolean;
  specific_migration_alerts: string[];
  mandatory_label_notes: string[];
  violations: string[];
  details: string;
}
