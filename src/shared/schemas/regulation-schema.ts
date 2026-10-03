import { z } from 'zod';

export const JurisdictionEnum = z.enum(['FSSAI', 'US_FDA', 'EU_FCM', 'CODEX']);

export const SpecificMigrationLimitSchema = z.object({
  substance_name: z.string().min(1),
  cas_number: z.string().optional(),
  sml_mg_per_kg: z.number().min(0),
  description: z.string().min(1),
  restriction_condition: z.string().optional()
});

export const RegulationRuleSchema = z.object({
  rule_id: z.string().min(1),
  jurisdiction: JurisdictionEnum,
  standard_code: z.string().min(1),
  standard_title: z.string().min(1),
  applicable_materials: z.array(z.string()),
  applicable_food_categories: z.array(z.string()),
  
  // Migration Limits
  overall_migration_limit_mg_dm2: z.number().min(0),
  overall_migration_limit_mg_kg: z.number().min(0),
  specific_migration_limits: z.array(SpecificMigrationLimitSchema),
  
  // Rules & Restrictions
  is_recycled_plastic_prohibited: z.boolean(),
  requires_declaration_of_compliance: z.boolean(),
  mandatory_labelling_clauses: z.array(z.string()),
  prohibited_substances: z.array(z.string()),
  specific_conditions: z.array(z.string())
});

export type RegulationRuleInput = z.infer<typeof RegulationRuleSchema>;
