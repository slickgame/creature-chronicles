import { getAllTalentDefinitions } from '@/data/talents/talentDefinitions';
import { GENERAL_ABILITY_POOL } from '@/data/talents/generalTalents';

// Design inventory generated from authoritative definitions, never a second balance table.
const generalIds = new Set(GENERAL_ABILITY_POOL.map(t => t.id));
const definitions = getAllTalentDefinitions();
const talents = definitions.map(d => ({
  id: d.id,
  name: d.name,
  source: d.source,
  category: d.category,
  coverage: generalIds.has(d.id) ? 'current-general-pool' : d.id === 'guard_dog' ? 'current-canine-generation' : 'additional-retained-definition',
  icon: generalIds.has(d.id) || d.id === 'guard_dog' ? `/images/ui/talents-c/icons/${d.id}.webp` : '/images/ui/creature-overview-a-v2/painted-r4/talents.webp',
  declaredSystems: d.systems,
  declaredTriggers: d.triggers,
  stackingRule: d.stackingRule,
  sourceRestrictions: d.sourceRestrictions,
  gradeCoverage: Object.keys(d.gradeEffects),
  exampleGrade: 'C',
  exampleDescription: d.exactDescriptionByGrade.C,
  exampleEffects: d.gradeEffects.C,
  needsRuntimeScopeReview: !generalIds.has(d.id) && d.id !== 'guard_dog',
}));
console.log(JSON.stringify({
  date: '2026-10-18',
  target: 'Approved Talents C compact register',
  definitionCount: definitions.length,
  currentGeneralCount: generalIds.size,
  currentCanineTalentCount: 1,
  additionalRetainedCount: talents.filter(t => t.coverage === 'additional-retained-definition').length,
  expectedUniqueTalentIcons: generalIds.size + 1,
  notes: [
    'The complete launch kit has ten dedicated icons. Retained legacy records use the generic painted talent symbol.',
    'One icon per launch talent ID; grades use shared badges rather than six artwork copies.',
    'Current-roll coverage is distinct from retained definitions available to existing saves.',
    'Declared systems and triggers do not certify that every runtime hook is connected.',
    'UI values must derive from the owned grade through talentDefinitions, not the C examples in this report.',
    'Unrestricted work XP bonuses now apply to recipe XP, rounded per batch; job-scoped bonuses remain scoped.',
  ],
  talents,
}, null, 2));
