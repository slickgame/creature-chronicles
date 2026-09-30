import type { RanchUpgradeEffects, RanchUpgradeId } from "@/types/ranchUpgrades";

export const OFFICE_BUILDINGS: Record<RanchUpgradeId, { name: string; file: string; note: string }> = {
  feline_habitat_capacity: { name: "Feline Habitat", file: "feline_habitat", note: "More room for feline-family creatures." },
  canine_habitat_capacity: { name: "Canine Habitat", file: "canine_habitat", note: "More room for canine-family creatures." },
  bovine_habitat_capacity: { name: "Bovine Habitat", file: "bovine_habitat", note: "More stable and pasture space." },
  lapine_habitat_capacity: { name: "Lapine Habitat", file: "lapine_habitat", note: "More burrow and garden space." },
  equine_habitat_capacity: { name: "Equine Habitat", file: "equine_habitat", note: "More stall and paddock space." },
  nursery_egg_capacity: { name: "Egg Capacity", file: "egg_nursery", note: "Room for more eggs in the nursery." },
  nursery_incubation_speed: { name: "Incubators", file: "egg_nursery", note: "Shorter pregnancy and incubation times." },
  breeding_pen_comfort: { name: "Pen Comfort", file: "breeding_pen", note: "Improve breeding chances, XP and energy costs." },
  ranch_chores_board: { name: "Chores Board", file: "guild_board", note: "Spend less energy and improve chore scores." },
  sleep_recovery: { name: "Sleep Recovery", file: "ranch_house", note: "Better recovery after a night's sleep." },
};

export const CONDITION_RULES = [
  { label: "Good", range: "0–19 damage", penalty: "No penalty" },
  { label: "Worn", range: "20–49 damage", penalty: "−5% sleep recovery" },
  { label: "Damaged", range: "50–79 damage", penalty: "−15% recovery, −1 affection" },
  { label: "Critical", range: "80–100 damage", penalty: "−25% recovery, −2 affection" },
];

const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`;
/** Read values from the gameplay effect calculator, including tier-zero penalties. */
export function officeEffectRows(id: RanchUpgradeId, effects: RanchUpgradeEffects): Array<[string, string]> {
  const capacities = { feline_habitat_capacity: effects.felineCapacity, canine_habitat_capacity: effects.canineCapacity, bovine_habitat_capacity: effects.bovineCapacity, lapine_habitat_capacity: effects.lapineCapacity, equine_habitat_capacity: effects.equineCapacity };
  if (id in capacities) return [["Capacity", `${capacities[id as keyof typeof capacities]} residents`]];
  if (id === "nursery_egg_capacity") return [["Egg capacity", `${effects.nurseryEggCapacity} slots`]];
  if (id === "nursery_incubation_speed") return [["Pregnancy", `${effects.nurseryPregnancyDays} days`], ["Egg incubation", `${effects.nurseryEggDays} days`]];
  if (id === "breeding_pen_comfort") return [["Pregnancy chance", `${signed(effects.breedingPregnancyBonus)}%`], ["Breeding XP", `+${effects.breedingXpBonus}`], ["Energy cost", signed(-effects.breedingEnergyDiscount)]];
  if (id === "ranch_chores_board") return [["Chore energy cost", signed(-effects.ranchChoreEnergyDiscount)], ["Chore score", `+${effects.ranchChoreScoreBonus}`]];
  return [["Sleep energy", `+${effects.sleepCreatureEnergyBonus}`], ["Sleep affection", `+${effects.sleepAffectionBonus}`]];
}
