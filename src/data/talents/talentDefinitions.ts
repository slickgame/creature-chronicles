import {
  GENERAL_ABILITY_POOL,
  SPECIES_DEFINITIONS,
  VARIANT_DEFINITIONS,
} from "@/data/creatures";
import type {
  AbilityGrade,
  CreatureAbility,
  CreatureFamily,
  CreatureStatKey,
} from "@/types/creature";
import type {
  TalentCategory,
  TalentDefinition,
  TalentEffect,
  TalentSourceRestriction,
  TalentSystem,
  TalentTrigger,
} from "@/types/talent";
import type { BattleStatKey } from "@/types/battle";
import type { RanchJobId } from "@/types/ranchJobs";

export const TALENT_DEFINITION_VERSION = 1;

const GRADES: AbilityGrade[] = ["F", "D", "C", "B", "A", "S"];
const LEGACY_GRADE_MULTIPLIER: Record<AbilityGrade, number> = {
  F: 0.65,
  D: 0.8,
  C: 1,
  B: 1.15,
  A: 1.35,
  S: 1.6,
};
const SYSTEM_SCALE: Record<AbilityGrade, number> = {
  F: 0.5,
  D: 0.75,
  C: 1,
  B: 1.25,
  A: 1.55,
  S: 2,
};

const BASIC_D_TALENTS: CreatureAbility[] = [
  { id: "plain_vigor", name: "Plain Vigor", grade: "D", source: "general", description: "A minor knack for daily ranch life." },
  { id: "soft_focus", name: "Soft Focus", grade: "D", source: "general", description: "A modest focus talent." },
  { id: "gentle_start", name: "Gentle Start", grade: "D", source: "general", description: "A modest early-life talent." },
  { id: "steady_habits", name: "Steady Habits", grade: "D", source: "general", description: "A small reliability talent." },
  { id: "faint_spark", name: "Faint Spark", grade: "D", source: "general", description: "A barely awakened talent." },
];

const sourceRestrictions = new Map<string, TalentSourceRestriction[]>();

function addRestriction(id: string, restriction: TalentSourceRestriction) {
  const existing = sourceRestrictions.get(id) ?? [];
  const serialized = JSON.stringify(restriction);
  if (!existing.some((entry) => JSON.stringify(entry) === serialized)) {
    sourceRestrictions.set(id, [...existing, restriction]);
  }
}

for (const species of SPECIES_DEFINITIONS) {
  for (const talent of species.exclusiveAbilityPool) {
    addRestriction(talent.id, { family: species.family, speciesId: String(species.speciesId) });
  }
}
for (const variant of VARIANT_DEFINITIONS) {
  for (const talent of variant.exclusiveAbilityPool) {
    addRestriction(talent.id, { family: variant.family, speciesId: String(variant.speciesId), variantId: String(variant.variantId) });
  }
}

const SOURCE_TALENTS = [
  ...BASIC_D_TALENTS,
  ...GENERAL_ABILITY_POOL,
  ...SPECIES_DEFINITIONS.flatMap((species) => species.exclusiveAbilityPool),
  ...VARIANT_DEFINITIONS.flatMap((variant) => variant.exclusiveAbilityPool),
].filter((talent, index, pool) => pool.findIndex((entry) => entry.id === talent.id) === index);

function includesAny(id: string, tokens: string[]): boolean {
  return tokens.some((token) => id.includes(token));
}

function inferCategory(talent: CreatureAbility): TalentCategory {
  const id = talent.id.toLowerCase();
  if (includesAny(id, ["line", "lineage", "bloodline"])) return "lineage";
  if (includesAny(id, ["heal", "recovery", "lullaby", "dream", "moonlit", "warm", "comfort"])) return "recovery";
  if (includesAny(id, ["worker", "field", "trot", "saddle", "producer", "grazer", "milk", "bloom", "verdant", "pasture"])) return "chore";
  if (includesAny(id, ["guard", "pounce", "instinct", "resolve", "anchor", "intimidating", "shoulder", "gallop"])) return "combat";
  if (includesAny(id, ["bond", "nest", "fert", "grace", "spark", "purr"])) return "breeding";
  if (talent.source === "species") return "species";
  if (talent.source === "variant") return "variant";
  return "general";
}

