import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type {
  CreaturePersonalityArchetype,
  CreaturePersonalityProfile,
  CreaturePersonalitySaveState,
  CreatureSocialStyle,
} from "@/types/personality";
import { CREATURE_PERSONALITY_VERSION } from "@/types/personality";
import type { RanchJobId } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";

const ARCHETYPE_DEFINITIONS: Record<
  CreaturePersonalityArchetype,
  Omit<CreaturePersonalityProfile, "version" | "creatureId">
> = {
  brave: {
    archetype: "brave",
    displayName: "Brave",
    description: "Steps toward danger quickly and takes pride in being dependable under pressure.",
    socialStyle: "outgoing",
    preferredJobIds: ["security_patrol", "field_hauling"],
    dislikedJobId: "comfort_care",
    preferredTrainingTags: ["strength", "endurance", "battle", "guard"],
    preferredGuildCategories: ["security", "restoration"],
    values: ["courage", "reliability"],
    likes: ["difficult assignments", "visible responsibility"],
    dislikes: ["being sheltered", "long periods without a task"],
  },
  gentle: {
    archetype: "gentle",
    displayName: "Gentle",
    description: "Prefers patient routines, quiet encouragement, and work that directly helps others.",
    socialStyle: "supportive",
    preferredJobIds: ["comfort_care", "garden_tending"],
    dislikedJobId: "security_patrol",
    preferredTrainingTags: ["support", "healing", "bond", "focus"],
    preferredGuildCategories: ["service", "restoration"],
    values: ["kindness", "stability"],
    likes: ["calm company", "caregiving work"],
    dislikes: ["needless conflict", "being rushed"],
  },
  curious: {
    archetype: "curious",
    displayName: "Curious",
    description: "Investigates unfamiliar routines and learns fastest when a task offers something new.",
    socialStyle: "outgoing",
    preferredJobIds: ["garden_tending", "field_hauling"],
    dislikedJobId: "stable_production",
    preferredTrainingTags: ["focus", "agility", "technique", "discovery"],
    preferredGuildCategories: ["registry", "restoration"],
    values: ["discovery", "adaptability"],
    likes: ["new places", "unusual creatures"],
    dislikes: ["repetitive schedules", "unanswered questions"],
  },
  industrious: {
    archetype: "industrious",
    displayName: "Industrious",
    description: "Finds satisfaction in steady progress, useful output, and a well-organized ranch routine.",
    socialStyle: "reserved",
    preferredJobIds: ["stable_production", "field_hauling"],
    dislikedJobId: "comfort_care",
    preferredTrainingTags: ["endurance", "strength", "discipline", "focus"],
    preferredGuildCategories: ["service", "restoration"],
    values: ["productivity", "craftsmanship"],
    likes: ["clear goals", "finishing work early"],
    dislikes: ["wasted supplies", "unfinished chores"],
  },
  playful: {
    archetype: "playful",
    displayName: "Playful",
    description: "Turns routine moments into games and forms bonds through shared activity and mischief.",
    socialStyle: "outgoing",
    preferredJobIds: ["comfort_care", "garden_tending"],
    dislikedJobId: "field_hauling",
    preferredTrainingTags: ["agility", "bond", "speed", "teamwork"],
    preferredGuildCategories: ["service", "registry"],
    values: ["joy", "companionship"],
    likes: ["friendly contests", "attention"],
    dislikes: ["isolation", "overly strict routines"],
  },
  aloof: {
    archetype: "aloof",
    displayName: "Aloof",
    description: "Works best with personal space and shows loyalty through consistency rather than display.",
    socialStyle: "independent",
    preferredJobIds: ["security_patrol", "stable_production"],
    dislikedJobId: "comfort_care",
    preferredTrainingTags: ["focus", "precision", "independent", "battle"],
    preferredGuildCategories: ["security", "registry"],
    values: ["self-reliance", "competence"],
    likes: ["quiet work", "earning trust slowly"],
    dislikes: ["crowded spaces", "forced affection"],
  },
  ambitious: {
    archetype: "ambitious",
    displayName: "Ambitious",
    description: "Seeks measurable accomplishments and notices every opportunity to build a greater legacy.",
    socialStyle: "competitive",
    preferredJobIds: ["security_patrol", "field_hauling"],
    dislikedJobId: "garden_tending",
    preferredTrainingTags: ["battle", "strength", "speed", "mastery"],
    preferredGuildCategories: ["security", "registry", "lineage"],
    values: ["achievement", "recognition"],
    likes: ["ranked challenges", "public accomplishments"],
    dislikes: ["being underestimated", "uncredited work"],
  },
  protective: {
    archetype: "protective",
    displayName: "Protective",
    description: "Watches the ranch closely and measures success by whether everyone returns safely.",
    socialStyle: "supportive",
    preferredJobIds: ["security_patrol", "comfort_care"],
    dislikedJobId: "field_hauling",
    preferredTrainingTags: ["guard", "support", "healing", "endurance"],
    preferredGuildCategories: ["security", "service", "restoration"],
    values: ["loyalty", "safety"],
    likes: ["team assignments", "protecting younger creatures"],
    dislikes: ["recklessness", "avoidable injuries"],
  },
};

