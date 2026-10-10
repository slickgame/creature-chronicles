import type { BattleStatusId, BattleStatusStack } from "@/types/battle";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import { BATTLE_STAT_LABELS } from "@/data/equipmentComparison";
import s from "./BattleArenaB.module.css";

const STATUS_CELL: Record<BattleStatusId, [number, number]> = {
  bleed:[0,0], stun:[1,0], guarded:[2,0], inspired:[0,1], marked:[1,1],
  taunted:[2,1], exhausted:[0,2], weakened:[1,2], slowed:[2,2],
};
export function statusLabel(effect:BattleStatusStack) {
  return `${getBattleStatusGlossary(effect.status).label}${effect.stat?` · ${BATTLE_STAT_LABELS[effect.stat]}`:""}`;
}
export function StatusIcon({status}:{status:BattleStatusId}) {
  const [x,y]=STATUS_CELL[status];
  return <span className={s.statusIcon} aria-hidden="true" style={{backgroundPosition:`${x*50}% ${y*50}%`}}/>;
}
export function BattleStatusBadges({name,effects,onOpen}:{name:string;effects:BattleStatusStack[];onOpen:()=>void}) {
  const active=effects.filter(e=>e.duration>0);
  return <div className={s.statusBadges} aria-label={`${name} active effects`}>{active.slice(0,2).map((e,i)=><button key={`${e.status}-${e.stat??"all"}-${i}`} title={`${statusLabel(e)} · ${e.duration} rounds · ${e.stacks??1} stack(s)`} aria-label={`${name}: ${statusLabel(e)}, ${e.duration} rounds. View active effects`} onClick={onOpen}><StatusIcon status={e.status}/><b>{e.duration}</b></button>)}{active.length>2&&<button className={s.moreStatuses} aria-label={`All ${active.length} active effects on ${name}`} title={`${active.length-2} more effects`} onClick={onOpen}>…</button>}</div>;
}
