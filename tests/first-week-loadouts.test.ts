import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFirstWeekFarm,runFirstWeekLoadouts} from '../scripts/first-week-loadouts';
test('first-week route reconciles all Gold, pays two projects and feeds every night',()=>{
 const a=buildFirstWeekFarm(),b=buildFirstWeekFarm();
 assert.deepEqual(a.days,b.days);assert.deepEqual(a.food,b.food);
 assert.equal(a.startGold+a.deliveryGold-a.constructionGold+a.otherGold,a.save.currencies.gold);
 assert.equal(a.deliveryGold,100);assert.equal(a.constructionGold,420);
 assert.equal(a.save.flags.farmWorkActions,21);
 assert.ok(a.save.flags.farmResourcesV1);for(const d of a.days){assert.equal(d.shortage,0);assert.equal(d.required,d.covered);assert.ok(d.gold>=0);}
});
test('accepted first-week loadouts pay real costs, cover food, and reject unaffordable sets',()=>{
 const result=runFirstWeekLoadouts(2);assert.ok(result.facilities.quarry);assert.ok(result.facilities.sawmill);
 for(const row of result.rows){assert.equal(row.balance,result.endGold-row.cost);assert.equal(row.afterFood,row.balance-result.food.topUpGold);if(row.accepted){assert.ok(row.afterFood>=0);for(const b of row.battles)assert.equal(b.wins+b.losses+b.timeouts,2);}else assert.equal(row.battles.length,0);}
 assert.equal(result.rows.find(r=>r.name==='Three weapons +3')!.cost,309);
 assert.equal(result.rows.find(r=>r.name==='Three weapons +3')!.dayOneAfterPlan,191);
 assert.equal(result.rows.find(r=>r.name==='Three common sets +6')!.accepted,false);
});
