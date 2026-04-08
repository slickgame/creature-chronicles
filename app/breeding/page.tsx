"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
        const cleanedFavorites = parsed.favoriteCreatureIds.filter(
          (id): id is number => typeof id === "number"
        );
        setFavoriteCreatureIds(cleanedFavorites);
      }

      if (Array.isArray(parsed.presets)) {
        const cleanedPresets = parsed.presets.filter((preset): preset is BreedingPreset => {
          return (
            typeof preset === "object" &&
            preset !== null &&
            typeof preset.slot === "number" &&
            typeof preset.name === "string" &&
            (preset.giverType === "player" || preset.giverType === "creature") &&
            (preset.receiverType === "player" || preset.receiverType === "creature") &&
            (typeof preset.giverCreatureId === "number" || preset.giverCreatureId === null) &&
            (typeof preset.receiverCreatureId === "number" || preset.receiverCreatureId === null)
          );
        });

        setPresets(cleanedPresets.sort((a, b) => a.slot - b.slot));
      }

      if (
        parsed.presetSortMode === "custom" ||
        parsed.presetSortMode === "best_match"
      ) {
        setPresetSortMode(parsed.presetSortMode);
      }
    } catch (error) {
      console.error("Failed to load breeding UI state from localStorage", error);
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
      console.error("Failed to save breeding UI state to localStorage", error);
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

  function getPresetParticipantLabel(
    type: "player" | "creature",
    creatureId: number | null
  ) {
    if (type === "player") return playerData.name;
    const creature = creatures.find((c) => c.id === creatureId);
    return creature ? creature.nickname : "Missing Creature";
  }

  function findCreatureBySavedId(id: number | null) {
    if (id === null) return null;
    return creatures.find((c) => c.id === id) ?? null;
  }

  function calculateRelationshipRiskFromSavedPair(
    giverType: "player" | "creature",
    giverCreatureId: number | null,
    receiverType: "player" | "creature",
    receiverCreatureId: number | null
  ): PresetValidation["familyRisk"] {
    const leftCreature = giverType === "creature" ? findCreatureBySavedId(giverCreatureId) : null;
    const rightCreature =
      receiverType === "creature" ? findCreatureBySavedId(receiverCreatureId) : null;

    if (
      giverType === "player" &&
      rightCreature &&
      (rightCreature.giverIsPlayer || rightCreature.receiverIsPlayer)
    ) {
      return "parent_child";
    }

    if (
      receiverType === "player" &&
      leftCreature &&
      (leftCreature.giverIsPlayer || leftCreature.receiverIsPlayer)
    ) {
      return "parent_child";
    }

    if (!leftCreature || !rightCreature) {
      return "none";
    }

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
      (leftCreature.receiverId !== null &&
        leftCreature.receiverId === rightCreature.receiverId) ||
      (leftCreature.receiverIsPlayer && rightCreature.receiverIsPlayer);

    if (sameGiverSide && sameReceiverSide) return "full_sibling";
    if (sameGiverSide || sameReceiverSide) return "half_sibling";

    return "none";
  }

  function validatePreset(preset: BreedingPreset): PresetValidation {
    const giverMissing =
      preset.giverType === "creature" &&
      !creatures.some((c) => c.id === preset.giverCreatureId);

    const receiverMissing =
      preset.receiverType === "creature" &&
      !creatures.some((c) => c.id === preset.receiverCreatureId);

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

    const currentPreset = getPresetAtSlot(slot);
    if (!currentPreset) return;

    const targetPreset = getPresetAtSlot(targetSlot);

    setPresets((current) => {
      const updated = current.map((preset) => {
        if (preset.slot === slot) return { ...preset, slot: targetSlot };
        if (preset.slot === targetSlot && targetPreset) return { ...preset, slot };
        return preset;
      });

      return [...updated].sort((a, b) => a.slot - b.slot);
    });

    if (renamingPresetSlot === slot) {
      setRenamingPresetSlot(targetSlot);
    } else if (renamingPresetSlot === targetSlot) {
      setRenamingPresetSlot(slot);
    }

    if (presetOverwriteSlot === slot) {
      setPresetOverwriteSlot(targetSlot);
    } else if (presetOverwriteSlot === targetSlot) {
      setPresetOverwriteSlot(slot);
    }
  }

  function savePresetToSlot(slot: number) {
    if (
      (breedingSelection.giverType !== "player" &&
        breedingSelection.giverCreatureId === null) ||
      (breedingSelection.receiverType !== "player" &&
        breedingSelection.receiverCreatureId === null)
    ) {
      return;
    }

    const trimmedName = presetNameInput.trim();
    const existing = getPresetAtSlot(slot);

    const newPreset: BreedingPreset = {
      slot,
      name:
        trimmedName.length > 0
          ? trimmedName
          : existing?.name ?? `Preset ${slot}`,
      giverType: breedingSelection.giverType,
      giverCreatureId: breedingSelection.giverCreatureId,
      receiverType: breedingSelection.receiverType,
      receiverCreatureId: breedingSelection.receiverCreatureId,
    };

    setPresets((current) => {
      const withoutSlot = current.filter((preset) => preset.slot !== slot);
      return [...withoutSlot, newPreset].sort((a, b) => a.slot - b.slot);
    });

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
      current.map((preset) =>
        preset.slot === slot ? { ...preset, name: trimmed } : preset
      )
    );

    setRenamingPresetSlot(null);
    setRenamePresetInput("");
  }

  function duplicatePreset(slot: number) {
    const preset = getPresetAtSlot(slot);
    if (!preset) return;

    const nextEmpty = getNextEmptyPresetSlot(slot);
    if (nextEmpty === null) return;

    let duplicateName = `${preset.name} Copy`;
    if (duplicateName.length > 32) {
      duplicateName = duplicateName.slice(0, 32);
    }

    const duplicated: BreedingPreset = {
      ...preset,
      slot: nextEmpty,
      name: duplicateName,
    };

    setPresets((current) => [...current, duplicated].sort((a, b) => a.slot - b.slot));
  }

  function getParticipantSnapshot(
    participantType: "player" | "creature",
    creature: typeof giverCreature
  ) {
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

  function getBestTraitEntry(
    traits: CreatureTraitEntry[],
    trait: CreatureTrait
  ): CreatureTraitEntry | null {
    const matches = traits.filter((entry) => entry.trait === trait);
    if (matches.length === 0) return null;

    return matches.reduce((best, current) =>
      getGradeMultiplier(current.grade) > getGradeMultiplier(best.grade)
        ? current
        : best
    );
  }

  function hasTrait(
    participant: { traits: CreatureTraitEntry[] } | null,
    trait: CreatureTrait
  ) {
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

  const giverParticipant = getParticipantSnapshot(
    breedingSelection.giverType,
    giverCreature
  );

  const receiverParticipant = getParticipantSnapshot(
    breedingSelection.receiverType,
    receiverCreature
  );

  const giverLabel = giverParticipant?.label ?? "None";
  const receiverLabel = receiverParticipant?.label ?? "None";

  const sameCreatureSelected =
    breedingSelection.giverType === "creature" &&
    breedingSelection.receiverType === "creature" &&
    breedingSelection.giverCreatureId !== null &&
    breedingSelection.giverCreatureId === breedingSelection.receiverCreatureId;

  function calculateRelationshipRisk(
    leftCreature: typeof giverCreature,
    rightCreature: typeof receiverCreature,
    leftIsPlayer = false,
    rightIsPlayer = false
  ) {
    if (
      leftIsPlayer &&
      rightCreature &&
      (rightCreature.giverIsPlayer || rightCreature.receiverIsPlayer)
    ) {
      return "parent_child";
    }

    if (
      rightIsPlayer &&
      leftCreature &&
      (leftCreature.giverIsPlayer || leftCreature.receiverIsPlayer)
    ) {
      return "parent_child";
    }

    if (!leftCreature || !rightCreature) {
      return "none";
    }

    const isParentChild =
      leftCreature.id === rightCreature.giverId ||
      leftCreature.id === rightCreature.receiverId ||
      rightCreature.id === leftCreature.giverId ||
      rightCreature.id === leftCreature.receiverId;

    if (isParentChild) return "parent_child";

    const sameGiverSide =
      (leftCreature.giverId !== null &&
        leftCreature.giverId === rightCreature.giverId) ||
      (leftCreature.giverIsPlayer && rightCreature.giverIsPlayer);

    const sameReceiverSide =
      (leftCreature.receiverId !== null &&
        leftCreature.receiverId === rightCreature.receiverId) ||
      (leftCreature.receiverIsPlayer && rightCreature.receiverIsPlayer);

    if (sameGiverSide && sameReceiverSide) return "full_sibling";
    if (sameGiverSide || sameReceiverSide) return "half_sibling";

    return "none";
  }

  function isParentChild() {
    return (
      calculateRelationshipRisk(
        giverCreature,
        receiverCreature,
        breedingSelection.giverType === "player",
        breedingSelection.receiverType === "player"
      ) === "parent_child"
    );
  }

  function isFullSibling() {
    return calculateRelationshipRisk(giverCreature, receiverCreature) === "full_sibling";
  }

  function isHalfSibling() {
    return calculateRelationshipRisk(giverCreature, receiverCreature) === "half_sibling";
  }

  function getBreedingMinutes() {
    const speeds = [giverParticipant?.speed, receiverParticipant?.speed].filter(
      (value): value is number => typeof value === "number"
    );

    const avgSpeed =
      speeds.length > 0
        ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length
        : 6;

    const traitBonus =
      getTraitScaledBonus(giverParticipant, "quick", 10) +
      getTraitScaledBonus(receiverParticipant, "quick", 10);

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

    return Math.max(
      6,
      22 - Math.floor(creature.stats.endurance / 2) - sturdyDiscount
    );
  }

  function isCreatureReady(creature: (typeof creatures)[number]) {
    const cost = getCreatureStaminaCost(creature.id) ?? 999;
    return (
      creature.breedingsToday < creature.dailyBreedingLimit &&
      creature.breedingStamina >= cost
    );
  }

  function isFamilySafeCandidate(
    candidate: (typeof creatures)[number],
    role: "giver" | "receiver"
  ) {
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
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness]
      .filter((value): value is number => typeof value === "number");

    if (happinessValues.length === 0) return 60;

    return (
      happinessValues.reduce((sum, value) => sum + value, 0) /
      happinessValues.length
    );
  }

  function getAverageBreedingCare() {
    const skillValues = [
      giverParticipant?.breedingCareLevel,
      receiverParticipant?.breedingCareLevel,
    ].filter((value): value is number => typeof value === "number");

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

    if (avgHappiness < 20) {
      refusalChance += 0.45;
    } else if (avgHappiness < 35) {
      refusalChance += 0.28;
    } else if (avgHappiness < 50) {
      refusalChance += 0.14;
    }

    if (homeState.cleanliness < 25) {
      refusalChance += 0.25;
    } else if (homeState.cleanliness < 50) {
      refusalChance += 0.12;
    }

    if (homeState.foodStock <= 0) {
      refusalChance += 0.15;
    } else if (homeState.foodStock <= 2) {
      refusalChance += 0.06;
    }

    refusalChance -= Math.min(0.12, avgBreedingCare * 0.015);
    refusalChance -= calmReduction;

    return Math.max(0, Math.min(0.75, refusalChance));
  }

  function getEggChanceEstimate() {
    if (breedingSelection.receiverType === "player") {
      return 0;
    }

    const fertilities = [giverParticipant?.fertility, receiverParticipant?.fertility]
      .filter((value): value is number => typeof value === "number");
    const vitalities = [giverParticipant?.vitality, receiverParticipant?.vitality]
      .filter((value): value is number => typeof value === "number");
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness]
      .filter((value): value is number => typeof value === "number");
    const breedingCareValues = [
      giverParticipant?.breedingCareLevel,
      receiverParticipant?.breedingCareLevel,
    ].filter((value): value is number => typeof value === "number");

    const avgFertility =
      fertilities.length > 0
        ? fertilities.reduce((sum, value) => sum + value, 0) / fertilities.length
        : 5;

    const avgVitality =
      vitalities.length > 0
        ? vitalities.reduce((sum, value) => sum + value, 0) / vitalities.length
        : 5;

    const avgHappiness =
      happinessValues.length > 0
        ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length
        : 60;

    const avgBreedingCare =
      breedingCareValues.length > 0
        ? breedingCareValues.reduce((sum, value) => sum + value, 0) / breedingCareValues.length
        : 1;

    const fertileBonus =
      getTraitScaledBonus(giverParticipant, "fertile", 7) / 100 +
      getTraitScaledBonus(receiverParticipant, "fertile", 7) / 100;

    let chance = 0.45;
    chance += (avgFertility - 5) * 0.05;
    chance += (avgVitality - 5) * 0.02;
    chance += (avgHappiness - 50) * 0.003;
    chance += avgBreedingCare * 0.015;
    chance += fertileBonus;

    if (homeState.cleanliness >= 80) {
      chance += 0.08;
    } else if (homeState.cleanliness >= 50) {
      chance += 0.03;
    } else if (homeState.cleanliness < 25) {
      chance -= 0.15;
    } else if (homeState.cleanliness < 50) {
      chance -= 0.07;
    }

    if (homeState.foodStock >= 8) {
      chance += 0.04;
    } else if (homeState.foodStock <= 0) {
      chance -= 0.12;
    } else if (homeState.foodStock <= 2) {
      chance -= 0.05;
    }

    return Math.max(0.1, Math.min(0.95, chance));
  }

  function getEggQualityPreview(): EggQuality {
    const fertilities = [giverParticipant?.fertility, receiverParticipant?.fertility]
      .filter((value): value is number => typeof value === "number");
    const vitalities = [giverParticipant?.vitality, receiverParticipant?.vitality]
      .filter((value): value is number => typeof value === "number");
    const intelligences = [giverParticipant?.intelligence, receiverParticipant?.intelligence]
      .filter((value): value is number => typeof value === "number");
    const happinessValues = [giverParticipant?.happiness, receiverParticipant?.happiness]
      .filter((value): value is number => typeof value === "number");
    const breedingCareValues = [
      giverParticipant?.breedingCareLevel,
      receiverParticipant?.breedingCareLevel,
    ].filter((value): value is number => typeof value === "number");

    const avgFertility =
      fertilities.length > 0
        ? fertilities.reduce((sum, value) => sum + value, 0) / fertilities.length
        : 5;

    const avgVitality =
      vitalities.length > 0
        ? vitalities.reduce((sum, value) => sum + value, 0) / vitalities.length
        : 5;

    const avgIntelligence =
      intelligences.length > 0
        ? intelligences.reduce((sum, value) => sum + value, 0) / intelligences.length
        : 5;

    const avgHappiness =
      happinessValues.length > 0
        ? happinessValues.reduce((sum, value) => sum + value, 0) / happinessValues.length
        : 60;

    const avgBreedingCare =
      breedingCareValues.length > 0
        ? breedingCareValues.reduce((sum, value) => sum + value, 0) / breedingCareValues.length
        : 1;

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
    if (quality === "exceptional") {
      return "bg-purple-100 text-purple-900 border-purple-300";
    }

    if (quality === "strong") {
      return "bg-sky-100 text-sky-900 border-sky-300";
    }

    if (quality === "normal") {
      return "bg-green-100 text-green-900 border-green-300";
    }

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

    if (chance >= 0.4) {
      return "bg-red-100 text-red-900 border-red-300";
    }

    if (chance >= 0.18) {
      return "bg-amber-100 text-amber-900 border-amber-300";
    }

    return "bg-green-100 text-green-900 border-green-300";
  }

  const allBreedableTraits: CreatureTrait[] = ALL_BREEDABLE_TRAITS;

  return (
    <>
      <main className="h-screen overflow-hidden bg-gradient-to-b from-pink-100 to-rose-200 p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-7xl flex-col">
          <h1 className="mb-4 shrink-0 text-3xl font-bold text-rose-900 md:text-4xl">
            💞 Breeding
          </h1>

          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            This is a modularized full replacement file shell that already imports your new helper files.
            Paste this only after you have created:
            - lib/breeding/types.ts
            - lib/breeding/uiHelpers.ts
            - components/breeding/BreedingUiPrimitives.tsx
          </div>
        </div>
      </main>
    </>
  );
}
