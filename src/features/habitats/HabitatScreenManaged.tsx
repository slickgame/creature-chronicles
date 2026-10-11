"use client";

import { HabitatScreen as CoreHabitatScreen } from "./HabitatScreen";
import { useGameContext } from "@/state/GameProvider";

export function HabitatScreen() {
  const { activeHabitatFamily } = useGameContext();
  return <CoreHabitatScreen key={activeHabitatFamily} />;
}
