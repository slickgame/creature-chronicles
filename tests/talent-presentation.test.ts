import test from 'node:test';
import assert from 'node:assert/strict';
import {getAllTalentDefinitions} from '@/data/talents/talentDefinitions';
import {getTalentPresentation,getCreatureTalentPresentations,CORE_TALENT_ICON_IDS} from '@/data/talents/talentPresentation';
import {createGeneralTalent} from '@/data/talents/generalTalents';
import {createGuardDog} from '@/data/talents/guardDog';
import {getFarmSecurity} from '@/data/farmSecurity';
import {createNewGameSave} from './helpers/establishedSave.ts';

test('all registered talents and all owned grades have finite, read-only presentation data',()=>{
 const definitions=getAllTalentDefinitions(),before=structuredClone(definitions);assert.equal(definitions.length,83);
 for(const d of definitions)for(const grade of ['F','D','C','B','A','S'] as const){const talent={id:d.id,name:d.name,source:d.source,grade,description:d.exactDescriptionByGrade[grade]},copy=structuredClone(talent),p=getTalentPresentation(talent);assert.ok(p.known);assert.deepEqual(p.effects.map(e=>e.value),d.gradeEffects[grade].map(e=>e.value));assert.ok(p.effects.every(e=>Number.isFinite(e.value)&&e.label&&e.when&&e.appliesTo.length));assert.ok(p.sourceLabel);assert.deepEqual(talent,copy);}
 assert.deepEqual(definitions,before);
});
test('Eager Learner covers recipes; yield and cost talents remain gathering-only',()=>{
 const xp=getTalentPresentation(createGeneralTalent('eager_learner','C'));assert.equal(xp.effectSummary,'+10% matching work-skill XP');assert.deepEqual(xp.appliesTo,['Harvesting','Material Gathering','Husbandry','Hunting','Crafting','Cooking']);
 for(const id of ['diligent','efficient_worker']){const p=getTalentPresentation(createGeneralTalent(id,'S'));assert.ok(!p.appliesTo.includes('Cooking'));assert.ok(!p.appliesTo.includes('Crafting'));}
 assert.equal(getTalentPresentation(createGeneralTalent('sure_strike','A')).effectSummary,'+6 Physical Power');
 const sleep=getTalentPresentation(createGeneralTalent('sound_sleeper','D'));assert.equal(sleep.effectSummary,'Extra daily recovery: 8% of max Energy');assert.match(sleep.effects[0].notes.join(' '),/maximum Energy itself does not increase/);
});
test('legacy inactive effects stay explicit and never enter active numeric summaries',()=>{
 const defs=getAllTalentDefinitions();let planned=0,retired=0;
 for(const d of defs){const p=getTalentPresentation({id:d.id,name:d.name,grade:'C',source:d.source,description:''});for(const e of p.effects){if(e.type.startsWith('inheritance-')){planned++;assert.equal(e.status,'planned');assert.ok(!p.activeEffects.includes(e));}if(e.appliesTo.includes('Former Security Patrol')||e.appliesTo.includes('Former Comfort Care')){retired++;assert.equal(e.status,'retired');assert.ok(!p.activeEffects.includes(e));}}}
 assert.ok(planned>0);assert.ok(retired>0);
});
test('Guard Dog current condition matches the farm engine including residency and stronger candidates',()=>{
 const save=createNewGameSave('Talent details',0),dog=save.creatures!.find(c=>c.variantId==='variant_base_canine')!;dog.abilities=[createGuardDog('C')];
 const before=structuredClone(save),p=getTalentPresentation(dog.abilities[0],{save,creature:dog});assert.match(p.condition!,new RegExp(`Currently contributing \\+${getFarmSecurity(save).guard!.bonus}`));assert.deepEqual(save,before);
 const second=structuredClone(dog);second.creatureId='stronger-dog';second.nickname='Stronger dog';second.abilities=[createGuardDog('S')];save.creatures!.push(second);save.habitats!.find(h=>h.creatureIds.includes(dog.creatureId))!.creatureIds.push(second.creatureId);
 assert.match(getTalentPresentation(dog.abilities[0],{save,creature:dog}).condition!,/Stronger dog provides/);
 for(const h of save.habitats!)h.creatureIds=h.creatureIds.filter(id=>id!==dog.creatureId);
 assert.match(getTalentPresentation(dog.abilities[0],{save,creature:dog}).condition!,/Not contributing: requires/);
});
test('unknown and malformed saved talents preserve descriptions without claiming active effects',()=>{
 const unknown={id:'unknown_saved',name:'Saved talent',grade:'C' as const,source:'future' as const,description:'Original saved description.'};const p=getTalentPresentation(unknown);assert.equal(p.known,false);assert.equal(p.effectSummary,unknown.description);assert.equal(p.activeEffects.length,0);assert.equal(p.hasDedicatedIcon,false);
 const malformed={...createGeneralTalent('eager_learner'),grade:'Z'};assert.equal(getTalentPresentation(malformed as never).known,false);
 const c=createNewGameSave('Duplicate view',0).creatures![0];c.abilities=[createGeneralTalent('eager_learner'),createGeneralTalent('eager_learner')];const before=structuredClone(c);assert.equal(getCreatureTalentPresentations(c).length,1);assert.deepEqual(c,before);assert.equal(new Set(CORE_TALENT_ICON_IDS).size,10);
});
