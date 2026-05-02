"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useGame } from "@/context/GameContext";
import { ITEM_DATA } from "@/lib/items/itemData";
import { RECIPE_DATA } from "@/lib/cooking/recipeData";
import { CROP_DATA } from "@/lib/farming/cropData";
import {
  CROP_QUALITY_DATA,
  type CropQuality,
} from "@/lib/game/farming";
import {
  FIELD_UPGRADE_DATA,
  FIELD_UPGRADE_ORDER,
  getFieldUpgradeEffects,
  isFieldUpgradeAvailable,
  isFieldUpgradeUnlocked,
  isPlotProtected,
} from "@/lib/game/fieldUpgrades";
import {
  buildFieldWorkSpecializationProfile,
  getFieldActionSpecializationNotes,
  getFieldSpecializationHighlights,
} from "@/lib/game/fieldSpecialization";
import {
  buildQualityIngredientPlan,
  describeQualityIngredientPlan,
  getQualityAdjustedItemEffects,
} from "@/lib/game/cookingQuality";
import {
  getCropSeasonModifier,
  getSeasonInfo,
  getWeatherInfo,
} from "@/lib/game/weather";
import {
  type InventoryCategory,
  getCategoryLabel,
  getInventoryCategory,
  getItemEffectSummary,
} from "@/lib/game/inventoryUi";
import { getCreatureImage } from "@/lib/breeding/uiHelpers";
import {
  getBreedingPairSummary,
  getCreatureBestUseSections,
  getCreatureRoleSummary,
  getCreatureSkillEntries,
  getCreatureStatEntries,
  getCreatureStrengthBadges,
  getCreatureTraitEntries,
} from "@/lib/creatures/creatureDisplay";
import {
  GameActionCard as ActionCard,
  GameCard as RoomCard,
  GameFeedbackBox as ResultFeedbackBox,
  GameModal as OverlayModal,
  GameSectionHeader as RoomHeader,
  GameStatChip as StatChip,
  GameStatusBadge as StatusBadge,
} from "@/components/ui/GameUi";

type RanchTab = "house" | "fields" | "barn" | "nursery" | "breeding";

const TAB_LABELS: Record<RanchTab, string> = {
  house: "House",
  fields: "Fields",
  barn: "Barn",
  nursery: "Nursery",
  breeding: "Breeding",
};

