Apply these exact changes to context/GameContext.tsx.

1) In GameContextType, add this function:
  consumeInventoryItem: (
    itemId: string,
    target: { type: "player" } | { type: "creature"; creatureId: number }
  ) => boolean;

2) Add this function inside GameProvider(), near your other inventory functions like
   getItemCount / knowsRecipe / purchaseMarketItem:

function consumeInventoryItem(
  itemId: string,
  target: { type: "player" } | { type: "creature"; creatureId: number }
) {
  const item = ITEM_DATA[itemId];
  const effects = item?.edibleEffects;

  if (!item || !effects) return false;
  if ((inventory[itemId] ?? 0) < 1) return false;
  if (!item.useTags.includes("edible")) return false;

  const updatedClock = addMinutesToClock(currentDay, currentHour, currentMinute, 5);
  setCurrentDay(updatedClock.day);
  setCurrentHour(updatedClock.hour);
  setCurrentMinute(updatedClock.minute);

  setInventory((prev) => removeItemFromInventory(prev, itemId, 1));

  if (target.type === "player") {
    setPlayerData((prev) => ({
      ...prev,
      energy: clamp(prev.energy + (effects.energyRestore ?? 0), 0, 100),
      happiness: clamp(prev.happiness + (effects.happinessGain ?? 0), 0, 100),
    }));
  } else {
    const creature = creatures.find((c) => c.id === target.creatureId);
    if (!creature) return false;

    setCreatures((prev) =>
      prev.map((c) => {
        if (c.id !== target.creatureId) return c;

        return {
          ...c,
          breedingStamina: clamp(
            c.breedingStamina +
              (effects.staminaRestore ?? 0) +
              (effects.breedingRecoveryBoost ?? 0),
            0,
            c.maxBreedingStamina
          ),
          happiness: clamp(c.happiness + (effects.happinessGain ?? 0), 0, 100),
          stats: {
            ...c.stats,
            fertility: clamp(
              c.stats.fertility + (effects.fertilityBoost ?? 0),
              1,
              99
            ),
          },
        };
      })
    );
  }

  setTownQuests((prev) =>
    ensureQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 10)
  );
  setTownNpcQuests((prev) =>
    ensureNpcQuestBoardSize(prev, updatedClock.day, updatedClock.hour, updatedClock.minute, 3)
  );

  return true;
}

3) In the GameContext.Provider value, add:
  consumeInventoryItem,

Place it near:
  inventory,
  knownRecipeIds,
  purchaseMarketItem,
  getItemCount,
  knowsRecipe,
  cookRecipe,

So that section becomes:
  inventory,
  knownRecipeIds,
  purchaseMarketItem,
  getItemCount,
  knowsRecipe,
  cookRecipe,
  consumeInventoryItem,

4) In the returned context value type block near the top, make sure the new function is included exactly once.
