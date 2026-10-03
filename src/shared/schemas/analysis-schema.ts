import { z } from 'zod';
import { FoodCommoditySchema } from './commodity-schema.js';
import { MaterialLayerSchema, PackagingMaterialSchema } from './material-schema.js';
import { JurisdictionEnum, RegulationRuleSchema } from './regulation-schema.js';

export const AtmosphereTypeEnum = z.enum([
  'AIR',
  'VACUUM',
  'MAP_NITROGEN_FLUSH',
  'MAP_HIGH_OXYGEN',
  'MAP_BALANCED_CO2_N2'
]);

export const MapGasRatioSchema = z.object({
  o2_pct: z.number().min(0).max(100),
  co2_pct: z.number().min(0).max(100),
  n2_pct: z.number().min(0).max(100)
}).refine(
  data => Math.abs(data.o2_pct + data.co2_pct + data.n2_pct - 100) < 1.0,
  { message: 'Gas ratios must sum to approximately 100%' }
);

export const StorageConditionSchema = z.object({
  temperature_c: z.number().min(-50).max(150),
  relative_humidity_pct: z.number().min(0).max(100),
  atmosphere: AtmosphereTypeEnum,
  map_gas_ratio: MapGasRatioSchema.optional(),
  target_shelf_life_days: z.number().min(1),
  package_surface_area_dm2: z.number().positive().default(2.0),
  package_weight_grams: z.number().positive().default(250.0)
});

export const AnalysisRequestSchema = z.object({
  commodity_id: z.string().min(1),
  custom_commodity_overrides: FoodCommoditySchema.partial().optional(),
  material_id: z.string().min(1),
  custom_material_layers: z.array(MaterialLayerSchema).optional(),
  storage_conditions: StorageConditionSchema,
  jurisdictions: z.array(JurisdictionEnum).min(1)
});

export type AnalysisRequestInput = z.infer<typeof AnalysisRequestSchema>;
