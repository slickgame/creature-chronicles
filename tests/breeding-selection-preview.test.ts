import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getBreedingParticipants} from '@/data/breeding';
import {createGeneralTalent} from '@/data/talents/generalTalents';
import {getInheritancePairBlocker,getInheritanceReviewTarget,getInheritancePartnerPreviews,rankInheritancePartners} from '@/data/breedingPartnerRanking';
import {getTalentInheritanceOdds} from '@/data/genetics';
import {getBattleMoveInheritancePreview} from '@/data/battleMoveInheritance';
import {getBreedingInheritancePreview,getBreedingSelectionBlocker} from '@/data/breedingSelectionPreview';
test('candidate selection keeps original role, duplicate and availability guards with explicit blockers',()=>{
 const save=createNewGameSave('Parents',0),p=getBreedingParticipants(save)[1];
 for(const role of ['giver','receiver']as const){for(const canBreed of [true,false]){for(const other of [null,p.participantId]){const c={...p,canBreed,unavailableReason:canBreed?null:'Training away'};assert.equal(!getBreedingSelectionBlocker(c,role,other),other!==p.participantId&&canBreed&&p.roleTags.includes(role));}}}
 assert.match(getBreedingSelectionBlocker({...p,roleTags:[]},'giver',null)!,/giver role/);assert.match(getBreedingSelectionBlocker({...p,canBreed:false,unavailableReason:'Training away'},'giver',null)!,/Training away/);assert.ok(getBreedingSelectionBlocker(undefined,'giver',null));
});
test('inheritance previews are read-only and match actual talent and move probability helpers',()=>{
 const save=createNewGameSave('Preview',0),[a,b]=save.creatures!,before=structuredClone(save);const model=getBreedingInheritancePreview(save,a.creatureId,b.creatureId);assert.equal(model.valid,true);const parents=getBreedingParticipants(save);assert.deepEqual(model.odds,getTalentInheritanceOdds(save,parents.find(p=>p.creatureId===a.creatureId)!,parents.find(p=>p.creatureId===b.creatureId)!));assert.deepEqual(model.moves,getBattleMoveInheritancePreview(save,a.creatureId,b.creatureId));assert.deepEqual(save,before);assert.deepEqual(getBreedingInheritancePreview(save,a.creatureId,b.creatureId),model);
});
test('incomplete, duplicate and player pairs do not claim creature-to-creature inheritance odds',()=>{
 const save=createNewGameSave('Incomplete',0),id=save.creatures![0].creatureId;for(const pair of [[null,null],[id,id],['player',id],[id,null]]as const){const model=getBreedingInheritancePreview(save,...pair);assert.equal(model.valid,false);assert.equal(model.odds,null);}
});


test('partner rankings use exact grades and exclude partners who cannot afford the attempt', () => {
  const save = createNewGameSave('Ranking', 0);
  const [fixed, source] = save.creatures!;
  fixed.energy = source.energy = 100;
  fixed.hearts = source.hearts = 5;
  fixed.affection = source.affection = 50;
  fixed.abilities = [];
  source.abilities = [createGeneralTalent('light_footed', 'S')];
  const second = { ...source, creatureId: 'rank_b' as typeof source.creatureId, nickname: 'Second',
    abilities: [createGeneralTalent('light_footed', 'B')] };
  const exhausted = { ...source, creatureId: 'rank_exhausted' as typeof source.creatureId,
    energy: 0, nickname: 'Exhausted' };
  save.creatures = [fixed, source, second, exhausted];
  const before = structuredClone(save);
  const previews = getInheritancePartnerPreviews(save, fixed.creatureId, 'giver');
  assert.deepEqual(previews.map(row => row.partner.participantId), [source.creatureId, second.creatureId]);
  const s = rankInheritancePartners(previews, { kind: 'talent', id: 'light_footed', grade: 'S' });
  const b = rankInheritancePartners(previews, { kind: 'grade', grade: 'B' });
  assert.deepEqual(s.map(row => row.partner.participantId), [source.creatureId, second.creatureId]);
  assert.deepEqual(b.map(row => row.partner.participantId), [second.creatureId, source.creatureId]);
  assert.ok(s[0].chance > s[1].chance && s[1].chance > 0);
  assert.ok(b[0].chance > b[1].chance && b[1].chance > 0);
  const participants = getBreedingParticipants(save);
  const giver = participants.find(p => p.participantId === fixed.creatureId)!;
  const receiver = participants.find(p => p.participantId === source.creatureId)!;
  const focus = { target: { kind: 'talent', id: 'light_footed', grade: 'S' }, label: 'Light-Footed · Grade S' } as const;
  assert.deepEqual(getInheritanceReviewTarget(save, giver, receiver, focus), { ...focus, chance: s[0].chance });
  assert.equal(getInheritanceReviewTarget(save, giver, receiver, {
    target: { kind: 'move', id: 'parent-missing' }, label: 'Unavailable move',
  }).chance, 0);
  assert.deepEqual(save, before);
});


test("ranked selection rechecks a pair after the roster or resources change", () => {
  const save = createNewGameSave("Selection", 0);
  const [a, b] = save.creatures!;
  a.energy = b.energy = 100;
  a.hearts = b.hearts = 5;
  const parents = () => getBreedingParticipants(save).filter(p => p.kind === "creature");
  const [giver, receiver] = parents();
  assert.equal(getInheritancePairBlocker(save, giver, receiver), null);
  assert.match(getInheritancePairBlocker(save, giver, giver)!, /other role/);
  assert.ok(getInheritancePairBlocker(save, giver, undefined));
  b.energy = 0;
  assert.ok(getInheritancePairBlocker(save, giver, parents()[1]));
});
