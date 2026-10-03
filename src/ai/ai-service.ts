/**
 * Hybrid AI Advisory Service
 * Combines LLM (Gemini API) contextual advisory with deterministic heuristic fallback.
 * Based on PackSmart Master Specification Section 4.7 & 9.2
 */

import { FoodCommodity } from '../shared/types/commodity.js';
import { PackagingMaterial } from '../shared/types/material.js';
import { HazardWarning, StorageCondition } from '../shared/types/analysis.js';
import { CalculatedBarrierMetrics } from '../engine/barrier-calculator.js';
import { PromptTemplates } from './prompts.js';
import { HeuristicRecommender } from './heuristic-recommender.js';
import { AIAdvisoryOutput, AIAdvisorySchema } from './schemas.js';

export class AIService {
  private static readonly API_TIMEOUT_MS = 3000;
  private static readonly MODEL_NAME = 'gemini-1.5-flash';

  /**
   * Generates AI advisory for an evaluated packaging system.
   * Gracefully falls back to heuristic engine if API key is missing or service is unreachable.
   */
  public static async generateAdvisory(
    commodity: FoodCommodity,
    material: PackagingMaterial,
    storage: StorageCondition,
    barrierMetrics: CalculatedBarrierMetrics,
    warnings: HazardWarning[],
    pfiScore: number,
    predictedShelfLife: number
  ): Promise<AIAdvisoryOutput> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Zero-Secret / Offline Heuristic Mode
    if (!apiKey || apiKey.trim() === '') {
      return HeuristicRecommender.generateAdvisory(
        commodity,
        material,
        storage,
        barrierMetrics,
        warnings,
        pfiScore,
        predictedShelfLife
      );
    }

    // Attempt Gemini API invocation with strict timeout & schema guardrails
    try {
      const prompt = PromptTemplates.buildAdvisoryPrompt(
        commodity,
        material,
        storage,
        barrierMetrics,
        warnings,
        pfiScore,
        predictedShelfLife
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT_MS);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL_NAME}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LLM API returned status ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from LLM');
      }

      const parsedJson = JSON.parse(rawText);
      const validatedAdvisory = AIAdvisorySchema.parse({
        ...parsedJson,
        is_fallback_mode: false
      });

      return validatedAdvisory;
    } catch {
      // Fallback seamlessly on any network failure, timeout, or schema error
      return HeuristicRecommender.generateAdvisory(
        commodity,
        material,
        storage,
        barrierMetrics,
        warnings,
        pfiScore,
        predictedShelfLife
      );
    }
  }
}
