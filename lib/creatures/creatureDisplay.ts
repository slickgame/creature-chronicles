export type CreatureStatKey =
  | "strength"
  | "endurance"
  | "intelligence"
  | "speed"
  | "fertility"
  | "vitality";

export type CreatureSkillKey =
  | "cooking"
  | "cleaning"
  | "breedingCare"
  | "fieldWork"
  | "hauling";

export type CreatureTraitKey =
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

export type DisplaySkillProgress = {
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
};

export type DisplayTraitEntry = {
  trait?: string;
  grade?: string;
};

export type DisplayCreature = {
  name?: string;
  nickname?: string;
  level?: number;
  happiness?: number;
  breedingStamina?: number;
  maxBreedingStamina?: number;
  stats?: Partial<Record<CreatureStatKey, number>>;
  skills?: Partial<Record<CreatureSkillKey, DisplaySkillProgress>>;
  traits?: DisplayTraitEntry[];
};

export type DisplayInfo = {
  label: string;
  shortEffect: string;
  category: string;
  appliesTo: string[];
  futureHook?: boolean;
};

export const CREATURE_STAT_DISPLAY: Record<CreatureStatKey, DisplayInfo> = {
  strength: {
    label: "Strength",
    category: "Core Stat",
    shortEffect: "Improves hauling, supply work, field effort, and heavy road tasks.",
    appliesTo: ["Ranch Work", "Field Work", "Road Dispatch", "Future Combat Hook"],
    futureHook: true,
  },
  endurance: {
    label: "Endurance",
    category: "Core Stat",
    shortEffect: "Helps stamina last longer during ranch, breeding, and road work.",
    appliesTo: ["Ranch Work", "Breeding", "Road Dispatch"],
  },
  intelligence: {
    label: "Intelligence",
    category: "Core Stat",
    shortEffect: "Supports cooking, cleaning, market reads, and complex task reliability.",
    appliesTo: ["Cooking", "House Care", "Market Support", "Quest Work"],
  },
  speed: {
    label: "Speed",
    category: "Core Stat",
    shortEffect: "Helps with quick errands, courier checks, and faster practical work.",
    appliesTo: ["Field Work", "Road Dispatch", "Town Errands"],
  },
  fertility: {
    label: "Fertility",
    category: "Breeding Stat",
    shortEffect: "Contributes to breeding reliability and egg outcome checks.",
    appliesTo: ["Breeding", "Egg Quality"],
  },
  vitality: {
    label: "Vitality",
    category: "Condition Stat",
    shortEffect: "Supports recovery, breeding resilience, and future health systems.",
    appliesTo: ["Breeding", "Recovery", "Future Combat Hook"],
    futureHook: true,
  },
};

export const CREATURE_SKILL_DISPLAY: Record<CreatureSkillKey, DisplayInfo> = {
  cooking: {
    label: "Cooking",
    category: "Ranch Skill",
    shortEffect: "Improves simple meals and recipe work in the Ranch House.",
    appliesTo: ["Cooking", "Ranch Work"],
  },
  cleaning: {
    label: "Cleaning",
    category: "Ranch Skill",
    shortEffect: "Improves home care, grooming support, and tidy ranch routines.",
    appliesTo: ["House Care", "Barn Care", "Ranch Work"],
  },
  breedingCare: {
    label: "Breeding Care",
    category: "Breeding Skill",
    shortEffect: "Supports breeding handling, comfort, and future lineage care hooks.",
    appliesTo: ["Breeding", "Egg Care"],
  },
  fieldWork: {
    label: "Field Work",
    category: "Ranch Skill",
    shortEffect: "Improves planting, watering, fertilizing, and harvest help.",
    appliesTo: ["Field Work", "Ranch Work"],
  },
  hauling: {
    label: "Hauling",
    category: "Road Skill",
    shortEffect: "Improves supply runs, heavy deliveries, and dispatch reliability.",
    appliesTo: ["Road Dispatch", "Market Support", "Ranch Work"],
  },
};

