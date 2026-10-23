import type {CSSProperties} from 'react';
import s from './NurseryScenic.module.css';
export function NurseryScene({egg,alt,hatching=false}:{egg?:string;alt:string;hatching?:boolean}){
 return <div className={s.stage} data-nursery-stage>
  <img className={s.cradle} src="/images/ui/nursery-scenic-a/cradle.webp" alt=""/>
  {egg&&<div className={`${s.eggLayers} ${hatching?s.eggHatching:''}`} key={egg} style={{'--egg-mask':`url("${egg}")`} as CSSProperties}>
   {hatching&&<img className={s.hatchHalo} src="/images/ui/nursery-scenic-a/polish-v1/effects/hatch-halo.webp" alt=""/>}
   <img className={s.stageEgg} src={egg} alt={alt}/>
   {hatching&&<><span className={s.hatchBloom} aria-hidden="true"/><span className={s.hatchCracks} data-nursery-fractures aria-hidden="true"/><span className={s.hatchMotes} aria-hidden="true"/></>}
  </div>}
  <img className={`${s.cradle} ${s.cradleFront}`} src="/images/ui/nursery-scenic-a/cradle.webp" alt=""/>
 </div>;
}
