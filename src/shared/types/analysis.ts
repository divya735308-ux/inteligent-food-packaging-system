/**
 * Analysis & Assessment Domain Types
 * Based on PackSmart Master Specification Section 4.3, 4.4, 4.8, 7.1
 */

import { FoodCommodity } from './commodity.js';
import { MaterialLayer, PackagingMaterial } from './material.js';
import { Jurisdiction, RegulatoryCheckResult } from './regulation.js';

export type AtmosphereType =
  | 'AIR'
  | 'VACUUM'
  | 'MAP_NITROGEN_FLUSH'
  | 'MAP_HIGH_OXYGEN'
  | 'MAP_BALANCED_CO2_N2';

export interface MapGasRatio {
  o2_pct: number;
  co2_pct: number;
  n2_pct: number;
}

export interface StorageCondition {
  temperature_c: number;
  relative_humidity_pct: number;
  atmosphere: AtmosphereType;
  map_gas_ratio?: MapGasRatio;
  target_shelf_life_days: number;
  package_surface_area_dm2?: number; // default 2.0 dm2
  package_weight_grams?: number;      // default 250g food
}

export type HazardSeverity = 'CRITICAL' | 'HIGH' | 'ADVISORY' | 'PASS';

export interface HazardWarning {
  id: string;
  severity: HazardSeverity;
  category: 'CHEMICAL_MIGRATION' | 'ACID_CORROSION' | 'LIPID_SCALPING' | 'OXIDATION' | 'MOISTURE_DEGRADATION' | 'THERMAL_FAILURE' | 'SUSTAINABILITY' | 'REGULATORY_BREACH';
  title: string;
  message: string;
  remediation_suggestion: string;
}

export interface DegradationPoint {
  day: number;
  moisture_content_pct: number;
  dissolved_headspace_o2_pct: number;
  quality_retention_pct: number;
}

export interface AIAdvisory {
  summary: string;
  optimization_suggestions: string[];
  safe_handling_tips: string;
  eco_alternatives?: string[];
  is_fallback_mode?: boolean;
}

export interface AnalysisRequest {
  commodity_id: string;
  custom_commodity_overrides?: Partial<FoodCommodity>;
  material_id: string;
  custom_material_layers?: MaterialLayer[];
  storage_conditions: StorageCondition;
  jurisdictions: Jurisdiction[];
}

export interface FitnessScores {
  overall_pfi: number;        // 0.0 - 100.0
  compatibility_score: number; // 0.0 - 100.0
  shelf_life_score: number;    // 0.0 - 100.0
  regulatory_score: number;    // 0.0 - 100.0
  sustainability_score: number;// 0.0 - 100.0
}

export interface AnalysisResult {
  analysis_id: string;
  timestamp: string;
  commodity: FoodCommodity;
  material: PackagingMaterial;
  storage: StorageCondition;
  compatibility_status: 'OPTIMAL' | 'COMPATIBLE_WITH_CONDITIONS' | 'SUB_OPTIMAL' | 'INCOMPATIBLE';
  fitness_index_score: number;
  scores: FitnessScores;
  predicted_shelf_life_days: number;
  limiting_failure_mode: string;
  warnings: HazardWarning[];
  regulatory_compliance: Record<Jurisdiction, RegulatoryCheckResult>;
  degradation_timeline?: DegradationPoint[];
  ai_advisory?: AIAdvisory;
}
