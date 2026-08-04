"use client";

import type { ComponentProps } from "react";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { CreatureMemoriesPanel } from "@/features/creatures/CreatureMemoriesPanel";
import { CreatureAmbitionPanel } from "./CreatureAmbitionPanel";
import { CreatureCareerPanel } from "./CreatureCareerPanel";
import { CreaturePersonalityPanel } from "./CreaturePersonalityPanel";
import { CreatureRelationshipsPanel } from "./CreatureRelationshipsPanel";
import type { GameSave } from "@/types/save";

type SharedDetailProps = ComponentProps<typeof SharedCreatureDetail>;

type CreatureDetailWithMemoriesProps = SharedDetailProps & {
  save: GameSave;
  memoryLimit?: number;
  relationshipLimit?: number;
  compactCareer?: boolean;
  compactAmbition?: boolean;
  compactPersonality?: boolean;
  compactRelationships?: boolean;
};

/**
 * Drop-in Legacy composition for screens that already render
 * SharedCreatureDetail. It keeps the established detail UI intact while
 * presenting ambitions, personality, relationships, career totals, and
 * narrative memories.
 */
export function CreatureDetailWithMemories({
  save,
  creature,
  memoryLimit = 8,
  relationshipLimit = 4,
  compactCareer = false,
  compactAmbition = false,
  compactPersonality = false,
  compactRelationships = false,
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
      <CreaturePersonalityPanel
        save={save}
        creatureId={creature.creatureId}
        compact={compactPersonality}
      />
      <CreatureRelationshipsPanel
        save={save}
        creatureId={creature.creatureId}
        limit={relationshipLimit}
        compact={compactRelationships}
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
