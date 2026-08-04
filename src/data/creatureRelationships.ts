export * from "./creatureRelationshipsCore";

import { addSharedCreatureMemory } from "@/data/creatureMemories";
import {
  getCreatureRelationship,
  recordCreatureRelationshipEvent as recordCreatureRelationshipEventCore,
} from "./creatureRelationshipsCore";
import type { CreatureId } from "@/types/ids";
import type { CreatureRelationshipEvent, CreatureRelationshipKind } from "@/types/relationships";
import type { GameSave } from "@/types/save";

type RelationshipMilestone = {
  kind: Extract<CreatureRelationshipKind, "friend" | "close_friend" | "strained" | "rival" | "trusted_family">;
  importance: "notable" | "major";
};

function creatureName(save: GameSave, creatureId: CreatureId): string {
  return (save.creatures ?? []).find((creature) => creature.creatureId === creatureId)?.nickname
    ?? "A former ranch creature";
}

function crossedMilestones(
  beforeAffinity: number,
  afterAffinity: number,
  family: boolean,
): RelationshipMilestone[] {
  const milestones: RelationshipMilestone[] = [];
  if (beforeAffinity < 30 && afterAffinity >= 30 && !family) {
    milestones.push({ kind: "friend", importance: "notable" });
  }
  if (beforeAffinity < 70 && afterAffinity >= 70 && !family) {
    milestones.push({ kind: "close_friend", importance: "major" });
  }
  if (beforeAffinity > -15 && afterAffinity <= -15 && !family) {
    milestones.push({ kind: "strained", importance: "notable" });
  }
  if (beforeAffinity > -45 && afterAffinity <= -45 && !family) {
    milestones.push({ kind: "rival", importance: "major" });
  }
  if (family && beforeAffinity < 65 && afterAffinity >= 65) {
    milestones.push({ kind: "trusted_family", importance: "major" });
  }
  return milestones;
}

function milestoneStory(
  kind: RelationshipMilestone["kind"],
  leftName: string,
  rightName: string,
): { title: string; description: string } {
  if (kind === "friend") {
    return {
      title: `${leftName} and ${rightName} became friends`,
      description: `After enough shared days and experiences, ${leftName} and ${rightName} began to seek out each other's company as true ranch friends.`,
    };
  }
  if (kind === "close_friend") {
    return {
      title: `${leftName} and ${rightName} formed a lasting friendship`,
      description: `${leftName} and ${rightName} became close friends whose shared history now forms part of the ranch's living legacy.`,
    };
  }
  if (kind === "strained") {
    return {
      title: `${leftName} and ${rightName} developed a strained bond`,
      description: `Repeated friction left ${leftName} and ${rightName} wary of one another. Future shared experiences may mend the tension or deepen it.`,
    };
  }
  if (kind === "rival") {
    return {
      title: `${leftName} and ${rightName} became rivals`,
      description: `${leftName} and ${rightName} now measure themselves against one another, turning their difficult history into a lasting ranch rivalry.`,
    };
  }
  return {
    title: `${leftName} and ${rightName} became trusted family`,
    description: `${leftName} and ${rightName} strengthened their family bond through years of shared ranch life and now trust one another deeply.`,
  };
}

/**
 * Persistent relationship transaction with automatic milestone storytelling.
 * Core affinity/event accounting remains isolated in creatureRelationshipsCore;
 * this facade mirrors newly crossed social thresholds into both creature Memory
 * books and one shared Chronicle entry.
 */
export function recordCreatureRelationshipEvent(
  save: GameSave,
  event: CreatureRelationshipEvent,
): GameSave {
  const [leftId, rightId] = event.creatureIds;
  const before = getCreatureRelationship(save, leftId, rightId);
  let nextSave = recordCreatureRelationshipEventCore(save, event);
  if (nextSave === save) return save;
  const after = getCreatureRelationship(nextSave, leftId, rightId);
  const milestones = crossedMilestones(before.affinity, after.affinity, after.family);
  const leftName = creatureName(save, leftId);
  const rightName = creatureName(save, rightId);

  for (const milestone of milestones) {
    const story = milestoneStory(milestone.kind, leftName, rightName);
    nextSave = addSharedCreatureMemory(nextSave, {
      creatureIds: [leftId, rightId],
      category: "relationship",
      importance: milestone.importance,
      title: story.title,
      description: story.description,
      dayNumber: event.dayNumber,
      sourceKey: `relationship-milestone:${after.relationshipId}:${milestone.kind}`,
      tags: ["relationship", "milestone", milestone.kind],
    });
  }
  return nextSave;
}
