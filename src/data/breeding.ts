import { CREATURE_PLACEHOLDER_IMAGE, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { createPregnancyRecord } from "@/data/nursery";
import type {
  BreedingAttemptRecord,
  BreedingParticipant,
  BreedingPreview,
  BreedingProgressionEvent,
  BreedingState,
} from "@/types/breeding";
import type { CreatureAbility, CreatureRecord, CreatureStats } from "@/types/creature";
import type { BreedingAttemptId, CreatureId } from "@/types/ids";
import type { GameSave, PlayerProfile } from "@/types/save";

export const PLAYER_PARTICIPANT_ID = "player";

const DEFAULT_PLAYER_STATS: CreatureStats = { STR: 5, DEX: 5, STA: 5, CHA: 5, WIL: 5, FER: 5 };
const STAT_KEYS: Array<keyof CreatureStats> = ["STR", "DEX", "STA", "CHA", "WIL", "FER"];
const STAT_LABELS: Record<keyof CreatureStats, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
};

export function createDefaultBreedingState(): BreedingState {
  return {
    hearts: 0,
    maxHearts: 0,
    attempts: [],
    streaks: [],
  };
}

export function getPairKey(giverId: string, receiverId: string): string {
  return [giverId, receiverId].sort().join("__");
}

function getCreatureXpToNext(level: number): number {
  return 45 + level * 30;
}

function getBreederXpToNext(level: number): number {
  return 70 + level * 45;
}

function normalizePlayer(player: PlayerProfile): PlayerProfile {
  const breederRank = player.breederRank ?? 1;
  return {
    ...player,
    breederRank,
    breederXp: player.breederXp ?? 0,
    breederXpToNext: player.breederXpToNext ?? getBreederXpToNext(breederRank),
    stats: player.stats ?? DEFAULT_PLAYER_STATS,
    hearts: player.hearts ?? 4,
    maxHearts: player.maxHearts ?? 4,
  };
}

function normalizeCreature(creature: CreatureRecord): CreatureRecord {
  const level = creature.level ?? 1;
  return {
    ...creature,
    level,
    xp: creature.xp ?? 0,
    xpToNext: creature.xpToNext ?? getCreatureXpToNext(level),
    hearts: creature.hearts ?? 4,
    maxHearts: creature.maxHearts ?? 4,
  };
}

function gradeMultiplier(grade: CreatureAbility["grade"]): number {
  if (grade === "S") return 1.6;
  if (grade === "A") return 1.35;
  if (grade === "B") return 1.15;
  if (grade === "C") return 1;
  if (grade === "D") return 0.8;
  return 0.65;
}

