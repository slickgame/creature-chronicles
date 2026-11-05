"use client";
import {useState,type ReactNode} from 'react';
import {DetailButton} from '@/features/ui/DetailButton';
import {GameDialog} from '@/features/ui/GameDialog';
import j from './InheritanceJournal.module.css';
import {getBreedingInheritancePreview} from '@/data/breedingSelectionPreview';
import {getBreedingPreview} from '@/data/breeding';
import {getSpeciesDefinition} from '@/data/creatures';
import {getBattleMove} from '@/data/battleMoves';
import {buildBredCreatureStartingMoveLoadout} from '@/data/battleLoadouts';
import {getCombinationMoveContributors,getParentBattleMoveSource,MAX_DIRECT_INHERITED_MOVES,MAX_COMBINATION_INHERITED_MOVES} from '@/data/battleMoveInheritance';
import {isBreedingSupportItemArmed,TRAIT_STABILIZER_ABILITY_BONUS,MUTATION_CATALYST_ABILITY_MUTATION_BONUS} from '@/data/breedingItems';
import type {GameSave} from '@/types/save';
import type {NurseryPage} from '@/features/nursery/NurseryBook';

import {WindowA,PanelA,ProfileA,PagerA,useShortWindow,breedingWindowStyles as s} from './BreedingWindowA';
import {BreedingInheritanceComparison,TalentGradeOdds,formatInheritancePercent as percent} from './BreedingInheritanceComparison';
import {BreedingPartnerRanking} from './BreedingPartnerRanking';
import {BreedingInspectBook} from './BreedingInspectBook';
import type {BreedingParticipant,BreedingRole} from '@/types/breeding';
function JournalHelp({label,hint,children}:{label:string;hint:string;children?:ReactNode}){const[open,setOpen]=useState(false);return <><DetailButton className={j.help} tooltipClassName={j.tooltip} hint={hint} aria-label={label} onClick={()=>setOpen(true)}>i</DetailButton>{open&&<GameDialog title={label} dialogClassName={j.recordDialog} onClose={()=>setOpen(false)} wide><div className={j.fullRecord}>{children??<p>{hint}</p>}</div></GameDialog>}</>}
const STATS={STR:'Strength',DEX:'Dexterity',STA:'Stamina',CHA:'Charm',WIL:'Willpower',FER:'Fertility'} as const;
export function BreedingInheritanceBook({save,giverId,receiverId,onSelectPartner,onClose}:{save:GameSave;giverId:string|null;receiverId:string|null;onSelectPartner:(fixedRole:BreedingRole,fixedId:string,partnerId:string)=>string|null;onClose:()=>void}){
 const [tab,setTab]=useState('Stats'),[collectionIndex,setCollectionIndex]=useState(0);
 const [compare,setCompare]=useState(false);
 const [ranking,setRanking]=useState(false);
 const short=useShortWindow();
 const [inspect,setInspect]=useState<BreedingParticipant|null>(null);
 const model=getBreedingInheritancePreview(save,giverId,receiverId);
 const {giver,receiver,moves,talentPreview:odds}=model;
 const moveSources = [giver, receiver].map(parent => ({
   name: parent?.displayName,
   source: getParentBattleMoveSource(save.creatures?.find(creature => creature.creatureId === parent?.creatureId)),
 }));
 const nativeMoveNames = model.valid && moves.childSpeciesId
   ? buildBredCreatureStartingMoveLoadout(moves.childSpeciesId).learnedMoveIds.map(id => getBattleMove(id).name)
   : [];
 const preview=getBreedingPreview(save,giverId,receiverId);
 let pages:NurseryPage[]=[];
 if(tab==='Family')pages=[{key:'overview',title:'Before conception',content:<><p>{giver?.displayName??'Choose a giver'} × {receiver?.displayName??'Choose a receiver'}</p><p className={model.valid?s.good:s.warning}>{model.valid?'Compare possible inheritance. Final offspring rolls remain unknown until successful conception.':'Choose two different tracked creatures for creature-to-creature inheritance.'}</p><p>Viewing this book spends nothing and never rerolls offspring.</p></>},{key:'chance',title:'Pregnancy & inheritance',content:<><p>Pregnancy chance: {preview?.pregnancyChance??'—'}%</p><p>Pregnancy, talent checks and move checks are separate. A successful pregnancy does not guarantee any listed talent or bonus move.</p><p>{preview?.blockedReason??preview?.pregnancyBlockedReason??'Review readiness and costs in the pen before committing.'}</p></>},{key:'family',title:'Offspring family',content:<><h3>{model.valid&&moves.childSpeciesId?getSpeciesDefinition(moves.childSpeciesId).name:'No creature pair selected'}</h3><p>Inheritance follows the offspring’s species compatibility. Native starting moves are supplied by the existing hatchling rules.</p></>}];
 if(tab==='Stats')pages=(Object.keys(STATS)as(keyof typeof STATS)[]).map(key=>({key,title:STATS[key],content:<><dl className={s.stats}>{[giver,receiver].map((p,i)=><div key={i}><dt>{p?.displayName??(i?'Receiver':'Giver')}</dt><dd>{p?.stats?.[key]??'Not recorded'} <small>Grade {p?.statGrades?.[key]??'not recorded'}</small></dd></div>)}<div><dt>Offspring</dt><dd>Unknown until conception</dd></div></dl><p>Current parent base stats and innate grades, excluding equipment. These are not promised hatchling values.</p></>}));
 if(tab==='Stats')pages.unshift({key:'comparison',title:'Parent base stats & innate grades',content:<><table className={s.table}><thead><tr><th>Base stat</th><th>{giver?.displayName??'Giver'}</th><th>{receiver?.displayName??'Receiver'}</th></tr></thead><tbody>{(Object.keys(STATS) as (keyof typeof STATS)[]).map(k=><tr key={k}><th><span className={j.statLabel}><img src={`/images/ui/stats-growth-b/${STATS[k].toLowerCase()}.webp`} alt=""/>{STATS[k]}</span></th>{[giver,receiver].map((p,i)=><td key={i}>{p?.stats?.[k]??'—'} <small>{p?.statGrades?.[k]??'—'}</small></td>)}</tr>)}</tbody></table><p>Parent base stats only; equipment excluded. Offspring values remain unknown until conception.</p></>});
 if(tab==='Talents')pages=[
   {key:'checks',title:'Talent checks after conception',content:odds?<dl className={s.stats}>
     <div><dt>First parent check</dt><dd>{odds.first}%</dd></div>
     <div><dt>Second, after first succeeds</dt><dd>{odds.second}%</dd></div>
     <div><dt>Mutation, if a slot remains</dt><dd>{odds.mutation}%</dd></div>
   </dl>:<p>Choose a creature receiver and a different giver.</p>},
   {key:'rules',title:'How parent talent odds work',content:<>
     <p>Each estimate combines the chance of getting that talent on the first or second parent pick, assuming conception succeeds. A talent shared by both parents appears once, with both sources listed.</p>
     <p>The standard session uses affection and familiarity earned by completing the pairing. A guided tutorial rescue uses the parents’ pre-session affection. Higher grades and affection increase a parent’s selection weight. The second pick must be a different talent. When both parents have the same talent, their eligible copies add to its selection weight. The inherited grade comes from the selected copy.</p>
     <p>Mutation and armed item checks are separate. Guard Dog is canine-only in normal parent rolls.</p>
   </>},
   ...(odds?.candidates ?? []).map(candidate=>({
     key:`talent-${candidate.talent.id}`,
     title:candidate.talent.name,
     content:<>
       <p><strong>{percent(candidate.chance)}</strong> · Base parent estimate after conception</p>
       <TalentGradeOdds talent={candidate}/>
       <p>{candidate.sources.map(source=>`${source.parentName} (${source.role}, grade ${source.ability.grade})`).join(' · ')}</p>
       {!candidate.sources.some(source=>source.eligible)&&<p className={s.warning}>Canine offspring only in normal parent rolls.</p>}
     </>,
   })),
   ...(isBreedingSupportItemArmed(save,'trait_stabilizer')?[{key:'stabilizer',title:'Trait Stabilizer armed',content:<p>A separate {TRAIT_STABILIZER_ABILITY_BONUS}% check can add a strongest parent talent when the normal checks leave no talents.</p>}]:[]),
   ...(isBreedingSupportItemArmed(save,'mutation_catalyst')?[{key:'catalyst',title:'Mutation Catalyst armed',content:<p>A separate {MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% mutation check applies if a talent slot remains.</p>}]:[]),
 ];
 if(tab==='Moves')pages=model.valid?[
   {key:'move-overview',title:'Possible move lineage',content:<p>Rolls happen after conception while the relevant inheritance slot remains open. Up to {MAX_DIRECT_INHERITED_MOVES} parent moves and {MAX_COMBINATION_INHERITED_MOVES} combination move can pass through.</p>},
   ...moves.directCandidates.flatMap((candidate,index)=>{
     const sources=moveSources.flatMap(({name,source})=>{
       if(source.equippedMoveIds.includes(candidate.moveId))return [`${name} (equipped)`];
       if(source.learnedMoveIds.includes(candidate.moveId))return [`${name} (learned)`];
       return [];
     });
     return [
       {key:`direct-${index}`,title:candidate.moveName,content:<>
         <p><strong>{candidate.finalChance}%</strong> · Parent roll with a slot open</p>
         <p>{sources.join(' · ')}</p>
       </>},
       {key:`direct-${index}-notes`,title:`${candidate.moveName} · Roll factors`,content:<ul>{candidate.reasons.map((reason,i)=><li key={i}>{reason}</li>)}</ul>},
     ];
   }),
   ...moves.combinationCandidates.flatMap((candidate,index)=>{
     const [first,second]=candidate.contributingMoveNames;
     const roles=getCombinationMoveContributors(candidate.parentAContributingMoveId,candidate.parentBContributingMoveId,moveSources[0].source,moveSources[1].source);
     const names={giver:giver?.displayName,receiver:receiver?.displayName};
     const inputs=roles ? `${names[roles[0]]}: ${first} + ${names[roles[1]]}: ${second}` : `${first} + ${second}`;
     return [
     {key:`combo-${index}`,title:candidate.outputMoveName,content:<>
       <p><strong>{candidate.chance}%</strong> · Combination roll with a slot open</p>
       <p>{inputs}</p>
     </>},
     {key:`combo-${index}-notes`,title:candidate.recipeName,content:<ul>{candidate.reasons.map((reason,i)=><li key={i}>{reason}</li>)}</ul>},
     ];
   }),
   {key:'native',title:'Species starting library',content:<><p>{nativeMoveNames.join(' · ')}</p><p>This is the baseline library before inherited moves are added. The final loadout follows the hatchling’s species and move limits.</p></>},
 ]:[{key:'no-pair',title:'Choose two creatures',content:<p>Parent-move and combination rolls require two tracked creatures. Hatchlings receive their species starting library.</p>}];
 const talents=tab==='Talents'?pages.filter(p=>p.key.startsWith('talent-')):[];
 const moveRows=tab==='Moves'?pages.filter(p=>/^(direct|combo)-\d+$/.test(p.key)):[];
 const collection=tab==='Talents'?talents:moveRows;
 const activeIndex=Math.min(collectionIndex,Math.max(0,collection.length-1));
 const activeTalent=tab==='Talents'?odds?.candidates[activeIndex]:undefined;
 const rules=pages.filter(p=>tab==='Talents'?['checks','rules','stabilizer','catalyst'].includes(p.key):tab==='Moves'?!moveRows.includes(p):true);
 const help=<JournalHelp label="Inheritance rules & complete records" hint="Pregnancy and inheritance checks are separate. Viewing this journal never rolls or saves offspring.">{pages.map(p=><section key={p.key}><h3>{p.title}</h3>{p.content}</section>)}</JournalHelp>;
 return <><WindowA className={j.journal} title="Inheritance" marker="inheritance" onClose={onClose} focusLabels={['Selected parents','Inheritance details']} navigation={<nav className={j.tabs} aria-label="Inheritance views">{['Stats','Talents','Moves','Family'].map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);setCollectionIndex(0)}}>{t}</button>)}</nav>} lead={<PanelA className={j.parents}><h2>Selected parents</h2><div className={j.figures}>{[giver,receiver].map((p,i)=><ProfileA key={i} src={p?.kind==='creature'?p.profilePath:undefined} name={p?.displayName??(i?'Choose receiver':'Choose giver')} subtitle={i?'Receiver':'Giver'}/>)}</div><p className={model.valid?j.note:j.warning}>{model.valid?'Pregnancy, talent and move checks remain separate.':odds?'The player contributes no talents or moves. Receiver talent rolls are available.':'Choose a creature receiver and a different giver.'}</p><footer className={s.actions}>{[giver,receiver].map((p,i)=><button key={i} disabled={!p} onClick={()=>p&&setInspect(p)}>Inspect {p?.displayName??(i?'receiver':'giver')}</button>)}</footer></PanelA>}><PanelA className={j.content}><div className={j.heading}><div><h2>{tab==='Stats'?'Base stats & innate grades':tab==='Talents'?'Possible parent talents':tab==='Moves'?'Move lineage':'Offspring family'}</h2><small>{giver?.displayName??'Giver'} × {receiver?.displayName??'Receiver'} · Before conception</small></div>{help}</div><div className={j.section} data-inheritance-section={tab}>
 {tab==='Stats'&&<><table className={j.table}><thead><tr><th>Stat</th><th>{giver?.displayName??'Giver'}</th><th>{receiver?.displayName??'Receiver'}</th><th>Info</th></tr></thead><tbody>{(Object.keys(STATS) as (keyof typeof STATS)[]).map(k=><tr key={k}><th><span className={j.statLabel}><img src={`/images/ui/stats-growth-b/${STATS[k].toLowerCase()}.webp`} alt=""/>{STATS[k]}</span></th>{[giver,receiver].map((p,i)=><td key={i}>{p?.stats?.[k]??'—'} <span className={j.grade} data-grade={p?.statGrades?.[k]}>{p?.statGrades?.[k]??'—'}</span></td>)}<td><JournalHelp label={STATS[k]} hint="Current parent base stat and innate grade, excluding equipment. This is not a promised hatchling value."/></td></tr>)}</tbody></table><p className={j.note}>{short?'Offspring unknown until conception. Equipment excluded.':'Offspring values remain unknown until conception. Parent values exclude equipment.'}</p></>}
 {tab==='Family'&&<><div className={j.family}><strong>{model.valid&&moves.childSpeciesId?getSpeciesDefinition(moves.childSpeciesId).name:'No creature pair selected'}</strong><span>Pregnancy chance: {preview?.pregnancyChance??'—'}%</span></div><p className={model.valid?j.note:j.warning}>{model.valid?'Final offspring rolls remain unknown until successful conception.': 'Choose two different tracked creatures for creature-to-creature inheritance.'}</p><p>Inheritance follows offspring species compatibility. Native starting moves follow the existing hatchling rules.</p><p className={j.note}>{preview?.blockedReason??preview?.pregnancyBlockedReason??'Review readiness and costs in the pen before committing.'}</p></>}
 {tab==='Talents'&&<>{odds?<><dl className={j.odds}><div><dt>First parent check</dt><dd>{odds.first}%</dd></div><div><dt>Second, after first succeeds</dt><dd>{odds.second}%</dd></div><div><dt>New talent, if a slot remains</dt><dd>{odds.mutation}%</dd></div></dl>{!short&&<p className={j.caveat}>The talent card combines the first and second parent picks. Mutation and item checks are separate.</p>}</>:<p className={j.warning}>Choose a creature receiver and a different giver.</p>}{isBreedingSupportItemArmed(save,'trait_stabilizer')&&<p className={j.modifier}>Trait Stabilizer: {TRAIT_STABILIZER_ABILITY_BONUS}% rescue check if earlier rolls leave no talents.</p>}{isBreedingSupportItemArmed(save,'mutation_catalyst')&&<p className={j.modifier}>Mutation Catalyst: {MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% mutation check if a slot remains.</p>}</>}
 {tab==='Moves'&&<><p className={model.valid?j.note:j.warning}>{model.valid?`Pair-quality bonus: +${moves.contextBonus}%. After conception, up to ${MAX_DIRECT_INHERITED_MOVES} parent moves and ${MAX_COMBINATION_INHERITED_MOVES} combination can pass through.`:'Move inheritance requires two tracked creatures.'}</p><p className={j.caveat}>Species starting moves follow the hatchling’s species.</p></>}
 {(tab==='Talents'||tab==='Moves')&&<>{collection[activeIndex]?<article className={j.card}><h3>{collection[activeIndex].title}</h3>{collection[activeIndex].content}{activeTalent&&<JournalHelp label={`${activeTalent.talent.name} · Chance details`} hint="Read the first and second pick odds, talent effects and sources.">
 <p>First pick: {percent(activeTalent.firstPick)} · Second pick: {percent(activeTalent.secondPick)}.</p>
 {activeTalent.grades.filter(row=>row.chance>0).map(row=><p key={row.grade}><strong>Grade {row.grade}</strong> · {percent(row.chance)} after conception · {percent(row.share)} of inherited copies</p>)}
 {activeTalent.sources.map((source,index)=><section key={index}><h3>{source.parentName} · Grade {source.ability.grade}</h3><p>{source.ability.description}</p></section>)}
 </JournalHelp>}{tab==='Moves'&&<JournalHelp label={`${collection[activeIndex].title} · Chance details`} hint="Read the complete chance contributions and compatibility notes.">{pages.filter(p=>p.key.startsWith(collection[activeIndex].key+'-')).map(p=><section key={p.key}><h3>{p.title}</h3>{p.content}</section>)}</JournalHelp>}</article>:<p className={j.note}>{tab==='Moves'?'No bonus moves available to preview.':'No parent talents available.'}</p>}{collection.length>1&&<PagerA index={activeIndex} total={collection.length} onChange={setCollectionIndex}/>}<div className={j.ruleHint}><span>Final results are stored at conception.</span><JournalHelp label={`${tab} rules`} hint="Read full selection, eligibility and inheritance rules.">{rules.map(p=><section key={p.key}><h3>{p.title}</h3>{p.content}</section>)}</JournalHelp></div></>}
 </div><footer className={s.actions}><button onClick={onClose}>Back to pairing desk</button>{odds&&<button type="button" onClick={()=>setCompare(true)}>Compare pairings</button>}{(giver||receiver?.kind==='creature')&&<button type="button" onClick={()=>setRanking(true)}>Rank partners</button>}</footer></PanelA></WindowA>{compare&&<BreedingInheritanceComparison save={save} current={model} initialMode={tab==='Moves'?'Moves':'Talents'} onClose={()=>setCompare(false)}/>}{ranking&&<BreedingPartnerRanking save={save} giver={giver} receiver={receiver} initialMode={tab==='Moves'?'Moves':'Talents'} onSelectPartner={onSelectPartner} onClose={()=>setRanking(false)}/>} {inspect&&<BreedingInspectBook participant={inspect} creature={(save.creatures??[]).find(c=>c.creatureId===inspect.creatureId)??null} dayNumber={save.dayState.dayNumber} onClose={()=>setInspect(null)}/>}</>;
}
