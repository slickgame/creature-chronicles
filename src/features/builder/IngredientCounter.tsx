"use client";
import { useRef, useState } from 'react';
import { SITES, FACILITIES, RECIPES, RESOURCES, getFarmState, resourceList, tradeResource, type ResourceId } from '@/data/farmResources';
import { getResourceArt } from '@/data/resourceArt';
import { useGameContext } from '@/state/GameProvider';
import { GameDialog } from '@/features/ui/GameDialog';
import { ProductionBook } from '@/features/resources/ProductionBook';
import old from './RecipeWorkbench.module.css';
import forge from './ForgeGallery.module.css';
import {ForgeWindow} from './ForgeWindow';
export function IngredientCounter({resourceId,needed,onClose,appearance}:{resourceId:ResourceId;needed:number;onClose:()=>void;appearance?:'forge'}) {
 const {currentSave:save,saveCurrentGame}=useGameContext();const [quantity,setQuantity]=useState(Math.min(20, needed));const [view,setView]=useState<'buy'|'produce'|'confirm'|'receipt'>('buy');const [message,setMessage]=useState('');const busy=useRef(false);const [production,setProduction]=useState<'Gathering'|'Kitchen'|'Workbench'|null>(null);
 if(!save)return null;
 const s=appearance==='forge'?{...old,popupBody:forge.sourceBody,pager:forge.sourceTabs,sourceItem:forge.sourceItem}:old;
 const resource=RESOURCES[resourceId],state=getFarmState(save),cost=resource.price*quantity,recipe=RECIPES.find(r=>r.id===resourceId);
 const site=Object.entries(SITES).find(([,s])=>s.resource===resourceId);
 if(production)return <GameDialog fullScreen title={`${resource.name} · Production`} onClose={()=>setProduction(null)}><ProductionBook section={production} onSection={setProduction} initialSelection={recipe?resourceId:site?.[0]} onBack={()=>setProduction(null)}/></GameDialog>;
 function confirm(){if(!save||busy.current)return;busy.current=true;const result=tradeResource(save,resourceId,quantity);if(result.ok)saveCurrentGame(result.save);setMessage(result.message);setView('receipt');}
 const content=<div className={s.popupBody}>
 {view==='receipt'?<><p role="status">{message}</p><button onClick={onClose}>Return to recipe</button></>:view==='confirm'?<><p>Buy {quantity} {resource.name} for <strong>{cost} Gold</strong> from Pella’s ingredients counter?</p><p>Balance {save.currencies.gold} → {save.currencies.gold-cost} Gold. Adds to farm storage; reserves stay unchanged.</p><div className={s.pager}><button onClick={()=>setView('buy')}>Cancel purchase</button><button disabled={save.currencies.gold<cost} onClick={confirm}>Confirm ingredient purchase</button></div></>:<><div className={s.pager}><button aria-pressed={view==='buy'} onClick={()=>setView('buy')}>Buy from Pella</button><button aria-pressed={view==='produce'} onClick={()=>setView('produce')}>Produce at ranch</button></div>{view==='buy'?<><div className={s.sourceItem}>{getResourceArt(resourceId)?<img src={getResourceArt(resourceId)} alt=""/>:null}<span>{state.stock[resourceId]??0} owned · {state.reserves[resourceId]??0} reserved<br/>{resource.price} Gold each</span></div><label>Quantity <select aria-label="Ingredient quantity" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}>{Array.from(new Set([Math.min(20,needed),1,5,10,20])).sort((a,b)=>a-b).map(n=><option key={n} value={n}>{n}</option>)}</select></label><button disabled={resource.price<=0||save.currencies.gold<cost} onClick={()=>{busy.current=false;setView('confirm');}}>Review ingredient purchase · {cost} Gold</button>{save.currencies.gold<cost?<p>Need {cost-save.currencies.gold} more Gold.</p>:null}</>:<><p>{recipe?`${resourceList(recipe.inputs)} → ${recipe.output} ${resource.name}.`:'Gather at the resource’s owned location, or buy from Pella.'}</p>{recipe?.facility?<p>Requires {FACILITIES[recipe.facility].name} · {state.facilities[recipe.facility]?'Built':'Not built'}. Use the farm Workbench.</p>:null}{resourceId==='iron'?<p>Make Charcoal from Wood, then smelt Iron ore with Charcoal. Iron ingots are refined metal; ore cannot replace them in Iona’s recipes.</p>:null}{(recipe||site)&&<button onClick={()=>setProduction(recipe?(['Food','Meals'].includes(resource.category)?'Kitchen':'Workbench'):'Gathering')}>Open {recipe?'recipe':'work location'}</button>}<p>Your original recipe and quantity stay selected. Return here after gathering or crafting.</p></>}</>}
 </div>;
 return appearance==='forge'?<ForgeWindow title={`${resource.name} · Sources`} marker="source" onClose={onClose}>{content}</ForgeWindow>:<GameDialog title={`${resource.name} · Sources`} onClose={onClose}>{content}</GameDialog>;
}