function inferTags(talent: CreatureAbility): string[] {
  const id = talent.id.toLowerCase();
  const tags = new Set<string>();
  if (talent.source === "general") tags.add("general");
  if (talent.source === "species") tags.add("species-specific");
  if (talent.source === "variant") tags.add("variant-specific");
  if (includesAny(id, ["fert", "nest", "line", "bond", "purr", "grace"])) tags.add("breeding");
  if (includesAny(id, ["learn", "growth", "vigor", "spark", "focus", "eyes", "heart"])) tags.add("learner");
  if (includesAny(id, ["steady", "efficient", "hardy", "stamina", "coat", "frame", "shoulder", "back"])) tags.add("durable");
  if (includesAny(id, ["guard", "loyal", "pack", "anchor", "intimidating", "dark", "tiger"])) tags.add("security");
  if (includesAny(id, ["producer", "grazer", "milk", "pasture", "herd"])) tags.add("production");
  if (includesAny(id, ["bloom", "verdant", "meadow", "spring", "hop", "leap"])) tags.add("harvesting");
  if (includesAny(id, ["field", "trot", "saddle", "back", "shoulder", "gallop"])) tags.add("hauling");
  if (includesAny(id, ["warm", "gentle", "calm", "purr", "lullaby", "dream", "comfort", "healing"])) tags.add("caregiver");
  if (includesAny(id, ["pounce", "tiger", "ember", "infernal", "iron", "strong", "fearless"])) tags.add("striker");
  if (includesAny(id, ["guard", "anchor", "coat", "frame", "shoulder", "hardy"])) tags.add("tank");
  if (includesAny(id, ["grace", "step", "paws", "hop", "leap", "gallop", "trot"])) tags.add("skirmisher");
  if (includesAny(id, ["healing", "lullaby", "calm", "poise", "gaze", "purr"])) tags.add("support");
  return [...tags];
}

function legacyBreedingEffects(id: string, grade: AbilityGrade): TalentEffect[] {
  const multiplier = LEGACY_GRADE_MULTIPLIER[grade];
  const lowerName = id.toLowerCase();
  const effects: TalentEffect[] = [
    {
      type: "breeding-pregnancy-chance",
      value: includesAny(lowerName, ["fert", "bond", "grace", "lucky"])
        ? Math.round(3 * multiplier)
        : Math.round(1 * multiplier),
      note: "Matches the current live Breeding Pen talent adapter.",
    },
    {
      type: "breeding-creature-xp-flat",
      value: includesAny(lowerName, ["learn", "growth", "vigor", "spark"])
        ? Math.round(4 * multiplier)
        : Math.round(1 * multiplier),
      note: "Matches the current live Breeding Pen talent adapter.",
    },
  ];

  if (includesAny(lowerName, ["loyal", "guard", "poise"])) {
    effects.push({ type: "breeding-breeder-xp-flat", value: Math.round(4 * multiplier) });
  }
  if (includesAny(lowerName, ["steady", "efficient", "hardy"])) {
    effects.push({ type: "breeding-energy-discount", value: Math.round(3 * multiplier) });
  }
  if (includesAny(lowerName, ["gentle", "warm", "purr"])) {
    effects.push({ type: "breeding-affection-gain", value: 1 });
  }
  if (lowerName.includes("fert")) effects.push({ type: "growth-stat-bias", value: 1, creatureStatKey: "FER" });
  else if (lowerName.includes("guard")) effects.push({ type: "growth-stat-bias", value: 1, creatureStatKey: "WIL" });
  else if (lowerName.includes("vigor")) effects.push({ type: "growth-stat-bias", value: 1, creatureStatKey: "STA" });

  return effects;
}

function scaledValue(base: number, grade: AbilityGrade, minimum = 1): number {
  return Math.max(minimum, Math.round(base * SYSTEM_SCALE[grade]));
}

