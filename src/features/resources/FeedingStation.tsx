"use client";

import {useMemo,useRef,useState} from 'react';
import {useGameContext} from '@/state/GameProvider';
import {GameDialog} from '@/features/ui/GameDialog';
import {PagedItems} from '@/features/ui/PagedItems';
import {IngredientCounter} from '@/features/builder/IngredientCounter';
import {ProductionBook,type ProductionSection} from './ProductionBook';
import {ResourceShelf} from './ResourceShelf';
import {getNightCareReview} from '@/data/nightCareReview';
import {getVariantDefinition} from '@/data/creatures';
import {getCreatureManagementStatus} from '@/data/creatureManagement';
import {getResourceArt} from '@/data/resourceArt';
import {AUTOMATIC_FOODS,RESOURCES,RESOURCE_IDS,creatureDiet,getFarmState,reserveResource,resourceList,setAutomaticFood,setIngredientFeeding,type AutomaticFood,type ResourceId,type FarmResult} from '@/data/farmResources';
import s from './FeedingStation.module.css';

type View='hub'|'meals'|'supplies';
type Food=ResourceId|'legacy_feed';
type Review={snapshot:string;food:Food;reserve:number;allowed:boolean;raw?:boolean};
const KIT='/images/ui/feeding-station-connected';
const POLISH=`${KIT}/polish-v2`;
const PAINTED='/images/ui/creature-overview-a-v2/painted-r4';
const FOOD_ORDER:ResourceId[]=['vegetables','wheat','meat','rations','eggs','milk',...RESOURCE_IDS.filter(id=>RESOURCES[id].category==='Meals')];
const name=(id:Food)=>id==='legacy_feed'?'Older Feed':RESOURCES[id].name;
const art=(id:Food)=>getResourceArt(id==='legacy_feed'?'rations':id);
const isAutomatic=(id:Food):id is AutomaticFood=>AUTOMATIC_FOODS.includes(id as AutomaticFood);
// These clocks run only in event handlers, never while constructing a view.
function eventTime(){return Date.now();}
function confirmationReady(opened:number){return Date.now()-opened>=250;}

