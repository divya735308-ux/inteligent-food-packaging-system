import { describe, it, expect } from 'vitest';
import { PackagingMaterialSchema } from '../../src/shared/schemas/material-schema.js';

describe('Phase 1: PackagingMaterial Schema & Validation', () => {
  it('should validate a valid thermoplastic polymer material', () => {
    const validMaterial = {
      material_id: 'MAT-TEST-001',
      name: 'Test LDPE Film',
      commercial_designation: 'Standard LDPE 50µm',
      material_class: 'THERMOPLASTIC_MONO',
      primary_polymer: 'LDPE',
      default_thickness_um: 50,
      otr: 2500,
      wvtr: 18.0,
      co2tr: 10000,
      light_transmittance_pct: 88,
      max_temperature_c: 80,
      min_temperature_c: -50,
      tensile_strength_mpa: 24,
      seal_strength_n_15mm: 28,
      grease_resistance_kit: 3,
      recyclability_code: 4,
      is_compostable: false,
      bio_based_content_pct: 0,
      relative_cost_index: 1.2,
      suitable_food_types: ['Fresh produce', 'Frozen vegetables'],
      incompatible_food_types: ['High fat/oily foods']
    };

    const parsed = PackagingMaterialSchema.safeParse(validMaterial);
    expect(parsed.success).toBe(true);
  });

  it('should validate a multi-layer composite laminate with layers', () => {
    const validLaminate = {
      material_id: 'MAT-TEST-002',
      name: 'Test 3-Ply Retort Pouch',
      commercial_designation: 'PET/AL/CPP 105µm',
      material_class: 'MULTI_LAYER_LAMINATE',
      primary_polymer: 'AL_FOIL',
      default_thickness_um: 105,
      otr: 0.01,
      wvtr: 0.01,
      co2tr: 0.01,
      light_transmittance_pct: 0,
      max_temperature_c: 135,
      min_temperature_c: -40,
      tensile_strength_mpa: 85,
      seal_strength_n_15mm: 55,
      grease_resistance_kit: 12,
      layers: [
        { layer_order: 1, material_code: 'BOPET', name: 'Print Web', role: 'OUTER_PRINT', thickness_um: 12 },
        { layer_order: 2, material_code: 'AL_FOIL', name: 'Barrier Foil', role: 'BARRIER', thickness_um: 9 },
        { layer_order: 3, material_code: 'CAST_PP', name: 'Inner Sealant', role: 'SEALANT_CONTACT', thickness_um: 80 }
      ],
      recyclability_code: 0,
      is_compostable: false,
      bio_based_content_pct: 0,
      relative_cost_index: 3.2,
      suitable_food_types: ['Retort ready meals'],
      incompatible_food_types: ['Microwave without opening']
    };

    const parsed = PackagingMaterialSchema.safeParse(validLaminate);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.layers?.length).toBe(3);
      expect(parsed.data.layers?.[2].role).toBe('SEALANT_CONTACT');
    }
  });

  it('should validate active/smart packaging features', () => {
    const activeMaterial = {
      material_id: 'MAT-TEST-003',
      name: 'Test O2 Scavenger Film',
      commercial_designation: 'Active O2 Absorbing Film 85µm',
      material_class: 'ACTIVE_SMART',
      primary_polymer: 'LLDPE',
      default_thickness_um: 85,
      otr: 0.05,
      wvtr: 3.5,
      co2tr: 15.0,
      light_transmittance_pct: 75,
      max_temperature_c: 85,
      min_temperature_c: -20,
      tensile_strength_mpa: 48,
      seal_strength_n_15mm: 36,
      grease_resistance_kit: 10,
      active_smart_features: {
        type: 'OXYGEN_SCAVENGER',
        capacity_description: 'Absorbs up to 50cc O2',
        active_substance: 'Ferrous Carbonate',
        migration_compliance: true
      },
      recyclability_code: 4,
      is_compostable: false,
      bio_based_content_pct: 0,
      relative_cost_index: 3.5,
      suitable_food_types: ['Whole milk powder'],
      incompatible_food_types: ['High moisture produce']
    };

    const parsed = PackagingMaterialSchema.safeParse(activeMaterial);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.active_smart_features?.type).toBe('OXYGEN_SCAVENGER');
    }
  });

  it('should reject material with negative thickness', () => {
    const invalidMaterial = {
      material_id: 'MAT-TEST-004',
      name: 'Negative Thickness Film',
      commercial_designation: 'Invalid Film',
      material_class: 'THERMOPLASTIC_MONO',
      primary_polymer: 'LDPE',
      default_thickness_um: -25, // Invalid negative thickness
      otr: 2500,
      wvtr: 18.0,
      co2tr: 10000,
      light_transmittance_pct: 88,
      max_temperature_c: 80,
      min_temperature_c: -50,
      tensile_strength_mpa: 24,
      seal_strength_n_15mm: 28,
      grease_resistance_kit: 3,
      recyclability_code: 4,
      is_compostable: false,
      bio_based_content_pct: 0,
      relative_cost_index: 1.2,
      suitable_food_types: ['Dry foods'],
      incompatible_food_types: ['Liquids']
    };

    const parsed = PackagingMaterialSchema.safeParse(invalidMaterial);
    expect(parsed.success).toBe(false);
  });
});