function pushChoreEffect(effects: TalentEffect[], tags: string[], grade: AbilityGrade) {
  const score = Number((0.8 * SYSTEM_SCALE[grade]).toFixed(1));
  const energy = Math.max(0, Math.round(1.25 * SYSTEM_SCALE[grade]));
  const jobs = new Set<RanchJobId>();
  if (tags.includes("security")) jobs.add("security_patrol");
  if (tags.includes("caregiver") || tags.includes("support")) jobs.add("comfort_care");
  if (tags.includes("production")) jobs.add("stable_production");
  if (tags.includes("harvesting")) jobs.add("garden_tending");
  if (tags.includes("hauling")) jobs.add("field_hauling");

  if (tags.includes("general") && tags.includes("durable")) {
    effects.push({ type: "chore-score", value: Number((0.35 * SYSTEM_SCALE[grade]).toFixed(1)), note: "Applies to every ranch chore." });
  }
  for (const jobId of jobs) {
    effects.push({ type: "chore-score", value: score, jobId });
    if (energy > 0 && (tags.includes("durable") || tags.includes("hauling"))) {
      effects.push({ type: "chore-energy-discount", value: energy, jobId });
    }
  }
}

function pushBattleEffects(effects: TalentEffect[], tags: string[], grade: AbilityGrade) {
  const addFlat = (battleStatKey: BattleStatKey, base: number) => {
    effects.push({ type: "battle-stat-flat", value: scaledValue(base, grade), battleStatKey });
  };
  if (tags.includes("tank")) {
    addFlat("maxHp", 8);
    addFlat("defense", 2);
  }
  if (tags.includes("striker")) addFlat("physicalPower", 2);
  if (tags.includes("skirmisher")) {
    addFlat("speed", 2);
    addFlat("evasion", 1);
  }
  if (tags.includes("support")) {
    addFlat("statusPower", 2);
    addFlat("statusResist", 1);
  }
  if (tags.includes("security") && !tags.includes("tank")) addFlat("defense", 1);
  if (tags.includes("learner")) addFlat("accuracy", 1);
}

function pushRecoveryEffects(effects: TalentEffect[], tags: string[], grade: AbilityGrade) {
  if (!tags.includes("caregiver") && !tags.includes("durable")) return;
  if (tags.includes("caregiver")) {
    effects.push({ type: "recovery-affection", value: Math.max(1, Math.floor(SYSTEM_SCALE[grade])) });
  }
  if (tags.includes("durable")) {
    effects.push({ type: "recovery-energy-percent", value: scaledValue(3, grade) });
  }
}

function pushInheritanceEffects(effects: TalentEffect[], id: string, tags: string[], grade: AbilityGrade) {
  if (includesAny(id, ["strong_line", "pure_lineage", "bloodline", "lucky_spark"])) {
    effects.push({ type: "inheritance-stability", value: scaledValue(2, grade) });
    effects.push({ type: "inheritance-ability-chance", value: scaledValue(2, grade) });
  }
  if (id === "lucky_spark") {
    effects.push({ type: "inheritance-mutation-chance", value: Math.max(1, Math.round(SYSTEM_SCALE[grade])) });
  }
  if (tags.includes("breeding") && includesAny(id, ["nest", "lineage", "line"])) {
    effects.push({ type: "inheritance-stability", value: Math.max(1, Math.round(SYSTEM_SCALE[grade])) });
  }
}

function roleTagsFor(tags: string[]): string[] {
  const roles = new Set<string>();
  if (tags.includes("tank")) roles.add("Tank");
  if (tags.includes("striker")) roles.add("Striker");
  if (tags.includes("skirmisher")) roles.add("Skirmisher");
  if (tags.includes("support")) roles.add("Support");
  if (tags.includes("caregiver")) roles.add("Caregiver");
  if (tags.includes("security")) roles.add("Security");
  if (tags.includes("production")) roles.add("Producer");
  if (tags.includes("harvesting")) roles.add("Harvester");
  if (tags.includes("hauling")) roles.add("Field Worker");
  if (tags.includes("learner")) roles.add("Fast Learner");
  if (tags.includes("durable")) roles.add("Durable");
  return [...roles];
}

