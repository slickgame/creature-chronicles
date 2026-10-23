import s from './NurseryScenic.module.css';
export function NurseryScene({egg,alt}:{egg?:string;alt:string}){
 return <div className={s.stage} data-nursery-stage>
  <img className={s.cradle} src="/images/ui/nursery-scenic-a/cradle.webp" alt=""/>
  {egg&&<img className={s.stageEgg} src={egg} alt={alt}/>}
  <img className={`${s.cradle} ${s.cradleFront}`} src="/images/ui/nursery-scenic-a/cradle.webp" alt=""/>
 </div>;
}
