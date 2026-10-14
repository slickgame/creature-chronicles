/** Explicit established-ranch fixture for combat/breeding regressions requiring multiple families.
 * New-game progression is tested against the production factory in ranch-progression.test.ts. */
import {createNewGameSave as createFreshSave} from '@/lib/save/localSave';
import {createStarterCreatures,createStarterHabitats} from '@/data/creatures';
import {normalizeCreatureManagementMetadata} from '@/data/creatureManagement';
import {normalizeCreatureBattleMoveLoadoutRecord} from '@/data/battleLoadouts';
import {getProjectedMaxEnergyForCreature} from '@/data/levelGrowth';
import {normalizeCreatureChoreSkills} from '@/data/choreSkills';
export * from '@/lib/save/localSave';
export function createNewGameSave(name:string,slot:number){
 const save=createFreshSave(name,slot);
 const creatures=createStarterCreatures(save.saveId).map(c=>normalizeCreatureBattleMoveLoadoutRecord({...c,maxEnergy:getProjectedMaxEnergyForCreature(c),energy:Math.min(c.energy,getProjectedMaxEnergyForCreature(c)),choreSkills:normalizeCreatureChoreSkills(c)}));
 const habitats=createStarterHabitats();
 return normalizeCreatureManagementMetadata({...save,creatures,creatureIds:creatures.map(c=>c.creatureId),habitats,habitatIds:habitats.map(h=>h.habitatId),flags:{...save.flags,ranchStartVersion:1,felineHabitatUnlocked:true,canineHabitatUnlocked:true,bovineHabitatUnlocked:true,lapineHabitatUnlocked:true,equineHabitatUnlocked:true}});
}