function getAbilityEffect(ability: CreatureAbility) {
  const multiplier = gradeMultiplier(ability.grade);

  switch (ability.id) {
    case "feline_grace":
      return { pregnancyChance: Math.round(3 * multiplier), xpGain: Math.round(4 * multiplier), affectionGain: 1, label: `${ability.name} improved bonding XP and pregnancy odds.` };
    case "steady_purr":
      return { pregnancyChance: Math.round(2 * multiplier), affectionGain: 2, label: `${ability.name} improved comfort and affection gain.` };
    case "ancient_poise":
      return { pregnancyChance: Math.round(5 * multiplier), breederXpGain: Math.round(5 * multiplier), label: `${ability.name} stabilized the pairing and improved breeder insight.` };
    case "sun_warmed":
      return { energyDiscount: Math.round(3 * multiplier), affectionGain: 1, label: `${ability.name} reduced the energy cost slightly.` };
    case "pack_loyalty":
      return { pregnancyChance: Math.round(2 * multiplier), breederXpGain: Math.round(7 * multiplier), label: `${ability.name} improved pair cooperation and breeder XP.` };
    case "steady_companion":
      return { energyDiscount: Math.round(4 * multiplier), xpGain: Math.round(2 * multiplier), label: `${ability.name} reduced energy cost and improved reliable practice XP.` };
    case "alpha_bond":
      return { pregnancyChance: Math.round(6 * multiplier), breederXpGain: Math.round(6 * multiplier), label: `${ability.name} boosted leadership synergy for the pairing.` };
    case "winter_coat":
      return { energyDiscount: Math.round(2 * multiplier), label: `${ability.name} lowered stamina strain during the attempt.` };
    case "ember_blood":
      return { xpGain: Math.round(6 * multiplier), statGrowthBias: "STR" as keyof CreatureStats, label: `${ability.name} intensified growth training from the attempt.` };
    case "infernal_focus":
      return { pregnancyChance: Math.round(3 * multiplier), xpGain: Math.round(3 * multiplier), label: `${ability.name} improved consistency under pressure.` };
    case "tiger_instinct":
      return { xpGain: Math.round(5 * multiplier), statGrowthBias: "STR" as keyof CreatureStats, label: `${ability.name} increased physical growth potential.` };
    case "apex_pounce":
      return { energyDiscount: Math.round(2 * multiplier), statGrowthBias: "DEX" as keyof CreatureStats, label: `${ability.name} made the session more efficient.` };
    case "guard_instinct":
      return { breederXpGain: Math.round(3 * multiplier), statGrowthBias: "WIL" as keyof CreatureStats, label: `${ability.name} improved discipline and breeder insight.` };
    case "soft_step":
      return { energyDiscount: Math.round(2 * multiplier), statGrowthBias: "DEX" as keyof CreatureStats, label: `${ability.name} reduced effort through careful movement.` };
    default:
      return { label: `${ability.name} was noted, but has no M8 breeding effect yet.` };
  }
}

function summarizeAbilityEffects(abilities: CreatureAbility[] | undefined) {
  const summary = {
    pregnancyChance: 0,
    xpGain: 0,
    breederXpGain: 0,
    energyDiscount: 0,
    affectionGain: 0,
    statGrowthBiases: [] as Array<keyof CreatureStats>,
    triggers: [] as string[],
  };

  for (const ability of abilities ?? []) {
    const effect = getAbilityEffect(ability);
    summary.pregnancyChance += effect.pregnancyChance ?? 0;
    summary.xpGain += effect.xpGain ?? 0;
    summary.breederXpGain += effect.breederXpGain ?? 0;
    summary.energyDiscount += effect.energyDiscount ?? 0;
    summary.affectionGain += effect.affectionGain ?? 0;

    if (effect.statGrowthBias) summary.statGrowthBiases.push(effect.statGrowthBias);

    if (effect.pregnancyChance || effect.xpGain || effect.breederXpGain || effect.energyDiscount || effect.affectionGain || effect.statGrowthBias) {
      summary.triggers.push(effect.label);
    }
  }

  return summary;
}

function getParticipantAbilities(participant: BreedingParticipant | undefined) {
  return participant?.abilities ?? [];
}

function getStatValue(participant: BreedingParticipant | undefined, statKey: keyof CreatureStats, fallback = 5): number {
  return participant?.stats?.[statKey] ?? fallback;
}

export function getBreedingParticipants(save: GameSave): BreedingParticipant[] {
  const normalizedPlayer = normalizePlayer(save.player);
  const player: BreedingParticipant = {
    participantId: PLAYER_PARTICIPANT_ID,
    kind: "player",
    displayName: normalizedPlayer.name,
    familyLabel: "Player",
    roleTags: ["giver", "receiver"],
    energy: save.currencies.energy,
    maxEnergy: save.currencies.maxEnergy,
    hearts: normalizedPlayer.hearts,
    maxHearts: normalizedPlayer.maxHearts,
    affection: 65,
    level: normalizedPlayer.breederRank,
    xp: normalizedPlayer.breederXp,
    xpToNext: normalizedPlayer.breederXpToNext,
    stats: normalizedPlayer.stats,
    description: "The player character can participate in breeding pair selection and gains Breeder XP from each attempt.",
    portraitPath: "/images/ui/icons/icon_breeder_level.png",
    profilePath: "/images/ui/icons/icon_breeder_level.png",
  };

  const creatures = (save.creatures ?? []).map((sourceCreature) => {
    const creature = normalizeCreature(sourceCreature);
    const variant = getVariantDefinition(creature.variantId);
    const species = getSpeciesDefinition(variant.speciesId);

    return {
      participantId: creature.creatureId,
      kind: "creature" as const,
      creatureId: creature.creatureId as CreatureId,
      displayName: creature.nickname,
      familyLabel: `${variant.name} ${species.name}`,
      roleTags: ["giver", "receiver"] as const,
      energy: creature.energy,
      maxEnergy: creature.maxEnergy,
      hearts: creature.hearts,
      maxHearts: creature.maxHearts,
      affection: creature.affection,
      level: creature.level,
      xp: creature.xp,
      xpToNext: creature.xpToNext,
      stats: creature.stats,
      abilities: creature.abilities,
      description: variant.description,
      portraitPath: variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE,
      profilePath: variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE,
    };
  });

  return [player, ...creatures];
}

