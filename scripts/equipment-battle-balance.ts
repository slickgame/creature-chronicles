import { createStarterCreatures } from '@/data/creatures';
import { applyCreatureLevelGrowth, getProjectedMaxEnergyForCreature } from '@/data/levelGrowth';
import { createNewGameSave } from '@/lib/save/localSave';
import { purchaseBattleOutfitterItem, assignBattleOutfitterEquipment, type BattleOutfitterItemId } from '@/data/battleOutfitter';
import { getEquipmentCopies, enhanceEquipment } from '@/data/equipmentInstances';
import { applyBattleOutfitterLoadouts } from '@/data/battleOutfitterIntegration';
import { createBattleState, resolveBattleRound } from '@/data/battleEngine';
import { buildBattleAiPlan } from '@/data/battleAi';
import { COLISEUM_C2_ENCOUNTERS, buildAuthoredColiseumEnemyTeam, applyAuthoredColiseumEquipment } from '@/data/coliseumC2';

export type EquipmentRollProfile = 'random' | 'low' | 'typical' | 'high';
/** Paired profiles share stat choices; only increment size changes. */
export function equipmentAuditRandom(profile:EquipmentRollProfile,seed:number){
 let state=seed>>>0,draw=0;
 return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;const value=state/4294967296;
  return draw++%2===0||profile==='random'||profile==='typical'?value:profile==='low'?0:1-Number.EPSILON;
 };
}
const COMMON_SET: BattleOutfitterItemId[] = ['training_grips','padded_harness','linen_headband','practice_wraps','keepsake_charm'];
export function runEquipmentBattleBalance(samples = 24, teamLevel = 1, rosterIndices = [0, 1, 2], rollProfile:EquipmentRollProfile = 'random') {
  const base=createNewGameSave('Equipment battle audit',0);
  base.saveId='equipment-battle-audit' as typeof base.saveId;
  base.creatures=createStarterCreatures(base.saveId);
  base.creatures=base.creatures.map(c=>{const growth=applyCreatureLevelGrowth(c,Math.max(0,teamLevel-c.level),[],`audit_growth_${c.creatureId}`);const leveled={...c,level:teamLevel,stats:growth.stats,growthProgress:growth.growthProgress};const maxEnergy=getProjectedMaxEnergyForCreature(leveled);return {...leveled,maxEnergy,energy:maxEnergy};});
  base.creatures=rosterIndices.map(i=>base.creatures![i]);
  const rows=[];
  for(const kit of ['none','weapons','full-common'] as const){
    for(const level of kit==='none'?[0]:[0,3,6]){
      const saves=Array.from({length:samples},(_,seed)=>{
       let save=structuredClone(base);save.currencies.gold=100000;
       const equipmentRandom=equipmentAuditRandom(rollProfile,1729+seed*7919);
      for(const creature of save.creatures!.slice(0,3)){
        for(const id of kit==='none'?[]:kit==='weapons'?['training_grips' as const]:COMMON_SET){
          const purchase=purchaseBattleOutfitterItem(save,id);if(!purchase.ok)throw Error(purchase.message);save=purchase.save;
          const copy=getEquipmentCopies(save,id).find(c=>!c.owner)!;
          for(let n=0;n<level;n++){const enhanced=enhanceEquipment(save,copy.id,n,equipmentRandom);if(!enhanced.ok)throw Error(enhanced.message);save=enhanced.save;}
          const equipped=assignBattleOutfitterEquipment(save,creature.creatureId,id,copy.id);if(!equipped.ok)throw Error(equipped.message);save=equipped.save;
        }
      }
       return save;
      });
      const goldCost=100000-saves[0].currencies.gold;
      for(const encounter of COLISEUM_C2_ENCOUNTERS.slice(0,4)){
        let wins=0,losses=0,timeouts=0,totalRounds=0,totalSurvivors=0;
        for(let seed=0;seed<samples;seed++){
          const save=saves[seed];
          let state=applyBattleOutfitterLoadouts(save,applyAuthoredColiseumEquipment(createBattleState({battleId:`audit_${encounter.encounterId}_${seed}`,playerCreatures:save.creatures!.slice(0,3),enemyCreatures:buildAuthoredColiseumEnemyTeam(save.saveId,encounter)}),encounter));
          let rounds=0;
          while(state.outcome==='ongoing'&&rounds<60){
            const player=buildBattleAiPlan(state,'player','tactical'),enemy=buildBattleAiPlan(state,'enemy',encounter.aiDifficulty);
            state=resolveBattleRound(state,[...player.actions,...enemy.actions]).state;rounds++;
          }
          if(state.outcome==='player_won')wins++;else if(state.outcome==='enemy_won')losses++;else timeouts++;
          totalRounds+=rounds;totalSurvivors+=state.teams.player.combatantIds.filter(id=>!state.combatants[id].isFainted).length;
        }
        rows.push({teamLevel,kit,level,goldCost,encounter:encounter.name,recommendedLevel:encounter.recommendedLevel,samples,wins,losses,timeouts,averageRounds:Math.round(totalRounds/samples*10)/10,averageSurvivors:Math.round(totalSurvivors/samples*10)/10});
      }
    }
  }
  return {rollProfile,method:`Fixed first three starters at the selected level using normal stat growth and move loadouts; tactical player AI versus authored enemy AI; matched battle IDs across loadouts; paired seeded equipment stat choices per sample, increment profile ${rollProfile}; no consumables, training, level gains or rewards; 60-round cap. Seeds sample deterministic rolls, not human win probabilities. Typical uses uniformly sampled increments, not a guaranteed population average.`,team:base.creatures!.slice(0,3).map(c=>({name:c.nickname,level:c.level})),rows};
}
if(process.argv[1]?.endsWith('equipment-battle-balance.ts'))console.log(JSON.stringify([runEquipmentBattleBalance(24,1),runEquipmentBattleBalance(24,4),runEquipmentBattleBalance(24,4,[0,2,3])],null,2));