const ARCHETYPES = Object.keys(ARCHETYPE_DEFINITIONS) as CreaturePersonalityArchetype[];
const SOCIAL_COMPATIBILITY: Record<CreatureSocialStyle, Record<CreatureSocialStyle, number>> = {
  outgoing: { outgoing: 2, reserved: 1, supportive: 2, competitive: 1, independent: 0 },
  reserved: { outgoing: 1, reserved: 1, supportive: 2, competitive: 0, independent: 2 },
  supportive: { outgoing: 2, reserved: 2, supportive: 2, competitive: 1, independent: 1 },
  competitive: { outgoing: 1, reserved: 0, supportive: 1, competitive: -1, independent: 0 },
  independent: { outgoing: 0, reserved: 2, supportive: 1, competitive: 0, independent: 1 },
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function cloneProfile(profile: CreaturePersonalityProfile): CreaturePersonalityProfile {
  return {
    ...profile,
    preferredJobIds: [...profile.preferredJobIds],
    preferredTrainingTags: [...profile.preferredTrainingTags],
    preferredGuildCategories: [...profile.preferredGuildCategories],
    values: [...profile.values],
    likes: [...profile.likes],
    dislikes: [...profile.dislikes],
  };
}

export function generateCreaturePersonality(creature: CreatureRecord): CreaturePersonalityProfile {
  const seed = [
    creature.creatureId,
    creature.speciesId,
    creature.variantId,
    creature.generation,
    creature.origin,
  ].join(":");
  const archetype = ARCHETYPES[stableHash(seed) % ARCHETYPES.length] ?? "gentle";
  const definition = ARCHETYPE_DEFINITIONS[archetype];
  return cloneProfile({
    ...definition,
    version: CREATURE_PERSONALITY_VERSION,
    creatureId: creature.creatureId,
  });
}

export function createEmptyCreaturePersonalityState(): CreaturePersonalitySaveState {
  return {
    version: CREATURE_PERSONALITY_VERSION,
    profilesByCreatureId: {},
  };
}

export function getCreaturePersonalityState(save: GameSave): CreaturePersonalitySaveState {
  const candidate = save.creaturePersonalities;
  if (!candidate || typeof candidate !== "object") return createEmptyCreaturePersonalityState();
  return {
    version: CREATURE_PERSONALITY_VERSION,
    profilesByCreatureId:
      candidate.profilesByCreatureId && typeof candidate.profilesByCreatureId === "object"
        ? candidate.profilesByCreatureId
        : {},
  };
}

export function getCreaturePersonalityProfile(
  save: GameSave,
  creatureId: CreatureId,
): CreaturePersonalityProfile {
  const existing = getCreaturePersonalityState(save).profilesByCreatureId[String(creatureId)];
  if (existing) return cloneProfile(existing);
  const creature = (save.creatures ?? []).find((entry) => entry.creatureId === creatureId);
  if (creature) return generateCreaturePersonality(creature);
  return cloneProfile({
    ...ARCHETYPE_DEFINITIONS.gentle,
    version: CREATURE_PERSONALITY_VERSION,
    creatureId,
  });
}

export function normalizeCreaturePersonalitySave(save: GameSave): GameSave {
  const state = getCreaturePersonalityState(save);
  const profilesByCreatureId = { ...state.profilesByCreatureId };
  for (const creature of save.creatures ?? []) {
    const existing = profilesByCreatureId[String(creature.creatureId)];
    profilesByCreatureId[String(creature.creatureId)] = existing
      ? cloneProfile({ ...existing, version: CREATURE_PERSONALITY_VERSION, creatureId: creature.creatureId })
      : generateCreaturePersonality(creature);
  }
  return {
    ...save,
    creaturePersonalities: {
      version: CREATURE_PERSONALITY_VERSION,
      profilesByCreatureId,
    },
    flags: {
      ...save.flags,
      creaturePersonalityVersion: CREATURE_PERSONALITY_VERSION,
      creaturePersonalitiesMigrated: true,
    },
  };
}

export function getPersonalityCompatibility(
  left: CreaturePersonalityProfile,
  right: CreaturePersonalityProfile,
): number {
  let score = SOCIAL_COMPATIBILITY[left.socialStyle][right.socialStyle] ?? 0;
  if (left.archetype === right.archetype) score += left.socialStyle === "competitive" ? -1 : 1;
  if (left.values.some((value) => right.values.includes(value))) score += 1;
  if (left.preferredJobIds.some((jobId) => right.preferredJobIds.includes(jobId))) score += 1;
  return Math.max(-2, Math.min(4, score));
}

export function isPreferredRanchJob(
  profile: CreaturePersonalityProfile,
  jobId: RanchJobId,
): boolean {
  return profile.preferredJobIds.includes(jobId);
}

export function isPreferredTrainingFocus(
  profile: CreaturePersonalityProfile,
  focusId: string,
): boolean {
  const normalized = focusId.toLowerCase().replaceAll("_", " ");
  return profile.preferredTrainingTags.some((tag) => normalized.includes(tag.toLowerCase()));
}

export function getPersonalityGuildCategoryBonus(
  profile: CreaturePersonalityProfile,
  category: string,
): number {
  return profile.preferredGuildCategories.includes(category) ? 18 : 0;
}
