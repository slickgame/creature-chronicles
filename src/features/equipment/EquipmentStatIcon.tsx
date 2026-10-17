import type {CSSProperties} from 'react';
import type {BattleStatKey} from '@/types/battle';
import s from './EquipmentStatIcon.module.css';

// Row-major positions in the approved sculpted ivory/gold production atlas.
const glyphs = ['maxHp','physicalPower','specialPower','defense','resistance','speed','accuracy','statusPower','statusResist','battleEnergy','inventory','equip'] as const;
export function EquipmentStatIcon({name}:{name:BattleStatKey|'inventory'|'equip'}) {
 const index=glyphs.findIndex(key=>key===name);
 if(index<0)return null; // Evasion is a creature stat, never an equipment glyph.
 return <span aria-hidden="true" data-equipment-glyph={name} className={s.icon} style={{'--glyph-x':`${index%4*100/3}%`,'--glyph-y':`${Math.floor(index/4)*50}%`} as CSSProperties}/>;
}
