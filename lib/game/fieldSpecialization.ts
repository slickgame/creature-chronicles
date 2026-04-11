export type FieldActionType = "plant" | "water" | "fertilize" | "harvest";

export type FieldSpecializationTraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

export type FieldSpecializationTraitEntry = {
  trait: string;
  grade: string;
};

export type FieldSpecializationCreature = {
  name: string;
  stats: {
    strength: number;
    endurance: number;
  };
  skills: {
    fieldWork: {
      level: number;
    };
  };
  traits: FieldSpecializationTraitEntry[];
};

export type FieldWorkSpecializationProfile = {
  speciesName: string;
  specialtyLabel: string;
  specialtySummary: string;
  strength: number;
  endurance: number;
  fieldWorkLevel: number;
  staminaDiscount: number;
  timeDiscount: number;
  xpBonus: number;
  industriousBonus: number;
  quickBonus: number;
  plantingQualityBonus: number;
  wateringQualityBonus: number;
  fertilizerQualityBonus: number;
  harvestQualityBonus: number;
  harvestYieldBonus: number;
  actionNotes: Record<FieldActionType, string[]>;
};

type SpeciesFieldIdentity = {
  label: string;
  summary: string;
  staminaDiscount?: number;
  timeDiscount?: number;
  plantingQualityBonus?: number;
  wateringQualityBonus?: number;
  fertilizerQualityBonus?: number;
  harvestQualityBonus?: number;
  harvestYieldBonus?: number;
  notes: Partial<Record<FieldActionType, string>>;
};

const TRAIT_GRADES: FieldSpecializationTraitGrade[] = ["F", "D", "C", "B", "A", "S"];

const SPECIES_FIELD_IDENTITIES: Record<string, SpeciesFieldIdentity> = {
  Horse: {
    label: "Field Labor Specialist",
    summary: "Powerful, steady, and built for the heavy work that makes a field obey.",
    staminaDiscount: 1,
    timeDiscount: 2,
    plantingQualityBonus: 2,
    harvestQualityBonus: 4,
    harvestYieldBonus: 2,
    notes: {
      plant: "Horse strength sets rows quickly and cleanly.",
      harvest: "Horse field labor adds a strong harvest yield bonus.",
    },
  },
  Bunny: {
    label: "Garden Whisperer",
    summary: "Soft, quick, and suspiciously good at coaxing tender crops into showing off.",
    timeDiscount: 1,
    plantingQualityBonus: 3,
    wateringQualityBonus: 7,
    fertilizerQualityBonus: 3,
    harvestQualityBonus: 3,
    notes: {
      plant: "Bunny instincts give seeds a gentle start.",
      water: "Bunny garden tending gives watering a big quality push.",
      fertilize: "Bunny care helps fertilizer settle neatly around roots.",
    },
  },
  Pig: {
    label: "Soil Savant",
    summary: "A practical field partner with a shamelessly good nose for rich soil.",
    staminaDiscount: 1,
    plantingQualityBonus: 2,
    fertilizerQualityBonus: 8,
    harvestYieldBonus: 1,
    notes: {
      fertilize: "Pig soil sense makes fertilizer much more effective.",
      harvest: "Pig foraging instincts add a little extra yield.",
    },
  },
  Dog: {
    label: "Field Coordinator",
    summary: "Fast, loyal, and good at keeping the whole field routine from getting messy.",
    staminaDiscount: 1,
    timeDiscount: 2,
    plantingQualityBonus: 1,
    wateringQualityBonus: 2,
    notes: {
      plant: "Dog coordination trims the time cost.",
      water: "Dog pacing keeps watering efficient.",
    },
  },
  Chicken: {
    label: "Pest-Eyed Picker",
    summary: "Small, alert, and better than expected at spotting what a crop needs.",
    timeDiscount: 1,
    fertilizerQualityBonus: 3,
    harvestQualityBonus: 2,
    harvestYieldBonus: 1,
    notes: {
      fertilize: "Chicken attention helps catch patchy soil.",
      harvest: "Chicken eyes find a little extra produce.",
    },
  },
  Cow: {
    label: "Steady Field Anchor",
    summary: "Patient and strong, with enough calm endurance to make repetitive field work feel easier.",
    staminaDiscount: 2,
    fertilizerQualityBonus: 2,
    harvestYieldBonus: 1,
    notes: {
      fertilize: "Cow patience makes soil work steadier.",
      harvest: "Cow endurance adds a modest harvest bonus.",
    },
  },
  Sheep: {
    label: "Weather-Steady Tender",
    summary: "Gentle, even-tempered, and good at keeping crops comfortable through fussy weather.",
    staminaDiscount: 1,
    wateringQualityBonus: 2,
    harvestQualityBonus: 4,
    notes: {
      water: "Sheep steadiness makes watering more consistent.",
      harvest: "Sheep calm helps preserve crop quality at harvest.",
    },
  },
  Cat: {
    label: "Precise Garden Tease",
    summary: "Quick paws, sharp eyes, and just enough smug precision to make delicate field work shine.",
    timeDiscount: 2,
    plantingQualityBonus: 3,
    wateringQualityBonus: 2,
    harvestQualityBonus: 2,
    notes: {
      plant: "Cat precision gives seed placement a quality bonus.",
      water: "Cat quickness trims the field routine.",
    },
  },
};

