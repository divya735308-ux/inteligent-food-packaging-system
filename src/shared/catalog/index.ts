import { FoodCommodity, FoodCategory } from '../types/commodity.js';
import { PackagingMaterial, MaterialClass } from '../types/material.js';
import { RegulationRule, Jurisdiction } from '../types/regulation.js';
import { SEED_COMMODITIES } from '../data/seed-commodities.js';
import { SEED_MATERIALS } from '../data/seed-materials.js';
import { SEED_REGULATIONS } from '../data/seed-regulations.js';
import { FoodCommoditySchema } from '../schemas/commodity-schema.js';
import { PackagingMaterialSchema } from '../schemas/material-schema.js';
import { RegulationRuleSchema } from '../schemas/regulation-schema.js';

export class CatalogRepository {
  private commodities: Map<string, FoodCommodity> = new Map();
  private materials: Map<string, PackagingMaterial> = new Map();
  private regulations: Map<string, RegulationRule> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    for (const commodity of SEED_COMMODITIES) {
      // Validate schema on loading
      const validated = FoodCommoditySchema.parse(commodity) as FoodCommodity;
      this.commodities.set(validated.commodity_id, validated);
    }

    for (const material of SEED_MATERIALS) {
      const validated = PackagingMaterialSchema.parse(material) as PackagingMaterial;
      this.materials.set(validated.material_id, validated);
    }

    for (const rule of SEED_REGULATIONS) {
      const validated = RegulationRuleSchema.parse(rule) as RegulationRule;
      this.regulations.set(validated.rule_id, validated);
    }
  }

  // Commodities Queries
  public getAllCommodities(): FoodCommodity[] {
    return Array.from(this.commodities.values());
  }

  public getCommodityById(id: string): FoodCommodity | undefined {
    return this.commodities.get(id);
  }

  public getCommoditiesByCategory(category: FoodCategory): FoodCommodity[] {
    return this.getAllCommodities().filter(c => c.category === category);
  }

  // Materials Queries
  public getAllMaterials(): PackagingMaterial[] {
    return Array.from(this.materials.values());
  }

  public getMaterialById(id: string): PackagingMaterial | undefined {
    return this.materials.get(id);
  }

  public getMaterialsByClass(materialClass: MaterialClass): PackagingMaterial[] {
    return this.getAllMaterials().filter(m => m.material_class === materialClass);
  }

  public getCompostableMaterials(): PackagingMaterial[] {
    return this.getAllMaterials().filter(m => m.is_compostable);
  }

  public getHighBarrierMaterials(maxOtr: number = 10.0, maxWvtr: number = 5.0): PackagingMaterial[] {
    return this.getAllMaterials().filter(m => m.otr <= maxOtr && m.wvtr <= maxWvtr);
  }

  // Regulations Queries
  public getAllRegulations(): RegulationRule[] {
    return Array.from(this.regulations.values());
  }

  public getRegulationsByJurisdiction(jurisdiction: Jurisdiction): RegulationRule[] {
    return this.getAllRegulations().filter(r => r.jurisdiction === jurisdiction);
  }

  public getRegulationsForMaterialClass(materialClass: string): RegulationRule[] {
    return this.getAllRegulations().filter(r => r.applicable_materials.includes(materialClass));
  }
}

export const catalogRepository = new CatalogRepository();
