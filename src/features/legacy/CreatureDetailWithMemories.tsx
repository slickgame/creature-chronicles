"use client";

import type { ComponentProps } from "react";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { CreatureAmbitionPanel } from "./CreatureAmbitionPanel";
import { CreatureCareerPanel } from "./CreatureCareerPanel";
import { CreatureMemoriesPanel } from "./CreatureMemoriesPanel";
import type { GameSave } from "@/types/save";

type SharedDetailProps = ComponentProps<typeof SharedCreatureDetail>;

type CreatureDetailWithMemoriesProps = SharedDetailProps & {
  save: GameSave;
  memoryLimit?: number;
  compactCareer?: boolean;
  compactAmbition?: boolean;
};

/**
 * Drop-in Legacy composition for screens that already render
 * SharedCreatureDetail. It keeps the established detail UI intact while
 * presenting ambition, structured career totals, and narrative memories.
 */
export function CreatureDetailWithMemories({
  save,
  creature,
  memoryLimit = 8,
  compactCareer = false,
  compactAmbition = false,
  ...detailProps
}: CreatureDetailWithMemoriesProps) {
  return (
    <div style={{ display: "grid", gap: 12, minHeight: 0 }}>
      <SharedCreatureDetail creature={creature} {...detailProps} />
      <CreatureAmbitionPanel
        save={save}
        creatureId={creature.creatureId}
        compact={compactAmbition}
      />
      <CreatureCareerPanel
        save={save}
        creatureId={creature.creatureId}
        compact={compactCareer}
      />
      <CreatureMemoriesPanel
        save={save}
        creatureId={creature.creatureId}
        limit={memoryLimit}
      />
    </div>
  );
}