function buildEffects(talent: CreatureAbility, grade: AbilityGrade, tags: string[]): TalentEffect[] {
  const effects = legacyBreedingEffects(talent.id, grade);
  pushChoreEffect(effects, tags, grade);
  pushBattleEffects(effects, tags, grade);
  pushRecoveryEffects(effects, tags, grade);
  pushInheritanceEffects(effects, talent.id, tags, grade);
  for (const roleTag of roleTagsFor(tags)) effects.push({ type: "role-tag", value: 1, roleTag });
  return effects;
}

function signed(value: number, suffix = ""): string {
  return `${value >= 0 ? "+" : ""}${value}${suffix}`;
}

function jobLabel(jobId?: RanchJobId): string {
  if (jobId === "security_patrol") return "Security Patrol";
  if (jobId === "comfort_care") return "Comfort Care";
  if (jobId === "stable_production") return "Stable Production";
  if (jobId === "garden_tending") return "Garden Tending";
  if (jobId === "field_hauling") return "Field Hauling";
  return "all chores";
}

function battleStatLabel(stat?: BattleStatKey): string {
  if (!stat) return "battle stat";
  return stat.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

export function describeTalentEffect(effect: TalentEffect): string {
  if (effect.type === "breeding-pregnancy-chance") return `${signed(effect.value, "%")} pregnancy chance`;
  if (effect.type === "breeding-energy-discount") return `${effect.value} less Breeding Energy cost`;
  if (effect.type === "breeding-creature-xp-flat") return `${signed(effect.value)} creature XP per breeding session`;
  if (effect.type === "breeding-creature-xp-percent") return `${signed(effect.value, "%")} creature XP from breeding`;
  if (effect.type === "breeding-breeder-xp-flat") return `${signed(effect.value)} Breeder XP when the player participates`;
  if (effect.type === "breeding-affection-gain") return `${signed(effect.value)} extra Affection after breeding`;
  if (effect.type === "growth-stat-bias") return `favors ${effect.creatureStatKey ?? "stat"} growth`;
  if (effect.type === "inheritance-stability") return `${signed(effect.value)} inheritance stability`;
  if (effect.type === "inheritance-ability-chance") return `${signed(effect.value, "%")} talent inheritance chance`;
  if (effect.type === "inheritance-mutation-chance") return `${signed(effect.value, "%")} beneficial mutation chance`;
  if (effect.type === "chore-score") return `${signed(effect.value)} ${jobLabel(effect.jobId)} score`;
  if (effect.type === "chore-energy-discount") return `${effect.value} less Energy for ${jobLabel(effect.jobId)}`;
  if (effect.type === "chore-xp-percent") return `${signed(effect.value, "%")} chore-skill XP`;
  if (effect.type === "battle-stat-flat") return `${signed(effect.value)} ${battleStatLabel(effect.battleStatKey)}`;
  if (effect.type === "battle-stat-percent") return `${signed(effect.value, "%")} ${battleStatLabel(effect.battleStatKey)}`;
  if (effect.type === "battle-damage-percent") return `${signed(effect.value, "%")} battle damage`;
  if (effect.type === "battle-healing-percent") return `${signed(effect.value, "%")} healing`;
  if (effect.type === "battle-start-status") return `starts battle with ${effect.statusId ?? "a status"}`;
  if (effect.type === "recovery-energy-percent") return `${signed(effect.value, "%")} daily Energy recovery`;
  if (effect.type === "recovery-affection") return `${signed(effect.value)} Affection during daily recovery`;
  if (effect.type === "role-tag") return `role identity: ${effect.roleTag ?? "Specialist"}`;
  return effect.note ?? effect.type;
}

function buildDescription(effects: TalentEffect[]): string {
  const mechanicalEffects = effects.filter((effect) => effect.type !== "role-tag");
  return mechanicalEffects.length
    ? mechanicalEffects.map(describeTalentEffect).join("; ") + "."
    : "Provides a role identity used by creature recommendations.";
}

function systemsFromEffects(effects: TalentEffect[]): TalentSystem[] {
  const systems = new Set<TalentSystem>();
  for (const effect of effects) {
    if (effect.type.startsWith("breeding-")) systems.add("breeding");
    if (effect.type === "growth-stat-bias") systems.add("growth");
    if (effect.type.startsWith("inheritance-")) systems.add("inheritance");
    if (effect.type.startsWith("chore-")) systems.add("chore");
    if (effect.type.startsWith("battle-")) systems.add("battle");
    if (effect.type.startsWith("recovery-")) systems.add("recovery");
    if (effect.type === "role-tag") systems.add("role-tags");
  }
  return [...systems];
}

function triggersFromSystems(systems: TalentSystem[]): TalentTrigger[] {
  const triggers = new Set<TalentTrigger>(["passive"]);
  if (systems.includes("breeding")) {
    triggers.add("breeding-preview");
    triggers.add("breeding-attempt");
  }
  if (systems.includes("growth")) triggers.add("level-growth");
  if (systems.includes("inheritance")) triggers.add("inheritance-roll");
  if (systems.includes("chore")) {
    triggers.add("chore-score");
    triggers.add("chore-energy-cost");
  }
  if (systems.includes("battle")) triggers.add("battle-stats");
  if (systems.includes("recovery")) triggers.add("daily-recovery");
  return [...triggers];
}

function buildDefinition(talent: CreatureAbility): TalentDefinition {
  const category = inferCategory(talent);
  const tags = inferTags(talent);
  const gradeEffects = GRADES.reduce((record, grade) => ({
    ...record,
    [grade]: buildEffects(talent, grade, tags),
  }), {} as Record<AbilityGrade, TalentEffect[]>);
  const systems = systemsFromEffects(gradeEffects[talent.grade] ?? gradeEffects.C);
  return {
    id: talent.id,
    name: talent.name,
    category,
    source: talent.source,
    tags,
    systems,
    triggers: triggersFromSystems(systems),
    stackingRule: "additive",
    sourceRestrictions: sourceRestrictions.get(talent.id) ?? [],
    gradeEffects,
    exactDescriptionByGrade: GRADES.reduce((record, grade) => ({
      ...record,
      [grade]: buildDescription(gradeEffects[grade]),
    }), {} as Record<AbilityGrade, string>),
    definitionVersion: TALENT_DEFINITION_VERSION,
  };
}

export const TALENT_DEFINITIONS: TalentDefinition[] = SOURCE_TALENTS.map(buildDefinition);
const TALENT_DEFINITION_MAP = new Map(TALENT_DEFINITIONS.map((definition) => [definition.id, definition]));

export function getAllTalentDefinitions(): TalentDefinition[] {
  return TALENT_DEFINITIONS.map((definition) => ({
    ...definition,
    tags: [...definition.tags],
    systems: [...definition.systems],
    triggers: [...definition.triggers],
    sourceRestrictions: definition.sourceRestrictions.map((restriction) => ({ ...restriction, requiredTags: restriction.requiredTags ? [...restriction.requiredTags] : undefined })),
    gradeEffects: GRADES.reduce((record, grade) => ({ ...record, [grade]: definition.gradeEffects[grade].map((effect) => ({ ...effect })) }), {} as TalentDefinition["gradeEffects"]),
    exactDescriptionByGrade: { ...definition.exactDescriptionByGrade },
  }));
}

export function getTalentDefinition(talentId: string): TalentDefinition | null {
  return TALENT_DEFINITION_MAP.get(talentId) ?? null;
}

export function getTalentEffects(talentId: string, grade: AbilityGrade): TalentEffect[] {
  return getTalentDefinition(talentId)?.gradeEffects[grade].map((effect) => ({ ...effect })) ?? [];
}

export function getTalentDescription(talentId: string, grade: AbilityGrade): string | null {
  return getTalentDefinition(talentId)?.exactDescriptionByGrade[grade] ?? null;
}

export function normalizeTalentInstance(talent: CreatureAbility): CreatureAbility {
  const definition = getTalentDefinition(talent.id);
  if (!definition) return talent;
  return {
    ...talent,
    name: definition.name,
    description: definition.exactDescriptionByGrade[talent.grade],
    category: definition.category,
    tags: [...definition.tags],
    definitionVersion: definition.definitionVersion,
  };
}

export function normalizeTalentInstances(talents: CreatureAbility[] | undefined): CreatureAbility[] {
  return (talents ?? [])
    .map(normalizeTalentInstance)
    .filter((talent, index, pool) => pool.findIndex((entry) => entry.id === talent.id) === index);
}
