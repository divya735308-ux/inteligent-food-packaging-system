import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../../src/engine/scoring-engine.js';
import { catalogRepository } from '../../src/shared/catalog/index.js';
import { HazardWarning } from '../../src/shared/types/analysis.js';
import { RegulatoryCheckResult } from '../../src/shared/types/regulation.js';

describe('Phase 3: ScoringEngine & PFI Algorithm Tests', () => {
  it('should compute weighted Packaging Fitness Index (PFI) correctly', () => {
    const material = catalogRepository.getMaterialById('MAT-LAM-004')!; // Recyclable AlOx-PET/PE (Resin code 4)
    const mockRegulatoryResults: Record<'FSSAI' | 'US_FDA' | 'EU_FCM' | 'CODEX', RegulatoryCheckResult> = {
      FSSAI: { jurisdiction: 'FSSAI', standard_code: 'IS 9845', status: 'COMPLIANT', overall_migration_pass: true, specific_migration_alerts: [], mandatory_label_notes: [], violations: [], details: '' },
      US_FDA: { jurisdiction: 'US_FDA', standard_code: '21 CFR', status: 'COMPLIANT', overall_migration_pass: true, specific_migration_alerts: [], mandatory_label_notes: [], violations: [], details: '' },
      EU_FCM: { jurisdiction: 'EU_FCM', standard_code: 'EU 10/2011', status: 'COMPLIANT', overall_migration_pass: true, specific_migration_alerts: [], mandatory_label_notes: [], violations: [], details: '' },
      CODEX: { jurisdiction: 'CODEX', standard_code: 'CODEX', status: 'COMPLIANT', overall_migration_pass: true, specific_migration_alerts: [], mandatory_label_notes: [], violations: [], details: '' }
    };

    const warnings: HazardWarning[] = [];
    // Compat = 95, ShelfLife = 90, Reg = 100, Eco = 60
    // PFI = 0.35 * 95 + 0.30 * 90 + 0.20 * 100 + 0.15 * 60 = 33.25 + 27.0 + 20.0 + 9.0 = 89.25 ~ 89.3
    const scores = ScoringEngine.calculateScores(95, 90, mockRegulatoryResults, material, warnings);

    expect(scores.overall_pfi).toBeGreaterThanOrEqual(85.0);
    expect(scores.compatibility_score).toBe(95.0);
    expect(scores.shelf_life_score).toBe(90.0);
    expect(scores.regulatory_score).toBe(100.0);

    const status = ScoringEngine.determineFinalStatus(scores, warnings);
    expect(status).toBe('SUB_OPTIMAL'); // >= 75 and < 90 is SUB_OPTIMAL
  });

  it('should enforce safety gate capping PFI < 40 and status INCOMPATIBLE upon critical hazard', () => {
    const material = catalogRepository.getMaterialById('MAT-MONO-001')!;
    const mockRegulatoryResults: Record<'FSSAI', RegulatoryCheckResult> = {
      FSSAI: { jurisdiction: 'FSSAI', standard_code: 'IS 9845', status: 'NON_COMPLIANT', overall_migration_pass: false, specific_migration_alerts: [], mandatory_label_notes: [], violations: ['Acidic corrosion violation'], details: '' }
    };

    const criticalWarnings: HazardWarning[] = [
      {
        id: 'WARN-ACID-CORROSION',
        severity: 'CRITICAL',
        category: 'ACID_CORROSION',
        title: 'Severe Acid Corrosion Risk',
        message: 'Acid reaction',
        remediation_suggestion: 'Use lacquer'
      }
    ];

    const scores = ScoringEngine.calculateScores(30, 20, mockRegulatoryResults, material, criticalWarnings);

    expect(scores.overall_pfi).toBeLessThan(40.0);
    expect(scores.regulatory_score).toBe(0.0);

    const status = ScoringEngine.determineFinalStatus(scores, criticalWarnings);
    expect(status).toBe('INCOMPATIBLE');
  });
});
