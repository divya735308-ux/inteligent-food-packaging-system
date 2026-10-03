import { describe, it, expect } from 'vitest';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { SEED_COMMODITIES } from '../../src/shared/data/seed-commodities.js';
import { SEED_MATERIALS } from '../../src/shared/data/seed-materials.js';
import { SEED_REGULATIONS } from '../../src/shared/data/seed-regulations.js';
import { FoodCommoditySchema } from '../../src/shared/schemas/commodity-schema.js';
import { PackagingMaterialSchema } from '../../src/shared/schemas/material-schema.js';
import { RegulationRuleSchema } from '../../src/shared/schemas/regulation-schema.js';

describe('Phase 1: Seed Knowledge Base Integrity & Catalog Tests', () => {
  describe('Seed Commodities Dataset', () => {
    it('should have at least 50 validated food commodities', () => {
      expect(SEED_COMMODITIES.length).toBeGreaterThanOrEqual(50);
    });

    it('should have unique commodity IDs for all items', () => {
      const ids = SEED_COMMODITIES.map(c => c.commodity_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should cover all 8 food categories specified in spec.md', () => {
      const requiredCategories = [
        'FRESH_PRODUCE',
        'DAIRY_PRODUCTS',
        'BAKERY_CONFECTIONERY',
        'MEAT_POULTRY_SEAFOOD',
        'FATS_AND_OILS',
        'BEVERAGES_LIQUIDS',
        'DRY_FOODS_GRAINS_SPICES',
        'PROCESSED_RETORT_RTE'
      ] as const;

      for (const category of requiredCategories) {
        const items = catalogRepository.getCommoditiesByCategory(category);
        expect(items.length).toBeGreaterThan(0);
      }
    });

    it('should pass Zod schema validation for 100% of seed commodities', () => {
      for (const commodity of SEED_COMMODITIES) {
        const result = FoodCommoditySchema.safeParse(commodity);
        expect(result.success, `Failed validating commodity: ${commodity.commodity_id} - ${commodity.name}`).toBe(true);
      }
    });

    it('should have valid realistic physical-chemical ranges', () => {
      for (const c of SEED_COMMODITIES) {
        expect(c.ph_level).toBeGreaterThanOrEqual(1.0);
        expect(c.ph_level).toBeLessThanOrEqual(14.0);
        expect(c.water_activity_aw).toBeGreaterThanOrEqual(0.0);
        expect(c.water_activity_aw).toBeLessThanOrEqual(1.0);
        expect(c.moisture_content_pct).toBeGreaterThanOrEqual(0.0);
        expect(c.moisture_content_pct).toBeLessThanOrEqual(100.0);
        expect(c.fat_lipid_content_pct).toBeGreaterThanOrEqual(0.0);
        expect(c.fat_lipid_content_pct).toBeLessThanOrEqual(100.0);
        expect(c.target_shelf_life_days).toBeGreaterThan(0);
      }
    });
  });

  describe('Seed Materials Dataset', () => {
    it('should have at least 30 validated packaging materials', () => {
      expect(SEED_MATERIALS.length).toBeGreaterThanOrEqual(30);
    });

    it('should have unique material IDs for all items', () => {
      const ids = SEED_MATERIALS.map(m => m.material_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should cover all 7 material classes specified in spec.md', () => {
      const requiredClasses = [
        'THERMOPLASTIC_MONO',
        'BIO_BASED_POLYMER',
        'MULTI_LAYER_LAMINATE',
        'METALLIC',
        'GLASS',
        'PAPER_BOARD',
        'ACTIVE_SMART'
      ] as const;

      for (const materialClass of requiredClasses) {
        const items = catalogRepository.getMaterialsByClass(materialClass);
        expect(items.length).toBeGreaterThan(0);
      }
    });

    it('should pass Zod schema validation for 100% of seed materials', () => {
      for (const material of SEED_MATERIALS) {
        const result = PackagingMaterialSchema.safeParse(material);
        expect(result.success, `Failed validating material: ${material.material_id} - ${material.name}`).toBe(true);
      }
    });

    it('should have valid non-negative barrier transmission rates', () => {
      for (const m of SEED_MATERIALS) {
        expect(m.otr).toBeGreaterThanOrEqual(0);
        expect(m.wvtr).toBeGreaterThanOrEqual(0);
        expect(m.co2tr).toBeGreaterThanOrEqual(0);
        expect(m.light_transmittance_pct).toBeGreaterThanOrEqual(0);
        expect(m.light_transmittance_pct).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Seed Regulations Dataset', () => {
    it('should cover all 4 jurisdictions (FSSAI, FDA, EU, Codex)', () => {
      const jurisdictions = ['FSSAI', 'US_FDA', 'EU_FCM', 'CODEX'] as const;
      for (const jur of jurisdictions) {
        const rules = catalogRepository.getRegulationsByJurisdiction(jur);
        expect(rules.length).toBeGreaterThan(0);
      }
    });

    it('should pass Zod schema validation for 100% of seed regulations', () => {
      for (const rule of SEED_REGULATIONS) {
        const result = RegulationRuleSchema.safeParse(rule);
        expect(result.success, `Failed validating rule: ${rule.rule_id}`).toBe(true);
      }
    });
  });

  describe('Catalog Repository Query APIs', () => {
    it('should retrieve items by ID accurately', () => {
      const commodity = catalogRepository.getCommodityById('COMM-DAIRY-001');
      expect(commodity).toBeDefined();
      expect(commodity?.name).toBe('Whole Milk Powder (Full Cream)');

      const material = catalogRepository.getMaterialById('MAT-LAM-001');
      expect(material).toBeDefined();
      expect(material?.primary_polymer).toBe('AL_FOIL');
    });

    it('should filter compostable materials', () => {
      const compostables = catalogRepository.getCompostableMaterials();
      expect(compostables.length).toBeGreaterThan(0);
      for (const comp of compostables) {
        expect(comp.is_compostable).toBe(true);
      }
    });

    it('should filter high-barrier materials', () => {
      const highBarrier = catalogRepository.getHighBarrierMaterials(1.0, 1.0);
      expect(highBarrier.length).toBeGreaterThan(0);
      for (const hb of highBarrier) {
        expect(hb.otr).toBeLessThanOrEqual(1.0);
        expect(hb.wvtr).toBeLessThanOrEqual(1.0);
      }
    });
  });
});
