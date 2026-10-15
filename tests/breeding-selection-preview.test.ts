import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {getBreedingParticipants} from '@/data/breeding';
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