const FALLBACK_FIELD_IDENTITY: SpeciesFieldIdentity = {
  label: "Flexible Field Hand",
  summary: "A general helper whose field-work skill and traits do most of the talking.",
  notes: {},
};

export function buildFieldWorkSpecializationProfile(
  creature: FieldSpecializationCreature
): FieldWorkSpecializationProfile {
  const identity = SPECIES_FIELD_IDENTITIES[creature.name] ?? FALLBACK_FIELD_IDENTITY;
  const fieldWorkLevel = creature.skills.fieldWork.level;
  const industriousBonus = getTraitFlatBonus(creature, "industrious", 4);
  const quickBonus = getTraitFlatBonus(creature, "quick", 2);
  const sturdyBonus = getTraitFlatBonus(creature, "sturdy", 3);
  const barnwiseBonus = getTraitFlatBonus(creature, "barnwise", 4);
  const surefootedBonus = getTraitFlatBonus(creature, "surefooted", 4);
  const keenBonus = getTraitFlatBonus(creature, "keen", 3);
  const calmBonus = getTraitFlatBonus(creature, "calm", 3);
  const fertileBonus = getTraitFlatBonus(creature, "fertile", 3);
  const gracefulBonus = getTraitFlatBonus(creature, "graceful", 3);
  const domesticBonus = getTraitFlatBonus(creature, "domestic", 2);
  const affectionateBonus = getTraitFlatBonus(creature, "affectionate", 2);
  const skillQualityBonus = Math.floor(fieldWorkLevel / 2);
  const skillYieldBonus = Math.floor(fieldWorkLevel / 4);
  const actionNotes = createBaseActionNotes(identity);

  addTraitNote(actionNotes, creature, "industrious", "Industrious pushes planting and harvest output harder.");
  addTraitNote(actionNotes, creature, "quick", "Quick keeps watering and field handling snappy.");
  addTraitNote(actionNotes, creature, "sturdy", "Sturdy reduces stamina pressure on field actions.");
  addTraitNote(actionNotes, creature, "barnwise", "Barnwise improves soil handling and harvest pull.");
  addTraitNote(actionNotes, creature, "surefooted", "Surefooted keeps harvests steady in rough field work.");
  addTraitNote(actionNotes, creature, "keen", "Keen eyes improve seed placement and harvest quality.");
  addTraitNote(actionNotes, creature, "calm", "Calm hands help watering and fertilizer settle.");
  addTraitNote(actionNotes, creature, "fertile", "Fertile instincts give seeds a more promising start.");

  return {
    speciesName: creature.name,
    specialtyLabel: identity.label,
    specialtySummary: identity.summary,
    strength: creature.stats.strength,
    endurance: creature.stats.endurance,
    fieldWorkLevel,
    staminaDiscount: sturdyBonus + (identity.staminaDiscount ?? 0),
    timeDiscount: Math.floor(fieldWorkLevel / 3) + quickBonus + (identity.timeDiscount ?? 0),
    xpBonus: Math.floor((affectionateBonus + domesticBonus) / 2),
    industriousBonus,
    quickBonus,
    plantingQualityBonus:
      skillQualityBonus +
      industriousBonus +
      fertileBonus +
      keenBonus +
      domesticBonus +
      (identity.plantingQualityBonus ?? 0),
    wateringQualityBonus:
      skillQualityBonus +
      quickBonus +
      calmBonus +
      gracefulBonus +
      (identity.wateringQualityBonus ?? 0),
    fertilizerQualityBonus:
      skillQualityBonus +
      barnwiseBonus +
      calmBonus +
      domesticBonus +
      Math.floor(industriousBonus / 2) +
      (identity.fertilizerQualityBonus ?? 0),
    harvestQualityBonus:
      skillQualityBonus +
      surefootedBonus +
      keenBonus +
      gracefulBonus +
      (identity.harvestQualityBonus ?? 0),
    harvestYieldBonus:
      skillYieldBonus +
      Math.floor(industriousBonus / 2) +
      Math.floor(barnwiseBonus / 2) +
      (identity.harvestYieldBonus ?? 0),
    actionNotes,
  };
}

