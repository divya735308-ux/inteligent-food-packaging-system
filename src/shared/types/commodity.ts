/**
 * Food Commodity Domain Types
 * Based on PackSmart Master Specification Section 4.1
 */

export type FoodCategory =
  | 'FRESH_PRODUCE'
  | 'DAIRY_PRODUCTS'
  | 'BAKERY_CONFECTIONERY'
  | 'MEAT_POULTRY_SEAFOOD'
  | 'FATS_AND_OILS'
  | 'BEVERAGES_LIQUIDS'
  | 'DRY_FOODS_GRAINS_SPICES'
  | 'PROCESSED_RETORT_RTE';

export type PhysicalState =
  | 'SOLID'
  | 'LIQUID'
  | 'SEMI_SOLID'
  | 'POWDER'
  | 'VISCOUS'
  | 'GRANULAR'
  | 'WHOLE_PRODUCE'
  | 'CUT_PRODUCE';

export type AcidityType =
  | 'NON_ACID'     // pH > 4.6
  | 'HIGH_ACID'    // pH <= 4.6
  | 'CITRIC'
  | 'ACETIC'
  | 'LACTIC'
  | 'MALIC'
  | 'PHOSPHORIC';

export type SensitivityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';

export interface RespirationMetrics {
  rate_mg_co2_kg_hr: number; // Respiration rate at reference temp (typically 5°C or 20°C)
  optimal_o2_range_pct: [number, number]; // e.g. [2, 5] for MAP
  optimal_co2_range_pct: [number, number]; // e.g. [3, 8] for MAP
}

export interface FoodCommodity {
  commodity_id: string;
  name: string;
  category: FoodCategory;
  description: string;
  physical_state: PhysicalState;
  
  // Chemical & Physical Properties
  ph_level: number;                 // 1.0 - 14.0
  water_activity_aw: number;        // 0.00 - 1.00
  moisture_content_pct: number;     // 0.0 - 100.0%
  fat_lipid_content_pct: number;    // 0.0 - 100.0%
  acidity_type: AcidityType;
  
  // Spoilage Sensitivities
  oxidation_sensitivity: SensitivityLevel;
  light_sensitivity: SensitivityLevel;
  moisture_sensitivity: SensitivityLevel;
  ethylene_sensitivity: SensitivityLevel;
  microbial_risk_level: SensitivityLevel;
  
  // Respiration (Produce only)
  respiration_metrics?: RespirationMetrics;
  
  // Quality & Preservation Thresholds
  critical_moisture_gain_pct?: number; // delta moisture that causes crispness loss or caking
  critical_moisture_loss_pct?: number; // delta moisture causing shrinkage
  critical_o2_uptake_ppm?: number;    // maximum O2 absorbed before rancidity
  target_shelf_life_days: number;     // baseline target shelf-life under recommended storage
  recommended_storage_temp_c: number; // e.g. 4.0 for cold chain, 25.0 for ambient
  recommended_storage_rh_pct: number;  // e.g. 60.0 for dry, 90.0 for produce
}
