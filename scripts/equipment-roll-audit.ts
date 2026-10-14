import {runEquipmentBattleBalance, type EquipmentRollProfile} from './equipment-battle-balance';
const profiles:EquipmentRollProfile[]=['low','typical','high'];
const reports=[1,4].flatMap(level=>profiles.map(profile=>runEquipmentBattleBalance(24,level,[0,1,2],profile)));
console.log(JSON.stringify(reports,null,2));
