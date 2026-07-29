import * as core from "./battleMoves";
import type {
  BattleMove,
  BattleMoveAiHint,
  BattleMoveCategory,
  BattleMoveDefenseStat,
  BattleMoveId,
  BattleMoveScalingStat,
} from "@/types/battle";
import type { SpeciesId } from "@/types/ids";

export * from "./battleMoves";

export const BATTLE_MOVE_DEFINITION_VERSION = 1;

const FELINE_SPECIES_ID = "species_feline" as SpeciesId;
const CANINE_SPECIES_ID = "species_canine" as SpeciesId;
const BOVINE_SPECIES_ID = "species_bovine" as SpeciesId;
const LAPINE_SPECIES_ID = "species_lapine" as SpeciesId;
const EQUINE_SPECIES_ID = "species_equine" as SpeciesId;

function getDefaultScalingStat(category: BattleMoveCategory): BattleMoveScalingStat {
  if (category === "physical") return "physicalPower";
  if (category === "special") return "specialPower";
  if (category === "status" || category === "healing") return "statusPower";
  return "none";
}

function getDefaultDefenseStat(category: BattleMoveCategory): BattleMoveDefenseStat {
  if (category === "physical") return "defense";
  if (category === "special") return "resistance";
  if (category === "status") return "statusResist";
  return "none";
}

function inferAiHints(move: BattleMove): BattleMoveAiHint[] {
  const hints = new Set<BattleMoveAiHint>();
  if (move.effects.some((effect) => effect.type === "damage")) hints.add("damage");
  if (move.tags.includes("finisher") || move.tags.includes("pursuit")) hints.add("finisher");
  if (move.effects.some((effect) => effect.type === "heal")) hints.add("heal_lowest");
  if (move.effects.some((effect) => effect.type === "restore_battle_energy")) hints.add("restore_energy");
  if (move.effects.some((effect) => effect.type === "cleanse_status")) hints.add("cleanse");
  if (move.effects.some((effect) => effect.type === "taunt")) hints.add("taunt");
  if (move.effects.some((effect) => effect.type === "debuff_stat" || (effect.type === "apply_status" && effect.target === "target"))) hints.add("debuff_threat");
  if (move.targetType === "all_allies" && move.category === "support") hints.add("buff_team");
  if (move.targetType === "self" && move.tags.includes("guard")) hints.add("guard_self");
  if (!hints.size) hints.add("setup");
  return Array.from(hints);
}

function normalizeMoveDefinition(move: BattleMove): BattleMove {
  return {
    ...move,
    scalingStat: move.scalingStat ?? getDefaultScalingStat(move.category),
    resistedBy: move.resistedBy ?? getDefaultDefenseStat(move.category),
    aiHints: move.aiHints?.length ? [...move.aiHints] : inferAiHints(move),
    definitionVersion: move.definitionVersion ?? BATTLE_MOVE_DEFINITION_VERSION,
  };
}

