import { calculateBattleStats } from "@/data/battleStats";
import { getVariantDefinition } from "@/data/creatures";
import { getCreatureTalentRoleTags } from "./talentEngine";
import type { CreatureRecord } from "@/types/creature";

export type CreatureRoleTagCategory = "combat" | "ranch" | "development";

export type CreatureRoleTag = {
  id: string;
  label: string;
  category: CreatureRoleTagCategory;
  score: number;
  primary: boolean;
  reasons: string[];
};

type MutableTag = Omit<CreatureRoleTag, "primary">;

function addTag(
  map: Map<string, MutableTag>,
  id: string,
  label: string,
  category: CreatureRoleTagCategory,
  score: number,
  reason: string,
) {
  const existing = map.get(id);
  if (existing) {
    existing.score += score;
    if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
    return;
  }
  map.set(id, { id, label, category, score, reasons: [reason] });
}

function addTalentTags(creature: CreatureRecord, map: Map<string, MutableTag>) {
  for (const label of getCreatureTalentRoleTags(creature)) {
    const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const combat = ["tank", "striker", "skirmisher", "support"].includes(normalized);
    const development = ["fast-learner", "durable"].includes(normalized);
    addTag(
      map,
      `talent-${normalized}`,
      label,
      combat ? "combat" : development ? "development" : "ranch",
      4,
      "Supported by one or more structured talents.",
    );
  }
}

function addStatTags(creature: CreatureRecord, map: Map<string, MutableTag>) {
  const { STR, DEX, STA, CHA, WIL, FER } = creature.stats;
  const battle = calculateBattleStats(creature);

  if (battle.maxHp + battle.defense >= 105) {
    addTag(map, "tank", "Tank", "combat", 4, `High durability: ${battle.maxHp} HP and ${battle.defense} Defense.`);
  }
  if (battle.physicalPower >= 18 || STR >= 9) {
    addTag(map, "striker", "Striker", "combat", 3, `Strong physical profile: STR ${STR}, Power ${battle.physicalPower}.`);
  }
  if (battle.speed >= 16 || DEX >= 9) {
    addTag(map, "skirmisher", "Skirmisher", "combat", 3, `Fast profile: DEX ${DEX}, Speed ${battle.speed}.`);
  }
  if (battle.statusPower >= 14 || CHA + WIL >= 14) {
    addTag(map, "support", "Support", "combat", 3, `Strong support profile: CHA ${CHA}, WIL ${WIL}.`);
  }
  if (STA + STR >= 16) {
    addTag(map, "field-worker", "Field Worker", "ranch", 3, `Strong field-work stats: STR ${STR}, STA ${STA}.`);
  }
  if (DEX + CHA >= 15) {
    addTag(map, "domestic-worker", "Domestic Worker", "ranch", 3, `Strong domestic-work stats: DEX ${DEX}, CHA ${CHA}.`);
  }
  if (CHA + WIL >= 15) {
    addTag(map, "caregiver", "Caregiver", "ranch", 3, `Strong care profile: CHA ${CHA}, WIL ${WIL}.`);
  }
  if (FER + CHA >= 16) {
    addTag(map, "breeding-specialist", "Breeding Specialist", "ranch", 3, `Strong breeding profile: FER ${FER}, CHA ${CHA}.`);
  }
  if (creature.level <= 5 && creature.xpToNext <= 195) {
    addTag(map, "developing", "Developing", "development", 1, "Early-level creature with substantial growth ahead.");
  }
  if (creature.affection >= 80) {
    addTag(map, "team-player", "Team Player", "development", 2, `High Affection: ${creature.affection}/100.`);
  }
}

function addFamilyTags(creature: CreatureRecord, map: Map<string, MutableTag>) {
  const variant = getVariantDefinition(creature.variantId);
  const familyReasons: Record<typeof variant.family, Array<[string, string]>> = {
    feline: [["domestic-worker", "Feline baseline favors careful domestic and social work."], ["support", "Feline baseline favors agile support roles."]],
    canine: [["security", "Canine baseline favors patrol and protection work."], ["tank", "Canine baseline supports dependable frontline roles."]],
    bovine: [["producer", "Bovine baseline favors production work."], ["tank", "Bovine baseline favors endurance and defense."]],
    lapine: [["harvester", "Lapine baseline favors harvesting and garden work."], ["caregiver", "Lapine baseline favors nursery and care work."]],
    equine: [["field-worker", "Equine baseline favors hauling and field work."], ["striker", "Equine baseline supports forceful combat roles."]],
  };
  for (const [id, reason] of familyReasons[variant.family]) {
    const labels: Record<string, string> = {
      security: "Security",
      producer: "Producer",
      harvester: "Harvester",
      "field-worker": "Field Worker",
      "domestic-worker": "Domestic Worker",
      support: "Support",
      tank: "Tank",
      caregiver: "Caregiver",
      striker: "Striker",
    };
    const combat = ["support", "tank", "striker"].includes(id);
    addTag(map, `family-${id}`, labels[id] ?? id, combat ? "combat" : "ranch", 2, reason);
  }
}

export function getCreatureRoleTags(creature: CreatureRecord): CreatureRoleTag[] {
  const map = new Map<string, MutableTag>();
  addFamilyTags(creature, map);
  addStatTags(creature, map);
  addTalentTags(creature, map);
  const sorted = [...map.values()]
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, 10);
  return sorted.map((tag, index) => ({ ...tag, primary: index < 2 }));
}

export function getPrimaryCreatureRoleTags(creature: CreatureRecord, limit = 4): CreatureRoleTag[] {
  return getCreatureRoleTags(creature).slice(0, Math.max(1, limit));
}
