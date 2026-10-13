import test from 'node:test';
import assert from 'node:assert/strict';
import { runEquipmentBattleBalance } from '../scripts/equipment-battle-balance.ts';
import { createNewGameSave } from '@/lib/save/localSave';
import { createBattleState } from '@/data/battleEngine';
import { applyBattleOutfitterLoadouts } from '@/data/battleOutfitterIntegration';
import { getEquippedBattleStats } from '@/data/equipmentComparison';
import { purchaseBattleOutfitterItem, assignBattleOutfitterEquipment } from '@/data/battleOutfitter';
import { getEquipmentCopies, enhanceEquipment } from '@/data/equipmentInstances';

test('battle balance runs reproduce identical starter talents, matched seeds and acquisition costs',()=>{
 const a=runEquipmentBattleBalance(2,1),b=runEquipmentBattleBalance(2,1);
 assert.deepEqual(a,b);assert.equal(a.rows.length,28);
 for(const r of a.rows){assert.equal(r.wins+r.losses+r.timeouts,2);assert.ok(r.averageRounds<=60);}
 assert.equal(a.rows.find(r=>r.kit==='weapons'&&r.level===3)!.goldCost,309);
 assert.equal(a.rows.find(r=>r.kit==='full-common'&&r.level===6)!.goldCost,3225);
});

test('preparation stats match the actual new battle with an enhanced equipped copy',()=>{
 let s=createNewGameSave('Prep',0);s=purchaseBattleOutfitterItem(s,'training_grips').save;
 const copy=getEquipmentCopies(s,'training_grips')[0];
 for(let n=0;n<3;n++)s=enhanceEquipment(s,copy.id,n).save;
 const c=s.creatures![0];s=assignBattleOutfitterEquipment(s,c.creatureId,'training_grips',copy.id).save;
 const snapshot=JSON.stringify(s),stats=getEquippedBattleStats(s,c);
 const battle=applyBattleOutfitterLoadouts(s,createBattleState({battleId:'prep-proof',playerCreatures:[c],enemyCreatures:[s.creatures![1]]}));
 assert.deepEqual(stats,battle.combatants[battle.teams.player.combatantIds[0]].battleStats);assert.equal(JSON.stringify(s),snapshot);
});
