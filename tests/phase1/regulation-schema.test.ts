import { describe, it, expect } from 'vitest';
import { RegulationRuleSchema } from '../../src/shared/schemas/regulation-schema.js';

describe('Phase 1: RegulationRule Schema & Validation', () => {
  it('should validate a valid FSSAI regulation rule', () => {
    const validRule = {
      rule_id: 'REG-TEST-001',
      jurisdiction: 'FSSAI',
      standard_code: 'IS 9845',
      standard_title: 'Method of analysis for determination of specific and overall migration',
      applicable_materials: ['THERMOPLASTIC_MONO', 'MULTI_LAYER_LAMINATE'],
      applicable_food_categories: ['DAIRY_PRODUCTS', 'BAKERY_CONFECTIONERY'],
      overall_migration_limit_mg_dm2: 10.0,
      overall_migration_limit_mg_kg: 60.0,
      specific_migration_limits: [
        {
          substance_name: 'Lead (Pb)',
          sml_mg_per_kg: 0.01,
          description: 'Toxic heavy metal limit'
        }
      ],
      is_recycled_plastic_prohibited: true,
      requires_declaration_of_compliance: true,
      mandatory_labelling_clauses: ['Mandatory veg/non-veg logo area'],
      prohibited_substances: ['Toluene in printing ink'],
      specific_conditions: ['Must pass overall migration test with 3% acetic acid']
    };

    const parsed = RegulationRuleSchema.safeParse(validRule);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.jurisdiction).toBe('FSSAI');
      expect(parsed.data.overall_migration_limit_mg_dm2).toBe(10.0);
    }
  });

  it('should reject unknown jurisdiction', () => {
    const invalidRule = {
      rule_id: 'REG-TEST-002',
      jurisdiction: 'UNKNOWN_REGION', // Invalid jurisdiction
      standard_code: 'XYZ-100',
      standard_title: 'Invalid standard',
      applicable_materials: ['GLASS'],
      applicable_food_categories: ['BEVERAGES_LIQUIDS'],
      overall_migration_limit_mg_dm2: 10.0,
      overall_migration_limit_mg_kg: 60.0,
      specific_migration_limits: [],
      is_recycled_plastic_prohibited: false,
      requires_declaration_of_compliance: false,
      mandatory_labelling_clauses: [],
      prohibited_substances: [],
      specific_conditions: []
    };

    const parsed = RegulationRuleSchema.safeParse(invalidRule);
    expect(parsed.success).toBe(false);
  });
});
