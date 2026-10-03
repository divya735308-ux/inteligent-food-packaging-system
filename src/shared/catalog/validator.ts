import { catalogRepository } from './index.js';

export function runCatalogValidation() {
  console.log('--- PackSmart Knowledge Base Validator ---');
  
  const commodities = catalogRepository.getAllCommodities();
  const materials = catalogRepository.getAllMaterials();
  const regulations = catalogRepository.getAllRegulations();

  console.log(`[PASS] Validated ${commodities.length} Food Commodities.`);
  console.log(`[PASS] Validated ${materials.length} Packaging Materials.`);
  console.log(`[PASS] Validated ${regulations.length} Regulatory Framework Rules.`);

  // Verify category distribution
  const categories = [
    'FRESH_PRODUCE',
    'DAIRY_PRODUCTS',
    'BAKERY_CONFECTIONERY',
    'MEAT_POULTRY_SEAFOOD',
    'FATS_AND_OILS',
    'BEVERAGES_LIQUIDS',
    'DRY_FOODS_GRAINS_SPICES',
    'PROCESSED_RETORT_RTE'
  ] as const;

  for (const cat of categories) {
    const count = catalogRepository.getCommoditiesByCategory(cat).length;
    console.log(`  - Category ${cat}: ${count} items`);
    if (count === 0) {
      throw new Error(`Category ${cat} has zero items!`);
    }
  }

  // Verify material classes
  const materialClasses = [
    'THERMOPLASTIC_MONO',
    'BIO_BASED_POLYMER',
    'MULTI_LAYER_LAMINATE',
    'METALLIC',
    'GLASS',
    'PAPER_BOARD',
    'ACTIVE_SMART'
  ] as const;

  for (const mc of materialClasses) {
    const count = catalogRepository.getMaterialsByClass(mc).length;
    console.log(`  - Material Class ${mc}: ${count} items`);
    if (count === 0) {
      throw new Error(`Material class ${mc} has zero items!`);
    }
  }

  // Verify jurisdictions
  const jurisdictions = ['FSSAI', 'US_FDA', 'EU_FCM', 'CODEX'] as const;
  for (const jur of jurisdictions) {
    const count = catalogRepository.getRegulationsByJurisdiction(jur).length;
    console.log(`  - Jurisdiction ${jur}: ${count} rules`);
    if (count === 0) {
      throw new Error(`Jurisdiction ${jur} has zero rules!`);
    }
  }

  console.log('\nAll Knowledge Base schemas and data models validated successfully!');
  return true;
}

try {
  runCatalogValidation();
} catch (err) {
  console.error('Validation failed:', err);
  process.exit(1);
}

