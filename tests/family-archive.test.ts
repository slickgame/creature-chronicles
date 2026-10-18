import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameSave, saveGameToSlot, loadSaveFromSlot, exportPortableSave, importPortableSaveToSlot } from './helpers/establishedSave';
import { buildFamilyArchive, preserveFamilyArchive, creatureFamilyId } from '@/data/familyArchive';
import { layoutFamilyTree, familyNeighborhood } from '@/data/familyTree';
import { hatchEgg } from '@/data/nursery';
import type { BirthRecord, EggRecord, ParentSnapshot } from '@/types/save';
import type { FamilyRecord } from '@/types/family';
import { normalizeTrackedCreatureGenerations } from '@/data/generationMigration';
import { getCorrectOffspringGeneration } from '@/data/geneticsBalance';

function fixture() {
  const save = createNewGameSave('Family', 0), c = save.creatures![0], other = save.creatures![1];
  const player: ParentSnapshot = { participantId: 'player', displayName: 'Player parent', kind: 'player', familyLabel: 'Player' };
  const parent: ParentSnapshot = { participantId: other.creatureId, creatureId: other.creatureId, displayName: other.nickname, kind: 'creature', familyLabel: 'Canine' };
  const egg: EggRecord = { eggId: 'egg_family' as never, ownerSaveId: save.saveId, createdAtDayNumber: 0, createdAt: 'test', daysRemaining: 0, totalDays: 3, status: 'ready', rarity: 'Common', speciesId: c.speciesId, variantId: c.variantId, habitatId: c.habitatId, parents: { giver: player, receiver: parent }, projectedStats: c.stats, projectedStatGrades: c.statGrades, projectedAbilities: c.abilities, statRollNotes: [], abilityRollNotes: [], lineageRisk: 'none', lineageRiskLabel: 'No Risk', lineageNotes: [], lineageTraits: [], suggestedName: 'Child' };
  save.eggs = [egg]; save.eggIds = [egg.eggId];
  const birth = (id: string): BirthRecord => ({ birthId: `birth_${id}`, eggId: `egg_${id}` as never, creatureId: id as never, nickname: id, hatchedAt: 'test', hatchedAtDayNumber: 1, rarity: 'Common', speciesId: c.speciesId, variantId: c.variantId, parents: egg.parents, inheritedStatGrades: c.statGrades, inheritedAbilities: [], lineageRisk: 'none', lineageRiskLabel: 'No Risk', lineageTraits: [] });
  return { save, egg, birth, c, other };
}
test('real hatching archives every older birth before truncating the recent log, without changing rewards or input', () => {
  const { save, egg, birth } = fixture(); save.birthHistory = Array.from({ length: 170 }, (_, i) => birth(`old_${i}`));
  const before = structuredClone(save), result = hatchEgg(save, egg.eggId, 'New child')!;
  assert.ok(result); assert.deepEqual(save, before); assert.equal(result.save.birthHistory!.length, 150);
  for (let i = 0; i < 170; i++) assert.ok(result.save.familyArchive!.records[creatureFamilyId(`old_${i}`)]);
  const r = result.save.familyArchive!.records[creatureFamilyId(result.creature.creatureId)];
  assert.deepEqual(r.parents, ['player:player', creatureFamilyId(save.creatures![1].creatureId)]);
  assert.equal(result.save.currencies.gold, save.currencies.gold);
});
test('archive survives departing parents, empty recent logs, roundtrip serialization and repeated normalization', () => {
  const { save, birth, other } = fixture(); save.birthHistory = [birth('child')];
  const initial = preserveFamilyArchive(save), removed = { ...initial, creatures: [], birthHistory: [], eggs: [] };
  const archived = preserveFamilyArchive(JSON.parse(JSON.stringify(removed)));
  assert.equal(archived.familyArchive!.records[creatureFamilyId(other.creatureId)].name, other.nickname);
  assert.deepEqual(archived.familyArchive!.records['creature:child'].parents, ['player:player', creatureFamilyId(other.creatureId)]);
  assert.equal(preserveFamilyArchive(archived), archived);
});
test('legacy player/creature array mismatch never turns the player name into the creature identity', () => {
  const { save, c, other } = fixture(); c.lineage = { risk: 'none', label: 'No Risk', parentNames: ['Player parent', other.nickname], parentCreatureIds: [other.creatureId], traits: [], notes: [] };
  const before = structuredClone(save), r = buildFamilyArchive(save).records;
  assert.deepEqual(save, before); const ps = r[creatureFamilyId(c.creatureId)].parents;
  assert.equal(ps.length, 2); assert.equal(r[creatureFamilyId(other.creatureId)].name, other.nickname);
  assert.ok(ps.some(id => r[id].kind === 'unknown' && r[id].name === 'Player parent'));
});
test('departed parents retain generations for existing descendants and pending hatches', () => {
  const { save, c, other, egg } = fixture(); other.generation = 8; c.generation = 9;
  c.lineage = { risk: 'none', label: 'No Risk', parentCreatureIds: [other.creatureId], parentNames: [other.nickname], traits: [], notes: [] };
  const archived = preserveFamilyArchive(save), departed = { ...archived, creatures: archived.creatures!.filter(r => r.creatureId !== other.creatureId) };
  assert.equal(normalizeTrackedCreatureGenerations(departed).creatures!.find(r => r.creatureId === c.creatureId)!.generation,9);
  assert.equal(getCorrectOffspringGeneration(departed,[other.creatureId]),9);
  const result = hatchEgg(departed, egg.eggId)!; assert.equal(result.creature.generation,9);
  assert.equal(result.save.familyArchive!.records[creatureFamilyId(result.creature.creatureId)].generation,9);
});
test('central save retains removed records using the prior slot, and never mixes different save identities', () => {
  const memory = new Map<string,string>(), storage = { getItem: (k:string) => memory.get(k) ?? null, setItem: (k:string,v:string) => memory.set(k,v), removeItem: (k:string) => memory.delete(k), key: (n:number) => [...memory.keys()][n] ?? null, get length() { return memory.size; } };
  Object.defineProperty(globalThis, 'window', { value: { localStorage: storage }, configurable: true });
  try {
    const { save, c } = fixture(); const saved = saveGameToSlot(save);
    const removed = { ...saved, familyArchive: undefined, creatures: saved.creatures!.filter(x => x.creatureId !== c.creatureId), creatureIds: saved.creatureIds.filter(id => id !== c.creatureId) };
    saveGameToSlot(removed); const loaded = loadSaveFromSlot(0)!; assert.ok(loaded.familyArchive!.records[creatureFamilyId(c.creatureId)]);
    const imported = importPortableSaveToSlot(exportPortableSave(loaded),1); assert.equal(imported.ok,true); assert.ok(imported.save!.familyArchive!.records[creatureFamilyId(c.creatureId)]);
    const unrelated = { ...removed, saveId: 'different_save' as never, creatures: [], creatureIds: [], familyArchive: undefined, eggs: [], birthHistory: [] };
    assert.equal(Object.keys(buildFamilyArchive(unrelated, saved).records).length, 0);
  } finally { Reflect.deleteProperty(globalThis, 'window'); }
});
const person = (id: string, parents: string[] = []): FamilyRecord => ({ id, name: id, kind: 'creature', parents, parentageRecorded: !!parents.length, notes: [], markers: [] });
test('multiple partners use distinct parent junctions; shared ancestors have one node and correct child edges', () => {
  const records = Object.fromEntries([person('a'),person('b'),person('c'),person('one',['a','b']),person('two',['a','c']),person('three',['a','b']),person('grandchild',['one','two'])].map(r => [r.id,r]));
  const g = layoutFamilyTree(records, new Set(Object.keys(records)));
  assert.equal(g.nodes.length, 7); assert.equal(g.paths.length, 3);
  assert.deepEqual(g.paths.find(p => p.id === '["a","b"]')!.children.sort(), ['one','three']);
  assert.deepEqual(g.paths.find(p => p.id === '["a","c"]')!.children, ['two']);
  assert.ok(g.nodes.every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
  assert.equal(g.omittedCycles, 0);
});
test('thousand-generation layout, progressive branches, and corrupt cycles terminate without losing saved links', () => {
  const records: Record<string, FamilyRecord> = {};
  for (let i = 0; i < 1200; i++) records[`n${i}`] = person(`n${i}`, i ? [`n${i-1}`] : []);
  assert.equal(familyNeighborhood(records,'n1199',new Set(['n1199'])).size,2);
  assert.equal(layoutFamilyTree(records,new Set(Object.keys(records))).nodes.length,1200);
  const cycle = { a: person('a',['b']), b: person('b',['a']) }, before = structuredClone(cycle);
  assert.ok(layoutFamilyTree(cycle,new Set(['a','b'])).omittedCycles > 0); assert.deepEqual(cycle,before);
});
