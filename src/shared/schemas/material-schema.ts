import { z } from 'zod';

export const MaterialClassEnum = z.enum([
  'THERMOPLASTIC_MONO',
  'BIO_BASED_POLYMER',
  'MULTI_LAYER_LAMINATE',
  'METALLIC',
  'GLASS',
  'PAPER_BOARD',
  'ACTIVE_SMART'
]);

export const LayerRoleEnum = z.enum([
  'OUTER_PRINT',
  'BARRIER',
  'TIE_ADHESIVE',
  'SEALANT_CONTACT',
  'STRUCTURAL'
]);

export const MaterialLayerSchema = z.object({
  layer_order: z.number().int().min(1),
  material_code: z.string().min(1),
  name: z.string().min(1),
  role: LayerRoleEnum,
  thickness_um: z.number().positive(),
  otr_contribution: z.number().min(0).optional(),
  wvtr_contribution: z.number().min(0).optional()
});

export const ActiveSmartAttributesSchema = z.object({
  type: z.enum([
    'OXYGEN_SCAVENGER',
    'MOISTURE_ABSORBER',
    'ETHYLENE_SCRUBBER',
    'CO2_EMITTER',
    'ANTIMICROBIAL',
    'TTI_INDICATOR',
    'FRESHNESS_INDICATOR'
  ]),
  capacity_description: z.string().min(1),
  active_substance: z.string().min(1),
  migration_compliance: z.boolean()
});

export const PackagingMaterialSchema = z.object({
  material_id: z.string().min(1),
  name: z.string().min(1),
  commercial_designation: z.string().min(1),
  material_class: MaterialClassEnum,
  primary_polymer: z.string().min(1),
  default_thickness_um: z.number().positive(),
  
  // Barrier Properties
  otr: z.number().min(0),
  wvtr: z.number().min(0),
  co2tr: z.number().min(0),
  light_transmittance_pct: z.number().min(0).max(100),
  
  // Thermal & Mechanical Properties
  max_temperature_c: z.number(),
  min_temperature_c: z.number(),
  tensile_strength_mpa: z.number().min(0),
  seal_strength_n_15mm: z.number().min(0),
  grease_resistance_kit: z.number().min(1).max(12),
  puncture_resistance_j: z.number().min(0).optional(),
  
  // Multi-layer composition
  layers: z.array(MaterialLayerSchema).optional(),
  
  // Active/Smart attributes
  active_smart_features: ActiveSmartAttributesSchema.optional(),
  
  // Environmental & Economic
  recyclability_code: z.number().int().min(0).max(7),
  is_compostable: z.boolean(),
  compostability_standard: z.enum(['EN_13432', 'ASTM_D6400', 'HOME_COMPOST', 'NONE']).optional(),
  bio_based_content_pct: z.number().min(0).max(100),
  relative_cost_index: z.number().min(1.0).max(5.0),
  
  suitable_food_types: z.array(z.string()),
  incompatible_food_types: z.array(z.string())
});

export type PackagingMaterialInput = z.infer<typeof PackagingMaterialSchema>;
