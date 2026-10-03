/**
 * Unified Deterministic Packaging Analysis Engine
 * Integrates BarrierCalculator, CompatibilityEngine, ShelfLifeEngine, HazardAssessmentEngine,
 * RegulatoryEngine, and ScoringEngine into a unified deterministic analysis pipeline.
 * Based on PackSmart Master Specification Section 5.2 & 7.1
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { AnalysisRequest, AnalysisResult, HazardWarning } from '../shared/types/analysis.js';
import { catalogRepository } from '../shared/catalog/index.js';
import { BarrierCalculator } from './barrier-calculator.js';
import { CompatibilityEngine } from './compatibility-engine.js';
import { ShelfLifeEngine } from './shelf-life-engine.js';
import { HazardAssessmentEngine } from './hazard-assessment-engine.js';
import { RegulatoryEngine } from './regulatory-engine.js';
import { ScoringEngine } from './scoring-engine.js';

export class UnifiedAnalyzer {
  /**
   * Executes the complete deterministic analysis pipeline.
   */
  public static analyze(request: AnalysisRequest): AnalysisResult {
    // 1. Resolve Commodity
    let commodity = catalogRepository.getCommodityById(request.commodity_id);
    if (!commodity) {
      throw new Error(`Commodity with ID '${request.commodity_id}' not found in catalog.`);
    }

    if (request.custom_commodity_overrides) {
      commodity = {
        ...commodity,
        ...request.custom_commodity_overrides
      };
    }

    // 2. Resolve Material
    let material = catalogRepository.getMaterialById(request.material_id);
    if (!material) {
      throw new Error(`Material with ID '${request.material_id}' not found in catalog.`);
    }

    const customLayers = request.custom_material_layers && request.custom_material_layers.length > 0
      ? request.custom_material_layers
      : undefined;

    // 3. Calculate Effective Barrier Metrics
    const barrierMetrics = BarrierCalculator.calculateEffectiveBarrier(material, customLayers);

    // 4. Evaluate Physical-Chemical Compatibility
    const compatEval = CompatibilityEngine.evaluate(
      commodity,
      material,
      request.storage_conditions,
      customLayers
    );

    // 5. Predict Shelf-Life & Degradation Timeline
    const shelfLifePred = ShelfLifeEngine.predictShelfLife(
      commodity,
      material,
      request.storage_conditions,
      barrierMetrics
    );

    // 6. Conduct Hazard & Safety Assessment
    const hazardWarnings = HazardAssessmentEngine.analyzeHazards(
      commodity,
      material,
      request.storage_conditions,
      barrierMetrics
    );

    // 7. Multi-Jurisdiction Regulatory Checks
    const jurisdictions = request.jurisdictions && request.jurisdictions.length > 0
      ? request.jurisdictions
      : ['FSSAI', 'US_FDA', 'EU_FCM', 'CODEX'];

    const regulatoryResults = RegulatoryEngine.checkCompliance(
      commodity,
      material,
      barrierMetrics,
      jurisdictions
    );

    // 8. Combine All Warnings
    const allWarnings: HazardWarning[] = [...compatEval.warnings, ...hazardWarnings];

    // Deduplicate warnings by ID
    const uniqueWarningsMap = new Map<string, HazardWarning>();
    for (const w of allWarnings) {
      uniqueWarningsMap.set(w.id, w);
    }
    const consolidatedWarnings = Array.from(uniqueWarningsMap.values());

    // 9. Compute Composite Scores & Final Status
    const scores = ScoringEngine.calculateScores(
      compatEval.compatibility_score,
      shelfLifePred.shelf_life_score,
      regulatoryResults,
      material,
      consolidatedWarnings
    );

    const finalStatus = ScoringEngine.determineFinalStatus(scores, consolidatedWarnings);

    // 10. Generate Analysis ID & Return Complete Result
    const analysisId = `ANALYSIS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      analysis_id: analysisId,
      timestamp: new Date().toISOString(),
      commodity,
      material,
      storage: request.storage_conditions,
      compatibility_status: finalStatus,
      fitness_index_score: scores.overall_pfi,
      scores,
      predicted_shelf_life_days: shelfLifePred.predicted_shelf_life_days,
      limiting_failure_mode: shelfLifePred.limiting_failure_mode,
      warnings: consolidatedWarnings,
      regulatory_compliance: regulatoryResults,
      degradation_timeline: shelfLifePred.degradation_timeline
    };
  }
}
