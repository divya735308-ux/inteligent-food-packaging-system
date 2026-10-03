import { describe, it, expect } from 'vitest';
import { UnifiedAnalyzer } from '../../src/engine/unified-analyzer.js';
import { AnalysisRequest } from '../../src/shared/types/analysis.js';

describe('Phase 3: UnifiedAnalyzer Deterministic Pipeline Tests', () => {
  it('should run full analysis for Whole Milk Powder in 3-Ply Foil Laminate (High PFI & Compliant)', () => {
    const request: AnalysisRequest = {
      commodity_id: 'COMM-DAIRY-001',
      material_id: 'MAT-LAM-001', // 3-ply foil pouch
      storage_conditions: {
        temperature_c: 25.0,
        relative_humidity_pct: 60.0,
        atmosphere: 'MAP_NITROGEN_FLUSH',
        map_gas_ratio: { o2_pct: 0.5, co2_pct: 0.0, n2_pct: 99.5 },
        target_shelf_life_days: 365,
        package_surface_area_dm2: 2.0,
        package_weight_grams: 500.0
      },
      jurisdictions: ['FSSAI', 'US_FDA', 'EU_FCM', 'CODEX']
    };

    const result = UnifiedAnalyzer.analyze(request);

    expect(result.analysis_id).toBeDefined();
    expect(result.fitness_index_score).toBeGreaterThanOrEqual(70.0);
    expect(result.predicted_shelf_life_days).toBeGreaterThanOrEqual(365);
    expect(result.regulatory_compliance.FSSAI).toBeDefined();
    expect(result.regulatory_compliance.US_FDA).toBeDefined();
    expect(result.regulatory_compliance.EU_FCM).toBeDefined();
    expect(result.degradation_timeline?.length).toBeGreaterThan(0);
  });

  it('should flag INCOMPATIBLE and fail regulatory checks for Tomato Paste in Bare Tin Can', () => {
    const request: AnalysisRequest = {
      commodity_id: 'COMM-RTE-002', // Tomato Paste pH 3.9
      material_id: 'MAT-MET-001',   // Bare Uncoated Tinplate
      storage_conditions: {
        temperature_c: 25.0,
        relative_humidity_pct: 60.0,
        atmosphere: 'AIR',
        target_shelf_life_days: 730,
        package_surface_area_dm2: 2.5,
        package_weight_grams: 400.0
      },
      jurisdictions: ['FSSAI', 'US_FDA', 'EU_FCM']
    };

    const result = UnifiedAnalyzer.analyze(request);

    expect(result.compatibility_status).toBe('INCOMPATIBLE');
    expect(result.fitness_index_score).toBeLessThan(40.0);
    expect(result.scores.regulatory_score).toBe(0.0);
    expect(result.regulatory_compliance.FSSAI.status).toBe('NON_COMPLIANT');
    expect(result.warnings.some(w => w.category === 'ACID_CORROSION')).toBe(true);
  });

  it('should support custom user-defined material layers dynamically', () => {
    const request: AnalysisRequest = {
      commodity_id: 'COMM-BAKE-001', // Potato chips
      material_id: 'MAT-LAM-008',   // Base PET/PE
      custom_material_layers: [
        { layer_order: 1, material_code: 'BOPP', name: 'Print BOPP', role: 'OUTER_PRINT', thickness_um: 20 },
        { layer_order: 2, material_code: 'METALLIZED_FILM', name: 'Met-BOPP Barrier', role: 'BARRIER', thickness_um: 15 },
        { layer_order: 3, material_code: 'CAST_PP', name: 'CPP Sealant', role: 'SEALANT_CONTACT', thickness_um: 25 }
      ],
      storage_conditions: {
        temperature_c: 25.0,
        relative_humidity_pct: 55.0,
        atmosphere: 'MAP_NITROGEN_FLUSH',
        map_gas_ratio: { o2_pct: 0.5, co2_pct: 0.0, n2_pct: 99.5 },
        target_shelf_life_days: 180,
        package_surface_area_dm2: 2.0,
        package_weight_grams: 150.0
      },
      jurisdictions: ['FSSAI', 'US_FDA']
    };

    const result = UnifiedAnalyzer.analyze(request);

    expect(result.predicted_shelf_life_days).toBeGreaterThanOrEqual(180);
    expect(result.fitness_index_score).toBeGreaterThanOrEqual(80.0);
  });
});
