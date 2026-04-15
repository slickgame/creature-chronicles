import type { TownNpcData } from "@/lib/town/npcData";
import {
  getRelationshipStageName,
  type NpcRelationshipState,
  type RelationshipStageName,
} from "@/lib/town/relationshipDefaults";

export type NpcVisitImageSource = "base" | "relationship_stage";

export type NpcVisitImage = {
  imageId: string;
  source: NpcVisitImageSource;
  stageName: RelationshipStageName;
  altText: string;
  label: string;
};

export function getNpcVisitImage(
  npc: TownNpcData,
  relationship?: NpcRelationshipState
): NpcVisitImage {
  const stageName = getRelationshipStageName(relationship?.level ?? 1);
  const stageImageId = npc.relationshipStageImageIds?.[stageName];
  const imageId = stageImageId ?? npc.baseImageId;
  const source: NpcVisitImageSource = stageImageId ? "relationship_stage" : "base";

  return {
    imageId,
    source,
    stageName,
    altText: `${npc.name} ${source === "base" ? "default visit" : stageName} portrait`,
    label: source === "base" ? "Default Visit Image" : `${stageName} Visit Image`,
  };
}

