"use client";

import type { ComponentProps } from "react";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { CreatureMemoriesPanel } from "./CreatureMemoriesPanel";
import type { GameSave } from "@/types/save";

type SharedDetailProps = ComponentProps<typeof SharedCreatureDetail>;

type CreatureDetailWithMemoriesProps = SharedDetailProps & {
  save: GameSave;
  memoryLimit?: number;
};

/**
 * Drop-in composition for screens that already render SharedCreatureDetail.
 * Keeping Legacy UI outside the large creature-detail module lowers regression
 * risk while the memories system is introduced incrementally.
 */
export function CreatureDetailWithMemories({
  save,
  creature,
  memoryLimit = 8,
  ...detailProps
}: CreatureDetailWithMemoriesProps) {
  return (
    <div style={{ display: "grid", gap: 12, minHeight: 0 }}>
      <SharedCreatureDetail creature={creature} {...detailProps} />
      <CreatureMemoriesPanel
        save={save}
        creatureId={creature.creatureId}
        limit={memoryLimit}
      />
    </div>
  );
}
