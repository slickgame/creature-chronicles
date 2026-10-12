import type { AbilityGrade, CreatureAbility } from "@/types/creature";
export const GUARD_DOG_VALUES: Record<AbilityGrade, number> = { F: 1, D: 2, C: 3, B: 4, A: 6, S: 8 };
export function createGuardDog(grade: AbilityGrade = "C"): CreatureAbility {
  return { id: "guard_dog", name: "Guard Dog", source: "species", grade, description: `+${GUARD_DOG_VALUES[grade]} farm Security while resident. Only the strongest Guard Dog applies; no Energy cost.` };
}
