import { z } from 'zod';

export const FoodCategoryEnum = z.enum([
  'FRESH_PRODUCE',
  'DAIRY_PRODUCTS',
  'BAKERY_CONFECTIONERY',
  'MEAT_POULTRY_SEAFOOD',
  'FATS_AND_OILS',
  'BEVERAGES_LIQUIDS',
  'DRY_FOODS_GRAINS_SPICES',
  'PROCESSED_RETORT_RTE'
]);

export const PhysicalStateEnum = z.enum([
  'SOLID',
  'LIQUID',
  'SEMI_SOLID',
  'POWDER',
  'VISCOUS',
  'GRANULAR',
  'WHOLE_PRODUCE',
  'CUT_PRODUCE'
]);

export const AcidityTypeEnum = z.enum([
  'NON_ACID',
  'HIGH_ACID',
  'CITRIC',
  'ACETIC',
  'LACTIC',
  'MALIC',
  'PHOSPHORIC'
]);

export const SensitivityLevelEnum = z.enum(['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'NONE']);

export const RespirationMetricsSchema = z.object({
  rate_mg_co2_kg_hr: z.number().min(0),
  optimal_o2_range_pct: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]),
  optimal_co2_range_pct: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)])
});

export const FoodCommoditySchema = z.object({
  commodity_id: z.string().min(1),
  name: z.string().min(1),
  category: FoodCategoryEnum,
  description: z.string().min(1),
  physical_state: PhysicalStateEnum,
  
  // Chemical & Physical Properties
  ph_level: z.number().min(1.0).max(14.0),
  water_activity_aw: z.number().min(0.0).max(1.0),
  moisture_content_pct: z.number().min(0.0).max(100.0),
  fat_lipid_content_pct: z.number().min(0.0).max(100.0),
  acidity_type: AcidityTypeEnum,
  
  // Spoilage Sensitivities
  oxidation_sensitivity: SensitivityLevelEnum,
  light_sensitivity: SensitivityLevelEnum,
  moisture_sensitivity: SensitivityLevelEnum,
  ethylene_sensitivity: SensitivityLevelEnum,
  microbial_risk_level: SensitivityLevelEnum,
  
  // Respiration
  respiration_metrics: RespirationMetricsSchema.optional(),
  
  // Quality & Preservation Thresholds
  critical_moisture_gain_pct: z.number().min(0).max(100).optional(),
  critical_moisture_loss_pct: z.number().min(0).max(100).optional(),
  critical_o2_uptake_ppm: z.number().min(0).optional(),
  target_shelf_life_days: z.number().min(1),
  recommended_storage_temp_c: z.number().min(-50).max(100),
  recommended_storage_rh_pct: z.number().min(0).max(100)
});

export type FoodCommodityInput = z.infer<typeof FoodCommoditySchema>;
