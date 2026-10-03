/**
 * Packaging Material Domain Types
 * Based on PackSmart Master Specification Section 4.2
 */

export type MaterialClass =
  | 'THERMOPLASTIC_MONO'
  | 'BIO_BASED_POLYMER'
  | 'MULTI_LAYER_LAMINATE'
  | 'METALLIC'
  | 'GLASS'
  | 'PAPER_BOARD'
  | 'ACTIVE_SMART';

export type PolymerCode =
  | 'LDPE'
  | 'LLDPE'
  | 'HDPE'
  | 'PP'
  | 'BOPP'
  | 'CAST_PP'
  | 'PET'
  | 'BOPET'
  | 'PVC'
  | 'PVDC'
  | 'EVOH'
  | 'PA_NYLON'
  | 'PLA'
  | 'PHA'
  | 'PBS'
  | 'CELLULOSE'
  | 'AL_FOIL'
  | 'METALLIZED_FILM'
  | 'TINPLATE'
  | 'GLASS_SODA_LIME'
  | 'PAPER_KRAFT'
  | 'PAPER_SBS';

export type LayerRole = 'OUTER_PRINT' | 'BARRIER' | 'TIE_ADHESIVE' | 'SEALANT_CONTACT' | 'STRUCTURAL';

export interface MaterialLayer {
  layer_order: number;         // 1 = outermost (external), N = innermost (direct food contact)
  material_code: PolymerCode | string;
  name: string;
  role: LayerRole;
  thickness_um: number;        // in microns (µm)
  otr_contribution?: number;   // OTR of layer at this thickness (cm3/m2·day·atm)
  wvtr_contribution?: number;  // WVTR of layer at this thickness (g/m2·day)
}

export interface ActiveSmartAttributes {
  type: 'OXYGEN_SCAVENGER' | 'MOISTURE_ABSORBER' | 'ETHYLENE_SCRUBBER' | 'CO2_EMITTER' | 'ANTIMICROBIAL' | 'TTI_INDICATOR' | 'FRESHNESS_INDICATOR';
  capacity_description: string;
  active_substance: string;
  migration_compliance: boolean;
}

export interface PackagingMaterial {
  material_id: string;
  name: string;
  commercial_designation: string;
  material_class: MaterialClass;
  primary_polymer: PolymerCode | string;
  default_thickness_um: number; // default baseline gauge
  
  // Barrier Properties (Normalized at default gauge)
  otr: number;                  // Oxygen Transmission Rate (cm³/m²·day·atm at 23°C, 0% RH)
  wvtr: number;                 // Water Vapor Transmission Rate (g/m²·day at 38°C, 90% RH)
  co2tr: number;                // CO2 Transmission Rate (cm³/m²·day·atm)
  light_transmittance_pct: number; // 200-800nm Transmittance % (0 = absolute opaque, 100 = clear)
  
  // Thermal & Mechanical Properties
  max_temperature_c: number;    // Maximum safe temperature (e.g., 121°C retort, 100°C boil)
  min_temperature_c: number;    // Minimum temperature before embrittlement (e.g., -40°C)
  tensile_strength_mpa: number; // MPa
  seal_strength_n_15mm: number; // N per 15mm seal width
  grease_resistance_kit: number;// 1 to 12 rating (12 = extreme grease resistance)
  puncture_resistance_j?: number; // Joules
  
  // Multi-layer composition (if laminate)
  layers?: MaterialLayer[];
  
  // Active/Smart attributes (if applicable)
  active_smart_features?: ActiveSmartAttributes;
  
  // Environmental & Economic Attributes
  recyclability_code: number;   // SPI Resin code 1-7 or 0 for multi-material non-recyclable
  is_compostable: boolean;
  compostability_standard?: 'EN_13432' | 'ASTM_D6400' | 'HOME_COMPOST' | 'NONE';
  bio_based_content_pct: number; // 0.0 - 100.0%
  relative_cost_index: number;  // 1.0 (Low cost) to 5.0 (Ultra-premium)
  
  // Description & Common Applications
  suitable_food_types: string[];
  incompatible_food_types: string[];
}
