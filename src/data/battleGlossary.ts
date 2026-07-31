import type {
  BattleMoveEffectType,
  BattleStatKey,
  BattleStatusId,
} from "@/types/battle";

export type BattleGlossaryEntry = {
  key: string;
  label: string;
  flavor: string;
  mechanics: string;
};

const STATUS_GLOSSARY: Record<BattleStatusId, BattleGlossaryEntry> = {
  bleed: {
    key: "bleed",
    label: "Bleed",
    flavor: "The wound keeps opening as the round wears on.",
    mechanics: "At the end of each round, the creature loses the status amount in HP (5 by default) for every stack before duration decreases. Bleed can reach 3 stacks.",
  },
  stun: {
    key: "stun",
    label: "Stun",
    flavor: "The creature is briefly unable to gather itself.",
    mechanics: "The creature cannot perform its queued action while Stun is active. Stun does not prevent normal end-of-round status ticks or Battle Energy recovery. Maximum 1 stack.",
  },
  guarded: {
    key: "guarded",
    label: "Guarded",
    flavor: "A braced stance turns a clean hit into a glancing blow.",
    mechanics: "Reduces incoming damage by the status amount (25% by default, clamped between 5% and 65%). Guard Break moves gain 25% damage against Guarded targets and remove Guarded after the hit. Maximum 1 stack.",
  },
  inspired: {
    key: "inspired",
    label: "Inspired",
    flavor: "Confidence sharpens every offensive instinct.",
    mechanics: "A general Inspired effect adds its amount (+3 by default) per stack to Physical Power, Special Power, and Status Power. Stat-specific Inspired effects increase only the named stat. Any active Inspired effect also adds 2 Battle Energy to end-of-round recovery. Up to 2 stacks.",
  },
  marked: {
    key: "marked",
    label: "Marked",
    flavor: "Every opening has been identified and called out.",
    mechanics: "The creature takes 15% more incoming damage from all attacks while Marked. Maximum 1 stack.",
  },
  taunted: {
    key: "taunted",
    label: "Taunted",
    flavor: "Provocation drags the creature's attention toward one opponent.",
    mechanics: "Single-enemy moves must target the living creature that applied Taunted. Self, ally, field, and all-enemy moves are not redirected. Maximum 1 stack.",
  },
  exhausted: {
    key: "exhausted",
    label: "Exhausted",
    flavor: "Heavy limbs make every decision arrive a little late.",
    mechanics: "Reduces Speed by the status amount (3 by default) per stack and halves end-of-round Battle Energy recovery while any Exhausted effect is active. Pursuit-tagged attacks gain 10% damage against an Exhausted target. Up to 2 stacks.",
  },
  weakened: {
    key: "weakened",
    label: "Weakened",
    flavor: "Power drains away before the strike can fully form.",
    mechanics: "A general Weakened effect reduces Physical Power and Special Power by the status amount (4 by default) per stack. Stat-specific Weakened effects reduce only the named stat. Up to 2 stacks.",
  },
  slowed: {
    key: "slowed",
    label: "Slowed",
    flavor: "Restricted movement makes the creature easier to read and catch.",
    mechanics: "Reduces Speed by the status amount (6 by default) per stack and reduces Evasion by half that amount, rounded up, per stack. Pursuit-tagged attacks gain 10% damage against a Slowed target. Up to 2 stacks.",
  },
};

const STAT_GLOSSARY: Record<BattleStatKey, BattleGlossaryEntry> = {
  maxHp: {
    key: "maxHp",
    label: "Maximum HP",
    flavor: "The total punishment a creature can withstand.",
    mechanics: "Sets the creature's maximum Hit Points. Reaching 0 current HP causes the creature to faint.",
  },
  physicalPower: {
    key: "physicalPower",
    label: "Physical Power",
    flavor: "Force generated through body, momentum, and direct impact.",
    mechanics: "Increases damage for moves that scale from Physical Power.",
  },
  specialPower: {
    key: "specialPower",
    label: "Special Power",
    flavor: "Control over elemental, mystical, and projected attacks.",
    mechanics: "Increases damage for moves that scale from Special Power.",
  },
  defense: {
    key: "defense",
    label: "Defense",
    flavor: "Natural toughness against direct physical force.",
    mechanics: "Reduces damage from moves resisted by Defense.",
  },
  resistance: {
    key: "resistance",
    label: "Resistance",
    flavor: "The ability to endure special and elemental pressure.",
    mechanics: "Reduces damage from moves resisted by Resistance.",
  },
  speed: {
    key: "speed",
    label: "Speed",
    flavor: "How quickly a creature commits to its chosen action.",
    mechanics: "Higher Speed raises turn score and normally causes the creature to act earlier after move Priority is considered.",
  },
  accuracy: {
    key: "accuracy",
    label: "Accuracy",
    flavor: "The ability to place an attack where it matters.",
    mechanics: "Modifies hostile move hit chance. Accuracy above or below 90 changes the final chance before Evasion and other bonuses are applied.",
  },
  evasion: {
    key: "evasion",
    label: "Evasion",
    flavor: "The ability to slip away from a committed attack.",
    mechanics: "Reduces the attacker's final hostile move hit chance.",
  },
  statusPower: {
    key: "statusPower",
    label: "Status Power",
    flavor: "The strength and reliability of disruptive techniques.",
    mechanics: "Improves status-move hit chance and secondary-effect chance when compared with the target's Status Resist.",
  },
  statusResist: {
    key: "statusResist",
    label: "Status Resist",
    flavor: "Composure against control, debuffs, and lingering effects.",
    mechanics: "Opposes hostile status accuracy and secondary-effect chance.",
  },
  battleEnergy: {
    key: "battleEnergy",
    label: "Battle Energy",
    flavor: "The reserve spent to use demanding techniques.",
    mechanics: "Sets maximum Battle Energy. Creatures recover 12% of maximum Battle Energy at the end of each round, with a minimum of 5 and maximum of 12 before status modifiers.",
  },
};