export function getBreedingPreview(save: GameSave, giverId: string | null, receiverId: string | null): BreedingPreview | null {
  if (!giverId || !receiverId || giverId === receiverId) return null;

  const breeding = save.breeding ?? createDefaultBreedingState();
  const participants = getBreedingParticipants(save);
  const giver = participants.find((item) => item.participantId === giverId);
  const receiver = participants.find((item) => item.participantId === receiverId);

  if (!giver || !receiver) return null;

  const pairKey = getPairKey(giverId, receiverId);
  const streakRecord = breeding.streaks.find((item) => item.pairKey === pairKey);
  const streakCount = streakRecord?.streakCount ?? 0;
  const giverEffects = summarizeAbilityEffects(getParticipantAbilities(giver));
  const receiverEffects = summarizeAbilityEffects(getParticipantAbilities(receiver));
  const involvesPlayer = giver.kind === "player" || receiver.kind === "player";
  const baseChance = 12;
  const streakBonus = Math.min(30, streakCount * 6);
  const affectionBonus = Math.floor((giver.affection + receiver.affection) / 40);
  const fertilityBonus = Math.floor((getStatValue(giver, "FER") + getStatValue(receiver, "FER")) / 3);
  const charmBonus = Math.floor((getStatValue(giver, "CHA") + getStatValue(receiver, "CHA")) / 6);
  const abilityBonus = giverEffects.pregnancyChance + receiverEffects.pregnancyChance;
  const pregnancyChance = Math.min(85, baseChance + streakBonus + affectionBonus + fertilityBonus + charmBonus + abilityBonus);
  const staminaDiscount = Math.floor((getStatValue(giver, "STA") + getStatValue(receiver, "STA")) / 6);
  const energyDiscount = Math.min(18, staminaDiscount + giverEffects.energyDiscount + receiverEffects.energyDiscount);
  const energyCost = Math.max(15, 35 - energyDiscount);
  const heartCost = involvesPlayer ? 2 : 1;
  const willpowerBonus = Math.floor((getStatValue(giver, "WIL") + getStatValue(receiver, "WIL")) / 5);
  const dexterityBonus = Math.floor((getStatValue(giver, "DEX") + getStatValue(receiver, "DEX")) / 7);
  const xpGain = 8 + streakCount * 2 + willpowerBonus + dexterityBonus + giverEffects.xpGain + receiverEffects.xpGain;
  const breederXpGain = involvesPlayer ? 10 + Math.floor(xpGain / 2) + giverEffects.breederXpGain + receiverEffects.breederXpGain : 0;
  const abilityTriggers = [...giverEffects.triggers, ...receiverEffects.triggers];

  let blockedReason: string | null = null;
  if (giver.hearts < heartCost || receiver.hearts < heartCost) blockedReason = "Both participants need enough Hearts.";
  else if (giver.energy < energyCost || receiver.energy < energyCost) blockedReason = "Both participants need enough energy.";

  return {
    pairKey,
    pregnancyChance,
    baseChance,
    streakBonus,
    affectionBonus,
    abilityBonus,
    energyDiscount,
    streakCount,
    energyCost,
    heartCost,
    xpGain,
    breederXpGain,
    abilityTriggers,
    canAttempt: blockedReason === null,
    blockedReason,
  };
}