export function FeedingStation({onBack,onSection}:{onBack:()=>void;onSection:(section:'Security'|'Budget')=>void}){
 const {currentSave:save,saveCurrentGame}=useGameContext();
 const [view,setView]=useState<View>('hub');
 const [residentId,setResidentId]=useState(''),[food,setFood]=useState<Food>('vegetables');
 const [focus,setFocus]=useState<'list'|'selected'>('list');
 const [draftReserve,setDraftReserve]=useState('0'),[draftAllowed,setDraftAllowed]=useState(true);
 const [popup,setPopup]=useState<'permissions'|'review'|'receipt'|'sources'|'rules'|null>(null);
 const [permission,setPermission]=useState('raw'),[draftRaw,setDraftRaw]=useState(false),[policyAllowed,setPolicyAllowed]=useState(true);
 const [quote,setQuote]=useState<Review|null>(null),[message,setMessage]=useState(''),[rule,setRule]=useState(0);
 const [route,setRoute]=useState<'production'|'buy'|'storage'|null>(null);
 const [production,setProduction]=useState<ProductionSection>('Kitchen');
 const opened=useRef(0),busy=useRef(false);
 const tonight=useMemo(()=>save?getNightCareReview(save):null,[save]);
 if(!save||!tonight)return null;
 const farm=getFarmState(save),residents=tonight.creatures;
 const resident=residents.find(r=>r.before.creatureId===residentId)??residents[0];
 const selected=resident?.before,meal=resident?.meal;
 const foodIds:Food[]=[...FOOD_ORDER,...(Number(save.flags.ranchFeedStock)>0||farm.excludedFoods?.includes('legacy_feed')?['legacy_feed' as const]:[])];
 const owned=food==='legacy_feed'?Math.max(0,Number(save.flags.ranchFeedStock)||0):farm.stock[food]??0;
 const reserved=food==='legacy_feed'?0:farm.reserves[food]??0;
 const allowed=!farm.excludedFoods?.includes(food);
 const validReserve=/^\d+$/.test(draftReserve)&&Number(draftReserve)<=9999;
 const changed=(food!=='legacy_feed'&&Number(draftReserve)!==reserved)||(isAutomatic(food)&&draftAllowed!==allowed);
 const title=view==='hub'?'Feeding Station':view==='meals'?'Creature Meals':'Food & Ingredients';
 const mealText=meal?[resourceList(meal.used),meal.legacyUsed?`${meal.legacyUsed} older Feed`:''].filter(Boolean).join(' + '):'';
 const fed=resident?.away?'Away with Rhea':meal&&meal.covered>=meal.required?'Fully fed':`Short by ${(meal?.required??0)-(meal?.covered??0)}`;
 function go(next:View){setView(next);setFocus('list');}
 function chooseFood(id:Food){setFood(id);setDraftReserve(String(id==='legacy_feed'?0:farm.reserves[id]??0));setDraftAllowed(!farm.excludedFoods?.includes(id));setFocus('selected');}
 function open(next:typeof popup){busy.current=false;opened.current=eventTime();setPopup(next);}
 function permissions(){setPermission('raw');setDraftRaw(!!farm.ingredientFeeding);setPolicyAllowed(true);setQuote({snapshot:JSON.stringify(save),food:'rations',reserve:0,allowed:true,raw:!!farm.ingredientFeeding});open('permissions');}
 function reviewFood(){if(!validReserve)return;setQuote({snapshot:JSON.stringify(save),food,reserve:Number(draftReserve),allowed:draftAllowed});open('review');}
 function commit(){
  if(!save||!quote||busy.current||!confirmationReady(opened.current))return;
  busy.current=true;
  if(quote.snapshot!==JSON.stringify(save)){setMessage('Your ranch changed. Review the current stock and feeding settings again.');setPopup('receipt');return;}
  let result:FarmResult;
  if(quote.raw!==undefined)result=setIngredientFeeding(save,quote.raw);
  else{
   result=isAutomatic(quote.food)?setAutomaticFood(save,quote.food,quote.allowed):{save,ok:true,message:''};
   if(result.ok&&quote.food!=='legacy_feed')result=reserveResource(result.save,quote.food,quote.reserve);
  }
  if(result.ok){
   const persisted=saveCurrentGame(result.save),a=getFarmState(persisted).stock,b=getFarmState(result.save).stock;
   const bonus=resourceList(Object.fromEntries(RESOURCE_IDS.map(id=>[id,(a[id]??0)-(b[id]??0)]).filter(([,n])=>Number(n)>0)));
   const gold=persisted.currencies.gold-result.save.currencies.gold,gp=persisted.currencies.guildPoints-result.save.currencies.guildPoints;
   const rewards=[bonus,gold?`${gold} Gold`:'',gp?`${gp} GP`:''].filter(Boolean);
   setMessage(`Settings saved. No food consumed. ${quote.raw!==undefined?`Raw ingredient feeding: ${quote.raw?'On':'Off'}.`:`${name(quote.food)}: ${isAutomatic(quote.food)?`automatic feeding ${quote.allowed?'allowed':'excluded'}. `:''}${quote.food==='legacy_feed'?'':`Reserve target ${quote.reserve}.`}`}${rewards.length?` Earned goal rewards: ${rewards.join(' + ')}.`:''}`);
  }else setMessage(result.message);
  setPopup('receipt');
 }
 function reviewPermission(){
  if(!quote)return;
  if(permission==='raw')setQuote({...quote,raw:draftRaw});
  else{const id=permission as AutomaticFood;setQuote({snapshot:quote.snapshot,food:id,reserve:id==='legacy_feed'?0:farm.reserves[id]??0,allowed:policyAllowed});}
  open('review');
 }
 const summary=<div className={s.summary}><img src={`${PAINTED}/creatures.webp`} alt=""/><div><strong>Creatures fed: {tonight.creaturesFed}/{tonight.creaturesEating}</strong><span>{tonight.covered} / {tonight.required} food units planned</span></div><p>Shared inventory · Consumed at sleep</p></div>;
 const rules=[
  'Food comes from shared inventory when you sleep. Viewing these screens never consumes it. Away trainees eat with Rhea and are excluded from the count.',
  'Allowed raw ingredients feed restricted diets before omnivores. Balanced rations and older Feed cover remaining needs. Raw ingredient feeding is opt-in.',
  'Reserves protect ingredients from feeding, recipes, sales, construction and deliveries. A reserve target may exceed current stock; it does not create food.',
  'Food exclusions affect only automatic feeding. Prepared bonus meals are served manually. Only underfed creatures receive hunger penalties; condition and talents also affect recovery.',
  'Tonight includes earned daily rewards processed before feeding. The seven-night Budget uses current stock only; it assumes no future production, rewards or arrivals.'
 ];
 return <main className={`${s.screen} ${view==='hub'?s.scenic:s.detail}`} onKeyDown={e=>{if(e.key==='Escape'&&view!=='hub'&&!popup&&!route){e.preventDefault();e.stopPropagation();go('hub');}}} data-feeding-station={view} data-farm-care-book>
  <div className={s.window}>
   <header className={s.header}><button aria-label={view==='hub'?'Back':'Back to Feeding Station'} onClick={view==='hub'?onBack:()=>go('hub')}><img src={`${KIT}/back.svg`} alt=""/><span>{view==='hub'?'Back':'Back to Feeding Station'}</span></button><h1>{title}</h1><button aria-label="Feeding guidance" onClick={()=>{setRule(0);open('rules');}}><img src={`${KIT}/menu.svg`} alt=""/></button></header>
   {view==='hub'?<div className={s.hub}>
    <div className={s.scenery} aria-label="Sunlit pantry"/>
    <section className={s.hubPanel} aria-label="Feeding Station actions">
     <nav className={s.tabs} aria-label="Care section"><button aria-current="page">Feeding</button><button onClick={()=>onSection('Security')}>Security</button><button onClick={()=>onSection('Budget')}>Budget</button></nav>
     {summary}
     <div className={s.actions}>
      <button onClick={()=>go('meals')}><img src={`${POLISH}/meals.webp`} alt=""/><span><b>Tonight’s meals</b><small>Review each creature’s planned food</small></span><img className={s.arrow} src={`${KIT}/chevron.svg`} alt=""/></button>
      <button onClick={()=>{go('supplies');chooseFood(food);setFocus('list');}}><img src={`${POLISH}/supplies.webp`} alt=""/><span><b>Food & ingredients</b><small>Available stock, reserves and permissions</small></span><img className={s.arrow} src={`${KIT}/chevron.svg`} alt=""/></button>
      <button onClick={()=>open('sources')}><img src={`${POLISH}/cooking.webp`} alt=""/><span><b>Food sources</b><small>Cook recipes, gather or buy supplies</small></span><img className={s.arrow} src={`${KIT}/chevron.svg`} alt=""/></button>
     </div>
     <footer className={s.hubFooter}><button onClick={permissions}><img src={`${KIT}/permissions.svg`} alt=""/>Food permissions</button><span>Raw ingredients: <b>{farm.ingredientFeeding?'On':'Off'}</b></span></footer>
     {tonight.shortage>0&&<p className={s.warning}>Short by {tonight.shortage} food units. Review tonight’s meals.</p>}
    </section>
   </div>:<>
    {summary}
    <nav className={s.focusTabs} aria-label={view==='meals'?'Meal view':'Supply view'}><button aria-pressed={focus==='list'} onClick={()=>setFocus('list')}>{view==='meals'?'Residents':'Supplies'}</button><button aria-pressed={focus==='selected'} onClick={()=>setFocus('selected')}>{view==='meals'?'Selected creature':'Selected ingredient'}</button></nav>
    <div className={s.split}>
     {view==='meals'?<>
      <section className={s.gallery} data-shown={focus==='list'} aria-label="Ranch residents">
       <div className={s.columns}><span>Creature</span><span>Level</span><span>Status</span><span>Meal</span></div>
       <PagedItems label="Ranch residents" rowHeight={66} maxPerPage={7} initialItemIndex={Math.max(0,residents.findIndex(r=>r.before.creatureId===residentId))} items={residents.map(r=>{
        const c=r.before,status=getCreatureManagementStatus(save,c).primaryStatus,full=!!r.meal&&r.meal.covered>=r.meal.required;
        return <button key={c.creatureId} className={s.resident} aria-pressed={selected?.creatureId===c.creatureId} aria-label={`Meal for ${c.nickname}`} onClick={()=>{setResidentId(c.creatureId);setFocus('selected');}}><span><img src={getVariantDefinition(c.variantId).portraitPath} alt=""/><b>{c.nickname}</b></span><span>Lv {c.level}</span><span>{status}</span><span data-good={full}>{r.away?'With Rhea':full?'Fully fed':`Short ${(r.meal?.required??0)-(r.meal?.covered??0)}`}</span></button>;
       })}/>{!residents.length&&<p>No creatures at the ranch.</p>}
      </section>
      <section className={s.inspector} data-shown={focus==='selected'} aria-label="Selected creature meal">
       {selected?<><div className={s.identity}><img src={getVariantDefinition(selected.variantId).portraitPath} alt={selected.nickname}/><div><h2>{selected.nickname} · Level {selected.level}</h2><p>{creatureDiet(selected)} · {getCreatureManagementStatus(save,selected).primaryStatus}</p></div></div><div className={s.meal}><h3>Planned meal</h3><div className={s.mealFoods}>{!resident.away&&Object.keys(meal?.used??{}).map(id=><img key={id} src={getResourceArt(id as ResourceId)} alt=""/>)}<p>{resident.away?'Eats with Rhea':mealText||'No food allocated'}</p></div>{!resident.away&&<strong>{meal?.covered??0} / {meal?.required??0} food units</strong>}<p className={resident.away||meal&&meal.covered>=meal.required?s.good:s.warning}>{fed}</p></div><p className={s.note}>Away creatures eat with Rhea and are excluded. Food is consumed at sleep.</p></>:<p>No resident selected.</p>}
      </section>
     </>:<>
      <section className={`${s.gallery} ${s.foodGallery}`} data-shown={focus==='list'} aria-label="Food supplies">
       <PagedItems label="Food supplies" rowHeight={128} maxPerPage={2} initialItemIndex={Math.floor(Math.max(0,foodIds.indexOf(food))/2)} items={Array.from({length:Math.ceil(foodIds.length/2)},(_,i)=><div className={s.foodPair} key={i}>{foodIds.slice(i*2,i*2+2).map(id=><button className={s.foodCard} key={id} aria-label={`Inspect ${name(id)}`} aria-pressed={id===food} onClick={()=>chooseFood(id)}><img src={art(id)} alt=""/><span><b>{name(id)}</b><small>{id==='legacy_feed'?Number(save.flags.ranchFeedStock)||0:farm.stock[id]??0} owned</small></span></button>)}</div>)}/>
      </section>
      <section className={s.inspector} data-shown={focus==='selected'} aria-label="Selected ingredient">
       <div className={s.foodIdentity}><img src={art(food)} alt=""/><h2>{name(food)}</h2></div>
       <dl className={s.amounts}><div><dt>Owned</dt><dd>{owned}</dd></div><div><dt>Reserved</dt><dd>{reserved}</dd></div><div><dt>Available</dt><dd>{Math.max(0,owned-reserved)}</dd></div></dl>
       {isAutomatic(food)?<><label className={s.check}><input type="checkbox" checked={draftAllowed} onChange={e=>setDraftAllowed(e.target.checked)}/>Allowed for automatic feeding</label>{food!=='rations'&&food!=='legacy_feed'&&!farm.ingredientFeeding&&<p className={s.note}>Raw feeding is off. Enable it in Food permissions.</p>}</>:<p className={s.note}>Manual bonus meal. Never consumed automatically.</p>}
       {food!=='legacy_feed'&&<label className={s.reserve}>Reserve quantity<div><button aria-label="Decrease reserve" disabled={Number(draftReserve)<=0} onClick={()=>setDraftReserve(String(Math.max(0,(Number(draftReserve)||0)-1)))}>−</button><input aria-label="Reserve quantity" type="number" min={0} max={9999} value={draftReserve} onChange={e=>setDraftReserve(e.target.value)}/><button aria-label="Increase reserve" disabled={Number(draftReserve)>=9999} onClick={()=>setDraftReserve(String(Math.min(9999,(Number(draftReserve)||0)+1)))}>+</button></div></label>}
       <button data-primary disabled={!changed||!validReserve} onClick={reviewFood}>Review changes</button>
       <p className={s.note}>{food==='legacy_feed'?'Older Feed has no reserve target; exclude it to protect it from automatic feeding.':'Reserves protect ingredients from feeding, recipes, sales, construction and deliveries.'}</p>
      </section>
     </>}
    </div>
    <footer className={s.footer}><button onClick={()=>{go(view==='meals'?'supplies':'meals');if(view==='meals')chooseFood(food);setFocus('list');}}>{view==='meals'?'Food & ingredients':'Creature meals'}</button><button onClick={()=>open('sources')}>Food sources</button><button onClick={permissions}>Food permissions</button></footer>
   </>}
  </div>
  {popup&&<GameDialog fullScreen title={popup==='review'?'Review feeding changes':popup==='permissions'?'Food permissions':popup==='sources'?'Food sources':popup==='rules'?'Feeding guidance':'Feeding receipt'} onClose={()=>{if(popup==='receipt')chooseFood(food);setPopup(null);}}><main className={`${s.screen} ${s.modal}`} data-feeding-popup={popup}><section className={s.modalPanel}><header className={s.header}><h2>{popup==='review'?'Review feeding changes':popup==='permissions'?'Food permissions':popup==='sources'?'Food sources':popup==='rules'?'Feeding guidance':'Feeding receipt'}</h2><button onClick={()=>setPopup(null)} aria-label="Close feeding window">Close ×</button></header>
   {popup==='permissions'?<><label>Feeding permission<select aria-label="Feeding permission" value={permission} onChange={e=>{setPermission(e.target.value);setPolicyAllowed(!farm.excludedFoods?.includes(e.target.value));}}><option value="raw">Raw ingredient feeding</option>{AUTOMATIC_FOODS.map(id=><option key={id} value={id}>{name(id)}</option>)}</select></label><label className={s.check}><input type="checkbox" checked={permission==='raw'?draftRaw:policyAllowed} onChange={e=>permission==='raw'?setDraftRaw(e.target.checked):setPolicyAllowed(e.target.checked)}/>{permission==='raw'?'Allow diet-compatible raw ingredients':`Allow ${name(permission as AutomaticFood)}`}</label><p>Reserves stay protected. Prepared bonus meals are never used automatically.</p><div className={s.footer}><button onClick={()=>setPopup(null)}>Cancel setting</button><button data-primary onClick={reviewPermission}>Review setting</button></div></>:popup==='review'&&quote?<><p>{quote.raw!==undefined?`Raw ingredient feeding: ${farm.ingredientFeeding?'On':'Off'} → ${quote.raw?'On':'Off'}`:name(quote.food)}</p>{quote.raw===undefined&&<><p>{isAutomatic(quote.food)?`Automatic feeding: ${farm.excludedFoods?.includes(quote.food)?'Excluded':'Allowed'} → ${quote.allowed?'Allowed':'Excluded'}`:'Manual bonus meal; automatic feeding stays off.'}</p>{quote.food!=='legacy_feed'&&<p>Reserve target: {farm.reserves[quote.food]??0} → {quote.reserve}</p>}</>}<p>Food stays in shared inventory. These changes consume no food and advance no time.</p><div className={s.footer}><button onClick={()=>setPopup(null)}>Cancel changes</button><button data-primary onClick={commit}>Confirm setting</button></div></>:popup==='receipt'?<><p role="status">{message}</p><button onClick={()=>{busy.current=false;chooseFood(food);setPopup(null);}}>Return to page</button></>:popup==='sources'?<><p>Choose a source. Work and cooking are instant; nightly food is consumed at sleep.</p><div className={s.sourceButtons}><button onClick={()=>{setProduction('Kitchen');setRoute('production');}}>Cook rations & meals</button><button onClick={()=>{setProduction('Gathering');setRoute('production');}}>Gather ingredients</button><button onClick={()=>setRoute('buy')}>Buy rations & ingredients</button><button onClick={()=>setRoute('storage')}>All farm storage & trade</button></div></>:popup==='rules'?<><p>{rules[rule]}</p><div className={s.footer}><button disabled={rule===0} onClick={()=>setRule(rule-1)}>Previous detail</button><span>{rule+1} / {rules.length}</span><button disabled={rule===rules.length-1} onClick={()=>setRule(rule+1)}>Next detail</button></div></>:null}
  </section></main></GameDialog>}
  {route==='production'&&<GameDialog fullScreen title="Food production" onClose={()=>setRoute(null)}><ProductionBook section={production} onSection={setProduction} initialSelection={production==='Kitchen'?'rations':''} onBack={()=>setRoute(null)} backLabel="Feeding Station"/></GameDialog>}
  {route==='buy'&&<IngredientCounter resourceId={view==='supplies'&&food!=='legacy_feed'&&RESOURCES[food].price>0?food:'rations'} needed={Math.max(1,tonight.shortage)} onClose={()=>setRoute(null)}/>}
  {route==='storage'&&<GameDialog fullScreen title="All farm storage" onClose={()=>setRoute(null)}><ResourceShelf initialMode="Storage" onBack={()=>setRoute(null)}/></GameDialog>}
 </main>;
}