export const CREATURE_TRAIT_DISPLAY: Record<CreatureTraitKey, DisplayInfo> = {
  domestic: {
    label: "Domestic",
    category: "Home Trait",
    shortEffect: "Comfortable with close ranch routines, cooking, and house care.",
    appliesTo: ["House Care", "Cooking", "Breeding"],
  },
  industrious: {
    label: "Industrious",
    category: "Work Trait",
    shortEffect: "Better suited to repeated practical tasks and steady labor.",
    appliesTo: ["Field Work", "Road Dispatch", "Ranch Work"],
  },
  calm: {
    label: "Calm",
    category: "Temperament",
    shortEffect: "Handles pressure better during breeding, recovery, and travel.",
    appliesTo: ["Breeding", "Recovery", "Road Dispatch"],
  },
  fertile: {
    label: "Fertile",
    category: "Breeding Trait",
    shortEffect: "A strong breeding signal that can matter for egg-focused pairings.",
    appliesTo: ["Breeding", "Egg Quality"],
  },
  quick: {
    label: "Quick",
    category: "Movement Trait",
    shortEffect: "Good for fast errands, courier checks, scouting, and nimble work.",
    appliesTo: ["Road Dispatch", "Town Errands", "Field Work"],
  },
  sturdy: {
    label: "Sturdy",
    category: "Condition Trait",
    shortEffect: "Good for stamina-heavy work, rough weather, and road service.",
    appliesTo: ["Road Dispatch", "Field Work", "Recovery"],
  },
  affectionate: {
    label: "Affectionate",
    category: "Social Trait",
    shortEffect: "A warm handling trait for mood, bonding, and future social hooks.",
    appliesTo: ["Barn Care", "Breeding", "Future Hook"],
    futureHook: true,
  },
  keen: {
    label: "Keen",
    category: "Awareness Trait",
    shortEffect: "Useful for scouting, rumors, buyer reads, and noticing details.",
    appliesTo: ["Road Dispatch", "Market Support", "Region Actions"],
  },
  barnwise: {
    label: "Barnwise",
    category: "Ranch Trait",
    shortEffect: "Settles well into ranch work, field routines, and creature care.",
    appliesTo: ["Ranch Work", "Field Work", "Barn Care"],
  },
  surefooted: {
    label: "Surefooted",
    category: "Road Trait",
    shortEffect: "Reliable on difficult ground, muddy routes, and hauling work.",
    appliesTo: ["Road Dispatch", "Region Actions"],
  },
  night_prawler: {
    label: "Night Prowler",
    category: "Scouting Trait",
    shortEffect: "Strong for scouting and rumor work; deeper night systems are future hooks.",
    appliesTo: ["Road Dispatch", "Rumors", "Future Hook"],
    futureHook: true,
  },
  graceful: {
    label: "Graceful",
    category: "Presentation Trait",
    shortEffect: "Helps the creature read as polished, marketable, and breeding-worthy.",
    appliesTo: ["Breeding", "Market Support", "Future Hook"],
    futureHook: true,
  },
};

const STAT_ORDER: CreatureStatKey[] = [
  "strength",
  "endurance",
  "intelligence",
  "speed",
  "fertility",
  "vitality",
];

const SKILL_ORDER: CreatureSkillKey[] = [
  "cooking",
  "cleaning",
  "breedingCare",
  "fieldWork",
  "hauling",
];

function statValue(creature: DisplayCreature, key: CreatureStatKey) {
  return creature.stats?.[key] ?? 0;
}

function skillLevel(creature: DisplayCreature, key: CreatureSkillKey) {
  return creature.skills?.[key]?.level ?? 0;
}

export function getCreatureStatEntries(creature: DisplayCreature) {
  return STAT_ORDER.map((key) => ({
    key,
    value: statValue(creature, key),
    ...CREATURE_STAT_DISPLAY[key],
  }));
}

export function getCreatureSkillEntries(creature: DisplayCreature) {
  return SKILL_ORDER.map((key) => ({
    key,
    level: skillLevel(creature, key),
    xp: creature.skills?.[key]?.xp ?? 0,
    xpToNextLevel: creature.skills?.[key]?.xpToNextLevel ?? 0,
    ...CREATURE_SKILL_DISPLAY[key],
  }));
}