export function getFieldSpecializationHighlights(profile: FieldWorkSpecializationProfile) {
  return [
    profile.specialtyLabel,
    `Field Work Lv ${profile.fieldWorkLevel}`,
    profile.timeDiscount > 0 ? `Time -${profile.timeDiscount}` : null,
    profile.staminaDiscount > 0 ? `Stamina -${profile.staminaDiscount}` : null,
    profile.plantingQualityBonus > 0 ? `Plant quality +${profile.plantingQualityBonus}` : null,
    profile.wateringQualityBonus > 0 ? `Water quality +${profile.wateringQualityBonus}` : null,
    profile.fertilizerQualityBonus > 0 ? `Fertilizer quality +${profile.fertilizerQualityBonus}` : null,
    profile.harvestYieldBonus > 0 ? `Harvest yield +${profile.harvestYieldBonus}` : null,
    profile.harvestQualityBonus > 0 ? `Harvest quality +${profile.harvestQualityBonus}` : null,
  ].filter((entry): entry is string => Boolean(entry));
}

export function getFieldActionSpecializationNotes(
  profile: FieldWorkSpecializationProfile,
  action: FieldActionType
) {
  return profile.actionNotes[action].slice(0, 4);
}

function createBaseActionNotes(identity: SpeciesFieldIdentity): Record<FieldActionType, string[]> {
  return {
    plant: identity.notes.plant ? [identity.notes.plant] : [],
    water: identity.notes.water ? [identity.notes.water] : [],
    fertilize: identity.notes.fertilize ? [identity.notes.fertilize] : [],
    harvest: identity.notes.harvest ? [identity.notes.harvest] : [],
  };
}

function addTraitNote(
  actionNotes: Record<FieldActionType, string[]>,
  creature: FieldSpecializationCreature,
  trait: string,
  note: string
) {
  const entry = getBestTraitEntry(creature, trait);
  if (!entry) return;

  const decoratedNote = `${entry.trait} ${entry.grade}: ${note}`;
  if (trait === "industrious") {
    actionNotes.plant.push(decoratedNote);
    actionNotes.harvest.push(decoratedNote);
    return;
  }
  if (trait === "quick") {
    actionNotes.water.push(decoratedNote);
    actionNotes.plant.push(decoratedNote);
    return;
  }
  if (trait === "sturdy") {
    actionNotes.plant.push(decoratedNote);
    actionNotes.water.push(decoratedNote);
    actionNotes.fertilize.push(decoratedNote);
    actionNotes.harvest.push(decoratedNote);
    return;
  }
  if (trait === "barnwise") {
    actionNotes.fertilize.push(decoratedNote);
    actionNotes.harvest.push(decoratedNote);
    return;
  }
  if (trait === "surefooted" || trait === "keen" || trait === "graceful") {
    actionNotes.harvest.push(decoratedNote);
    actionNotes.plant.push(decoratedNote);
    return;
  }
  if (trait === "calm" || trait === "domestic") {
    actionNotes.water.push(decoratedNote);
    actionNotes.fertilize.push(decoratedNote);
    return;
  }
  if (trait === "fertile") {
    actionNotes.plant.push(decoratedNote);
  }
}

function getTraitFlatBonus(
  creature: FieldSpecializationCreature,
  trait: string,
  maxBonus: number
) {
  const entry = getBestTraitEntry(creature, trait);
  return entry ? Math.max(1, Math.round(maxBonus * getTraitPowerMultiplier(entry.grade))) : 0;
}

function getBestTraitEntry(creature: FieldSpecializationCreature, trait: string) {
  const matches = creature.traits.filter((entry) => entry.trait === trait);
  if (matches.length === 0) return null;

  return matches.reduce((best, current) =>
    getGradeRank(normalizeGrade(current.grade)) > getGradeRank(normalizeGrade(best.grade))
      ? current
      : best
  );
}

function normalizeGrade(grade: string): FieldSpecializationTraitGrade {
  return TRAIT_GRADES.includes(grade as FieldSpecializationTraitGrade)
    ? (grade as FieldSpecializationTraitGrade)
    : "C";
}

function getGradeRank(grade: string) {
  return TRAIT_GRADES.indexOf(normalizeGrade(grade));
}

function getTraitPowerMultiplier(grade: string) {
  const normalized = normalizeGrade(grade);
  if (normalized === "F") return 0.35;
  if (normalized === "D") return 0.5;
  if (normalized === "C") return 0.7;
  if (normalized === "B") return 0.9;
  if (normalized === "A") return 1.15;
  return 1.4;
}
