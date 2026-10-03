import { RegulationRule } from '../types/regulation.js';

export const SEED_REGULATIONS: RegulationRule[] = [
  // ==========================================
  // 1. FSSAI (India) Regulatory Framework
  // ==========================================
  {
    rule_id: 'REG-FSSAI-001',
    jurisdiction: 'FSSAI',
    standard_code: 'FSSAI Packaging Regs 2018 / IS 9845',
    standard_title: 'Food Safety and Standards (Packaging) Regulations, 2018 - Overall Migration Limits',
    applicable_materials: ['THERMOPLASTIC_MONO', 'MULTI_LAYER_LAMINATE', 'BIO_BASED_POLYMER', 'ACTIVE_SMART'],
    applicable_food_categories: [
      'FRESH_PRODUCE',
      'DAIRY_PRODUCTS',
      'BAKERY_CONFECTIONERY',
      'MEAT_POULTRY_SEAFOOD',
      'FATS_AND_OILS',
      'BEVERAGES_LIQUIDS',
      'DRY_FOODS_GRAINS_SPICES',
      'PROCESSED_RETORT_RTE'
    ],
    overall_migration_limit_mg_dm2: 10.0,
    overall_migration_limit_mg_kg: 60.0,
    specific_migration_limits: [
      {
        substance_name: 'Lead (Pb)',
        sml_mg_per_kg: 0.01,
        description: 'Heavy metal contaminant in direct food contact plastics'
      },
      {
        substance_name: 'Cadmium (Cd)',
        sml_mg_per_kg: 0.005,
        description: 'Toxic heavy metal restricted in food contact resins'
      },
      {
        substance_name: 'Primary Aromatic Amines (PAAs)',
        sml_mg_per_kg: 0.01,
        description: 'Polyurethane lamination adhesive migration breakdown product'
      }
    ],
    is_recycled_plastic_prohibited: true, // Recycled plastics banned unless explicitly certified rPET
    requires_declaration_of_compliance: true,
    mandatory_labelling_clauses: [
      'Mandatory display of food-grade symbol or text "FOR FOOD USE ONLY"',
      'Mandatory declaration of recyclability resin identification code (IS 14534)',
      'Green/Brown Veg/Non-Veg logo clear demarcation zone'
    ],
    prohibited_substances: [
      'Uncertified post-consumer recycled plastic direct contact',
      'Toluene-based printing ink formulation (IS 15495)',
      'Newspaper or recycled contaminated paper direct food contact'
    ],
    specific_conditions: [
      'Migration testing must use prescribed stimulants: Distilled water, 3% Acetic acid, 15% Ethanol, or n-Heptane',
      'Laminated pouches must undergo bond strength and seal strength integrity checks'
    ]
  },
  {
    rule_id: 'REG-FSSAI-002',
    jurisdiction: 'FSSAI',
    standard_code: 'IS 15495:2020',
    standard_title: 'Printing Inks for Food Packaging - Code of Practice',
    applicable_materials: ['MULTI_LAYER_LAMINATE', 'PAPER_BOARD', 'THERMOPLASTIC_MONO'],
    applicable_food_categories: [
      'FRESH_PRODUCE',
      'DAIRY_PRODUCTS',
      'BAKERY_CONFECTIONERY',
      'MEAT_POULTRY_SEAFOOD',
      'FATS_AND_OILS',
      'BEVERAGES_LIQUIDS',
      'DRY_FOODS_GRAINS_SPICES',
      'PROCESSED_RETORT_RTE'
    ],
    overall_migration_limit_mg_dm2: 10.0,
    overall_migration_limit_mg_kg: 60.0,
    specific_migration_limits: [
      {
        substance_name: 'Toluene',
        cas_number: '108-88-3',
        sml_mg_per_kg: 0.0,
        description: 'Complete ban on toluene in food packaging printing inks'
      },
      {
        substance_name: 'Benzophenone',
        cas_number: '119-61-9',
        sml_mg_per_kg: 0.6,
        description: 'UV curing photoinitiator'
      }
    ],
    is_recycled_plastic_prohibited: false,
    requires_declaration_of_compliance: true,
    mandatory_labelling_clauses: [
      'External printing surface only; direct ink contact with food forbidden without functional barrier'
    ],
    prohibited_substances: ['Toluene', 'Benzene', 'Titanium acetylacetonate', 'Chlorinated plasticizers'],
    specific_conditions: ['Combined heavy metals (Pb, Cd, Hg, Cr-VI) in printing ink pigments must not exceed 100 ppm']
  },

  // ==========================================
  // 2. US FDA (21 CFR) Regulatory Framework
  // ==========================================
  {
    rule_id: 'REG-FDA-001',
    jurisdiction: 'US_FDA',
    standard_code: '21 CFR 177.1520',
    standard_title: 'Indirect Food Additives: Polymers - Olefin Polymers (PE / PP)',
    applicable_materials: ['THERMOPLASTIC_MONO', 'MULTI_LAYER_LAMINATE', 'ACTIVE_SMART'],
    applicable_food_categories: [
      'FRESH_PRODUCE',
      'DAIRY_PRODUCTS',
      'BAKERY_CONFECTIONERY',
      'MEAT_POULTRY_SEAFOOD',
      'FATS_AND_OILS',
      'BEVERAGES_LIQUIDS',
      'DRY_FOODS_GRAINS_SPICES',
      'PROCESSED_RETORT_RTE'
    ],
    overall_migration_limit_mg_dm2: 10.0,
    overall_migration_limit_mg_kg: 60.0,
    specific_migration_limits: [
      {
        substance_name: 'Hexane-extractable fraction',
        sml_mg_per_kg: 55.0,
        description: 'Maximum extractable fraction at 50°C in n-hexane'
      },
      {
        substance_name: 'Xylene-soluble fraction',
        sml_mg_per_kg: 300.0,
        description: 'Maximum xylene soluble fraction at 25°C for polypropylene'
      }
    ],
    is_recycled_plastic_prohibited: false, // Permitted with FDA Letter of No Objection (LNO)
    requires_declaration_of_compliance: true,
    mandatory_labelling_clauses: [
      'Food Contact Notification (FCN) compliance reference where applicable'
    ],
    prohibited_substances: ['Non-approved masterbatch slip/anti-block additives exceeding threshold'],
    specific_conditions: [
      'Temperature limitations: Polyolefins for boiling water (Condition of Use B) or Retort (Condition of Use A) must satisfy designated density and melt index criteria'
    ]
  },
  {
    rule_id: 'REG-FDA-002',
    jurisdiction: 'US_FDA',
    standard_code: '21 CFR 175.300',
    standard_title: 'Indirect Food Additives: Resinous and Polymeric Coatings (Can Linings)',
    applicable_materials: ['METALLIC'],
    applicable_food_categories: ['BEVERAGES_LIQUIDS', 'PROCESSED_RETORT_RTE', 'FATS_AND_OILS'],
    overall_migration_limit_mg_dm2: 7.75, // 0.5 mg per square inch = 7.75 mg/dm2
    overall_migration_limit_mg_kg: 50.0,
    specific_migration_limits: [
      {
        substance_name: 'Chloroform-soluble extractives',
        sml_mg_per_kg: 18.0,
        description: 'Total extractives from can lacquers in distilled water / 8% alcohol / n-heptane'
      },
      {
        substance_name: 'Bisphenol A (BPA)',
        cas_number: '80-05-7',
        sml_mg_per_kg: 0.0,
        description: 'Prohibited in packaging for infant formula and baby bottles'
      }
    ],
    is_recycled_plastic_prohibited: false,
    requires_declaration_of_compliance: true,
    mandatory_labelling_clauses: [
      'BPA-NI (Non-Intent) declaration for infant nutrition products'
    ],
    prohibited_substances: ['BPA in infant food containers'],
    specific_conditions: [
      'Acids foods (pH < 4.5) must not contact bare tin or uncoated aluminum'
    ]
  },

  // ==========================================
  // 3. EUROPEAN UNION (EU FCM) Regulatory Framework
  // ==========================================
  {
    rule_id: 'REG-EU-001',
    jurisdiction: 'EU_FCM',
    standard_code: 'Commission Regulation (EU) No 10/2011',
    standard_title: 'Plastic Materials and Articles Intended to Come into Contact with Food',
    applicable_materials: ['THERMOPLASTIC_MONO', 'MULTI_LAYER_LAMINATE', 'BIO_BASED_POLYMER', 'ACTIVE_SMART'],
    applicable_food_categories: [
      'FRESH_PRODUCE',
      'DAIRY_PRODUCTS',
      'BAKERY_CONFECTIONERY',
      'MEAT_POULTRY_SEAFOOD',
      'FATS_AND_OILS',
      'BEVERAGES_LIQUIDS',
      'DRY_FOODS_GRAINS_SPICES',
      'PROCESSED_RETORT_RTE'
    ],
    overall_migration_limit_mg_dm2: 10.0, // Strict EU OML: 10 mg/dm2 or 60 mg/kg
    overall_migration_limit_mg_kg: 60.0,
    specific_migration_limits: [
      {
        substance_name: 'Bis(2-ethylhexyl) phthalate (DEHP)',
        cas_number: '117-81-7',
        sml_mg_per_kg: 1.5,
        description: 'Plasticizer restricted to non-fatty food contact only'
      },
      {
        substance_name: 'Dibutyl phthalate (DBP)',
        cas_number: '84-74-2',
        sml_mg_per_kg: 0.3,
        description: 'Plasticizer strictly restricted'
      },
      {
        substance_name: 'Bisphenol A (BPA)',
        cas_number: '80-05-7',
        sml_mg_per_kg: 0.05,
        description: 'Specific migration threshold (Regulation EU 2018/213)'
      },
      {
        substance_name: 'Formaldehyde',
        cas_number: '50-00-0',
        sml_mg_per_kg: 15.0,
        description: 'Monomer in melamine resins'
      },
      {
        substance_name: 'Primary Aromatic Amines (PAAs)',
        sml_mg_per_kg: 0.01,
        description: 'Detection limit 0.01 mg/kg; individual carcinogenic amines < 0.002 mg/kg'
      }
    ],
    is_recycled_plastic_prohibited: false, // Governed under Regulation (EU) 2022/1616 authorized processes
    requires_declaration_of_compliance: true,
    mandatory_labelling_clauses: [
      'Declaration of Compliance (DoC) accompanying every supply chain tier',
      'Wine glass and fork food contact symbol (Regulation EC 1935/2004)',
      'Dual-use food additive identification declaration'
    ],
    prohibited_substances: [
      'Substances not listed in Annex I Positive Union List without approved functional barrier',
      'Uncertified recycled plastics under Regulation (EU) 2022/1616'
    ],
    specific_conditions: [
      'Standardized test conditions (OM1 to OM7) tailored to contact time, temperature, and food simulant (A, B, C, D1, D2, E)',
      'Fat reduction factor (FRF) calculation applicable for lipophilic migrants in fatty foods'
    ]
  },
  {
    rule_id: 'REG-EU-002',
    jurisdiction: 'EU_FCM',
    standard_code: 'Regulation (EC) No 1935/2004 & 2023/2006',
    standard_title: 'Framework Regulation on Materials and Articles in Contact with Food & GMP',
    applicable_materials: ['THERMOPLASTIC_MONO', 'MULTI_LAYER_LAMINATE', 'METALLIC', 'GLASS', 'PAPER_BOARD', 'BIO_BASED_POLYMER', 'ACTIVE_SMART'],
    applicable_food_categories: [
      'FRESH_PRODUCE',
      'DAIRY_PRODUCTS',
      'BAKERY_CONFECTIONERY',
      'MEAT_POULTRY_SEAFOOD',
      'FATS_AND_OILS',
      'BEVERAGES_LIQUIDS',
      'DRY_FOODS_GRAINS_SPICES',
      'PROCESSED_RETORT_RTE'
    ],
    overall_migration_limit_mg_dm2: 10.0,
    overall_migration_limit_mg_kg: 60.0,
    specific_migration_limits: [
      {
        substance_name: 'Mineral Oil Saturated Hydrocarbons (MOSH)',
        sml_mg_per_kg: 2.0,
        description: 'Recommendation limits for paper/cardboard migration'
      },
      {
        substance_name: 'Mineral Oil Aromatic Hydrocarbons (MOAH)',
        sml_mg_per_kg: 0.5,
        description: 'Carcinogenic fractions in recycled paperboard'
      }
    ],
    is_recycled_plastic_prohibited: false,
    requires_declaration_of_compliance: true,
    mandatory_labelling_clauses: [
      'Full batch traceability and Good Manufacturing Practice (GMP) audit trail'
    ],
    prohibited_substances: ['Substances causing organoleptic deterioration of food'],
    specific_conditions: [
      'Article 3: Materials must not transfer constituents to food in quantities that endanger human health, bring about unacceptable change in composition, or deteriorate organoleptic characteristics'
    ]
  },

  // ==========================================
  // 4. CODEX ALIMENTARIUS
  // ==========================================
  {
    rule_id: 'REG-CODEX-001',
    jurisdiction: 'CODEX',
    standard_code: 'CODEX STAN 1-1985 / CAC/RCP 1-1969',
    standard_title: 'Codex General Standard for the Labelling and Packaging of Prepackaged Foods',
    applicable_materials: ['THERMOPLASTIC_MONO', 'MULTI_LAYER_LAMINATE', 'METALLIC', 'GLASS', 'PAPER_BOARD', 'BIO_BASED_POLYMER', 'ACTIVE_SMART'],
    applicable_food_categories: [
      'FRESH_PRODUCE',
      'DAIRY_PRODUCTS',
      'BAKERY_CONFECTIONERY',
      'MEAT_POULTRY_SEAFOOD',
      'FATS_AND_OILS',
      'BEVERAGES_LIQUIDS',
      'DRY_FOODS_GRAINS_SPICES',
      'PROCESSED_RETORT_RTE'
    ],
    overall_migration_limit_mg_dm2: 10.0,
    overall_migration_limit_mg_kg: 60.0,
    specific_migration_limits: [
      {
        substance_name: 'Lead (Pb)',
        sml_mg_per_kg: 0.02,
        description: 'Codex guideline level for food contact surface migration'
      }
    ],
    is_recycled_plastic_prohibited: false,
    requires_declaration_of_compliance: false,
    mandatory_labelling_clauses: [
      'Clear declaration of net contents and drained weight',
      'Expiry date / Best before date display location requirements',
      'Storage instruction requirements (e.g. Keep Refrigerated after opening)'
    ],
    prohibited_substances: ['Toxic contaminants and unhygienic packaging substrates'],
    specific_conditions: [
      'Packaging must protect food against contamination and damage under normal distribution and handling conditions'
    ]
  }
];
