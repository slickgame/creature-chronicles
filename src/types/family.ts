import type { CreatureId, SpeciesId, VariantId } from './ids';
export type FamilyRecord = {
  id: string; name: string; kind: 'creature' | 'player' | 'unknown'; creatureId?: CreatureId;
  speciesId?: SpeciesId; variantId?: VariantId; generation?: number;
  parents: string[]; parentageRecorded: boolean; origin?: string; assessment?: string;
  markers: string[]; notes: string[];
};
export type FamilyArchive = { version: 1; records: Record<string, FamilyRecord> };