const EFFECT_GLOSSARY: Record<BattleMoveEffectType, BattleGlossaryEntry> = {
  damage: {
    key: "damage",
    label: "Damage",
    flavor: "Converts the move's power and scaling into lost HP.",
    mechanics: "Deals damage using the move's scaling stat, resisted-by stat, tags, target statuses, and area modifiers.",
  },
  guard: {
    key: "guard",
    label: "Guard",
    flavor: "Creates a temporary defensive stance.",
    mechanics: "Applies Guarded to the selected effect target for the listed duration and amount.",
  },
  heal: {
    key: "heal",
    label: "Heal",
    flavor: "Restores the target's ability to remain in the fight.",
    mechanics: "Restores HP up to the target's maximum HP. Healing cannot revive a fainted creature unless another rule explicitly says so.",
  },
  restore_battle_energy: {
    key: "restore_battle_energy",
    label: "Restore Battle Energy",
    flavor: "Returns spent momentum to the target.",
    mechanics: "Restores the listed Battle Energy amount without exceeding the target's maximum.",
  },
  apply_status: {
    key: "apply_status",
    label: "Apply Status",
    flavor: "Places a timed condition on the effect target.",
    mechanics: "Applies, stacks, or refreshes the listed status. Duration and stack limits are shown with the effect and status definition.",
  },
  cleanse_status: {
    key: "cleanse_status",
    label: "Cleanse Status",
    flavor: "Removes a specific harmful condition.",
    mechanics: "Removes every active stack of the named status from the effect target.",
  },
  buff_stat: {
    key: "buff_stat",
    label: "Buff Stat",
    flavor: "Temporarily improves one combat statistic.",
    mechanics: "Applies a stat-specific Inspired effect using the listed amount, duration, and stack limit.",
  },
  debuff_stat: {
    key: "debuff_stat",
    label: "Debuff Stat",
    flavor: "Temporarily suppresses one combat statistic.",
    mechanics: "Applies a stat-specific Weakened effect using the listed amount, duration, and stack limit.",
  },
  mark: {
    key: "mark",
    label: "Mark",
    flavor: "Calls attention to a vulnerable target.",
    mechanics: "Applies Marked, causing the target to take 15% more incoming damage while it remains active.",
  },
  taunt: {
    key: "taunt",
    label: "Taunt",
    flavor: "Forces an opponent to answer the provocation.",
    mechanics: "Applies Taunted and records the user as its source for single-enemy target enforcement.",
  },
};

const TAG_GLOSSARY: Record<string, BattleGlossaryEntry> = {
  precision: {
    key: "precision",
    label: "Precision",
    flavor: "A carefully placed technique sacrifices guesswork.",
    mechanics: "Adds 5 percentage points to the move's final hit chance before the 5%–100% clamp.",
  },
  finisher: {
    key: "finisher",
    label: "Finisher",
    flavor: "The move becomes most dangerous when the target is already failing.",
    mechanics: "Deals 20% more damage when the target is at or below 35% of maximum HP.",
  },
  pursuit: {
    key: "pursuit",
    label: "Pursuit",
    flavor: "Punishes opponents whose movement or stamina has broken down.",
    mechanics: "Deals 10% more damage against a Slowed target and another 10% more against an Exhausted target. Both bonuses can apply together.",
  },
  guard_break: {
    key: "guard_break",
    label: "Guard Break",
    flavor: "A committed strike aimed directly at a defensive stance.",
    mechanics: "Deals 25% more damage to a Guarded target and removes Guarded after the hit resolves.",
  },
};

export function getBattleStatusGlossary(status: BattleStatusId): BattleGlossaryEntry {
  return STATUS_GLOSSARY[status];
}

export function getBattleStatGlossary(stat: BattleStatKey): BattleGlossaryEntry {
  return STAT_GLOSSARY[stat];
}

export function getBattleEffectGlossary(effect: BattleMoveEffectType): BattleGlossaryEntry {
  return EFFECT_GLOSSARY[effect];
}

export function getBattleTagGlossary(tag: string): BattleGlossaryEntry | null {
  return TAG_GLOSSARY[tag] ?? null;
}

export const BATTLE_STATUS_GLOSSARY = STATUS_GLOSSARY;