export function getTraitDisplayInfo(trait: string | undefined): DisplayInfo {
  if (trait && trait in CREATURE_TRAIT_DISPLAY) {
    return CREATURE_TRAIT_DISPLAY[trait as CreatureTraitKey];
  }

  return {
    label: trait ? formatCreatureDisplayLabel(trait) : "Unmapped Trait",
    category: "Unmapped Effect",
    shortEffect: "This trait exists on the creature, but no player-facing effect is mapped yet.",
    appliesTo: ["Future Hook"],
    futureHook: true,
  };
}

export function getCreatureTraitEntries(creature: DisplayCreature) {
  return (creature.traits ?? []).map((entry) => ({
    trait: entry.trait ?? "unknown",
    grade: entry.grade ?? "?",
    ...getTraitDisplayInfo(entry.trait),
  }));
}

export function getCreatureStrongestSkill(creature: DisplayCreature) {
  const entries = getCreatureSkillEntries(creature).sort((a, b) => b.level - a.level);
  return entries[0] ?? getCreatureSkillEntries(creature)[0];
}

export function getCreatureRoleSummary(creature: DisplayCreature) {
  const strongestSkill = getCreatureStrongestSkill(creature);
  const stats = creature.stats ?? {};

  if ((stats.fertility ?? 0) >= 14 || skillLevel(creature, "breedingCare") >= 3) {
    return "Strong breeder and lineage support";
  }

  if (strongestSkill.key === "hauling" || (stats.strength ?? 0) >= 14) {
    return "Road hauler and supply runner";
  }

  if (strongestSkill.key === "fieldWork") return "Field helper";
  if (strongestSkill.key === "cooking") return "Kitchen helper";
  if (strongestSkill.key === "cleaning") return "Home-care helper";

  if ((stats.speed ?? 0) >= 14 || hasTrait(creature, "quick") || hasTrait(creature, "keen")) {
    return "Scout and errand runner";
  }

  return `${strongestSkill.label} specialist`;
}

export function getCreatureStrengthBadges(creature: DisplayCreature) {
  const badges: string[] = [];

  if (statValue(creature, "strength") >= 13 || skillLevel(creature, "hauling") >= 3 || hasTrait(creature, "surefooted")) {
    badges.push("Good Hauler");
  }
  if (statValue(creature, "speed") >= 13 || hasTrait(creature, "quick") || hasTrait(creature, "keen")) {
    badges.push("Road Scout");
  }
  if (skillLevel(creature, "fieldWork") >= 3 || hasTrait(creature, "industrious") || hasTrait(creature, "barnwise")) {
    badges.push("Field Helper");
  }
  if (statValue(creature, "intelligence") >= 13 || hasTrait(creature, "keen") || hasTrait(creature, "graceful")) {
    badges.push("Premium Support");
  }
  if (statValue(creature, "fertility") >= 13 || skillLevel(creature, "breedingCare") >= 3 || hasTrait(creature, "fertile")) {
    badges.push("Strong Breeder");
  }
  if ((creature.maxBreedingStamina ?? 0) >= 24 || statValue(creature, "endurance") >= 13 || hasTrait(creature, "sturdy")) {
    badges.push("High Stamina");
  }
  if (skillLevel(creature, "cooking") >= 3 || hasTrait(creature, "domestic")) {
    badges.push("Kitchen Helper");
  }
  if (skillLevel(creature, "cleaning") >= 3 || hasTrait(creature, "domestic")) {
    badges.push("Home Care");
  }

  return Array.from(new Set(badges)).slice(0, 6);
}

