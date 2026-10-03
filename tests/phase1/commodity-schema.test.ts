import { describe, it, expect } from 'vitest';
import { FoodCommoditySchema } from '../../src/shared/schemas/commodity-schema.js';

describe('Phase 1: FoodCommodity Schema & Validation', () => {
  it('should successfully validate a well-formed food commodity', () => {
    const validCommodity = {
      commodity_id: 'TEST-COMM-001',
      name: 'Test Milk Powder',
      category: 'DAIRY_PRODUCTS',
      description: 'Spray dried whole milk powder test sample',
      physical_state: 'POWDER',
      ph_level: 6.6,
      water_activity_aw: 0.20,
      moisture_content_pct: 3.2,
      fat_lipid_content_pct: 26.0,
      acidity_type: 'NON_ACID',
      oxidation_sensitivity: 'HIGH',
      light_sensitivity: 'HIGH',
      moisture_sensitivity: 'CRITICAL',
      ethylene_sensitivity: 'NONE',
      microbial_risk_level: 'LOW',
      target_shelf_life_days: 365,
      recommended_storage_temp_c: 20.0,
      recommended_storage_rh_pct: 50.0
    };

    const parsed = FoodCommoditySchema.safeParse(validCommodity);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid pH values (< 1.0 or > 14.0)', () => {
    const invalidPhCommodity = {
      commodity_id: 'TEST-COMM-002',
      name: 'Invalid pH Item',
      category: 'BEVERAGES_LIQUIDS',
      description: 'Test description',
      physical_state: 'LIQUID',
      ph_level: 15.5, // Invalid pH
      water_activity_aw: 0.99,
      moisture_content_pct: 90.0,
      fat_lipid_content_pct: 0.0,
      acidity_type: 'CITRIC',
      oxidation_sensitivity: 'LOW',
      light_sensitivity: 'LOW',
      moisture_sensitivity: 'LOW',
      ethylene_sensitivity: 'NONE',
      microbial_risk_level: 'LOW',
      target_shelf_life_days: 90,
      recommended_storage_temp_c: 4.0,
      recommended_storage_rh_pct: 70.0
    };

    const parsed = FoodCommoditySchema.safeParse(invalidPhCommodity);
    expect(parsed.success).toBe(false);
  });

  it('should reject invalid water activity (aw > 1.0 or < 0.0)', () => {
    const invalidAwCommodity = {
      commodity_id: 'TEST-COMM-003',
      name: 'Invalid Aw Item',
      category: 'BAKERY_CONFECTIONERY',
      description: 'Test description',
      physical_state: 'SOLID',
      ph_level: 6.0,
      water_activity_aw: 1.25, // Invalid aw > 1.0
      moisture_content_pct: 10.0,
      fat_lipid_content_pct: 5.0,
      acidity_type: 'NON_ACID',
      oxidation_sensitivity: 'LOW',
      light_sensitivity: 'LOW',
      moisture_sensitivity: 'LOW',
      ethylene_sensitivity: 'NONE',
      microbial_risk_level: 'LOW',
      target_shelf_life_days: 90,
      recommended_storage_temp_c: 20.0,
      recommended_storage_rh_pct: 50.0
    };

    const parsed = FoodCommoditySchema.safeParse(invalidAwCommodity);
    expect(parsed.success).toBe(false);
  });

  it('should validate fresh produce with respiration metrics', () => {
    const produceItem = {
      commodity_id: 'TEST-PROD-001',
      name: 'Test Strawberries',
      category: 'FRESH_PRODUCE',
      description: 'Fresh berry sample',
      physical_state: 'WHOLE_PRODUCE',
      ph_level: 3.5,
      water_activity_aw: 0.98,
      moisture_content_pct: 90.0,
      fat_lipid_content_pct: 0.2,
      acidity_type: 'CITRIC',
      oxidation_sensitivity: 'LOW',
      light_sensitivity: 'MODERATE',
      moisture_sensitivity: 'CRITICAL',
      ethylene_sensitivity: 'LOW',
      microbial_risk_level: 'CRITICAL',
      respiration_metrics: {
        rate_mg_co2_kg_hr: 45.0,
        optimal_o2_range_pct: [3, 5],
        optimal_co2_range_pct: [10, 15]
      },
      target_shelf_life_days: 7,
      recommended_storage_temp_c: 1.0,
      recommended_storage_rh_pct: 95.0
    };

    const parsed = FoodCommoditySchema.safeParse(produceItem);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.respiration_metrics?.rate_mg_co2_kg_hr).toBe(45.0);
    }
  });
});