function updateStreaks(state: BreedingState, pairKey: string, giverId: string, receiverId: string, dayNumber: number, outcome: "pregnancy" | "failed") {
  const previous = state.streaks.find((item) => item.pairKey === pairKey);
  const streakAfter = (previous?.streakCount ?? 0) + 1;
  const unrelated = state.streaks.filter(
    (item) => item.pairKey === pairKey || (!item.pairKey.includes(giverId) && !item.pairKey.includes(receiverId)),
  );

  return {
    streakBefore: previous?.streakCount ?? 0,
    streakAfter,
    streaks: [
      ...unrelated.filter((item) => item.pairKey !== pairKey),
      { pairKey, participantAId: giverId, participantBId: receiverId, streakCount: streakAfter, lastAttemptDayNumber: dayNumber, lastOutcome: outcome },
    ],
  };
}

function deterministicRoll(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  return hash % 100;
}

function rollStatGrowth(seed: string, levelUps: number, biases: Array<keyof CreatureStats>): Partial<CreatureStats> {
  const statGrowth: Partial<CreatureStats> = {};
  const rollsPerLevel = 2;

  for (let index = 0; index < levelUps * rollsPerLevel; index += 1) {
    const bias = biases.length ? biases[index % biases.length] : null;
    const roll = deterministicRoll(`${seed}_stat_${index}`);
    const statKey = bias && roll < 55 ? bias : STAT_KEYS[roll % STAT_KEYS.length];
    statGrowth[statKey] = (statGrowth[statKey] ?? 0) + 1;
  }

  return statGrowth;
}

function applyStatGrowth(stats: CreatureStats, growth: Partial<CreatureStats>): CreatureStats {
  return {
    STR: stats.STR + (growth.STR ?? 0),
    DEX: stats.DEX + (growth.DEX ?? 0),
    STA: stats.STA + (growth.STA ?? 0),
    CHA: stats.CHA + (growth.CHA ?? 0),
    WIL: stats.WIL + (growth.WIL ?? 0),
    FER: stats.FER + (growth.FER ?? 0),
  };
}

function formatStatGrowth(growth: Partial<CreatureStats>) {
  return Object.entries(growth).map(([key, value]) => `+${value} ${STAT_LABELS[key as keyof CreatureStats]}`);
}

function getHeartMilestoneGain(beforeLevel: number, afterLevel: number, interval: number): number {
  return Math.floor(afterLevel / interval) - Math.floor(beforeLevel / interval);
}

function progressCreature(creature: CreatureRecord, xpGain: number, seed: string): { creature: CreatureRecord; event: BreedingProgressionEvent } {
  const normalized = normalizeCreature(creature);
  const beforeLevel = normalized.level;
  const beforeXp = normalized.xp;
  const beforeXpToNext = normalized.xpToNext;
  const effects = summarizeAbilityEffects(normalized.abilities);
  let level = normalized.level;
  let xp = normalized.xp + xpGain;
  let xpToNext = normalized.xpToNext;
  let levelUps = 0;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    levelUps += 1;
    xpToNext = getCreatureXpToNext(level);
  }

  const statGrowth = levelUps > 0 ? rollStatGrowth(seed, levelUps, effects.statGrowthBiases) : {};
  const energyGrowth = levelUps > 0 ? levelUps * 4 + (statGrowth.STA ?? 0) * 2 : 0;
  const heartGrowth = getHeartMilestoneGain(beforeLevel, level, 5);
  const abilityTriggers = [...effects.triggers];

  if (levelUps > 0) {
    abilityTriggers.push(`${normalized.nickname} leveled up ${levelUps} time${levelUps === 1 ? "" : "s"}.`);
    const growthText = formatStatGrowth(statGrowth);
    if (growthText.length) abilityTriggers.push(`Stat growth: ${growthText.join(", ")}.`);
    if (energyGrowth > 0) abilityTriggers.push(`Max Energy increased by ${energyGrowth}.`);
    if (heartGrowth > 0) abilityTriggers.push(`Max Hearts increased by ${heartGrowth}.`);
  }

  return {
    creature: {
      ...normalized,
      level,
      xp,
      xpToNext,
      stats: applyStatGrowth(normalized.stats, statGrowth),
      maxEnergy: normalized.maxEnergy + energyGrowth,
      maxHearts: normalized.maxHearts + heartGrowth,
      affection: Math.min(100, normalized.affection + 2 + effects.affectionGain),
    },
    event: {
      participantId: normalized.creatureId,
      displayName: normalized.nickname,
      kind: "creature",
      xpBefore: beforeXp,
      xpAfter: xp,
      xpToNextBefore: beforeXpToNext,
      xpToNextAfter: xpToNext,
      levelBefore: beforeLevel,
      levelAfter: level,
      levelUps,
      statGrowth,
      abilityTriggers,
    },
  };
}

