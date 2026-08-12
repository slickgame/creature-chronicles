import { recordBirthMemories } from "@/data/creatureMemoryEvents";
import { hatchEgg } from "@/data/nurseryLifecycle";
import type { CreatureRecord } from "@/types/creature";
import type { EggId } from "@/types/ids";
import type { GameSave } from "@/types/save";

export type MemoryAwareHatchResult = {
  save: GameSave;
  creature: CreatureRecord;
};

/**
 * Canonical Legacy A1 hatch transaction.
 *
 * It delegates creature creation and birth-history persistence to the existing
 * nursery lifecycle, then writes child and parent memories from the resulting
 * BirthRecord. Because memory source keys are deterministic, transaction
 * recovery may safely repeat this wrapper without duplicating Chronicle entries.
 */
export function hatchEggWithMemories(
  save: GameSave,
  eggId: EggId,
  nickname?: string,
): MemoryAwareHatchResult | null {
  const result = hatchEgg(save, eggId, nickname);
  if (!result) return null;

  const birth = (result.save.birthHistory ?? []).find(
    (record) => record.creatureId === result.creature.creatureId,
  );

  return {
    creature: result.creature,
    save: birth ? recordBirthMemories(result.save, birth) : result.save,
  };
}
