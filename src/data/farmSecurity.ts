import { getVariantDefinition } from "./creatures";
import { getBuilderSecurityBonus } from "./builderProjects";
import { getTrainingUnavailableReason } from "./trainingGrounds";
import { GUARD_DOG_VALUES } from "./talents/guardDog";
import type { GameSave } from "@/types/save";
export function getFarmSecurity(save: GameSave) {
  const candidates = (save.creatures ?? []).flatMap(c => {
    if (getVariantDefinition(c.variantId).family !== "canine" || getTrainingUnavailableReason(save, c.creatureId)) return [];
    if (!save.habitats?.some(h => h.unlocked && h.creatureIds.includes(c.creatureId))) return [];
    const talent = c.abilities.find(a => a.id === "guard_dog");
    return talent ? [{ id: c.creatureId, name: c.nickname, grade: talent.grade, bonus: GUARD_DOG_VALUES[talent.grade] ?? 0 }] : [];
  }).sort((a,b) => b.bonus-a.bonus || a.id.localeCompare(b.id));
  const condition = Math.max(0, Math.min(100, 100 - Number(save.flags.ranchDamage ?? 0)));
  const maximum = 6 + getBuilderSecurityBonus(save);
  const fortifications = Math.floor(maximum * condition / 100);
  const guard = candidates[0] ?? null;
  return { condition, maximum, fortifications, guard, candidates, total: fortifications + (guard?.bonus ?? 0) };
}