function progressPlayer(player: PlayerProfile, xpGain: number, seed: string): { player: PlayerProfile; event: BreedingProgressionEvent; energyGrowth: number } {
  const normalized = normalizePlayer(player);
  const beforeLevel = normalized.breederRank;
  const beforeXp = normalized.breederXp;
  const beforeXpToNext = normalized.breederXpToNext;
  let level = normalized.breederRank;
  let xp = normalized.breederXp + xpGain;
  let xpToNext = normalized.breederXpToNext;
  let levelUps = 0;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    levelUps += 1;
    xpToNext = getBreederXpToNext(level);
  }

  const statGrowth = levelUps > 0 ? rollStatGrowth(`${seed}_player`, levelUps, ["CHA", "FER", "WIL"]) : {};
  const energyGrowth = levelUps > 0 ? levelUps * 10 + (statGrowth.STA ?? 0) * 3 : 0;
  const heartGrowth = getHeartMilestoneGain(beforeLevel, level, 3);
  const abilityTriggers: string[] = [];

  if (levelUps > 0) {
    abilityTriggers.push(`Breeder Rank increased to ${level}.`);
    const growthText = formatStatGrowth(statGrowth);
    if (growthText.length) abilityTriggers.push(`Player stat growth: ${growthText.join(", ")}.`);
    if (energyGrowth > 0) abilityTriggers.push(`Player Max Energy increased by ${energyGrowth}.`);
    if (heartGrowth > 0) abilityTriggers.push(`Player Max Hearts increased by ${heartGrowth}.`);
  }

  return {
    player: {
      ...normalized,
      breederRank: level,
      breederXp: xp,
      breederXpToNext: xpToNext,
      stats: applyStatGrowth(normalized.stats, statGrowth),
      maxHearts: normalized.maxHearts + heartGrowth,
    },
    event: {
      participantId: PLAYER_PARTICIPANT_ID,
      displayName: normalized.name,
      kind: "player",
      xpBefore: beforeXp,
      xpAfter: xp,
      xpToNextBefore: beforeXpToNext,
      xpToNextAfter: xpToNext,
      levelBefore: beforeLevel,
      levelAfter: level,
      levelUps,
      statGrowth,
      abilityTriggers,
    },
    energyGrowth,
  };
}

