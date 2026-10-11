import * as expanded from "./battleMovesExpanded";
import type {
  BattleMove,
  BattleMoveId,
} from "@/types/battle";
import type { CreatureFamily } from "@/types/creature";

export * from "./battleMovesExpanded";

export const COLISEUM_BATTLE_MOVE_DEFINITION_VERSION = 1;

const ALL_FAMILIES: CreatureFamily[] = ["feline", "canine", "bovine", "lapine", "equine"];

/** Focus Manual techniques shared by every family; saved loadouts stay explicit. */
export const TACTICAL_MANUAL_MOVES: readonly BattleMove[] = [
  {
    id: "covering_guard", name: "Covering Guard",
    description: "Act early to give one ally 35% Guarded protection for this round. Time it before concentrated attacks.",
    sourceType: "manual", category: "support", targetType: "single_ally",
    power: 0, accuracy: 100, battleEnergyCost: 9, cooldown: 2, priority: 2,
    tags: ["guard", "support"],
    effects: [{ type: "apply_status", target: "target", status: "guarded", amount: 35, duration: 1 }],
    inheritable: true, rarity: "uncommon", learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "none", resistedBy: "none", aiHints: ["guard_ally"], definitionVersion: 1,
  },
  {
    id: "clear_head", name: "Clear Head",
    description: "Remove Bleed and Marked from one ally and restore 6 Battle Energy. Offers cleansing without healing HP.",
    sourceType: "manual", category: "support", targetType: "single_ally",
    power: 0, accuracy: 100, battleEnergyCost: 8, cooldown: 2, priority: 1,
    tags: ["cleanse", "support", "battle_energy"],
    effects: [
      { type: "cleanse_status", target: "target", status: "bleed" },
      { type: "cleanse_status", target: "target", status: "marked" },
      { type: "restore_battle_energy", target: "target", amount: 6 },
    ],
    inheritable: true, rarity: "uncommon", learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "none", resistedBy: "none", aiHints: ["cleanse", "restore_energy"], definitionVersion: 1,
  },
  {
    id: "piercing_echo", name: "Piercing Echo",
    description: "A special attack that breaks Guarded protection. An alternative to physical guard breakers against armored foes.",
    sourceType: "manual", category: "special", targetType: "single_enemy",
    power: 22, accuracy: 92, battleEnergyCost: 11, cooldown: 2, priority: 0,
    tags: ["special", "guard_break"], effects: [{ type: "damage", target: "target" }],
    inheritable: true, rarity: "uncommon", learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "specialPower", resistedBy: "resistance", aiHints: ["damage"], definitionVersion: 1,
  },
  {
    id: "checking_blow", name: "Checking Blow",
    description: "A light physical hit with a 75% chance to Slow its target for two rounds. Status resistance can reduce the chance.",
    sourceType: "manual", category: "physical", targetType: "single_enemy",
    power: 16, accuracy: 94, battleEnergyCost: 8, cooldown: 2, priority: 0,
    tags: ["physical", "disrupt"], effects: [
      { type: "damage", target: "target" },
      { type: "apply_status", target: "target", status: "slowed", chance: 75, duration: 2 },
    ],
    inheritable: true, rarity: "uncommon", learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "physicalPower", resistedBy: "defense", aiHints: ["damage", "debuff_threat"], definitionVersion: 1,
  },
];