function formatTime(hour: number, minute: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function getMoodLabel(happiness: number) {
  if (happiness >= 85) return "Smug / Thriving";
  if (happiness >= 65) return "Content";
  if (happiness >= 40) return "Restless";
  return "Touchy";
}

function getStaminaPercent(current: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function getPlayerImage() {
  return "/images/player.png";
}

function getParticipantImage(participantName: string) {
  if (participantName === "Player") return getPlayerImage();
  if (participantName === "Horse") return "/images/horse.PNG";
  if (participantName === "Cat") return "/images/cat.png";
  return getCreatureImage(participantName);
}

function getBreedingRoleLabel(role: "giver" | "receiver") {
  return role === "giver" ? "Giver" : "Receiver";
}

function getSimpleBreedingRiskLabel({
  sameCreature,
  giverIsPlayer,
  receiverIsPlayer,
}: {
  sameCreature: boolean;
  giverIsPlayer: boolean;
  receiverIsPlayer: boolean;
}) {
  if (sameCreature) return "Blocked: choose two different creatures.";
  if (giverIsPlayer || receiverIsPlayer) return "Low lineage risk from player pairing.";
  return "Lineage risk is checked from parent records when breeding starts.";
}

function getFieldTraitSummary(
  creature: {
    name: string;
    stats: { strength: number; endurance: number };
    skills: { fieldWork: { level: number } };
    traits: { trait: string; grade: string }[];
  } | null
) {
  if (!creature) return "Pick a creature to see field bonuses.";
  return getFieldSpecializationHighlights(buildFieldWorkSpecializationProfile(creature)).join(" - ");
}

function formatQualityBreakdown(
  itemId: string,
  getQualityItemCount: (itemId: string, quality: CropQuality) => number
) {
  return (Object.keys(CROP_QUALITY_DATA) as CropQuality[])
    .map((quality) => {
      const count = getQualityItemCount(itemId, quality);
      return count > 0 ? `${CROP_QUALITY_DATA[quality].label} x${count}` : null;
    })
    .filter(Boolean)
    .join(" - ");
}

function formatEffectPreview(effects: ReturnType<typeof getQualityAdjustedItemEffects>) {
  if (!effects) return "No edible effects listed.";

  const parts = [
    effects.energyRestore ? `Energy +${effects.energyRestore}` : null,
    effects.staminaRestore ? `Stamina +${effects.staminaRestore}` : null,
    effects.happinessGain ? `Happiness +${effects.happinessGain}` : null,
    effects.breedingRecoveryBoost ? `Breeding recovery +${effects.breedingRecoveryBoost}` : null,
    effects.fertilityBoost ? `Fertility +${effects.fertilityBoost}` : null,
    effects.taskBonus
      ? `${effects.taskBonus.taskType} tasks +${effects.taskBonus.amount} for ${effects.taskBonus.durationTasks}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : "No edible effects listed.";
}

function getHouseCleanPreview(creature: {
  name: string;
  stats: { intelligence: number; speed: number; endurance: number };
  skills: { cleaning: { level: number } };
  breedingStamina: number;
} | null) {
  if (!creature) return null;
  const speciesBonus = creature.name === "Cat" ? 2 : 0;
  const minutesSpent = Math.max(
    8,
    35 - Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level + speciesBonus) / 2)
  );
  const staminaCost = Math.max(
    4,
    12 - Math.floor((creature.stats.endurance + creature.stats.speed) / 6)
  );
  const cleanGain = Math.max(
    6,
    10 + Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level + speciesBonus) / 3)
  );
  return { minutesSpent, staminaCost, cleanGain };
}

function getHouseMealPreview(creature: {
  name: string;
  stats: { intelligence: number; speed: number; endurance: number; vitality: number };
  skills: { cooking: { level: number } };
  breedingStamina: number;
} | null) {
  if (!creature) return null;
  const speciesBonus = creature.name === "Cat" ? 2 : 0;
  const minutesSpent = Math.max(
    12,
    45 - Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level + speciesBonus) / 2)
  );
  const staminaCost = Math.max(
    4,
    14 - Math.floor((creature.stats.endurance + creature.stats.vitality) / 6)
  );
  const foodGain = Math.max(
    1,
    1 + Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cooking.level + speciesBonus) / 8)
  );
  return { minutesSpent, staminaCost, foodGain };
}

function getBarnCarePreview(
  careType: "feed" | "groom" | "recovery",
  creature: {
    stats: { intelligence: number; speed: number; endurance: number; vitality: number };
    skills: { cleaning: { level: number } };
    breedingStamina: number;
  }
) {
  if (careType === "feed") {
    return {
      minutesSpent: Math.max(8, 24 - Math.floor((creature.stats.intelligence + creature.skills.cleaning.level) / 3)),
      staminaCost: Math.max(1, 4),
      outcome: "Consumes 1 food, restores stamina, adds happiness, grants cleaning XP.",
    };
  }

  if (careType === "groom") {
    return {
      minutesSpent: Math.max(12, 36 - Math.floor((creature.stats.intelligence + creature.stats.speed + creature.skills.cleaning.level) / 3)),
      staminaCost: Math.max(2, 8),
      outcome: "Raises happiness, improves home cleanliness, grants cleaning XP.",
    };
  }

  return {
    minutesSpent: Math.max(20, 70 - Math.floor((creature.stats.vitality + creature.stats.endurance) / 2)),
    staminaCost: 0,
    outcome: "Restores breeding stamina and adds a small happiness lift.",
  };
}

function getStrongestSkillLabel(creature: {
  skills: {
    cooking: { level: number; xp: number };
    cleaning: { level: number; xp: number };
    breedingCare: { level: number; xp: number };
    fieldWork: { level: number; xp: number };
    hauling: { level: number; xp: number };
  };
}) {
  const entries = Object.entries(creature.skills).sort((a, b) => b[1].level - a[1].level);
  const [skill, value] = entries[0] ?? ["fieldWork", { level: 1 }];
  const label = skill
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
  return `${label} Lv ${value.level}`;
}

function BreedingParticipantPreview({
  role,
  participant,
}: {
  role: "giver" | "receiver";
  participant:
    | {
        type: "player";
        name: string;
        level: number;
        energy: number;
        happiness: number;
        stats: {
          strength: number;
          endurance: number;
          intelligence: number;
          speed: number;
          fertility: number;
          vitality: number;
        };
      }
    | {
        type: "creature";
        name: string;
        species: string;
        level: number;
        happiness: number;
        breedingStamina: number;
        maxBreedingStamina: number;
        breedingsToday: number;
        dailyBreedingLimit: number;
        stats: {
          strength: number;
          endurance: number;
          intelligence: number;
          speed: number;
          fertility: number;
          vitality: number;
        };
      }
    | null;
}) {
  if (!participant) {
    return (
      <div className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p className="text-xs font-bold uppercase text-stone-500">{getBreedingRoleLabel(role)}</p>
        <p className="mt-2 font-semibold">No participant selected.</p>
      </div>
    );
  }

  const imageSrc =
    participant.type === "player"
      ? getParticipantImage("Player")
      : getParticipantImage(participant.species);
  const staminaLabel =
    participant.type === "player"
      ? `Energy ${participant.energy}`
      : `Stamina ${participant.breedingStamina}/${participant.maxBreedingStamina}`;
  const usageLabel =
    participant.type === "player"
      ? "Player participant"
      : `${participant.breedingsToday}/${participant.dailyBreedingLimit} breedings today`;

  return (
    <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
          <Image
            src={imageSrc}
            alt={participant.name}
            width={160}
            height={160}
            className="max-h-full w-auto object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase text-rose-800">{getBreedingRoleLabel(role)}</p>
          <h4 className="truncate text-xl font-bold text-stone-950">{participant.name}</h4>
          <p className="text-sm font-semibold text-stone-700">
            {participant.type === "player" ? "Player" : participant.species} - Lv {participant.level}
          </p>
          <p className="mt-1 text-xs text-stone-600">{staminaLabel} - {usageLabel}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-700 sm:grid-cols-3">
        <p><strong>STR:</strong> {participant.stats.strength}</p>
        <p><strong>END:</strong> {participant.stats.endurance}</p>
        <p><strong>INT:</strong> {participant.stats.intelligence}</p>
        <p><strong>SPD:</strong> {participant.stats.speed}</p>
        <p><strong>FER:</strong> {participant.stats.fertility}</p>
        <p><strong>VIT:</strong> {participant.stats.vitality}</p>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-rose-700"
          style={{
            width:
              participant.type === "player"
                ? `${Math.max(0, Math.min(100, participant.energy))}%`
                : `${getStaminaPercent(participant.breedingStamina, participant.maxBreedingStamina)}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function RanchOperationsPanel({
  initialTab = "house",
  initialInventoryOpen = false,
}: {
  initialTab?: RanchTab;
  initialInventoryOpen?: boolean;
}) {
  const {
    currentDay,
    currentHour,
    currentMinute,
    currentWeather,
    currentSeason,
    currentLocation,
    playerData,
    homeState,
    creatures,
    eggs,
    breedingSelection,
    inventory,
    produceQualityInventory,
    fieldPlots,
    fieldUpgrades,
    lastFieldAction,
    knownRecipeIds,
    getQualityItemCount,
    cookMeal,
    cookRecipe,
    cleanHome,
    plantCrop,
    waterPlot,
    fertilizePlot,
    harvestPlot,
    purchaseFieldUpgrade,
    breedCreatures,
    setBreedingSelection,
    hatchEgg,
    careForCreature,
    renameCreature,
    roadDispatchUnlocked,
    activeDispatches,
    completedDispatchLog,
  } = useGame();

  const [activeTab, setActiveTab] = useState<RanchTab>(initialTab);
  const [inventoryOpen, setInventoryOpen] = useState(initialInventoryOpen);
  const [selectedCreatureId, setSelectedCreatureId] = useState<number | null>(null);
  const [selectedSeedItemId, setSelectedSeedItemId] = useState<string>("");
  const [selectedFertilizerItemId, setSelectedFertilizerItemId] = useState<string>("");
  const [selectedFieldCreatureId, setSelectedFieldCreatureId] = useState<number | null>(null);
  const [selectedHouseHelperId, setSelectedHouseHelperId] = useState<number | null>(null);
  const [houseFeedback, setHouseFeedback] = useState<string>("");
  const [recipeWorkshopOpen, setRecipeWorkshopOpen] = useState(false);
  const [fieldUpgradesOpen, setFieldUpgradesOpen] = useState(false);
  const [fieldHelperOpen, setFieldHelperOpen] = useState(false);
  const [weatherSeasonOpen, setWeatherSeasonOpen] = useState(false);
  const [barnFeedback, setBarnFeedback] = useState<string>("");
  const [nurseryFeedback, setNurseryFeedback] = useState<string>("");
  const [breedingFeedback, setBreedingFeedback] = useState<string>("");
  const [renameInput, setRenameInput] = useState<string>("");

  const ownedSeedEntries = useMemo(() => {
    return Object.entries(inventory)
      .filter(([itemId, count]) => itemId.endsWith("_seed") && count > 0)
      .map(([itemId, count]) => ({
        itemId,
        count,
        item: ITEM_DATA[itemId],
      }))
      .filter((entry) => entry.item);
  }, [inventory]);

  const ownedFertilizerEntries = useMemo(() => {
    return Object.entries(inventory)
      .filter(([itemId, count]) => (ITEM_DATA[itemId]?.useTags.includes("fertilizer") ?? false) && count > 0)
      .map(([itemId, count]) => ({
        itemId,
        count,
        item: ITEM_DATA[itemId],
      }));
  }, [inventory]);

  const inventoryEntries = useMemo(() => {
    return Object.entries(inventory)
      .filter(([, count]) => count > 0)
      .map(([itemId, count]) => ({
        itemId,
        count,
        item: ITEM_DATA[itemId],
        category: getInventoryCategory(itemId),
      }))
      .sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId);
      });
  }, [inventory]);

  const inventoryGroups = useMemo(() => {
    return {
      seeds: inventoryEntries.filter((entry) => entry.category === "seeds"),
      ingredients: inventoryEntries.filter((entry) => entry.category === "ingredients"),
      food: inventoryEntries.filter((entry) => entry.category === "food"),
      books: inventoryEntries.filter((entry) => entry.category === "books"),
      other: inventoryEntries.filter((entry) => entry.category === "other"),
    };
  }, [inventoryEntries]);

  const knownRecipes = useMemo(() => {
    return knownRecipeIds
      .map((recipeId) => RECIPE_DATA[recipeId])
      .filter(Boolean)
      .map((recipe) => {
        const ingredientPlan = buildQualityIngredientPlan(
          produceQualityInventory,
          inventory,
          recipe.ingredients
        );
        const craftable = ingredientPlan !== null;
        const outputQuality = ingredientPlan?.outputQuality ?? "standard";
        const outputEffects = getQualityAdjustedItemEffects(
          ITEM_DATA[recipe.outputItemId]?.edibleEffects,
          outputQuality
        );

        return {
          ...recipe,
          craftable,
          ingredientPlan,
          outputQuality,
          outputEffects,
          outputItem: ITEM_DATA[recipe.outputItemId],
        };
      });
  }, [knownRecipeIds, produceQualityInventory, inventory]);

  const firstCreature = creatures[0] ?? null;
  const houseHelper =
    creatures.find((creature) => creature.id === selectedHouseHelperId) ??
    firstCreature;
  const houseCleanPreview = getHouseCleanPreview(houseHelper);
  const houseMealPreview = getHouseMealPreview(houseHelper);
  const hasMealWheat = homeState.wheatStock > 0 || (inventory.wheat ?? 0) > 0;
  const selectedSeedEntry =
    ownedSeedEntries.find((entry) => entry.itemId === selectedSeedItemId) ??
    ownedSeedEntries[0] ??
    null;
  const selectedFertilizerEntry =
    ownedFertilizerEntries.find((entry) => entry.itemId === selectedFertilizerItemId) ??
    ownedFertilizerEntries[0] ??
    null;
  const fieldCreature =
    creatures.find((creature) => creature.id === selectedFieldCreatureId) ??
    firstCreature;
  const fieldSpecialization = fieldCreature
    ? buildFieldWorkSpecializationProfile(fieldCreature)
    : null;
  const weatherInfo = getWeatherInfo(currentWeather);
  const seasonInfo = getSeasonInfo(currentSeason);
  const fieldUpgradeEffects = getFieldUpgradeEffects(fieldUpgrades);
  const growingPlotCount = fieldPlots.filter((plot) => plot.cropId && plot.daysRemaining > 0).length;
  const readyPlotCount = fieldPlots.filter((plot) => plot.cropId && plot.daysRemaining <= 0).length;
  const fineOrBetterPlotCount = fieldPlots.filter(
    (plot) => plot.cropId && plot.quality !== "standard"
  ).length;
  const selectedCreature =
    creatures.find((creature) => creature.id === selectedCreatureId) ?? null;
  const ranchActionLocationAllowed = currentLocation === "home" || currentLocation === "ranch";
  const giverCreature =
    breedingSelection.giverType === "creature"
      ? creatures.find((creature) => creature.id === breedingSelection.giverCreatureId) ?? null
      : null;
  const receiverCreature =
    breedingSelection.receiverType === "creature"
      ? creatures.find((creature) => creature.id === breedingSelection.receiverCreatureId) ?? null
      : null;
  const giverParticipant =
    breedingSelection.giverType === "player"
      ? {
          type: "player" as const,
          name: playerData.name,
          level: playerData.level,
          energy: playerData.energy,
          happiness: playerData.happiness,
          stats: playerData.stats,
        }
      : giverCreature
        ? {
            type: "creature" as const,
            name: giverCreature.nickname,
            species: giverCreature.name,
            level: giverCreature.level,
            happiness: giverCreature.happiness,
            breedingStamina: giverCreature.breedingStamina,
            maxBreedingStamina: giverCreature.maxBreedingStamina,
            breedingsToday: giverCreature.breedingsToday,
            dailyBreedingLimit: giverCreature.dailyBreedingLimit,
            stats: giverCreature.stats,
          }
        : null;
  const receiverParticipant =
    breedingSelection.receiverType === "player"
      ? {
          type: "player" as const,
          name: playerData.name,
          level: playerData.level,
          energy: playerData.energy,
          happiness: playerData.happiness,
          stats: playerData.stats,
        }
      : receiverCreature
        ? {
            type: "creature" as const,
            name: receiverCreature.nickname,
            species: receiverCreature.name,
            level: receiverCreature.level,
            happiness: receiverCreature.happiness,
            breedingStamina: receiverCreature.breedingStamina,
            maxBreedingStamina: receiverCreature.maxBreedingStamina,
            breedingsToday: receiverCreature.breedingsToday,
            dailyBreedingLimit: receiverCreature.dailyBreedingLimit,
            stats: receiverCreature.stats,
          }
        : null;
  const breedingSameCreature =
    breedingSelection.giverType === "creature" &&
    breedingSelection.receiverType === "creature" &&
    breedingSelection.giverCreatureId !== null &&
    breedingSelection.giverCreatureId === breedingSelection.receiverCreatureId;
  const breedingEnergyCost = 8;
  const giverUnavailableReason = giverParticipant?.type === "creature"
    ? giverParticipant.breedingsToday >= giverParticipant.dailyBreedingLimit
      ? `${giverParticipant.name} has reached today's breeding limit.`
      : giverParticipant.breedingStamina <= 0
        ? `${giverParticipant.name} needs recovery before breeding.`
        : ""
    : "";
  const receiverUnavailableReason = receiverParticipant?.type === "creature"
    ? receiverParticipant.breedingsToday >= receiverParticipant.dailyBreedingLimit
      ? `${receiverParticipant.name} has reached today's breeding limit.`
      : receiverParticipant.breedingStamina <= 0
        ? `${receiverParticipant.name} needs recovery before breeding.`
        : ""
    : "";
  const breedingCanPerform =
    Boolean(giverParticipant && receiverParticipant) &&
    !breedingSameCreature &&
    playerData.energy >= breedingEnergyCost &&
    !giverUnavailableReason &&
    !receiverUnavailableReason;
  const breedingDisabledReason = !giverParticipant || !receiverParticipant
    ? "Select a giver and receiver."
    : breedingSameCreature
      ? "Choose two different creatures."
      : playerData.energy < breedingEnergyCost
        ? `Need ${breedingEnergyCost} player energy.`
        : giverUnavailableReason || receiverUnavailableReason;
  const breedingPairSummary = getBreedingPairSummary(
    breedingSelection.giverType === "player" ? { name: playerData.name, stats: playerData.stats } : giverCreature,
    breedingSelection.receiverType === "player" ? { name: playerData.name, stats: playerData.stats } : receiverCreature
  );

  return (
    <>
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border-4 border-emerald-900 bg-white/90 p-3 shadow-xl sm:p-4">
        <div className="mb-3 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emerald-950 sm:text-3xl">Ranch Operations</h2>
            <p className="text-sm text-stone-600">
              Central ranch hub for chores, field work, creatures, eggs, breeding, inventory, and recipe crafting.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Day / Time</p>
              <p className="font-semibold text-stone-900">
                Day {currentDay} • {formatTime(currentHour, currentMinute)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Energy</p>
              <p className="font-semibold text-stone-900">{playerData.energy}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Cleanliness</p>
              <p className="font-semibold text-stone-900">{homeState.cleanliness}/100</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm">
              <p className="text-stone-500">Food / Wheat</p>
              <p className="font-semibold text-stone-900">
                {homeState.foodStock} / {homeState.wheatStock}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-3 hidden shrink-0 flex-wrap gap-2 md:flex">
          <StatChip label="Inventory Entries" value={Object.keys(inventory).length} />
          <StatChip label="Seed Types" value={ownedSeedEntries.length} />
          <StatChip label="Known Recipes" value={knownRecipes.length} />
          <StatChip label="Eggs" value={eggs.length} />
        </div>

        <div className="mb-3 flex shrink-0 flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as RanchTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab
                  ? "bg-emerald-700 text-white"
                  : "border border-emerald-300 bg-white text-stone-800"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {activeTab === "house" && (
          <div className="space-y-4">
            <RoomHeader
              eyebrow="House"
              title="Home Care"
              description="Pick a helper, handle warm little upkeep chores, and keep recipe crafting tucked into the workshop."
            >
              <button
                type="button"
                onClick={() => setRecipeWorkshopOpen(true)}
                className="min-h-11 w-full rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow sm:w-auto"
              >
                Recipe Workshop
              </button>
            </RoomHeader>

            <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
                <label className="block text-sm font-bold text-stone-900">
                  Selected Helper
                  <select
                    value={houseHelper?.id ?? ""}
                    onChange={(event) => setSelectedHouseHelperId(Number(event.target.value))}
                    className="mt-2 min-h-11 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm"
                  >
                    {creatures.length === 0 ? (
                      <option value="">No helper available</option>
                    ) : (
                      creatures.map((creature) => (
                        <option key={creature.id} value={creature.id}>
                          {creature.nickname} - {creature.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                {houseHelper ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex gap-3">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                        <Image
                          src={getCreatureImage(houseHelper.name)}
                          alt={houseHelper.nickname}
                          width={160}
                          height={160}
                          className="max-h-full w-auto object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xl font-bold text-stone-950">{houseHelper.nickname}</p>
                        <p className="text-sm font-semibold text-stone-700">
                          {houseHelper.name} - {getMoodLabel(houseHelper.happiness)}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          Stamina {houseHelper.breedingStamina}/{houseHelper.maxBreedingStamina}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          Cooking Lv {houseHelper.skills.cooking.level} - Cleaning Lv {houseHelper.skills.cleaning.level}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                    No creature is available for house care yet.
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2">
                    <p className="text-stone-500">Clean</p>
                    <p className="font-bold text-stone-900">{homeState.cleanliness}/100</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2">
                    <p className="text-stone-500">Food</p>
                    <p className="font-bold text-stone-900">{homeState.foodStock}</p>
                  </div>
                  <div className="rounded-2xl bg-lime-50 px-3 py-2">
                    <p className="text-stone-500">Wheat</p>
                    <p className="font-bold text-stone-900">{homeState.wheatStock + (inventory.wheat ?? 0)}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ActionCard
                  title="Clean House"
                  performer={houseHelper ? houseHelper.nickname : "No helper selected"}
                  cost={houseCleanPreview ? `${houseCleanPreview.minutesSpent} min, about ${houseCleanPreview.staminaCost} stamina` : "Needs a helper"}
                  outcome={houseCleanPreview ? `Cleanliness +${houseCleanPreview.cleanGain}, Cleaning XP` : "Raises cleanliness"}
                  disabledReason={
                    !houseHelper
                      ? "Choose a helper creature."
                      : !ranchActionLocationAllowed
                        ? "Return home or to the ranch through in-world travel."
                        : houseCleanPreview && houseHelper.breedingStamina < houseCleanPreview.staminaCost
                          ? `${houseHelper.nickname} needs more stamina.`
                          : ""
                  }
                  buttonLabel="Clean House"
                  onAction={() => {
                    if (!houseHelper) return;
                    cleanHome(houseHelper.id);
                    setHouseFeedback(`${houseHelper.nickname} cleaned the house until the place felt soft, bright, and thoroughly cared for.`);
                  }}
                  tone="emerald"
                />

                <ActionCard
                  title="Prepare Simple Meal"
                  performer={houseHelper ? houseHelper.nickname : "No helper selected"}
                  cost={houseMealPreview ? `1 wheat, ${houseMealPreview.minutesSpent} min, about ${houseMealPreview.staminaCost} stamina` : "Needs a helper and wheat"}
                  outcome={houseMealPreview ? `Food stock +${houseMealPreview.foodGain}, Cooking XP` : "Adds food stock"}
                  disabledReason={
                    !houseHelper
                      ? "Choose a helper creature."
                      : !ranchActionLocationAllowed
                        ? "Return home or to the ranch through in-world travel."
                        : !hasMealWheat
                          ? "Needs wheat in home stores or inventory."
                          : houseMealPreview && houseHelper.breedingStamina < houseMealPreview.staminaCost
                            ? `${houseHelper.nickname} needs more stamina.`
                            : ""
                  }
                  buttonLabel="Prepare Meal"
                  onAction={() => {
                    if (!houseHelper) return;
                    cookMeal(houseHelper.id);
                    setHouseFeedback(`${houseHelper.nickname} prepared a simple meal for the ranch stores, warm enough to make everyone linger near the kitchen.`);
                  }}
                  tone="amber"
                />

                <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm md:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-rose-950">Recipe Workshop</p>
                      <p className="mt-1 text-sm text-stone-700">
                        {knownRecipes.length} known recipe(s). Crafting uses the selected recipe and the helper you choose inside the workshop.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecipeWorkshopOpen(true)}
                      className="min-h-11 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow"
                    >
                      Open Workshop
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ResultFeedbackBox message={houseFeedback} />
          </div>
        )}

        {activeTab === "fields" && (
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">Field Work</p>
              <p className="mt-2 text-sm text-stone-600">
                Plant owned seeds, wait out the day countdown, then harvest produce into inventory.
              </p>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-semibold text-stone-800">
                  Seed
                  <select
                    value={selectedSeedEntry?.itemId ?? ""}
                    onChange={(event) => setSelectedSeedItemId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-stone-800"
                  >
                    {ownedSeedEntries.length === 0 ? (
                      <option value="">No seeds owned</option>
                    ) : (
                      ownedSeedEntries.map((entry) => (
                        <option key={entry.itemId} value={entry.itemId}>
                          {entry.item?.name ?? entry.itemId} x{entry.count}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-stone-800">
                  Creature
                  <select
                    value={fieldCreature?.id ?? ""}
                    onChange={(event) => setSelectedFieldCreatureId(Number(event.target.value))}
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-stone-800"
                  >
                    {creatures.map((creature) => (
                      <option key={creature.id} value={creature.id}>
                        {creature.nickname} - Stamina {creature.breedingStamina}/{creature.maxBreedingStamina} - Field Lv {creature.skills.fieldWork.level}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-semibold text-stone-800">
                  Fertilizer
                  <select
                    value={selectedFertilizerEntry?.itemId ?? ""}
                    onChange={(event) => setSelectedFertilizerItemId(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm text-stone-800"
                  >
                    {ownedFertilizerEntries.length === 0 ? (
                      <option value="">No fertilizer owned</option>
                    ) : (
                      ownedFertilizerEntries.map((entry) => (
                        <option key={entry.itemId} value={entry.itemId}>
                          {entry.item?.name ?? entry.itemId} x{entry.count}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-stone-700">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-emerald-950">Helper Influence</p>
                      <p className="mt-1">{getFieldTraitSummary(fieldCreature)}</p>
                      {fieldCreature ? (
                        <p className="mt-1 text-xs text-stone-600">
                          Helper: {fieldCreature.nickname} - Stamina {fieldCreature.breedingStamina}/{fieldCreature.maxBreedingStamina} - Field Lv {fieldCreature.skills.fieldWork.level}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFieldHelperOpen(true)}
                      className="min-h-11 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-950 shadow"
                    >
                      Helper Details
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-stone-700 lg:grid-cols-2">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
                    <p className="font-semibold text-sky-950">Today&apos;s Weather: {weatherInfo.label}</p>
                    <p className="mt-1 text-xs font-semibold text-sky-900">
                      {weatherInfo.fieldNote}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="font-semibold text-amber-950">Season: {seasonInfo.label}</p>
                    <p className="mt-1 text-xs font-semibold text-amber-900">
                      {seasonInfo.fieldNote}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWeatherSeasonOpen(true)}
                  className="min-h-11 rounded-xl border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-950 shadow"
                >
                  Weather & Season Details
                </button>

                <div className="grid gap-2 text-sm text-stone-700 sm:grid-cols-4">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2">
                    <p className="text-stone-500">Empty</p>
                    <p className="font-bold text-stone-900">{fieldPlots.length - growingPlotCount - readyPlotCount}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-3 py-2">
                    <p className="text-stone-500">Growing</p>
                    <p className="font-bold text-stone-900">{growingPlotCount}</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 px-3 py-2">
                    <p className="text-stone-500">Ready</p>
                    <p className="font-bold text-stone-900">{readyPlotCount}</p>
                  </div>
                  <div className="rounded-2xl bg-lime-50 px-3 py-2">
                    <p className="text-stone-500">Fine+</p>
                    <p className="font-bold text-stone-900">{fineOrBetterPlotCount}</p>
                  </div>
                </div>

                {currentLocation !== "home" && currentLocation !== "ranch" ? (
                  <div className="rounded-2xl border border-stone-300 bg-stone-50 p-3 text-sm text-stone-600">
                    Return home or to the ranch before field work.
                  </div>
                ) : null}

                {lastFieldAction ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-stone-700">
                    <p className="font-semibold text-rose-950">{lastFieldAction.message}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {lastFieldAction.details.join(" - ")}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-sky-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">Field Upgrades</p>
              <p className="mt-2 text-sm text-stone-600">
                Upgrade purchasing and long descriptions live in the field shop panel.
              </p>

              <div className="mt-4 grid gap-2 text-sm text-stone-700 sm:grid-cols-3">
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <p className="text-stone-500">Unlocked Plots</p>
                  <p className="font-bold text-stone-900">{fieldUpgradeEffects.unlockedPlotCount}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <p className="text-stone-500">Water Tool</p>
                  <p className="font-bold text-stone-900">Lv {fieldUpgradeEffects.wateringToolLevel}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                  <p className="text-stone-500">Protected</p>
                  <p className="font-bold text-stone-900">{fieldUpgradeEffects.protectedPlotCount} plot(s)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFieldUpgradesOpen(true)}
                className="mt-4 min-h-11 w-full rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow"
              >
                Open Field Upgrades
              </button>
            </div>

            <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 shadow">
              <p className="text-xl font-bold text-stone-900">Owned Seeds</p>
              <p className="mt-2 text-sm text-stone-600">
                Seeds bought from Maris can be planted in any empty plot.
              </p>

              <div className="mt-4 space-y-3">
                {ownedSeedEntries.length === 0 ? (
                  <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                    No seeds owned yet. Visit Maris in Town to stock up.
                  </div>
                ) : (
                  ownedSeedEntries.map((entry) => {
                    const cropId = entry.item?.seedData?.cropId;
                    const seasonModifier = getCropSeasonModifier(cropId, currentSeason);

                    return (
                    <div
                      key={entry.itemId}
                      className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-stone-900">{entry.item?.name}</p>
                          <p className="text-sm text-stone-600">{entry.item?.description}</p>
                          <p className="mt-2 text-xs text-stone-700">
                            Grow Time: {entry.item?.seedData?.growDays ?? "?"} day(s) • Yield{" "}
                            {entry.item?.seedData?.minYield ?? "?"}–{entry.item?.seedData?.maxYield ?? "?"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-amber-900">
                            {seasonModifier.label}: {seasonModifier.note}
                          </p>
                        </div>

                        <div className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                          Owned: {entry.count}
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 border-t border-amber-200 pt-4">
                <p className="text-lg font-bold text-stone-900">Fertilizer</p>
                <div className="mt-3 space-y-3">
                  {ownedFertilizerEntries.length === 0 ? (
                    <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                      No fertilizer in the shed. Maris sells soil boosters with her seed stock.
                    </div>
                  ) : (
                    ownedFertilizerEntries.map((entry) => (
                      <button
                        key={entry.itemId}
                        type="button"
                        onClick={() => setSelectedFertilizerItemId(entry.itemId)}
                        className={`w-full rounded-2xl border p-4 text-left shadow-sm ${
                          selectedFertilizerEntry?.itemId === entry.itemId
                            ? "border-lime-500 bg-lime-100"
                            : "border-lime-200 bg-lime-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-stone-900">{entry.item?.name}</p>
                            <p className="text-sm text-stone-600">{entry.item?.description}</p>
                            <p className="mt-2 text-xs text-stone-700">
                              Quality +{entry.item?.fertilizerData?.qualityBonus ?? "?"} - Yield +{entry.item?.fertilizerData?.yieldBonus ?? "?"}
                            </p>
                          </div>

                          <div className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs font-semibold text-lime-900">
                            x{entry.count}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Link
                  href="/town"
                  className="inline-block rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow"
                >
                  Visit Maris for More Seeds
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-lime-200 bg-white p-4 shadow xl:col-span-2">
              <p className="text-xl font-bold text-stone-900">Crop Plots</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fieldPlots.map((plot) => {
                  const crop = plot.cropId ? CROP_DATA[plot.cropId] : null;
                  const produceItem = crop ? ITEM_DATA[crop.produceItemId] : null;
                  const isReady = Boolean(plot.cropId && plot.daysRemaining <= 0);
                  const qualityInfo = CROP_QUALITY_DATA[plot.quality];
                  const seasonModifier = getCropSeasonModifier(plot.cropId, currentSeason);
                  const protectedPlot = isPlotProtected(plot.id, fieldUpgradeEffects);
                  const canPlant =
                    !plot.cropId &&
                    Boolean(selectedSeedEntry && fieldCreature) &&
                    (currentLocation === "home" || currentLocation === "ranch");
                  const canWater =
                    Boolean(plot.cropId) &&
                    plot.daysRemaining > 0 &&
                    !plot.wateredToday &&
                    !weatherInfo.autoWaters &&
                    Boolean(fieldCreature) &&
                    (currentLocation === "home" || currentLocation === "ranch");
                  const canFertilize =
                    Boolean(plot.cropId) &&
                    plot.daysRemaining > 0 &&
                    !plot.fertilizerItemId &&
                    Boolean(selectedFertilizerEntry && fieldCreature) &&
                    (currentLocation === "home" || currentLocation === "ranch");
                  const canHarvest =
                    isReady &&
                    Boolean(fieldCreature) &&
                    (currentLocation === "home" || currentLocation === "ranch");

                  return (
                    <div
                      key={plot.id}
                      className={`rounded-2xl border-2 p-4 shadow ${
                        isReady
                          ? "border-rose-300 bg-rose-50"
                          : plot.cropId
                          ? "border-amber-300 bg-amber-50"
                          : "border-emerald-200 bg-emerald-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-stone-900">Plot {plot.id}</p>
                          <p className="text-sm text-stone-600">
                            {crop ? crop.name : "Empty soil"}{protectedPlot ? " - Protected" : ""}
                          </p>
                        </div>
                        <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                          {isReady ? "Ready" : plot.cropId ? `${plot.daysRemaining} day(s)` : "Open"}
                        </div>
                      </div>

                      {crop ? (
                        <div className="mt-3 space-y-1 text-sm text-stone-700">
                          <p>{crop.description}</p>
                          <p>
                            Harvest: {plot.minYield}-{plot.maxYield} {produceItem?.name ?? crop.produceItemId}
                          </p>
                          <p>
                            Quality: {qualityInfo.label} - {qualityInfo.description}
                          </p>
                          <p>
                            Season Fit: {seasonModifier.label} - {seasonModifier.note}
                          </p>
                          <p>
                            Watered {plot.wateredDays} time(s){plot.wateredToday ? " - watered today" : ""}.
                          </p>
                          <p>
                            Weather: {weatherInfo.autoWaters ? "Rain covers watering today" : weatherInfo.fieldNote}
                          </p>
                          {protectedPlot ? (
                            <p className="font-semibold text-sky-900">
                              Protection: greenhouse cover softens negative weather and adds a small quality cushion.
                            </p>
                          ) : null}
                          <p>
                            Fertilizer: {plot.fertilizerItemId ? ITEM_DATA[plot.fertilizerItemId]?.name ?? plot.fertilizerItemId : "None"}
                          </p>
                          <p>Planted Day {plot.plantedDay ?? "?"}</p>
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-stone-700">
                          {selectedSeedEntry ? (
                            <p>Ready for {selectedSeedEntry.item?.name ?? selectedSeedEntry.itemId}.</p>
                          ) : (
                            <p>Buy seeds in Town to start a crop here.</p>
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        {plot.cropId ? (
                          <div className="grid gap-2">
                            <button
                              type="button"
                              disabled={!canWater}
                              onClick={() => {
                                if (fieldCreature) waterPlot(plot.id, fieldCreature.id);
                              }}
                              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                                canWater ? "bg-sky-700" : "bg-stone-400"
                              }`}
                            >
                              {weatherInfo.autoWaters ? "Weather Watering" : plot.wateredToday ? "Watered Today" : "Water"}
                            </button>
                            <button
                              type="button"
                              disabled={!canFertilize}
                              onClick={() => {
                                if (selectedFertilizerEntry && fieldCreature) {
                                  fertilizePlot(plot.id, selectedFertilizerEntry.itemId, fieldCreature.id);
                                }
                              }}
                              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                                canFertilize ? "bg-lime-700" : "bg-stone-400"
                              }`}
                            >
                              {plot.fertilizerItemId ? "Fertilized" : "Fertilize"}
                            </button>
                            <button
                              type="button"
                              disabled={!canHarvest}
                              onClick={() => {
                                if (fieldCreature) harvestPlot(plot.id, fieldCreature.id);
                              }}
                              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                                canHarvest ? "bg-rose-700" : "bg-stone-400"
                              }`}
                            >
                              {isReady ? "Harvest" : "Growing"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!canPlant}
                            onClick={() => {
                              if (selectedSeedEntry && fieldCreature) {
                                plantCrop(plot.id, selectedSeedEntry.itemId, fieldCreature.id);
                              }
                            }}
                            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow ${
                              canPlant ? "bg-emerald-700" : "bg-stone-400"
                            }`}
                          >
                            Plant
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "barn" && (
          <div className="space-y-4">
            <RoomHeader
              eyebrow="Barn"
              title="Creature Care"
              description={`${creatures.length} creature(s) live here. Feed, groom, recover, or open a focused card without stretching the whole ranch room.`}
            />

            <ResultFeedbackBox message={barnFeedback} />

            <RoomCard tone={roadDispatchUnlocked ? "teal" : "stone"} className="shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-stone-950">Road Dispatch</h3>
                    <StatusBadge tone={roadDispatchUnlocked ? "emerald" : "stone"}>
                      {roadDispatchUnlocked ? "Unlocked" : "Locked"}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-stone-700">
                    {roadDispatchUnlocked
                      ? "Assign creatures to Brindlewood Road jobs from the Regions screen. The barn keeps the crew count visible here."
                      : "Complete Road Work on Brindlewood Road to unlock creature dispatch assignments."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatChip label="Active" value={activeDispatches.length} />
                    <StatChip label="Completed" value={completedDispatchLog.length} />
                  </div>
                </div>
                <Link
                  href="/regions"
                  className="min-h-11 rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white shadow"
                >
                  Open Regions
                </Link>
              </div>
            </RoomCard>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {creatures.map((creature) => {
                const staminaPct = getStaminaPercent(
                  creature.breedingStamina,
                  creature.maxBreedingStamina
                );
                const feedPreview = getBarnCarePreview("feed", creature);
                const groomPreview = getBarnCarePreview("groom", creature);
                const locationDisabledReason = ranchActionLocationAllowed
                  ? ""
                  : "Return home or to the ranch through in-world travel.";

                return (
                  <div
                    key={creature.id}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                        <Image
                          src={getCreatureImage(creature.name)}
                          alt={creature.nickname}
                          width={140}
                          height={140}
                          className="max-h-full w-auto object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold text-stone-900">{creature.nickname}</p>
                        <p className="text-sm text-stone-600">
                          {creature.name} • Lv {creature.level}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-900">
                          {getStrongestSkillLabel(creature)}
                        </p>
                        <div className="mt-2 w-fit rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
                          {getMoodLabel(creature.happiness)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-stone-700">
                          <span>Stamina</span>
                          <span>
                            {creature.breedingStamina}/{creature.maxBreedingStamina}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-stone-200">
                          <div
                            className="h-3 rounded-full bg-emerald-600"
                            style={{ width: `${staminaPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-stone-700">
                        <p><strong>Happiness:</strong> {creature.happiness}</p>
                        <p><strong>Generation:</strong> {creature.generation}</p>
                        <p><strong>Feed:</strong> 1 food, ~{feedPreview.minutesSpent} min</p>
                        <p><strong>Groom:</strong> ~{groomPreview.staminaCost} stamina</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {(["feed", "groom", "recovery"] as const).map((careType) => {
                        const preview = getBarnCarePreview(careType, creature);
                        const disabledReason =
                          locationDisabledReason ||
                          (careType === "feed" && homeState.foodStock < 1
                            ? "Need food stock."
                            : careType !== "recovery" && creature.breedingStamina < preview.staminaCost
                              ? "Needs stamina."
                              : "");
                        const label = careType === "feed" ? "Feed" : careType === "groom" ? "Groom" : "Recovery";

                        return (
                          <button
                            key={`${creature.id}-${careType}`}
                            type="button"
                            title={disabledReason || `${preview.minutesSpent} min. ${preview.outcome}`}
                            disabled={Boolean(disabledReason)}
                            onClick={() => {
                              careForCreature(creature.id, careType);
                              setBarnFeedback(`${creature.nickname} received ${label.toLowerCase()} care. ${preview.outcome}`);
                            }}
                            className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow ${
                              disabledReason ? "bg-stone-400" : "bg-emerald-700"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setRenameInput(creature.nickname);
                          setSelectedCreatureId(creature.id);
                        }}
                        className="min-h-11 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-950 shadow"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "nursery" && (
          <div className="space-y-4">
            <RoomHeader
              eyebrow="Nursery"
              title="Egg Care"
              description={`${eggs.length} egg(s) resting in the nursery. Ready eggs can hatch here; future nursery risks stay quiet until a later systems pass.`}
            />

            <ResultFeedbackBox message={nurseryFeedback} />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {eggs.length === 0 ? (
                <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                  No eggs are resting here yet.
                </div>
              ) : (
                eggs.map((egg) => {
                  const ready = egg.hatchDaysRemaining <= 0;
                  return (
                    <div
                      key={egg.id}
                      className={`rounded-2xl border-2 p-4 shadow ${ready ? "border-rose-300 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-stone-900">{egg.name}</p>
                          <p className="text-sm text-stone-600">Parents: {egg.parents}</p>
                        </div>
                        <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                          {ready ? "Ready" : `${egg.hatchDaysRemaining} day(s)`}
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-700">
                        <p><strong>Quality:</strong> {egg.quality ?? "normal"}</p>
                        <p><strong>Family Risk:</strong> {egg.inbreedingRisk ?? "checked"}</p>
                        <p><strong>Giver:</strong> {egg.giver}</p>
                        <p><strong>Receiver:</strong> {egg.receiver}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!ready}
                        onClick={() => {
                          const hatched = hatchEgg(egg.id);
                          setNurseryFeedback(
                            hatched
                              ? `${hatched.nickname} hatched from ${egg.name}. The nursery just got a very bright new heartbeat.`
                              : `${egg.name} is not ready to hatch yet.`
                          );
                        }}
                        className={`mt-4 min-h-11 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow ${
                          ready ? "bg-rose-700" : "bg-stone-400"
                        }`}
                      >
                        {ready ? "Hatch Egg" : "Still Growing"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "breeding" && (
          <div className="rounded-2xl border-2 border-emerald-200 bg-white p-4 shadow">
            <p className="text-xl font-bold text-stone-900">Breeding</p>
            <p className="mt-2 text-sm text-stone-600">
              Pair a giver and receiver here. This ranch tab is the main breeding workspace.
            </p>

            <div className="mt-4">
              <ResultFeedbackBox message={breedingFeedback} />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <label className="block text-sm font-bold text-stone-900">
                  Giver Type
                  <select
                    value={breedingSelection.giverType}
                    onChange={(event) =>
                      setBreedingSelection({
                        ...breedingSelection,
                        giverType: event.target.value as "player" | "creature",
                        giverCreatureId:
                          event.target.value === "creature"
                            ? breedingSelection.giverCreatureId ?? creatures[0]?.id ?? null
                            : null,
                      })
                    }
                    className="mt-1 min-h-11 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="player">Player</option>
                    <option value="creature">Creature</option>
                  </select>
                </label>
                {breedingSelection.giverType === "creature" ? (
                  <label className="mt-3 block text-sm font-bold text-stone-900">
                    Giver
                    <select
                      value={breedingSelection.giverCreatureId ?? ""}
                      onChange={(event) =>
                        setBreedingSelection({
                          ...breedingSelection,
                          giverType: "creature",
                          giverCreatureId: Number(event.target.value),
                        })
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                    >
                      {creatures.map((creature) => (
                        <option key={`giver-${creature.id}`} value={creature.id}>
                          {creature.nickname} - {creature.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                <label className="block text-sm font-bold text-stone-900">
                  Receiver Type
                  <select
                    value={breedingSelection.receiverType}
                    onChange={(event) =>
                      setBreedingSelection({
                        ...breedingSelection,
                        receiverType: event.target.value as "player" | "creature",
                        receiverCreatureId:
                          event.target.value === "creature"
                            ? breedingSelection.receiverCreatureId ?? creatures[0]?.id ?? null
                            : null,
                      })
                    }
                    className="mt-1 min-h-11 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="player">Player</option>
                    <option value="creature">Creature</option>
                  </select>
                </label>
                {breedingSelection.receiverType === "creature" ? (
                  <label className="mt-3 block text-sm font-bold text-stone-900">
                    Receiver
                    <select
                      value={breedingSelection.receiverCreatureId ?? ""}
                      onChange={(event) =>
                        setBreedingSelection({
                          ...breedingSelection,
                          receiverType: "creature",
                          receiverCreatureId: Number(event.target.value),
                        })
                      }
                      className="mt-1 min-h-11 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm"
                    >
                      {creatures.map((creature) => (
                        <option key={`receiver-${creature.id}`} value={creature.id}>
                          {creature.nickname} - {creature.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <BreedingParticipantPreview role="giver" participant={giverParticipant} />
              <BreedingParticipantPreview role="receiver" participant={receiverParticipant} />
            </div>

            <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
              <p className="font-bold text-rose-950">Pair Preview</p>
              <p className="mt-1">
                {giverParticipant?.name ?? "Choose a giver"} with {receiverParticipant?.name ?? "choose a receiver"}.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-rose-50 px-3 py-2">
                  <p className="text-stone-500">Egg Chance</p>
                  <p className="font-bold text-stone-900">
                    {breedingSelection.receiverType === "player" ? "No egg" : "Rolled"}
                  </p>
                </div>
                <div className="rounded-xl bg-rose-50 px-3 py-2">
                  <p className="text-stone-500">Refusal</p>
                  <p className="font-bold text-stone-900">Mood-based</p>
                </div>
                <div className="rounded-xl bg-rose-50 px-3 py-2">
                  <p className="text-stone-500">Quality</p>
                  <p className="font-bold text-stone-900">Stats + home</p>
                </div>
                <div className="rounded-xl bg-rose-50 px-3 py-2">
                  <p className="text-stone-500">Family Risk</p>
                  <p className="font-bold text-stone-900">
                    {breedingSameCreature ? "Blocked" : "Checked"}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2">
                <p className="font-bold text-rose-950">{breedingPairSummary.title}</p>
                <p className="mt-1">{breedingPairSummary.details}</p>
                <p className="mt-1"><strong>Parent stat contribution:</strong> {breedingPairSummary.statContribution}</p>
                <p className="mt-1"><strong>Trait / ability chances:</strong> {breedingPairSummary.traitContribution}</p>
                <p className="mt-1"><strong>Where the egg goes:</strong> If an egg is produced, it appears in the Nursery and can also be reviewed on the Eggs screen.</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-stone-700">
              <p><strong>Cost:</strong> {breedingEnergyCost} player energy. Creature stamina and daily limits are checked when breeding starts.</p>
              <p className="mt-1"><strong>Risk:</strong> {getSimpleBreedingRiskLabel({
                sameCreature: breedingSameCreature,
                giverIsPlayer: breedingSelection.giverType === "player",
                receiverIsPlayer: breedingSelection.receiverType === "player",
              })}</p>
              <p className="mt-1"><strong>Immediate result:</strong> The action spends the cost, runs the existing breeding roll, and either creates a Nursery egg or records a no-egg pairing result.</p>
              <p className="mt-1"><strong>Shiny / cosmetic chance:</strong> Future Hook. Current UI shows quality, lineage, trait, and stamina signals only.</p>
              {breedingDisabledReason ? (
                <p className="mt-2 font-semibold text-red-800">{breedingDisabledReason}</p>
              ) : null}
            </div>

            <div className="mt-4">
              <button
                type="button"
                disabled={!breedingCanPerform}
                onClick={() => {
                  breedCreatures();
                  setBreedingFeedback(
                    breedingSelection.receiverType === "player"
                      ? "Breeding completed. Player receiver pairings can deepen bonds and training, but do not produce an egg."
                      : "Breeding attempt completed. If the pairing produced an egg, the Nursery will show it right away."
                  );
                }}
                className={`min-h-12 w-full rounded-2xl px-4 py-3 font-semibold text-white shadow sm:w-auto ${
                  breedingCanPerform ? "bg-rose-700" : "bg-stone-400"
                }`}
              >
                Perform Breeding
              </button>
            </div>
          </div>
        )}
        </div>
      </section>

      <OverlayModal
        open={recipeWorkshopOpen}
        onClose={() => setRecipeWorkshopOpen(false)}
        title="Recipe Workshop"
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          {knownRecipes.length === 0 ? (
            <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
              No known recipes yet. Visit Tamsin in Town to buy recipe books.
            </div>
          ) : (
            knownRecipes.map((recipe) => (
              <div key={recipe.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-stone-900">{recipe.name}</p>
                    <p className="text-sm text-stone-600">{recipe.description}</p>
                    <p className="mt-2 text-xs text-stone-700">
                      Ingredients:{" "}
                      {recipe.ingredients
                        .map((ingredient) => `${ingredient.quantity} ${ITEM_DATA[ingredient.itemId]?.name ?? ingredient.itemId}`)
                        .join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-stone-700">
                      Output: {recipe.outputQuantity} {recipe.outputItem?.name ?? recipe.outputItemId}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-rose-900">
                      Expected Quality: {CROP_QUALITY_DATA[recipe.outputQuality].label}
                      {recipe.ingredientPlan
                        ? ` from ${describeQualityIngredientPlan(recipe.ingredientPlan)} ingredients`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-stone-700">
                      Effects: {formatEffectPreview(recipe.outputEffects)}
                    </p>
                    <p className="mt-1 text-xs text-stone-700">Cook Time: {recipe.cookMinutes} min</p>
                  </div>
                  <div
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      recipe.craftable
                        ? "border border-emerald-300 bg-emerald-100 text-emerald-900"
                        : "border border-stone-300 bg-stone-100 text-stone-700"
                    }`}
                  >
                    {recipe.craftable ? "Ready to Cook" : "Missing Ingredients"}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {creatures.length === 0 ? (
                    <div className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-600">
                      Needs a helper creature
                    </div>
                  ) : (
                    creatures.map((creature) => (
                      <button
                        key={`${recipe.id}-${creature.id}`}
                        type="button"
                        disabled={!recipe.craftable || !ranchActionLocationAllowed}
                        onClick={() => {
                          const cooked = cookRecipe(recipe.id, creature.id);
                          setHouseFeedback(
                            cooked
                              ? `${creature.nickname} cooked ${recipe.name}. The kitchen smells shamelessly inviting.`
                              : `${recipe.name} needs ingredients, stamina, or a return to the ranch first.`
                          );
                          if (cooked) setRecipeWorkshopOpen(false);
                        }}
                        className={`min-h-11 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow ${
                          recipe.craftable && ranchActionLocationAllowed ? "bg-rose-700" : "bg-stone-400"
                        }`}
                      >
                        Cook with {creature.nickname}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))
          )}

          <Link
            href="/town"
            className="inline-block min-h-11 rounded-xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow"
          >
            Visit Tamsin for More Recipes
          </Link>
        </div>
      </OverlayModal>

      <OverlayModal
        open={fieldUpgradesOpen}
        onClose={() => setFieldUpgradesOpen(false)}
        title="Field Upgrades"
      >
        <div className="space-y-3">
          {FIELD_UPGRADE_ORDER.map((upgradeId) => {
            const upgrade = FIELD_UPGRADE_DATA[upgradeId];
            const unlocked = isFieldUpgradeUnlocked(fieldUpgrades, upgradeId);
            const available = isFieldUpgradeAvailable(fieldUpgrades, upgradeId);
            const affordable = playerData.gold >= upgrade.cost;

            return (
              <div
                key={upgrade.id}
                className={`rounded-2xl border p-4 ${
                  unlocked
                    ? "border-emerald-200 bg-emerald-50"
                    : available
                      ? "border-sky-200 bg-sky-50"
                      : "border-stone-200 bg-stone-50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-stone-900">{upgrade.title}</p>
                    <p className="text-sm text-stone-600">{upgrade.description}</p>
                    <p className="mt-1 text-xs font-semibold text-sky-900">{upgrade.effectSummary}</p>
                  </div>
                  <div className="w-fit rounded-full border border-sky-300 bg-white px-3 py-1 text-xs font-semibold text-sky-900">
                    {unlocked ? "Owned" : `${upgrade.cost}g`}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={unlocked || !available || !affordable}
                  onClick={() => purchaseFieldUpgrade(upgrade.id)}
                  className={`mt-3 min-h-11 w-full rounded-xl px-4 py-2 text-xs font-semibold text-white shadow ${
                    unlocked || !available || !affordable ? "bg-stone-400" : "bg-sky-700"
                  }`}
                >
                  {unlocked
                    ? "Installed"
                    : !available
                      ? "Needs Earlier Upgrade"
                      : !affordable
                        ? "Not Enough Gold"
                        : "Install Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </OverlayModal>

      <OverlayModal
        open={fieldHelperOpen}
        onClose={() => setFieldHelperOpen(false)}
        title="Helper Field Details"
        maxWidth="max-w-4xl"
      >
        {fieldCreature && fieldSpecialization ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xl font-bold text-emerald-950">{fieldCreature.nickname}</p>
              <p className="mt-1 text-sm text-stone-700">
                {fieldCreature.name} - Field Work Lv {fieldCreature.skills.fieldWork.level} - Stamina {fieldCreature.breedingStamina}/{fieldCreature.maxBreedingStamina}
              </p>
              <p className="mt-2 text-sm text-stone-700">{fieldSpecialization.specialtySummary}</p>
            </div>
            <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
              <p><strong>Plant:</strong> {getFieldActionSpecializationNotes(fieldSpecialization, "plant").join(" ") || "General field skill applies."}</p>
              <p><strong>Water:</strong> {getFieldActionSpecializationNotes(fieldSpecialization, "water").join(" ") || "General field skill applies."}</p>
              <p><strong>Fertilize:</strong> {getFieldActionSpecializationNotes(fieldSpecialization, "fertilize").join(" ") || "General field skill applies."}</p>
              <p><strong>Harvest:</strong> {getFieldActionSpecializationNotes(fieldSpecialization, "harvest").join(" ") || "General field skill applies."}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
            Choose a field helper to see details.
          </div>
        )}
      </OverlayModal>

      <OverlayModal
        open={weatherSeasonOpen}
        onClose={() => setWeatherSeasonOpen(false)}
        title="Weather & Season"
        maxWidth="max-w-4xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-stone-700">
            <p className="text-lg font-bold text-sky-950">{weatherInfo.label}</p>
            <p className="mt-2">{weatherInfo.description}</p>
            <p className="mt-2 font-semibold text-sky-900">{weatherInfo.fieldNote}</p>
            <p className="mt-2 text-xs">
              Water pressure: {weatherInfo.waterPressure} - Growth {weatherInfo.growthDelta >= 0 ? "+" : ""}{weatherInfo.growthDelta} - Quality {weatherInfo.qualityDelta >= 0 ? "+" : ""}{weatherInfo.qualityDelta}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-700">
            <p className="text-lg font-bold text-amber-950">{seasonInfo.label}</p>
            <p className="mt-2">{seasonInfo.description}</p>
            <p className="mt-2 font-semibold text-amber-900">{seasonInfo.fieldNote}</p>
            <p className="mt-2 text-xs">
              Favored: {seasonInfo.favoredCropIds.join(", ")} - Tough: {seasonInfo.toughCropIds.join(", ")}
            </p>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        title="Ranch Inventory"
      >
        <div className="space-y-6">
          {(["seeds", "ingredients", "food", "books", "other"] as Exclude<InventoryCategory, "all">[]).map((category) => {
            const entries = inventoryGroups[category];
            if (entries.length === 0) return null;

            return (
              <section key={category} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-xl font-bold text-emerald-950">{getCategoryLabel(category)}</h4>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {entries.map((entry) => (
                    <div key={entry.itemId} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-stone-900">{entry.item?.name ?? entry.itemId}</p>
                          <p className="text-sm text-stone-600">{entry.item?.description ?? "No description yet."}</p>
                        </div>
                        <div className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                          x{entry.count}
                        </div>
                      </div>

                      {entry.item?.seedData ? (
                        <p className="mt-2 text-xs text-stone-700">
                          Seed: {entry.item.seedData.growDays} day grow time • Yield {entry.item.seedData.minYield}–{entry.item.seedData.maxYield}
                        </p>
                      ) : null}

                      {getItemEffectSummary(entry.itemId) ? (
                        <p className="mt-2 text-xs text-stone-700">
                          Effect: {getItemEffectSummary(entry.itemId)}
                        </p>
                      ) : null}

                      {formatQualityBreakdown(entry.itemId, getQualityItemCount) ? (
                        <p className="mt-2 text-xs font-semibold text-emerald-900">
                          Quality Lots: {formatQualityBreakdown(entry.itemId, getQualityItemCount)}
                        </p>
                      ) : null}

                      {entry.item?.recipeUnlockIds?.length ? (
                        <p className="mt-2 text-xs text-stone-700">
                          Unlocks: {entry.item.recipeUnlockIds.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {inventoryEntries.length === 0 ? (
            <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
              Inventory is currently empty.
            </div>
          ) : null}
        </div>
      </OverlayModal>

      <OverlayModal
        open={selectedCreature !== null}
        onClose={() => setSelectedCreatureId(null)}
        title={selectedCreature ? `${selectedCreature.nickname} — Creature Card` : "Creature Card"}
        maxWidth="max-w-4xl"
      >
        {selectedCreature ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                    <Image
                      src={getCreatureImage(selectedCreature.name)}
                      alt={selectedCreature.nickname}
                      width={160}
                      height={160}
                      className="max-h-full w-auto object-contain"
                    />
                  </div>
                  <div>
                  <p className="text-2xl font-bold text-emerald-950">{selectedCreature.nickname}</p>
                  <p className="mt-1 text-sm font-semibold text-stone-800">
                    Best use: {getCreatureRoleSummary(selectedCreature)}
                  </p>
                  <p className="text-sm text-stone-700">
                    {selectedCreature.name} • Level {selectedCreature.level} • Generation {selectedCreature.generation}
                  </p>
                  </div>
                </div>
                <div className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-sm font-semibold text-emerald-900">
                  {getMoodLabel(selectedCreature.happiness)}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {getCreatureStrengthBadges(selectedCreature).map((badge) => (
                  <div key={badge} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-900">
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Rename</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={renameInput || selectedCreature.nickname}
                  onChange={(event) => setRenameInput(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextName = renameInput || selectedCreature.nickname;
                    renameCreature(selectedCreature.id, nextName);
                    setBarnFeedback(`${nextName} has a fresh name on the barn board.`);
                  }}
                  className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow"
                >
                  Save Name
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="mb-3 text-lg font-bold text-stone-900">Condition</p>
                <div className="space-y-2 text-sm text-stone-700">
                  <p><strong>Stamina:</strong> {selectedCreature.breedingStamina}/{selectedCreature.maxBreedingStamina}</p>
                  <p><strong>Happiness:</strong> {selectedCreature.happiness}</p>
                  <p><strong>Inbreeding Risk:</strong> {selectedCreature.inbreedingRisk}</p>
                  <p><strong>Inbred Trait:</strong> {selectedCreature.inbredTrait}</p>
                  <p><strong>Severity:</strong> {selectedCreature.inbredTraitSeverity}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                <p className="mb-3 text-lg font-bold text-stone-900">Lineage</p>
                <div className="space-y-2 text-sm text-stone-700">
                  <p><strong>Giver:</strong> {selectedCreature.giver ?? "Unknown"}</p>
                  <p><strong>Receiver:</strong> {selectedCreature.receiver ?? "Unknown"}</p>
                  <p><strong>Born On Day:</strong> {selectedCreature.bornOnDay}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Stats</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-stone-700">
                {getCreatureStatEntries(selectedCreature).map((stat) => (
                  <div key={stat.key} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <p className="font-bold text-stone-950">{stat.label}: {stat.value}</p>
                    <p className="mt-1 text-xs">{stat.shortEffect}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Skills</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-stone-700">
                {getCreatureSkillEntries(selectedCreature).map((skill) => (
                  <div key={skill.key} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <p className="font-bold text-stone-950">{skill.label}: Lv {skill.level}</p>
                    <p className="mt-1 text-xs">{skill.shortEffect}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Traits</p>
              <div className="flex flex-wrap gap-2">
                {selectedCreature.traits.length > 0 ? (
                  selectedCreature.traits.map((trait, index) => (
                    <div
                      key={`${selectedCreature.id}-${trait.trait}-${index}`}
                      className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900"
                    >
                      {trait.trait} • {trait.grade}
                    </div>
                  ))
                ) : (
                  <div className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    No traits listed
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="mb-3 text-lg font-bold text-stone-900">Ability Meanings & Best Uses</p>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="grid gap-2 text-sm text-stone-700">
                  {getCreatureTraitEntries(selectedCreature).length > 0 ? (
                    getCreatureTraitEntries(selectedCreature).map((trait, index) => (
                      <div key={`${trait.trait}-${index}`} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                        <p className="font-bold text-stone-950">{trait.label} - Grade {trait.grade}</p>
                        <p className="mt-1">{trait.shortEffect}</p>
                        <p className="mt-1 text-xs font-semibold text-stone-500">Applies: {trait.appliesTo.join(", ")}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                      No mapped ability effects yet.
                    </div>
                  )}
                </div>
                <div className="grid gap-2 text-sm text-stone-700">
                  {getCreatureBestUseSections(selectedCreature).map((use) => (
                    <div key={use.label} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <p className="font-bold text-stone-950">{use.label}</p>
                      <p className="mt-1">{use.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </OverlayModal>
    </>
  );
}
