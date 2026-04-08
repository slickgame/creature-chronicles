"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useGame } from "@/context/GameContext";
import {
  ALL_BREEDABLE_TRAITS,
  BREEDING_UI_STORAGE_KEY,
  BreedingPreset,
  CreatureTrait,
  CreatureTraitEntry,
  DetailTarget,
  EggQuality,
  PresetPreviewTarget,
  PresetSortMode,
  PresetValidation,
  SavedBreedingUiState,
  SortDirection,
  SortOption,
  TraitGrade,
} from "@/lib/breeding/types";
import {
  getCreatureImage,
  getGradeClasses,
  getGradeDescription,
  getGradeMultiplier,
  getHappinessLabel,
  getTraitClasses,
  getTraitDescription,
  getTraitLabel,
} from "@/lib/breeding/uiHelpers";
import {
  CompactParticipantCard,
  FilterChip,
  HelpModal,
  InfoButton,
  SortDirectionButtons,
  TraitBadgeRow,
} from "@/components/breeding/BreedingUiPrimitives";
import { BreedingPresetPanel } from "@/components/breeding/BreedingPresetPanel";

export default function BreedingPage() {
  const {
    breedCreatures,
    playerData,
    homeState,
    breedingSelection,
    setBreedingSelection,
    creatures,
    currentDay,
    currentHour,
    currentMinute,
  } = useGame();

  const [traitHelpOpen, setTraitHelpOpen] = useState(false);
  const [gradeGuideOpen, setGradeGuideOpen] = useState(false);
  const [inheritanceHelpOpen, setInheritanceHelpOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [presetPreviewTarget, setPresetPreviewTarget] =
    useState<PresetPreviewTarget | null>(null);

  const [giverSearch, setGiverSearch] = useState("");
  const [receiverSearch, setReceiverSearch] = useState("");
  const [giverReadyOnly, setGiverReadyOnly] = useState(false);
  const [receiverReadyOnly, setReceiverReadyOnly] = useState(false);
  const [giverTraitsOnly, setGiverTraitsOnly] = useState(false);
  const [receiverTraitsOnly, setReceiverTraitsOnly] = useState(false);
  const [giverFamilySafeOnly, setGiverFamilySafeOnly] = useState(false);
  const [receiverFamilySafeOnly, setReceiverFamilySafeOnly] = useState(false);
  const [giverFavoritesOnly, setGiverFavoritesOnly] = useState(false);
  const [receiverFavoritesOnly, setReceiverFavoritesOnly] = useState(false);
  const [giverSort, setGiverSort] = useState<SortOption>("name");
  const [receiverSort, setReceiverSort] = useState<SortOption>("name");
  const [giverSortDirection, setGiverSortDirection] = useState<SortDirection>("asc");
  const [receiverSortDirection, setReceiverSortDirection] =
    useState<SortDirection>("asc");
  const [favoriteCreatureIds, setFavoriteCreatureIds] = useState<number[]>([]);
  const [presetNameInput, setPresetNameInput] = useState("");
  const [presetOverwriteSlot, setPresetOverwriteSlot] = useState<number>(1);
  const [presets, setPresets] = useState<BreedingPreset[]>([]);
  const [renamingPresetSlot, setRenamingPresetSlot] = useState<number | null>(null);
  const [renamePresetInput, setRenamePresetInput] = useState("");
  const [presetSortMode, setPresetSortMode] = useState<PresetSortMode>("custom");

  const PRESET_SLOT_COUNT = 5;
  const canAffordBreed = playerData.energy >= 8;

  const giverCreature = breedingSelection.giverCreatureId
    ? creatures.find((c) => c.id === breedingSelection.giverCreatureId) ?? null
    : null;

  const receiverCreature = breedingSelection.receiverCreatureId
    ? creatures.find((c) => c.id === breedingSelection.receiverCreatureId) ?? null
    : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(BREEDING_UI_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedBreedingUiState>;
      if (Array.isArray(parsed.favoriteCreatureIds)) {
        setFavoriteCreatureIds(
          parsed.favoriteCreatureIds.filter((id): id is number => typeof id === "number")
        );
      }
      if (Array.isArray(parsed.presets)) {
        setPresets(
          parsed.presets
            .filter((preset): preset is BreedingPreset => {
              return (
                typeof preset === "object" &&
                preset !== null &&
                typeof preset.slot === "number" &&
                typeof preset.name === "string" &&
                (preset.giverType === "player" || preset.giverType === "creature") &&
                (preset.receiverType === "player" || preset.receiverType === "creature")
              );
            })
            .sort((a, b) => a.slot - b.slot)
        );
      }
      if (parsed.presetSortMode === "custom" || parsed.presetSortMode === "best_match") {
        setPresetSortMode(parsed.presetSortMode);
      }
    } catch (error) {
      console.error("Failed to load breeding UI state", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload: SavedBreedingUiState = {
        favoriteCreatureIds,
        presets,
        presetSortMode,
      };
      window.localStorage.setItem(BREEDING_UI_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("Failed to save breeding UI state", error);
    }
  }, [favoriteCreatureIds, presets, presetSortMode]);

  function toggleFavoriteCreature(creatureId: number) {
    setFavoriteCreatureIds((current) =>
      current.includes(creatureId)
        ? current.filter((id) => id !== creatureId)
        : [...current, creatureId]
    );
  }

  function isFavoritedCreature(creatureId: number) {
    return favoriteCreatureIds.includes(creatureId);
  }

  function getPresetAtSlot(slot: number) {
    return presets.find((preset) => preset.slot === slot) ?? null;
  }

  function findCreatureBySavedId(id: number | null) {
    if (id === null) return null;
    return creatures.find((c) => c.id === id) ?? null;
  }

  function getPresetParticipantLabel(type: "player" | "creature", creatureId: number | null) {
    if (type === "player") return playerData.name;
    const creature = creatures.find((c) => c.id === creatureId);
    return creature ? creature.nickname : "Missing Creature";
  }

  function calculateRelationshipRiskFromSavedPair(
    giverType: "player" | "creature",
    giverCreatureId: number | null,
    receiverType: "player" | "creature",
    receiverCreatureId: number | null
  ): PresetValidation["familyRisk"] {
    const leftCreature = giverType === "creature" ? findCreatureBySavedId(giverCreatureId) : null;
    const rightCreature = receiverType === "creature" ? findCreatureBySavedId(receiverCreatureId) : null;

    if (giverType === "player" && rightCreature && (rightCreature.giverIsPlayer || rightCreature.receiverIsPlayer)) {
      return "parent_child";
    }
    if (receiverType === "player" && leftCreature && (leftCreature.giverIsPlayer || leftCreature.receiverIsPlayer)) {
      return "parent_child";
    }
    if (!leftCreature || !rightCreature) return "none";

    const isParentChild =
      leftCreature.id === rightCreature.giverId ||
      leftCreature.id === rightCreature.receiverId ||
      rightCreature.id === leftCreature.giverId ||
      rightCreature.id === leftCreature.receiverId;

    if (isParentChild) return "parent_child";

    const sameGiverSide =
      (leftCreature.giverId !== null && leftCreature.giverId === rightCreature.giverId) ||
      (leftCreature.giverIsPlayer && rightCreature.giverIsPlayer);
    const sameReceiverSide =
      (leftCreature.receiverId !== null && leftCreature.receiverId === rightCreature.receiverId) ||
      (leftCreature.receiverIsPlayer && rightCreature.receiverIsPlayer);

    if (sameGiverSide && sameReceiverSide) return "full_sibling";
    if (sameGiverSide || sameReceiverSide) return "half_sibling";
    return "none";
  }

  function validatePreset(preset: BreedingPreset): PresetValidation {
    const giverMissing = preset.giverType === "creature" && !creatures.some((c) => c.id === preset.giverCreatureId);
    const receiverMissing = preset.receiverType === "creature" && !creatures.some((c) => c.id === preset.receiverCreatureId);
    const sameCreature =
      preset.giverType === "creature" &&
      preset.receiverType === "creature" &&
      preset.giverCreatureId !== null &&
      preset.giverCreatureId === preset.receiverCreatureId;

    const familyRisk =
      giverMissing || receiverMissing || sameCreature
        ? "none"
        : calculateRelationshipRiskFromSavedPair(
            preset.giverType,
            preset.giverCreatureId,
            preset.receiverType,
            preset.receiverCreatureId
          );

    return {
      giverMissing,
      receiverMissing,
      sameCreature,
      familyRisk,
      canLoad: !giverMissing && !receiverMissing && !sameCreature,
    };
  }

  function getNextEmptyPresetSlot(excludeSlot?: number) {
    for (let slot = 1; slot <= PRESET_SLOT_COUNT; slot += 1) {
      if (slot === excludeSlot) continue;
      if (!getPresetAtSlot(slot)) return slot;
    }
    return null;
  }

  function movePreset(slot: number, direction: "up" | "down") {
    if (presetSortMode !== "custom") return;
    const targetSlot = direction === "up" ? slot - 1 : slot + 1;
    if (targetSlot < 1 || targetSlot > PRESET_SLOT_COUNT) return;
    const targetPreset = getPresetAtSlot(targetSlot);

    setPresets((current) =>
      [...current]
        .map((preset) => {
          if (preset.slot === slot) return { ...preset, slot: targetSlot };
          if (preset.slot === targetSlot && targetPreset) return { ...preset, slot };
          return preset;
        })
        .sort((a, b) => a.slot - b.slot)
    );
  }

  function savePresetToSlot(slot: number) {
    if (
      (breedingSelection.giverType !== "player" && breedingSelection.giverCreatureId === null) ||
      (breedingSelection.receiverType !== "player" && breedingSelection.receiverCreatureId === null)
    ) {
      return;
    }

    const trimmedName = presetNameInput.trim();
    const existing = getPresetAtSlot(slot);
    const newPreset: BreedingPreset = {
      slot,
      name: trimmedName.length > 0 ? trimmedName : existing?.name ?? `Preset ${slot}`,
      giverType: breedingSelection.giverType,
      giverCreatureId: breedingSelection.giverCreatureId,
      receiverType: breedingSelection.receiverType,
      receiverCreatureId: breedingSelection.receiverCreatureId,
    };

    setPresets((current) =>
      [...current.filter((preset) => preset.slot !== slot), newPreset].sort((a, b) => a.slot - b.slot)
    );
    setPresetNameInput("");
  }

  function loadPreset(slot: number) {
    const preset = getPresetAtSlot(slot);
    if (!preset) return;
    const validation = validatePreset(preset);
    if (!validation.canLoad) return;

    setBreedingSelection({
      ...breedingSelection,
      giverType: preset.giverType,
      giverCreatureId: preset.giverCreatureId,
      receiverType: preset.receiverType,
      receiverCreatureId: preset.receiverCreatureId,
    });
  }

  function loadPresetIntoCompare(slot: number) {
    loadPreset(slot);
    setPresetPreviewTarget(null);
    setCompareOpen(true);
  }

  function deletePreset(slot: number) {
    setPresets((current) => current.filter((preset) => preset.slot !== slot));
    if (renamingPresetSlot === slot) {
      setRenamingPresetSlot(null);
      setRenamePresetInput("");
    }
    if (presetPreviewTarget?.slot === slot) {
      setPresetPreviewTarget(null);
    }
  }

  function startRenamePreset(slot: number) {
    const preset = getPresetAtSlot(slot);
    if (!preset) return;
    setRenamingPresetSlot(slot);
    setRenamePresetInput(preset.name);
  }

  function cancelRenamePreset() {
    setRenamingPresetSlot(null);
    setRenamePresetInput("");
  }

  function saveRenamePreset(slot: number) {
    const trimmed = renamePresetInput.trim();
    if (trimmed.length === 0) return;
    setPresets((current) =>
      current.map((preset) => (preset.slot === slot ? { ...preset, name: trimmed } : preset))
    );
    setRenamingPresetSlot(null);
    setRenamePresetInput("");
  }

  function duplicatePreset(slot: number) {
    const preset = getPresetAtSlot(slot);
    if (!preset) return;
    const nextEmpty = getNextEmptyPresetSlot(slot);
    if (nextEmpty === null) return;
    const duplicateName = `${preset.name} Copy`.slice(0, 32);
    setPresets((current) =>
      [...current, { ...preset, slot: nextEmpty, name: duplicateName }].sort((a, b) => a.slot - b.slot)
    );
  }

  function getParticipantSnapshot(participantType: "player" | "creature", creature: typeof giverCreature) {
    if (participantType === "player") {
      return {
        label: playerData.name,
        happiness: playerData.happiness,
        fertility: playerData.stats.fertility,
        vitality: playerData.stats.vitality,
        intelligence: playerData.stats.intelligence,
        speed: playerData.stats.speed,
        breedingCareLevel: playerData.breedingCare.level,
        traits: [] as CreatureTraitEntry[],
      };
    }
    if (!creature) return null;
    return {
      label: creature.nickname,
      happiness: creature.happiness,
      fertility: creature.stats.fertility,
      vitality: creature.stats.vitality,
      intelligence: creature.stats.intelligence,
      speed: creature.stats.speed,
      breedingCareLevel: creature.skills.breedingCare.level,
      traits: Array.isArray(creature.traits) ? creature.traits : [],
    };
  }

  function getBestTraitEntry(traits: CreatureTraitEntry[], trait: CreatureTrait): CreatureTraitEntry | null {
    const matches = traits.filter((entry) => entry.trait === trait);
    if (matches.length === 0) return null;
    return matches.reduce((best, current) =>
      getGradeMultiplier(current.grade) > getGradeMultiplier(best.grade) ? current : best
    );
  }

  function hasTrait(participant: { traits: CreatureTraitEntry[] } | null, trait: CreatureTrait) {
    if (!participant) return false;
    return participant.traits.some((entry) => entry.trait === trait);
  }

  function getTraitScaledBonus(
    participant: { traits: CreatureTraitEntry[] } | null,
    trait: CreatureTrait,
    maxBonus: number
  ) {
    if (!participant) return 0;
    const best = getBestTraitEntry(participant.traits, trait);
    if (!best) return 0;
    return Math.max(1, Math.round(maxBonus * getGradeMultiplier(best.grade)));
  }

  const giverParticipant = getParticipantSnapshot(breedingSelection.giverType, giverCreature);
  const receiverParticipant = getParticipantSnapshot(breedingSelection.receiverType, receiverCreature);
  const giverLabel = giverParticipant?.label ?? "None";
  const receiverLabel = receiverParticipant?.label ?? "None";

  function calculateRelationshipRisk(
    leftCreature: typeof giverCreature,
    rightCreature: typeof receiverCreature,
    leftIsPlayer = false,
    rightIsPlayer = false
  ) {
    if (leftIsPlayer && rightCreature && (rightCreature.giverIsPlayer || rightCreature.receiverIsPlayer)) {
      return "parent_child";
    }
    if (rightIsPlayer && leftCreature && (leftCreature.giverIsPlayer || leftCreature.receiverIsPlayer)) {
      return "parent_child";
    }
    if (!leftCreature || !rightCreature) return "none";

    const isParentChild =
      leftCreature.id === rightCreature.giverId ||
      leftCreature.id === rightCreature.receiverId ||
      rightCreature.id === leftCreature.giverId ||
      rightCreature.id === leftCreature.receiverId;
    if (isParentChild) return "parent_child";

    const sameGiverSide =
      (leftCreature.giverId !== null && leftCreature.giverId === rightCreature.giverId) ||
      (leftCreature.giverIsPlayer && rightCreature.giverIsPlayer);
    const sameReceiverSide =
      (leftCreature.receiverId !== null && leftCreature.receiverId === rightCreature.receiverId) ||
      (leftCreature.receiverIsPlayer && rightCreature.receiverIsPlayer);

    if (sameGiverSide && sameReceiverSide) return "full_sibling";
    if (sameGiverSide || sameReceiverSide) return "half_sibling";
    return "none";
  }

  const sameCreatureSelected =
    breedingSelection.giverType === "creature" &&
    breedingSelection.receiverType === "creature" &&
    breedingSelection.giverCreatureId !== null &&
    breedingSelection.giverCreatureId === breedingSelection.receiverCreatureId;

  const parentChildWarning =
    calculateRelationshipRisk(
      giverCreature,
      receiverCreature,
      breedingSelection.giverType === "player",
      breedingSelection.receiverType === "player"
    ) === "parent_child";
  const fullSiblingWarning = calculateRelationshipRisk(giverCreature, receiverCreature) === "full_sibling";
  const halfSiblingWarning = calculateRelationshipRisk(giverCreature, receiverCreature) === "half_sibling";

  function getBreedingMinutes() {
    const speeds = [giverParticipant?.speed, receiverParticipant?.speed].filter(
      (value): value is number => typeof value === "number"
    );
    const avgSpeed = speeds.length > 0 ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length : 6;
    const traitBonus = getTraitScaledBonus(giverParticipant, "quick", 10) + getTraitScaledBonus(receiverParticipant, "quick", 10);
    return Math.max(25, 120 - Math.round(avgSpeed * 6) - traitBonus);
  }

  function getCreatureStaminaCost(creatureId: number | null) {
    if (!creatureId) return null;
    const creature = creatures.find((c) => c.id === creatureId);
    if (!creature) return null;
    const sturdyDiscount = getTraitScaledBonus(
      { traits: Array.isArray(creature.traits) ? creature.traits : [] },
      "sturdy",
      3
    );
    return Math.max(6, 22 - Math.floor(creature.stats.endurance / 2) - sturdyDiscount);
  }

  function isCreatureReady(creature: (typeof creatures)[number]) {
    const cost = getCreatureStaminaCost(creature.id) ?? 999;
    return creature.breedingsToday < creature.dailyBreedingLimit && creature.breedingStamina >= cost;
  }

  function isFamilySafeCandidate(candidate: (typeof creatures)[number], role: "giver" | "receiver") {
    if (role === "giver") {
      return (
        calculateRelationshipRisk(
          candidate,
          receiverCreature,
          false,
          breedingSelection.receiverType === "player"
        ) === "none"
      );
    }
    return (
      calculateRelationshipRisk(
        giverCreature,
        candidate,
        breedingSelection.giverType === "player",
        false
      ) === "none"
    );
  }

  function getAverageHappiness() {
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness].filter(
      (value): value is number => typeof value === "number"
    );
    if (happinessValues.length === 0) return 60;
    return happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length;
  }

  function getAverageBreedingCare() {
    const skillValues = [giverParticipant?.breedingCareLevel, receiverParticipant?.breedingCareLevel].filter(
      (value): value is number => typeof value === "number"
    );
    if (skillValues.length === 0) return 1;
    return skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length;
  }

  function getRefusalChanceEstimate() {
    let refusalChance = 0;
    const avgHappiness = getAverageHappiness();
    const avgBreedingCare = getAverageBreedingCare();
    const calmReduction =
      getTraitScaledBonus(giverParticipant, "calm", 8) / 100 +
      getTraitScaledBonus(receiverParticipant, "calm", 8) / 100;

    if (avgHappiness < 20) refusalChance += 0.45;
    else if (avgHappiness < 35) refusalChance += 0.28;
    else if (avgHappiness < 50) refusalChance += 0.14;

    if (homeState.cleanliness < 25) refusalChance += 0.25;
    else if (homeState.cleanliness < 50) refusalChance += 0.12;

    if (homeState.foodStock <= 0) refusalChance += 0.15;
    else if (homeState.foodStock <= 2) refusalChance += 0.06;

    refusalChance -= Math.min(0.12, avgBreedingCare * 0.015);
    refusalChance -= calmReduction;
    return Math.max(0, Math.min(0.75, refusalChance));
  }

  function getEggChanceEstimate() {
    if (breedingSelection.receiverType === "player") return 0;

    const fertilities = [giverParticipant?.fertility, receiverParticipant?.fertility].filter(
      (value): value is number => typeof value === "number"
    );
    const vitalities = [giverParticipant?.vitality, receiverParticipant?.vitality].filter(
      (value): value is number => typeof value === "number"
    );
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness].filter(
      (value): value is number => typeof value === "number"
    );
    const breedingCareValues = [giverParticipant?.breedingCareLevel, receiverParticipant?.breedingCareLevel].filter(
      (value): value is number => typeof value === "number"
    );

    const avgFertility = fertilities.length > 0 ? fertilities.reduce((sum, value) => sum + value, 0) / fertilities.length : 5;
    const avgVitality = vitalities.length > 0 ? vitalities.reduce((sum, value) => sum + value, 0) / vitalities.length : 5;
    const avgHappiness = happinessValues.length > 0 ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length : 60;
    const avgBreedingCare = breedingCareValues.length > 0 ? breedingCareValues.reduce((sum, value) => sum + value, 0) / breedingCareValues.length : 1;
    const fertileBonus =
      getTraitScaledBonus(giverParticipant, "fertile", 7) / 100 +
      getTraitScaledBonus(receiverParticipant, "fertile", 7) / 100;

    let chance = 0.45;
    chance += (avgFertility - 5) * 0.05;
    chance += (avgVitality - 5) * 0.02;
    chance += (avgHappiness - 50) * 0.003;
    chance += avgBreedingCare * 0.015;
    chance += fertileBonus;

    if (homeState.cleanliness >= 80) chance += 0.08;
    else if (homeState.cleanliness >= 50) chance += 0.03;
    else if (homeState.cleanliness < 25) chance -= 0.15;
    else if (homeState.cleanliness < 50) chance -= 0.07;

    if (homeState.foodStock >= 8) chance += 0.04;
    else if (homeState.foodStock <= 0) chance -= 0.12;
    else if (homeState.foodStock <= 2) chance -= 0.05;

    return Math.max(0.1, Math.min(0.95, chance));
  }

  function getEggQualityPreview(): EggQuality {
    const fertilities = [giverParticipant?.fertility, receiverParticipant?.fertility].filter(
      (value): value is number => typeof value === "number"
    );
    const vitalities = [giverParticipant?.vitality, receiverParticipant?.vitality].filter(
      (value): value is number => typeof value === "number"
    );
    const intelligences = [giverParticipant?.intelligence, receiverParticipant?.intelligence].filter(
      (value): value is number => typeof value === "number"
    );
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness].filter(
      (value): value is number => typeof value === "number"
    );
    const breedingCareValues = [giverParticipant?.breedingCareLevel, receiverParticipant?.breedingCareLevel].filter(
      (value): value is number => typeof value === "number"
    );

    const avgFertility = fertilities.length > 0 ? fertilities.reduce((sum, value) => sum + value, 0) / fertilities.length : 5;
    const avgVitality = vitalities.length > 0 ? vitalities.reduce((sum, value) => sum + value, 0) / vitalities.length : 5;
    const avgIntelligence = intelligences.length > 0 ? intelligences.reduce((sum, value) => sum + value, 0) / intelligences.length : 5;
    const avgHappiness = happinessValues.length > 0 ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length : 60;
    const avgBreedingCare = breedingCareValues.length > 0 ? breedingCareValues.reduce((sum, value) => sum + value, 0) / breedingCareValues.length : 1;
    const extraTraitScore =
      (hasTrait(giverParticipant, "calm") ? 1 : 0) +
      (hasTrait(receiverParticipant, "calm") ? 1 : 0) +
      (hasTrait(giverParticipant, "fertile") ? 1 : 0) +
      (hasTrait(receiverParticipant, "fertile") ? 1 : 0);

    const score =
      avgFertility +
      avgVitality +
      avgIntelligence +
      avgBreedingCare * 1.5 +
      avgHappiness / 10 +
      homeState.cleanliness / 20 +
      Math.min(homeState.foodStock, 10) / 2 +
      extraTraitScore;

    if (score >= 34) return "exceptional";
    if (score >= 28) return "strong";
    if (score >= 22) return "normal";
    return "poor";
  }

  function getQualityClasses(quality: EggQuality) {
    if (quality === "exceptional") return "bg-purple-100 text-purple-900 border-purple-300";
    if (quality === "strong") return "bg-sky-100 text-sky-900 border-sky-300";
    if (quality === "normal") return "bg-green-100 text-green-900 border-green-300";
    return "bg-stone-100 text-stone-800 border-stone-300";
  }

  function getRefusalRiskLabel() {
    const chance = getRefusalChanceEstimate();
    if (chance >= 0.4) return "High";
    if (chance >= 0.18) return "Moderate";
    return "Low";
  }

  function getRefusalRiskClasses() {
    const chance = getRefusalChanceEstimate();
    if (chance >= 0.4) return "bg-red-100 text-red-900 border-red-300";
    if (chance >= 0.18) return "bg-amber-100 text-amber-900 border-amber-300";
    return "bg-green-100 text-green-900 border-green-300";
  }

  const inheritancePreview = useMemo(() => {
    const shared = ALL_BREEDABLE_TRAITS.map((trait) => {
      const giverBest = getBestTraitEntry(giverParticipant?.traits ?? [], trait);
      const receiverBest = getBestTraitEntry(receiverParticipant?.traits ?? [], trait);
      if (!giverBest || !receiverBest) return null;
      return {
        type: "shared" as const,
        trait,
        strongestGrade:
          getGradeMultiplier(giverBest.grade) >= getGradeMultiplier(receiverBest.grade)
            ? giverBest.grade
            : receiverBest.grade,
        note: "High chance",
      };
    }).filter(Boolean);

    const giverOnly = ALL_BREEDABLE_TRAITS.map((trait) => {
      const giverBest = getBestTraitEntry(giverParticipant?.traits ?? [], trait);
      const receiverBest = getBestTraitEntry(receiverParticipant?.traits ?? [], trait);
      if (!giverBest || receiverBest) return null;
      return {
        type: "giver" as const,
        trait,
        strongestGrade: giverBest.grade,
        note: "Good chance",
      };
    }).filter(Boolean);

    const receiverOnly = ALL_BREEDABLE_TRAITS.map((trait) => {
      const giverBest = getBestTraitEntry(giverParticipant?.traits ?? [], trait);
      const receiverBest = getBestTraitEntry(receiverParticipant?.traits ?? [], trait);
      if (giverBest || !receiverBest) return null;
      return {
        type: "receiver" as const,
        trait,
        strongestGrade: receiverBest.grade,
        note: "Good chance",
      };
    }).filter(Boolean);

    return [...shared, ...giverOnly, ...receiverOnly] as {
      type: "shared" | "giver" | "receiver";
      trait: CreatureTrait;
      strongestGrade: TraitGrade;
      note: string;
    }[];
  }, [giverParticipant, receiverParticipant]);

  const hasValidSelection =
    (breedingSelection.giverType === "player" || breedingSelection.giverCreatureId !== null) &&
    (breedingSelection.receiverType === "player" || breedingSelection.receiverCreatureId !== null) &&
    !sameCreatureSelected;

  const giverCreatureReady = !giverCreature || isCreatureReady(giverCreature);
  const receiverCreatureReady = !receiverCreature || isCreatureReady(receiverCreature);
  const canBreed = canAffordBreed && hasValidSelection && giverCreatureReady && receiverCreatureReady;
  const playerIsReceiver = breedingSelection.receiverType === "player";

  function formatTime(hour: number, minute: number) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${suffix}`;
  }

  function getPresetScore(preset: BreedingPreset) {
    const validation = validatePreset(preset);
    if (!validation.canLoad) {
      return {
        score: -1000,
        label: validation.giverMissing || validation.receiverMissing ? "Missing" : "Invalid",
        eggChance: 0,
        refusalChance: 1,
      };
    }

    let score = 100;
    if (validation.familyRisk === "none") score += 60;
    if (validation.familyRisk === "half_sibling") score += 15;
    if (validation.familyRisk === "full_sibling") score -= 40;
    if (validation.familyRisk === "parent_child") score -= 60;

    return {
      score,
      label:
        validation.familyRisk === "none"
          ? "Usable"
          : validation.familyRisk === "half_sibling"
          ? "Risk"
          : "High Risk",
      eggChance: 0,
      refusalChance: 0,
    };
  }

  function getPresetPreviewData(preset: BreedingPreset) {
    const validation = validatePreset(preset);
    const scoreData = getPresetScore(preset);
    const presetGiver = preset.giverType === "creature" ? creatures.find((c) => c.id === preset.giverCreatureId) ?? null : null;
    const presetReceiver = preset.receiverType === "creature" ? creatures.find((c) => c.id === preset.receiverCreatureId) ?? null : null;
    const giverName = preset.giverType === "player" ? playerData.name : presetGiver?.nickname ?? "Missing Creature";
    const receiverName = preset.receiverType === "player" ? playerData.name : presetReceiver?.nickname ?? "Missing Creature";
    return { validation, scoreData, presetGiver, presetReceiver, giverName, receiverName };
  }

  const sortedPresetSlots = useMemo(() => {
    const slots = Array.from({ length: PRESET_SLOT_COUNT }, (_, i) => i + 1);
    if (presetSortMode === "custom") return slots;
    return [...slots].sort((a, b) => {
      const presetA = getPresetAtSlot(a);
      const presetB = getPresetAtSlot(b);
      if (!presetA && !presetB) return a - b;
      if (!presetA) return 1;
      if (!presetB) return -1;
      return getPresetScore(presetB).score - getPresetScore(presetA).score;
    });
  }, [presetSortMode, presets, creatures, playerData]);

function filterCreatures(
  search: string,
  readyOnly: boolean,
  traitsOnly: boolean,
  familySafeOnly: boolean,
  favoritesOnly: boolean,
  sort: SortOption,
  direction: SortDirection,
  role: "giver" | "receiver"
) {
  const lowered = search.trim().toLowerCase();

  const filtered = creatures.filter((creature: (typeof creatures)[number]) => {
    const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
      ? creature.traits
      : [];

    const matchesSearch =
      lowered.length === 0 ||
      creature.nickname.toLowerCase().includes(lowered) ||
      creature.name.toLowerCase().includes(lowered);

    const matchesReady = !readyOnly || isCreatureReady(creature);
    const matchesTraits = !traitsOnly || traits.length > 0;
    const matchesFamilySafe = !familySafeOnly || isFamilySafeCandidate(creature, role);
    const matchesFavorite = !favoritesOnly || isFavoritedCreature(creature.id);

    return (
      matchesSearch &&
      matchesReady &&
      matchesTraits &&
      matchesFamilySafe &&
      matchesFavorite
    );
  });

  return sortCreatures(filtered, sort, direction);
}



  const filteredGiverCreatures = useMemo(
    () =>
      filterCreatures(
        giverSearch,
        giverReadyOnly,
        giverTraitsOnly,
        giverFamilySafeOnly,
        giverFavoritesOnly,
        giverSort,
        giverSortDirection,
        "giver"
      ),
    [
      creatures,
      giverSearch,
      giverReadyOnly,
      giverTraitsOnly,
      giverFamilySafeOnly,
      giverFavoritesOnly,
      giverSort,
      giverSortDirection,
      receiverCreature,
      breedingSelection.receiverType,
      favoriteCreatureIds,
    ]
  );

  const filteredReceiverCreatures = useMemo(
    () =>
      filterCreatures(
        receiverSearch,
        receiverReadyOnly,
        receiverTraitsOnly,
        receiverFamilySafeOnly,
        receiverFavoritesOnly,
        receiverSort,
        receiverSortDirection,
        "receiver"
      ),
    [
      creatures,
      receiverSearch,
      receiverReadyOnly,
      receiverTraitsOnly,
      receiverFamilySafeOnly,
      receiverFavoritesOnly,
      receiverSort,
      receiverSortDirection,
      giverCreature,
      breedingSelection.giverType,
      favoriteCreatureIds,
    ]
  );

  return (
    <>
      <main className="h-screen overflow-hidden bg-gradient-to-b from-pink-100 to-rose-200 p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <h1 className="mb-4 shrink-0 text-3xl font-bold text-rose-900 md:text-4xl">
            💞 Breeding
          </h1>

          <div className="mb-4 shrink-0 grid gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <p><strong>Time:</strong> Day {currentDay}, {formatTime(currentHour, currentMinute)}</p>
              <p><strong>Energy:</strong> {playerData.energy}</p>
              <p><strong>Session:</strong> {getBreedingMinutes()}m</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <p><strong>Egg Chance:</strong> {playerIsReceiver ? "None" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
              <p><strong>Refusal:</strong> {getRefusalRiskLabel()}</p>
              <p><strong>Quality:</strong> {getEggQualityPreview()}</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <p><strong>Home:</strong> Clean {homeState.cleanliness}/100</p>
              <p><strong>Food:</strong> {homeState.foodStock}</p>
              <p><strong>Breeding Care:</strong> {getAverageBreedingCare().toFixed(1)}</p>
            </div>

            <div className="rounded-2xl border-2 border-rose-300 bg-white/80 p-3 text-sm text-stone-800 shadow">
              <div className="flex flex-wrap gap-2">
                <InfoButton onClick={() => setTraitHelpOpen(true)} label="How traits work" />
                <InfoButton onClick={() => setGradeGuideOpen(true)} label="Grade guide" />
                <InfoButton onClick={() => setInheritanceHelpOpen(true)} label="Inheritance help" />
              </div>
              <p className="mt-2 text-xs text-stone-600">Hover trait badges for quick help.</p>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_1fr_360px]">
            <section className="flex min-h-0 flex-col rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
              <div className="mb-3 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-rose-950">Choose Giver</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        giverType: "player",
                        giverCreatureId: null,
                      })
                    }
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow ${
                      breedingSelection.giverType === "player"
                        ? "bg-rose-700 text-white"
                        : "border border-rose-300 bg-white text-stone-800"
                    }`}
                  >
                    Select Player
                  </button>
                </div>

                <input
                  type="text"
                  value={giverSearch}
                  onChange={(e) => setGiverSearch(e.target.value)}
                  placeholder="Search giver..."
                  className="mb-3 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                />

                <div className="mb-3 flex flex-wrap gap-2">
                  <FilterChip active={giverReadyOnly} label="Ready" onClick={() => setGiverReadyOnly((v) => !v)} />
                  <FilterChip active={giverTraitsOnly} label="Has Traits" onClick={() => setGiverTraitsOnly((v) => !v)} />
                  <FilterChip active={giverFamilySafeOnly} label="Family Safe" onClick={() => setGiverFamilySafeOnly((v) => !v)} />
                  <FilterChip active={giverFavoritesOnly} label="Favorites" onClick={() => setGiverFavoritesOnly((v) => !v)} />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={giverSort}
                    onChange={(e) => setGiverSort(e.target.value as SortOption)}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="fertility">Sort: Fertility</option>
                    <option value="happiness">Sort: Happiness</option>
                    <option value="generation">Sort: Generation</option>
                    <option value="ready">Sort: Ready Status</option>
                  </select>
                  <SortDirectionButtons direction={giverSortDirection} setDirection={setGiverSortDirection} />
                </div>
              </div>

              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <CompactParticipantCard
                  selected={breedingSelection.giverType === "player"}
                  title={playerData.name}
                  subtitle="Player"
                  meta={`Happy ${playerData.happiness} • Fertility ${playerData.stats.fertility} • Vitality ${playerData.stats.vitality}`}
                  traits={[]}
                  imageSrc="/images/player.png"
                  onSelect={() =>
                    setBreedingSelection({
                      ...breedingSelection,
                      giverType: "player",
                      giverCreatureId: null,
                    })
                  }
                  onOpenDetails={() =>
                    setDetailTarget({
                      type: "player",
                      roleLabel: "Giver",
                    })
                  }
                />

                {filteredGiverCreatures.map((creature) => {
                  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                    ? creature.traits
                    : [];
                  return (
                    <CompactParticipantCard
                      key={`giver-${creature.id}`}
                      selected={
                        breedingSelection.giverType === "creature" &&
                        breedingSelection.giverCreatureId === creature.id
                      }
                      title={creature.nickname}
                      subtitle={`${creature.name} • Lv ${creature.level} • Gen ${creature.generation}`}
                      meta={`Happy ${creature.happiness} • Fertility ${creature.stats.fertility} • Vitality ${creature.stats.vitality}`}
                      staminaCostLabel={`Cost ${getCreatureStaminaCost(creature.id)} stamina`}
                      traits={traits}
                      imageSrc={getCreatureImage(creature.name)}
                      isFavorited={isFavoritedCreature(creature.id)}
                      onToggleFavorite={() => toggleFavoriteCreature(creature.id)}
                      onSelect={() =>
                        setBreedingSelection({
                          ...breedingSelection,
                          giverType: "creature",
                          giverCreatureId: creature.id,
                        })
                      }
                      onOpenDetails={() =>
                        setDetailTarget({
                          type: "creature",
                          roleLabel: "Giver",
                          creature,
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>

            <section className="flex min-h-0 flex-col rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
              <div className="mb-3 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-rose-950">Choose Receiver</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setBreedingSelection({
                        ...breedingSelection,
                        receiverType: "player",
                        receiverCreatureId: null,
                      })
                    }
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold shadow ${
                      breedingSelection.receiverType === "player"
                        ? "bg-rose-700 text-white"
                        : "border border-rose-300 bg-white text-stone-800"
                    }`}
                  >
                    Select Player
                  </button>
                </div>

                <input
                  type="text"
                  value={receiverSearch}
                  onChange={(e) => setReceiverSearch(e.target.value)}
                  placeholder="Search receiver..."
                  className="mb-3 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                />

                <div className="mb-3 flex flex-wrap gap-2">
                  <FilterChip active={receiverReadyOnly} label="Ready" onClick={() => setReceiverReadyOnly((v) => !v)} />
                  <FilterChip active={receiverTraitsOnly} label="Has Traits" onClick={() => setReceiverTraitsOnly((v) => !v)} />
                  <FilterChip active={receiverFamilySafeOnly} label="Family Safe" onClick={() => setReceiverFamilySafeOnly((v) => !v)} />
                  <FilterChip active={receiverFavoritesOnly} label="Favorites" onClick={() => setReceiverFavoritesOnly((v) => !v)} />
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    value={receiverSort}
                    onChange={(e) => setReceiverSort(e.target.value as SortOption)}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="fertility">Sort: Fertility</option>
                    <option value="happiness">Sort: Happiness</option>
                    <option value="generation">Sort: Generation</option>
                    <option value="ready">Sort: Ready Status</option>
                  </select>
                  <SortDirectionButtons direction={receiverSortDirection} setDirection={setReceiverSortDirection} />
                </div>
              </div>

              <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                <CompactParticipantCard
                  selected={breedingSelection.receiverType === "player"}
                  title={playerData.name}
                  subtitle="Player"
                  meta={`Happy ${playerData.happiness} • Fertility ${playerData.stats.fertility} • Vitality ${playerData.stats.vitality}`}
                  traits={[]}
                  imageSrc="/images/player.png"
                  onSelect={() =>
                    setBreedingSelection({
                      ...breedingSelection,
                      receiverType: "player",
                      receiverCreatureId: null,
                    })
                  }
                  onOpenDetails={() =>
                    setDetailTarget({
                      type: "player",
                      roleLabel: "Receiver",
                    })
                  }
                />

                {filteredReceiverCreatures.map((creature) => {
                  const traits: CreatureTraitEntry[] = Array.isArray(creature.traits)
                    ? creature.traits
                    : [];
                  return (
                    <CompactParticipantCard
                      key={`receiver-${creature.id}`}
                      selected={
                        breedingSelection.receiverType === "creature" &&
                        breedingSelection.receiverCreatureId === creature.id
                      }
                      title={creature.nickname}
                      subtitle={`${creature.name} • Lv ${creature.level} • Gen ${creature.generation}`}
                      meta={`Happy ${creature.happiness} • Fertility ${creature.stats.fertility} • Vitality ${creature.stats.vitality}`}
                      staminaCostLabel={`Cost ${getCreatureStaminaCost(creature.id)} stamina`}
                      traits={traits}
                      imageSrc={getCreatureImage(creature.name)}
                      isFavorited={isFavoritedCreature(creature.id)}
                      onToggleFavorite={() => toggleFavoriteCreature(creature.id)}
                      onSelect={() =>
                        setBreedingSelection({
                          ...breedingSelection,
                          receiverType: "creature",
                          receiverCreatureId: creature.id,
                        })
                      }
                      onOpenDetails={() =>
                        setDetailTarget({
                          type: "creature",
                          roleLabel: "Receiver",
                          creature,
                        })
                      }
                    />
                  );
                })}
              </div>
            </section>

            <aside className="flex min-h-0 flex-col rounded-3xl border-4 border-rose-900 bg-white/85 p-4 shadow-xl">
              <h2 className="mb-3 shrink-0 text-2xl font-bold text-rose-950">Pair Preview</h2>

              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="rounded-2xl bg-rose-50 p-3 text-sm text-stone-800">
                  <p><strong>Giver:</strong> {giverLabel}</p>
                  <p><strong>Receiver:</strong> {receiverLabel}</p>
                  <p><strong>Cost:</strong> 8 Energy + creature stamina</p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-3 text-sm text-stone-800">
                  <p><strong>Egg Chance:</strong> {playerIsReceiver ? "No egg possible" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
                  <p><strong>Refusal:</strong> {getRefusalRiskLabel()}</p>
                  <p><strong>Quality:</strong> {getEggQualityPreview()}</p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">Inheritance Preview</p>
                    <InfoButton onClick={() => setInheritanceHelpOpen(true)} label="Inheritance help" small />
                  </div>

                  {!hasValidSelection ? (
                    <p className="text-sm text-stone-600">Select a valid pair to preview likely inherited traits.</p>
                  ) : inheritancePreview.length === 0 ? (
                    <p className="text-sm text-stone-600">No clear visible inherited traits from this pair.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {inheritancePreview.map((entry, index) => (
                        <div key={`${entry.trait}-${entry.strongestGrade}-${index}`} className="group relative">
                          <div className="flex items-center gap-1">
                            <div className={`inline-block rounded-full border px-2 py-1 text-xs font-semibold ${getTraitClasses(entry.trait)}`}>
                              {getTraitLabel(entry.trait)}
                            </div>
                            <div className={`inline-block rounded-full border px-2 py-1 text-[10px] font-semibold ${getGradeClasses(entry.strongestGrade)}`}>
                              {entry.strongestGrade}
                            </div>
                          </div>
                          <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-60 rounded-2xl border border-stone-300 bg-white p-3 text-left text-xs text-stone-700 shadow-xl group-hover:block">
                            <p className="font-semibold text-stone-900">{getTraitLabel(entry.trait)} — {entry.note}</p>
                            <p className="mt-1">Strongest visible parent grade: {entry.strongestGrade}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getRefusalRiskClasses()}`}>
                    Refusal: {getRefusalRiskLabel()}
                  </div>
                  <div className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getQualityClasses(getEggQualityPreview())}`}>
                    Quality: {getEggQualityPreview()}
                  </div>
                  {playerIsReceiver && (
                    <div className="inline-block rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                      No egg if Player is receiver
                    </div>
                  )}
                  {sameCreatureSelected && (
                    <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                      Same creature cannot fill both roles
                    </div>
                  )}
                  {(parentChildWarning || fullSiblingWarning || halfSiblingWarning) && (
                    <div className="inline-block rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-semibold text-red-900">
                      Family-risk pairing
                    </div>
                  )}
                </div>

                <BreedingPresetPanel
                  presetSlotCount={PRESET_SLOT_COUNT}
                  presetSortMode={presetSortMode}
                  setPresetSortMode={setPresetSortMode}
                  presetNameInput={presetNameInput}
                  setPresetNameInput={setPresetNameInput}
                  presetOverwriteSlot={presetOverwriteSlot}
                  setPresetOverwriteSlot={setPresetOverwriteSlot}
                  hasValidSelection={hasValidSelection}
                  savePresetToSlot={savePresetToSlot}
                  favoriteCreatureIds={favoriteCreatureIds}
                  clearSavedUiData={() => {
                    setFavoriteCreatureIds([]);
                    setPresets([]);
                    setRenamingPresetSlot(null);
                    setRenamePresetInput("");
                    setPresetSortMode("custom");
                    setPresetPreviewTarget(null);
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem(BREEDING_UI_STORAGE_KEY);
                    }
                  }}
                  sortedPresetSlots={sortedPresetSlots}
                  getPresetAtSlot={getPresetAtSlot}
                  validatePreset={validatePreset}
                  getPresetScore={getPresetScore}
                  getNextEmptyPresetSlot={getNextEmptyPresetSlot}
                  renamingPresetSlot={renamingPresetSlot}
                  renamePresetInput={renamePresetInput}
                  setRenamePresetInput={setRenamePresetInput}
                  saveRenamePreset={saveRenamePreset}
                  cancelRenamePreset={cancelRenamePreset}
                  startRenamePreset={startRenamePreset}
                  getPresetParticipantLabel={getPresetParticipantLabel}
                  setPresetPreviewTarget={setPresetPreviewTarget}
                  movePreset={movePreset}
                  loadPreset={loadPreset}
                  duplicatePreset={duplicatePreset}
                  deletePreset={deletePreset}
                />
              </div>

              <div className="mt-4 shrink-0 space-y-3">
                <button
                  onClick={() => setCompareOpen(true)}
                  disabled={!hasValidSelection}
                  className={`w-full rounded-2xl px-4 py-3 font-semibold shadow ${
                    hasValidSelection
                      ? "border border-rose-300 bg-white text-stone-900"
                      : "bg-stone-200 text-stone-500"
                  }`}
                  type="button"
                >
                  Compare Selected Pair
                </button>

                <button
                  onClick={breedCreatures}
                  disabled={!canBreed}
                  className={`w-full rounded-2xl px-4 py-3 text-white font-semibold shadow ${
                    canBreed ? "bg-pink-600" : "bg-gray-500"
                  }`}
                  type="button"
                >
                  {canBreed ? "Breed" : "Cannot Breed"}
                </button>

                <Link
                  href="/breeding/history"
                  className="block rounded-2xl bg-white px-5 py-3 text-center font-semibold text-rose-900 shadow border border-rose-300"
                >
                  View Breeding History
                </Link>

                <Link
                  href="/ranch"
                  className="block rounded-2xl bg-stone-800 px-5 py-3 text-center font-semibold text-white shadow"
                >
                  Back to Ranch
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <HelpModal open={traitHelpOpen} title="How Traits Work" onClose={() => setTraitHelpOpen(false)}>
        <div className="space-y-4">
          {ALL_BREEDABLE_TRAITS.map((trait) => (
            <div key={trait} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className={`mb-2 inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getTraitClasses(trait)}`}>
                {getTraitLabel(trait)}
              </div>
              <p className="font-semibold text-stone-900">{getTraitDescription(trait)}</p>
            </div>
          ))}
        </div>
      </HelpModal>

      <HelpModal open={gradeGuideOpen} title="Grade Guide" onClose={() => setGradeGuideOpen(false)}>
        <div className="space-y-3">
          {(["F", "D", "C", "B", "A", "S"] as TraitGrade[]).map((grade) => (
            <div key={grade} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${getGradeClasses(grade)}`}>
                Grade {grade}
              </div>
              <p className="mt-2 font-semibold text-stone-900">{getGradeDescription(grade)}</p>
            </div>
          ))}
        </div>
      </HelpModal>

      <HelpModal open={inheritanceHelpOpen} title="Inheritance Help" onClose={() => setInheritanceHelpOpen(false)}>
        <div className="space-y-4 text-sm">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-stone-900">Shared traits</p>
            <p className="mt-1 text-stone-700">If both parents have the same trait, that trait has the best inheritance odds.</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-stone-900">Single-parent traits</p>
            <p className="mt-1 text-stone-700">Traits present on only one parent can still pass down, just less consistently.</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-900">Family-risk pairings</p>
            <p className="mt-1 text-red-800">Parent-child and sibling pairings increase the chance of negative outcomes and can reduce trait quality.</p>
          </div>
        </div>
      </HelpModal>

      <HelpModal
        open={detailTarget !== null}
        title={detailTarget ? `${detailTarget.roleLabel} Details` : "Details"}
        onClose={() => setDetailTarget(null)}
        maxWidth="max-w-3xl"
      >
        {detailTarget?.type === "player" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
                <Image src="/images/player.png" alt="Player" width={320} height={320} className="max-h-full w-auto object-contain" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-2xl font-bold text-stone-900">{playerData.name}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-rose-50 p-3"><p className="font-semibold text-stone-900">Happiness: {playerData.happiness} • {getHappinessLabel(playerData.happiness)}</p></div>
                  <div className="rounded-2xl bg-rose-50 p-3"><p className="font-semibold text-stone-900">Breeding Care: Lv {playerData.breedingCare.level}</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {detailTarget?.type === "creature" && (
          <div className="space-y-5">
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl bg-stone-100 md:w-72">
                <Image
                  src={getCreatureImage(detailTarget.creature.name)}
                  alt={detailTarget.creature.name}
                  width={320}
                  height={320}
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-2xl font-bold text-stone-900">{detailTarget.creature.nickname}</p>
                <p className="text-stone-600">{detailTarget.creature.name} • Lv {detailTarget.creature.level} • Gen {detailTarget.creature.generation}</p>
                <TraitBadgeRow traits={Array.isArray(detailTarget.creature.traits) ? detailTarget.creature.traits : []} />
              </div>
            </div>
          </div>
        )}
      </HelpModal>

      <HelpModal open={compareOpen} title="Compare Selected Pair" onClose={() => setCompareOpen(false)} maxWidth="max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="mb-2 text-sm text-stone-500">Giver</p>
            <p className="text-xl font-bold text-stone-900">{giverLabel}</p>
            {giverCreature && <TraitBadgeRow traits={Array.isArray(giverCreature.traits) ? giverCreature.traits : []} />}
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="mb-2 text-sm text-stone-500">Receiver</p>
            <p className="text-xl font-bold text-stone-900">{receiverLabel}</p>
            {receiverCreature && <TraitBadgeRow traits={Array.isArray(receiverCreature.traits) ? receiverCreature.traits : []} />}
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-stone-100 p-4 text-sm text-stone-800">
          <p><strong>Egg Chance:</strong> {playerIsReceiver ? "No egg possible" : `${Math.round(getEggChanceEstimate() * 100)}%`}</p>
          <p><strong>Refusal Risk:</strong> {getRefusalRiskLabel()}</p>
          <p><strong>Egg Quality:</strong> {getEggQualityPreview()}</p>
          <p><strong>Session Time:</strong> {getBreedingMinutes()} minutes</p>
        </div>
      </HelpModal>

      <HelpModal
        open={presetPreviewTarget !== null}
        title={presetPreviewTarget ? `Preset Preview — Slot ${presetPreviewTarget.slot}` : "Preset Preview"}
        onClose={() => setPresetPreviewTarget(null)}
        maxWidth="max-w-4xl"
      >
        {presetPreviewTarget && (() => {
          const { preset, slot } = presetPreviewTarget;
          const preview = getPresetPreviewData(preset);
          return (
            <div className="space-y-4">
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-lg font-bold text-stone-900">{preset.name}</p>
                <p className="text-sm text-stone-600">Slot {slot} • {preview.giverName} → {preview.receiverName}</p>
              </div>
              <div className="rounded-2xl bg-stone-100 p-4 text-sm text-stone-800">
                <p><strong>Status:</strong> {preview.scoreData.label}</p>
                <p><strong>Score:</strong> {preview.scoreData.score}</p>
                <p><strong>Family Risk:</strong> {preview.validation.familyRisk}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {preview.validation.canLoad ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        loadPreset(slot);
                        setPresetPreviewTarget(null);
                      }}
                      className="rounded-2xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white shadow"
                    >
                      Load Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => loadPresetIntoCompare(slot)}
                      className="rounded-2xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow"
                    >
                      Load + Compare
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                    This preset cannot be loaded yet.
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </HelpModal>
    </>
  );
}