export const ADVANCED_BATTLE_MOVES = [
  {
    id: "will_bolt",
    name: "Will Bolt",
    description: "A focused burst of willpower that gives every species access to a basic special attack.",
    sourceType: "universal",
    category: "special",
    targetType: "single_enemy",
    power: 20,
    accuracy: 94,
    battleEnergyCost: 4,
    cooldown: 0,
    priority: 0,
    tags: ["special", "focus", "willpower", "basic"],
    effects: [{ type: "damage", target: "target" }],
    inheritable: true,
    rarity: "common",
    scalingStat: "specialPower",
    resistedBy: "resistance",
    aiHints: ["damage"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "mend_wounds",
    name: "Mend Wounds",
    description: "A deliberate healing technique that restores one ally and cleanses Weakened.",
    sourceType: "universal",
    category: "healing",
    targetType: "single_ally",
    power: 28,
    accuracy: 100,
    battleEnergyCost: 14,
    cooldown: 3,
    priority: 0,
    tags: ["heal", "care", "support", "cleanse"],
    effects: [
      { type: "heal", target: "target", amount: 28 },
      { type: "cleanse_status", target: "target", status: "weakened" },
    ],
    inheritable: true,
    rarity: "uncommon",
    learnRequirements: { temperamentTags: ["nurturing", "protective", "disciplined", "calm"], roleTags: ["support", "healer"] },
    scalingStat: "statusPower",
    resistedBy: "none",
    aiHints: ["heal_lowest", "cleanse"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "suppress",
    name: "Suppress",
    description: "Pressure one enemy, reducing its offensive output and slowing its next actions.",
    sourceType: "universal",
    category: "status",
    targetType: "single_enemy",
    power: 0,
    accuracy: 90,
    battleEnergyCost: 9,
    cooldown: 2,
    priority: 0,
    tags: ["control", "debuff", "pressure"],
    effects: [
      { type: "apply_status", target: "target", status: "weakened", duration: 2 },
      { type: "apply_status", target: "target", status: "slowed", chance: 40, duration: 2 },
    ],
    inheritable: true,
    rarity: "common",
    learnRequirements: { roleTags: ["controller", "disruptor", "tank"], temperamentTags: ["territorial", "cunning", "disciplined"] },
    scalingStat: "statusPower",
    resistedBy: "statusResist",
    aiHints: ["debuff_threat"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "energy_link",
    name: "Energy Link",
    description: "Transfer tactical momentum to one ally, restoring Battle Energy and granting Inspired.",
    sourceType: "universal",
    category: "support",
    targetType: "single_ally",
    power: 0,
    accuracy: 100,
    battleEnergyCost: 8,
    cooldown: 2,
    priority: 0,
    tags: ["support", "battle_energy", "teamwork"],
    effects: [
      { type: "restore_battle_energy", target: "target", amount: 14 },
      { type: "apply_status", target: "target", status: "inspired", duration: 1 },
    ],
    inheritable: true,
    rarity: "common",
    learnRequirements: { roleTags: ["support", "buffer", "healer"], temperamentTags: ["loyal", "protective", "nurturing"] },
    scalingStat: "none",
    resistedBy: "none",
    aiHints: ["restore_energy", "buff_team"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "shadow_feint",
    name: "Shadow Feint",
    description: "A deceptive feline special attack that may leave the target Marked.",
    sourceType: "species",
    category: "special",
    targetType: "single_enemy",
    power: 27,
    accuracy: 93,
    battleEnergyCost: 9,
    cooldown: 1,
    priority: 1,
    tags: ["feline", "special", "feint", "mark", "cunning"],
    effects: [
      { type: "damage", target: "target" },
      { type: "apply_status", target: "target", status: "marked", chance: 35, duration: 2 },
    ],
    inheritable: true,
    rarity: "uncommon",
    learnRequirements: { speciesIds: [FELINE_SPECIES_ID], temperamentTags: ["cunning", "predatory"] },
    scalingStat: "specialPower",
    resistedBy: "resistance",
    aiHints: ["damage", "setup"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "resonant_bark",
    name: "Resonant Bark",
    description: "A forceful canine call that strikes every enemy and may leave them Weakened.",
    sourceType: "species",
    category: "special",
    targetType: "all_enemies",
    power: 18,
    accuracy: 88,
    battleEnergyCost: 15,
    cooldown: 3,
    priority: 0,
    tags: ["canine", "special", "howl", "pressure", "team_attack"],
    effects: [
      { type: "damage", target: "enemies" },
      { type: "apply_status", target: "enemies", status: "weakened", chance: 25, duration: 2 },
    ],
    inheritable: true,
    rarity: "uncommon",
    learnRequirements: { speciesIds: [CANINE_SPECIES_ID], temperamentTags: ["loyal", "aggressive", "protective"] },
    scalingStat: "specialPower",
    resistedBy: "resistance",
    aiHints: ["damage", "debuff_threat"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "unyielding_aura",
    name: "Unyielding Aura",
    description: "A bovine defensive presence that grants Guarded to the entire team.",
    sourceType: "species",
    category: "support",
    targetType: "all_allies",
    power: 0,
    accuracy: 100,
    battleEnergyCost: 16,
    cooldown: 4,
    priority: 1,
    tags: ["bovine", "guard", "teamwork", "tank", "support"],
    effects: [{ type: "apply_status", target: "allies", status: "guarded", amount: 20, duration: 1 }],
    inheritable: true,
    rarity: "rare",
    learnRequirements: { speciesIds: [BOVINE_SPECIES_ID], roleTags: ["tank", "support"] },
    scalingStat: "none",
    resistedBy: "none",
    aiHints: ["buff_team", "guard_ally"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "soothing_pulse",
    name: "Soothing Pulse",
    description: "A lapine healing rhythm that restores a modest amount of HP to all allies.",
    sourceType: "species",
    category: "healing",
    targetType: "all_allies",
    power: 18,
    accuracy: 100,
    battleEnergyCost: 17,
    cooldown: 4,
    priority: 0,
    tags: ["lapine", "heal", "teamwork", "nurturing"],
    effects: [{ type: "heal", target: "allies", amount: 18 }],
    inheritable: true,
    rarity: "rare",
    learnRequirements: { speciesIds: [LAPINE_SPECIES_ID], temperamentTags: ["nurturing", "docile"] },
    scalingStat: "statusPower",
    resistedBy: "none",
    aiHints: ["heal_lowest"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "thunder_tread",
    name: "Thunder Tread",
    description: "A resonant equine stomp that damages every enemy and may Slow them.",
    sourceType: "species",
    category: "special",
    targetType: "all_enemies",
    power: 20,
    accuracy: 86,
    battleEnergyCost: 16,
    cooldown: 3,
    priority: -1,
    tags: ["equine", "special", "hoof", "heavy", "slow"],
    effects: [
      { type: "damage", target: "enemies" },
      { type: "apply_status", target: "enemies", status: "slowed", chance: 30, duration: 2 },
    ],
    inheritable: true,
    rarity: "uncommon",
    learnRequirements: { speciesIds: [EQUINE_SPECIES_ID], bodyTags: ["hoofed", "heavy", "sturdy"] },
    scalingStat: "specialPower",
    resistedBy: "resistance",
    aiHints: ["damage", "debuff_threat"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "predator_pursuit",
    name: "Predator Pursuit",
    description: "A rare inherited technique created when focused marking and relentless pursuit combine.",
    sourceType: "combination",
    category: "physical",
    targetType: "single_enemy",
    power: 35,
    accuracy: 92,
    battleEnergyCost: 13,
    cooldown: 2,
    priority: 1,
    tags: ["combination", "pursuit", "mark", "finisher", "predatory"],
    effects: [
      { type: "damage", target: "target" },
      { type: "apply_status", target: "target", status: "marked", duration: 2 },
    ],
    inheritable: true,
    rarity: "rare",
    learnRequirements: { requiredAnyTags: ["pursuit", "predatory", "finisher", "cunning"] },
    scalingStat: "physicalPower",
    resistedBy: "defense",
    aiHints: ["damage", "finisher"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
    combinationRecipeIds: ["recipe_predator_pursuit"],
  },
  {
    id: "guardian_chorus",
    name: "Guardian Chorus",
    description: "A rare inherited team call formed from protective howls and calming presence.",
    sourceType: "combination",
    category: "support",
    targetType: "all_allies",
    power: 0,
    accuracy: 100,
    battleEnergyCost: 18,
    cooldown: 4,
    priority: 0,
    tags: ["combination", "howl", "calm", "guard", "teamwork"],
    effects: [
      { type: "apply_status", target: "allies", status: "inspired", duration: 2 },
      { type: "apply_status", target: "allies", status: "guarded", amount: 18, duration: 1 },
    ],
    inheritable: true,
    rarity: "rare",
    learnRequirements: { requiredAnyTags: ["support", "protective", "loyal", "calm"] },
    scalingStat: "none",
    resistedBy: "none",
    aiHints: ["buff_team", "guard_ally"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
    combinationRecipeIds: ["recipe_guardian_chorus"],
  },
  {
    id: "restorative_rhythm",
    name: "Restorative Rhythm",
    description: "A rare inherited rhythm that combines nurturing comfort with disciplined calm.",
    sourceType: "combination",
    category: "healing",
    targetType: "all_allies",
    power: 24,
    accuracy: 100,
    battleEnergyCost: 20,
    cooldown: 5,
    priority: 0,
    tags: ["combination", "heal", "calm", "nurturing", "cleanse"],
    effects: [
      { type: "heal", target: "allies", amount: 24 },
      { type: "cleanse_status", target: "allies", status: "exhausted" },
      { type: "cleanse_status", target: "allies", status: "weakened" },
    ],
    inheritable: true,
    rarity: "rare",
    learnRequirements: { requiredAnyTags: ["nurturing", "calm", "support", "healer"] },
    scalingStat: "statusPower",
    resistedBy: "none",
    aiHints: ["heal_lowest", "cleanse"],
    definitionVersion: BATTLE_MOVE_DEFINITION_VERSION,
    combinationRecipeIds: ["recipe_restorative_rhythm"],
  },
] as const satisfies readonly BattleMove[];

export const UNIVERSAL_BATTLE_MOVE_IDS = [
  ...core.UNIVERSAL_BATTLE_MOVE_IDS,
  "will_bolt",
  "mend_wounds",
  "suppress",
  "energy_link",
] as const satisfies readonly BattleMoveId[];

export const BATTLE_MOVES: readonly BattleMove[] = [
  ...core.BATTLE_MOVES.map(normalizeMoveDefinition),
  ...ADVANCED_BATTLE_MOVES.map(normalizeMoveDefinition),
];

export const BATTLE_MOVES_BY_ID: Record<BattleMoveId, BattleMove> = BATTLE_MOVES.reduce(
  (movesById, move) => ({ ...movesById, [move.id]: move }),
  {} as Record<BattleMoveId, BattleMove>,
);

export function getBattleMove(moveId: BattleMoveId): BattleMove {
  const move = BATTLE_MOVES_BY_ID[moveId];
  if (!move) throw new Error(`Unknown battle move: ${moveId}`);
  return move;
}

export function getBattleMoves(moveIds: BattleMoveId[]): BattleMove[] {
  return moveIds.map((moveId) => getBattleMove(moveId));
}
