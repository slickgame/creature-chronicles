import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameSave} from './helpers/establishedSave';
import {renameOwnedCreature} from '@/data/creatureNaming';

test('rename validates before writing and preserves the rest of the exact creature and save',()=>{
  const save=createNewGameSave('Naming QA',0),before=structuredClone(save),id=save.creatures![0].creatureId;
  for(const name of ['', '    ', 'x'.repeat(25)]){const r=renameOwnedCreature(save,id,name);assert.equal(r.ok,false);assert.equal(r.save,save);}
  assert.equal(renameOwnedCreature(save,'departed-id','New name').save,save);
  assert.equal(renameOwnedCreature(save,id,save.creatures![0].nickname).save,save);
  const result=renameOwnedCreature(save,id,'  Mira Rose  ');assert.ok(result.ok);
  assert.deepEqual(result.save.creatures![0],{...save.creatures![0],nickname:'Mira Rose'});
  assert.deepEqual(result.save.creatures!.slice(1),save.creatures!.slice(1));
  const expected={...save,creatures:result.save.creatures,flags:{...save.flags,m3CreatureRenamed:true,m9RenamePolishUsed:true}};
  assert.deepEqual(result.save,expected);assert.deepEqual(save,before);
  assert.ok(renameOwnedCreature(save,id,'x'.repeat(24)).ok);
});