export function performBreedingAttempt(save: GameSave, giverId: string, receiverId: string): { save: GameSave; attempt: BreedingAttemptRecord } | null {
  const breeding = save.breeding ?? createDefaultBreedingState();
  const normalizedSave = { ...save, player: normalizePlayer(save.player), creatures: (save.creatures ?? []).map(normalizeCreature), breeding };
  const preview = getBreedingPreview(normalizedSave, giverId, receiverId);
  if (!preview || !preview.canAttempt) return null;

  const attemptNumber = breeding.attempts.length + 1;
  const attemptId = `breeding_${save.dayState.dayNumber}_${attemptNumber}_${Date.now()}` as BreedingAttemptId;
  const roll = deterministicRoll(`${save.saveId}_${attemptId}_${giverId}_${receiverId}`);
  const outcome = roll < preview.pregnancyChance ? "pregnancy" : "failed";
  const streakUpdate = updateStreaks(breeding, preview.pairKey, giverId, receiverId, save.dayState.dayNumber, outcome);
  const participants = getBreedingParticipants(normalizedSave);
  const giver = participants.find((item) => item.participantId === giverId);
  const receiver = participants.find((item) => item.participantId === receiverId);
  const resultText = outcome === "pregnancy"
    ? `${receiver?.displayName ?? "Receiver"} shows promising signs. Pregnancy will create an egg after sleep.`
    : `${giver?.displayName ?? "Giver"} and ${receiver?.displayName ?? "Receiver"} bonded, but no pregnancy occurred.`;

  const shouldUpdatePlayer = giverId === PLAYER_PARTICIPANT_ID || receiverId === PLAYER_PARTICIPANT_ID;
  const playerProgress = shouldUpdatePlayer ? progressPlayer(normalizedSave.player, preview.breederXpGain, `${save.saveId}_${attemptId}`) : null;
  const progressionEvents: BreedingProgressionEvent[] = [];

  if (playerProgress) progressionEvents.push(playerProgress.event);

  const updatedCreatures = (normalizedSave.creatures ?? []).map((creature) => {
    if (creature.creatureId !== giverId && creature.creatureId !== receiverId) return creature;

    const progressed = progressCreature(creature, preview.xpGain, `${save.saveId}_${attemptId}_${creature.creatureId}`);
    progressionEvents.push(progressed.event);

    return {
      ...progressed.creature,
      energy: Math.max(0, progressed.creature.energy - preview.energyCost),
      hearts: Math.max(0, (progressed.creature.hearts ?? 4) - preview.heartCost),
    };
  });

  const pregnancy = outcome === "pregnancy" && giver && receiver ? createPregnancyRecord(normalizedSave, giver, receiver, `${save.saveId}_${attemptId}`) : null;

  const attempt: BreedingAttemptRecord = {
    attemptId,
    dayNumber: save.dayState.dayNumber,
    giverId,
    receiverId,
    pregnancyChance: preview.pregnancyChance,
    energyCost: preview.energyCost,
    heartCost: preview.heartCost,
    xpGain: preview.xpGain,
    breederXpGain: preview.breederXpGain,
    streakBefore: streakUpdate.streakBefore,
    streakAfter: streakUpdate.streakAfter,
    outcome,
    resultText,
    progressionEvents,
    createdAt: new Date().toISOString(),
  };

  const nextMaxEnergy = normalizedSave.currencies.maxEnergy + (playerProgress?.energyGrowth ?? 0);

  return {
    save: {
      ...normalizedSave,
      player: playerProgress
        ? { ...playerProgress.player, hearts: Math.max(0, (playerProgress.player.hearts ?? 4) - preview.heartCost) }
        : normalizedSave.player,
      currencies: {
        ...normalizedSave.currencies,
        maxEnergy: nextMaxEnergy,
        energy: shouldUpdatePlayer ? Math.max(0, normalizedSave.currencies.energy - preview.energyCost) : normalizedSave.currencies.energy,
      },
      creatures: updatedCreatures,
      pregnancies: pregnancy ? [pregnancy, ...(normalizedSave.pregnancies ?? [])] : (normalizedSave.pregnancies ?? []),
      eggs: normalizedSave.eggs ?? [],
      breeding: { hearts: 0, maxHearts: 0, attempts: [attempt, ...breeding.attempts].slice(0, 20), streaks: streakUpdate.streaks },
      flags: {
        ...normalizedSave.flags,
        breedingUnlocked: true,
        m4BreedingAttempted: true,
        m5PregnancyCreated: pregnancy ? true : (normalizedSave.flags.m5PregnancyCreated ?? false),
        m8BreedingProgression: true,
        lastBreedingOutcome: outcome,
      },
    },
    attempt,
  };
}

export function getXpBarPercent(xp: number | undefined, xpToNext: number | undefined): number {
  if (!xpToNext || xpToNext <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((xp ?? 0) / xpToNext) * 100)));
}