export const COLISEUM_EXCLUSIVE_MOVES = [
  {
    id: "arena_breaker",
    name: "Arena Breaker",
    description: "A disciplined Coliseum strike that punishes defensive formations and shatters Guarded protection.",
    sourceType: "coliseum",
    category: "physical",
    targetType: "single_enemy",
    power: 34,
    accuracy: 93,
    battleEnergyCost: 12,
    cooldown: 2,
    priority: 0,
    tags: ["coliseum", "physical", "guard_break", "pressure"],
    effects: [{ type: "damage", target: "target" }],
    inheritable: false,
    rarity: "rare",
    learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "physicalPower",
    resistedBy: "defense",
    aiHints: ["damage"],
    definitionVersion: COLISEUM_BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "tactical_reversal",
    name: "Tactical Reversal",
    description: "Turn enemy pressure into momentum, gaining Guarded and Inspired before the next exchange.",
    sourceType: "coliseum",
    category: "support",
    targetType: "self",
    power: 0,
    accuracy: 100,
    battleEnergyCost: 10,
    cooldown: 3,
    priority: 2,
    tags: ["coliseum", "guard", "counter", "setup"],
    effects: [
      { type: "apply_status", target: "self", status: "guarded", amount: 24, duration: 1 },
      { type: "apply_status", target: "self", status: "inspired", duration: 2 },
    ],
    inheritable: false,
    rarity: "rare",
    learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "none",
    resistedBy: "none",
    aiHints: ["guard_self", "setup"],
    definitionVersion: COLISEUM_BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "arena_medic",
    name: "Arena Medic",
    description: "A tournament recovery technique that restores one ally and removes common control penalties.",
    sourceType: "coliseum",
    category: "healing",
    targetType: "single_ally",
    power: 32,
    accuracy: 100,
    battleEnergyCost: 16,
    cooldown: 3,
    priority: 0,
    tags: ["coliseum", "heal", "cleanse", "support"],
    effects: [
      { type: "heal", target: "target", amount: 32 },
      { type: "cleanse_status", target: "target", status: "slowed" },
      { type: "cleanse_status", target: "target", status: "weakened" },
    ],
    inheritable: false,
    rarity: "rare",
    learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "statusPower",
    resistedBy: "none",
    aiHints: ["heal_lowest", "cleanse"],
    definitionVersion: COLISEUM_BATTLE_MOVE_DEFINITION_VERSION,
  },
  {
    id: "champion_command",
    name: "Champion Command",
    description: "A Crown-circuit formation call that inspires the entire team and restores Battle Energy.",
    sourceType: "coliseum",
    category: "support",
    targetType: "all_allies",
    power: 0,
    accuracy: 100,
    battleEnergyCost: 22,
    cooldown: 5,
    priority: 1,
    tags: ["coliseum", "champion", "teamwork", "battle_energy"],
    effects: [
      { type: "apply_status", target: "allies", status: "inspired", duration: 2 },
      { type: "restore_battle_energy", target: "allies", amount: 12 },
    ],
    inheritable: false,
    rarity: "signature",
    learnRequirements: { familyTags: ALL_FAMILIES },
    scalingStat: "none",
    resistedBy: "none",
    aiHints: ["buff_team", "restore_energy"],
    definitionVersion: COLISEUM_BATTLE_MOVE_DEFINITION_VERSION,
  },
] as const satisfies readonly BattleMove[];

export const COLISEUM_EXCLUSIVE_MOVE_IDS = COLISEUM_EXCLUSIVE_MOVES.map((move) => move.id) as BattleMoveId[];

export const BATTLE_MOVES: readonly BattleMove[] = [
  ...expanded.BATTLE_MOVES,
  ...TACTICAL_MANUAL_MOVES,
  ...COLISEUM_EXCLUSIVE_MOVES,
];

export const BATTLE_MOVES_BY_ID: Record<BattleMoveId, BattleMove> = BATTLE_MOVES.reduce(
  (movesById, move) => ({ ...movesById, [move.id]: move }),
  {} as Record<BattleMoveId, BattleMove>,
);

export const UNIVERSAL_BATTLE_MOVE_IDS = expanded.UNIVERSAL_BATTLE_MOVE_IDS;

export function getBattleMove(moveId: BattleMoveId): BattleMove {
  const move = BATTLE_MOVES_BY_ID[moveId];
  if (!move) throw new Error(`Unknown battle move: ${moveId}`);
  return move;
}

export function getBattleMoves(moveIds: BattleMoveId[]): BattleMove[] {
  return moveIds.map((moveId) => getBattleMove(moveId));
}

