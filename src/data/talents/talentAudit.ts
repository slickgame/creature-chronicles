import {
  TALENT_DEFINITION_VERSION,
  getAllTalentDefinitions,
  getTalentDefinition,
} from "./talentDefinitions";
import { getCreatureRoleTags } from "./creatureRoleTags";
import type { AbilityGrade, CreatureRecord } from "@/types/creature";
import type { GameSave } from "@/types/save";
import type {
  TalentAuditRecord,
  TalentAuditStatus,
  TalentDefinition,
  TalentSystem,
} from "@/types/talent";

const GRADES: AbilityGrade[] = ["F", "D", "C", "B", "A", "S"];
const LIVE_STRUCTURED_SYSTEMS = new Set<TalentSystem>([
  "breeding",
  "growth",
  "chore",
  "battle",
  "recovery",
  "role-tags",
]);

export type TalentAuditSummary = {
  definitionCount: number;
  ownedInstanceCount: number;
  ownedCreatureCount: number;
  fullyImplementedCount: number;
  partiallyImplementedCount: number;
  descriptionOnlyCount: number;
  unknownDefinitionCount: number;
  gradeCoverageCount: number;
  gradeCoverageExpected: number;
  definitionVersion: number;
  records: TalentAuditRecord[];
  globalWarnings: string[];
};

export type CreatureTalentAudit = {
  creature: CreatureRecord;
  talentCount: number;
  unknownTalentIds: string[];
  roleTags: ReturnType<typeof getCreatureRoleTags>;
  warnings: string[];
};

function getDefinitionWarnings(definition: TalentDefinition): string[] {
  const warnings: string[] = [];
  if (!definition.systems.length) warnings.push("No gameplay system is registered for this talent.");
  if (!definition.triggers.length) warnings.push("No trigger is registered for this talent.");
  if (!definition.tags.length) warnings.push("No capability tags are registered.");

  for (const grade of GRADES) {
    if (!definition.gradeEffects[grade]?.length) warnings.push(`Grade ${grade} has no structured effects.`);
    if (!definition.exactDescriptionByGrade[grade]?.trim()) warnings.push(`Grade ${grade} has no exact description.`);
  }

  const inactiveSystems = definition.systems.filter((system) => !LIVE_STRUCTURED_SYSTEMS.has(system));
  if (inactiveSystems.length) {
    warnings.push(
      `Structured effects for ${inactiveSystems.join(", ")} are defined but not yet connected to their final runtime hooks.`,
    );
  }
  return warnings;
}

function getStatus(definition: TalentDefinition, warnings: string[]): TalentAuditStatus {
  if (!definition.systems.length || GRADES.every((grade) => !definition.gradeEffects[grade]?.length)) {
    return "description-only";
  }
  if (warnings.some((warning) => warning.includes("not yet connected") || warning.includes("has no"))) {
    return "partially-implemented";
  }
  return "fully-implemented";
}

function uniqueGrades(creatures: CreatureRecord[], talentId: string): AbilityGrade[] {
  const grades = new Set<AbilityGrade>();
  for (const creature of creatures) {
    for (const talent of creature.abilities ?? []) {
      if (talent.id === talentId) grades.add(talent.grade);
    }
  }
  return GRADES.filter((grade) => grades.has(grade));
}

export function auditTalentDefinitions(save?: GameSave | null): TalentAuditSummary {
  const creatures = save?.creatures ?? [];
  const definitions = getAllTalentDefinitions();
  const records: TalentAuditRecord[] = definitions.map((definition) => {
    const warnings = getDefinitionWarnings(definition);
    const ownedCount = creatures.reduce(
      (count, creature) => count + (creature.abilities ?? []).filter((talent) => talent.id === definition.id).length,
      0,
    );
    return {
      talentId: definition.id,
      name: definition.name,
      status: getStatus(definition, warnings),
      category: definition.category,
      systems: [...definition.systems],
      triggers: [...definition.triggers],
      tags: [...definition.tags],
      ownedCount,
      gradesOwned: uniqueGrades(creatures, definition.id),
      definitionVersion: definition.definitionVersion,
      warnings,
    };
  });

  const unknownInstances = new Map<string, { name: string; count: number; grades: Set<AbilityGrade> }>();
  for (const creature of creatures) {
    for (const talent of creature.abilities ?? []) {
      if (getTalentDefinition(talent.id)) continue;
      const prior = unknownInstances.get(talent.id) ?? { name: talent.name, count: 0, grades: new Set<AbilityGrade>() };
      prior.count += 1;
      prior.grades.add(talent.grade);
      unknownInstances.set(talent.id, prior);
    }
  }

  for (const [talentId, unknown] of unknownInstances) {
    records.push({
      talentId,
      name: unknown.name,
      status: "unknown-definition",
      category: "general",
      systems: [],
      triggers: [],
      tags: [],
      ownedCount: unknown.count,
      gradesOwned: GRADES.filter((grade) => unknown.grades.has(grade)),
      definitionVersion: 0,
      warnings: ["This saved talent has no central definition and cannot provide structured effects."],
    });
  }

  const gradeCoverageCount = definitions.reduce(
    (total, definition) => total + GRADES.filter((grade) => definition.gradeEffects[grade]?.length && definition.exactDescriptionByGrade[grade]?.trim()).length,
    0,
  );
  const globalWarnings: string[] = [];
  if (unknownInstances.size) globalWarnings.push(`${unknownInstances.size} saved talent id(s) have no definition.`);
  if (records.some((record) => record.systems.includes("inheritance"))) {
    globalWarnings.push("Inheritance talent effects are defined and visible in the audit, but their final genetics-roll hook remains scheduled for the genetics follow-up patch.");
  }
  globalWarnings.push("Breeding definitions intentionally preserve the current live Breeding Pen calculations while the private legacy adapter is retired incrementally.");

  return {
    definitionCount: definitions.length,
    ownedInstanceCount: creatures.reduce((total, creature) => total + (creature.abilities?.length ?? 0), 0),
    ownedCreatureCount: creatures.filter((creature) => creature.abilities?.length).length,
    fullyImplementedCount: records.filter((record) => record.status === "fully-implemented").length,
    partiallyImplementedCount: records.filter((record) => record.status === "partially-implemented").length,
    descriptionOnlyCount: records.filter((record) => record.status === "description-only").length,
    unknownDefinitionCount: records.filter((record) => record.status === "unknown-definition").length,
    gradeCoverageCount,
    gradeCoverageExpected: definitions.length * GRADES.length,
    definitionVersion: TALENT_DEFINITION_VERSION,
    records: records.sort((a, b) => a.status.localeCompare(b.status) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    globalWarnings,
  };
}

export function auditCreatureTalents(creature: CreatureRecord): CreatureTalentAudit {
  const unknownTalentIds = (creature.abilities ?? [])
    .filter((talent) => !getTalentDefinition(talent.id))
    .map((talent) => talent.id);
  const warnings: string[] = [];
  if (!creature.abilities?.length) warnings.push("This creature currently has no talents.");
  if (unknownTalentIds.length) warnings.push(`${unknownTalentIds.length} talent(s) have no structured definition.`);
  return {
    creature,
    talentCount: creature.abilities?.length ?? 0,
    unknownTalentIds,
    roleTags: getCreatureRoleTags(creature),
    warnings,
  };
}
