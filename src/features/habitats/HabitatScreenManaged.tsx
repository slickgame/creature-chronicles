"use client";

import { useEffect, useMemo } from "react";
import { getVariantDefinition } from "@/data/creatures";
import { LegacyCreatureProfileLauncher } from "@/features/legacy/LegacyCreatureProfileLauncher";
import { HabitatScreen as CoreHabitatScreen } from "./HabitatScreen";
import { useGameContext } from "@/state/GameProvider";

const STORAGE_KEY = "creature_chronicles_habitat_focus";

export function HabitatScreen() {
  const { activeHabitatFamily, appScreen, currentSave } = useGameContext();
  const habitatCreatures = useMemo(
    () =>
      currentSave && activeHabitatFamily
        ? (currentSave.creatures ?? []).filter(
            (creature) => getVariantDefinition(creature.variantId).family === activeHabitatFamily,
          )
        : [],
    [activeHabitatFamily, currentSave],
  );

  useEffect(() => {
    if (appScreen !== "habitat" || !currentSave) return;
    const creatureId = window.sessionStorage.getItem(STORAGE_KEY);
    if (!creatureId) return;
    const creature = (currentSave.creatures ?? []).find(
      (item) => item.creatureId === creatureId,
    );
    if (!creature) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    let attempts = 0;
    const focusCreature = () => {
      attempts += 1;
      const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
        (candidate) =>
          candidate.querySelector("strong")?.textContent?.trim() === creature.nickname,
      );
      if (button) {
        button.click();
        button.scrollIntoView({ block: "nearest" });
        window.sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (attempts < 12) window.setTimeout(focusCreature, 90);
    };

    window.setTimeout(focusCreature, 0);
  }, [appScreen, currentSave]);

  return (
    <>
      <CoreHabitatScreen />
      {currentSave && habitatCreatures.length ? (
        <LegacyCreatureProfileLauncher
          save={currentSave}
          creatures={habitatCreatures}
          label="Habitat Legacy"
          title="Habitat Creature Legacy Profiles"
          position="right"
        />
      ) : null}
    </>
  );
}