export function getCreatureBestUseSections(creature: DisplayCreature) {
  return [
    {
      label: "Breeding",
      summary:
        statValue(creature, "fertility") >= 13 || skillLevel(creature, "breedingCare") >= 3 || hasTrait(creature, "fertile")
          ? "Strong contributor to egg-focused pairings and breeding support."
          : "Can breed if stamina, daily limits, and pairing rules allow it.",
    },
    {
      label: "Ranch Work",
      summary:
        skillLevel(creature, "cooking") >= 3 || skillLevel(creature, "cleaning") >= 3
          ? "Good fit for House chores, meals, and creature care routines."
          : "Can help with basic ranch routines when stamina is available.",
    },
    {
      label: "Field Work",
      summary:
        skillLevel(creature, "fieldWork") >= 3 || hasTrait(creature, "industrious")
          ? "Reliable for planting, watering, fertilizing, and harvest work."
          : "Usable in Fields, with results mostly driven by field skill and current tools.",
    },
    {
      label: "Road Dispatch",
      summary:
        skillLevel(creature, "hauling") >= 3 || statValue(creature, "speed") >= 13 || hasTrait(creature, "surefooted")
          ? "Good candidate for Brindlewood Road dispatch jobs and road incidents."
          : "Can join dispatch if unlocked, rested, and not already assigned.",
    },
    {
      label: "Market Support",
      summary:
        statValue(creature, "intelligence") >= 13 || hasTrait(creature, "keen") || hasTrait(creature, "graceful")
          ? "Useful flavor fit for Silvergrain samples, buyer reads, and premium presentation."
          : "Market-specific creature effects are still light, but traits can guide future route choices.",
    },
    {
      label: "Future Combat",
      summary: "Future Hook: no combat system is active yet.",
    },
  ];
}

export function getBreedingPairSummary(giver: DisplayCreature | null, receiver: DisplayCreature | null) {
  if (!giver || !receiver) {
    return {
      title: "Choose both participants",
      details: "The preview updates once a giver and receiver are selected.",
      statContribution: "Fertility, vitality, endurance, and happiness are the main readable signals for breeding.",
      traitContribution: "Traits from both sides are considered by the existing breeding logic when an egg is created.",
    };
  }

  const fertilityAverage = Math.round((statValue(giver, "fertility") + statValue(receiver, "fertility")) / 2);
  const vitalityAverage = Math.round((statValue(giver, "vitality") + statValue(receiver, "vitality")) / 2);
  const bestTraits = [...getCreatureTraitEntries(giver), ...getCreatureTraitEntries(receiver)]
    .filter((entry) => entry.trait !== "unknown")
    .slice(0, 4)
    .map((entry) => `${entry.label} ${entry.grade}`)
    .join(", ");

  return {
    title: "Why this pairing matters",
    details:
      fertilityAverage >= 13 || vitalityAverage >= 13
        ? "This pair has a strong breeding signal from fertility or vitality."
        : "This pair is viable when stamina, mood, and lineage rules allow it, with average stat pressure.",
    statContribution: `Projected parent pressure: Fertility ${fertilityAverage}, Vitality ${vitalityAverage}. Higher values can support stronger egg outcomes.`,
    traitContribution: bestTraits
      ? `Visible inheritance candidates: ${bestTraits}. Exact inheritance is still resolved by the existing breeding roll.`
      : "No mapped traits are visible on this pair yet.",
  };
}

export function getEggClaritySummary(egg: {
  quality?: string;
  hatchDaysRemaining?: number;
  giver?: string;
  receiver?: string;
  inbreedingRisk?: string;
}) {
  const ready = (egg.hatchDaysRemaining ?? 1) <= 0;
  const qualityText =
    egg.quality === "exceptional"
      ? "Exceptional eggs hatch with the strongest current starting bonus."
      : egg.quality === "strong"
        ? "Strong eggs hatch with a useful starting bonus."
        : egg.quality === "poor"
          ? "Poor eggs hatch without a quality bonus."
          : "Normal eggs hatch with standard starting values.";

  return {
    projectedSpecies: "Uses the receiver-side egg rules from the existing breeding system.",
    projectedStats: qualityText,
    inheritedTraits: "Parent traits can influence the newborn when the egg hatches; exact inheritance is resolved on hatch.",
    status: ready
      ? "Ready now. Hatching creates a creature, removes this egg, and opens the rename step."
      : `Needs ${egg.hatchDaysRemaining ?? 0} more in-game day(s).`,
    disabledReason: ready ? undefined : "Advance days before hatching.",
    parentSummary: `${egg.giver ?? "Unknown giver"} x ${egg.receiver ?? "Unknown receiver"}`,
  };
}

export function formatCreatureDisplayLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasTrait(creature: DisplayCreature, trait: CreatureTraitKey) {
  return (creature.traits ?? []).some((entry) => entry.trait === trait);
}
