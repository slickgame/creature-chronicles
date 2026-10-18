import { describeTalentEffect, getTalentDefinition, getTalentEffects } from './talentDefinitions';
import { getBattleStatGlossary } from '@/data/battleGlossary';
import { getFarmSecurity } from '@/data/farmSecurity';
import type { CreatureAbility, CreatureRecord } from '@/types/creature';
import type { GameSave } from '@/types/save';
import type { TalentEffect } from '@/types/talent';

export const CORE_TALENT_ICON_IDS = ['eager_learner','sound_sleeper','diligent','efficient_worker','sure_strike','thick_hide','light_footed','hot_blooded','lasting_vigor','guard_dog'] as const;
export const TALENT_FILTERS = ['all','work','battle','care'] as const;
export type TalentFilter = typeof TALENT_FILTERS[number];
export type TalentEffectStatus = 'active' | 'planned' | 'retired' | 'informational' | 'unverified';
export type PresentedTalentEffect = {
  type: TalentEffect['type']; value: number; label: string; appliesTo: string[];
  when: string; notes: string[]; status: TalentEffectStatus; filter: Exclude<TalentFilter,'all'>;
};
const SOURCES: Record<CreatureAbility['source'],string> = {
  general:'General',species:'Species',variant:'Variant',starter:'Starter',future:'Future',combat:'Combat',chore:'Work',role:'Role',
};
const GATHERING = ['Harvesting','Material Gathering','Husbandry','Hunting'];
const WORK = [...GATHERING,'Crafting','Cooking'];
const JOB_SCOPE = {
  garden_tending:['Harvesting'], field_hauling:['Material Gathering'], stable_production:['Husbandry','Hunting'],
  security_patrol:['Former Security Patrol'], comfort_care:['Former Comfort Care'],
};
const unique = (values: string[]) => [...new Set(values)];
const signed = (value: number) => `${value >= 0 ? '+' : ''}${value}`;

function presentEffect(effect: TalentEffect): PresentedTalentEffect {
  const e: PresentedTalentEffect = {type:effect.type,value:effect.value,label:describeTalentEffect(effect),appliesTo:[],when:'',notes:[],status:'active',filter:'care'};
  if (effect.type === 'farm-security-flat') {
    return {...e,filter:'work',label:`${signed(effect.value)} farm Security`,appliesTo:['Farm Security'],when:'While this canine lives in an unlocked ranch habitat and is not away at training.',notes:['Only the strongest eligible Guard Dog contributes. No Energy cost.']};
  }
  if (effect.type.startsWith('chore-')) {
    e.filter='work';
    e.appliesTo=effect.jobId ? [...JOB_SCOPE[effect.jobId]] : effect.type === 'chore-xp-percent' ? [...WORK] : [...GATHERING];
    if (effect.jobId === 'security_patrol' || effect.jobId === 'comfort_care') {
      return {...e,status:'retired',when:'This bonus refers to a retired chore.',notes:['These chores are no longer assignable. This effect does not provide passive farm Security.']};
    }
    e.when=effect.type === 'chore-xp-percent' ? 'When the creature completes matching work and earns skill XP.' : 'When the creature performs matching gathering work.';
    if (effect.type === 'chore-xp-percent') {
      e.label=`${signed(effect.value)}% matching work-skill XP`;
      e.notes=['Skill XP is rounded per work action or recipe batch. This does not increase creature-level XP.'];
    } else if (effect.type === 'chore-score') {
      e.label=Number.isInteger(effect.value) ? `${signed(effect.value)} matching gathering resources` : `${signed(effect.value)} gathering yield contribution`;
      e.notes=['Matching talent yield contributions are added together, then rounded down. Recipe output ratios are unchanged.'];
    } else {
      e.label=`${effect.value} less Energy for matching gathering`;
      e.notes=['Gathering costs at least 8 Energy. This bonus does not reduce recipe Energy costs.'];
    }
    return e;
  }
  if (effect.type === 'battle-stat-flat' || effect.type === 'battle-stat-percent') {
    e.filter='battle';e.appliesTo=['Battle stats'];e.when='When battle stats are calculated.';
    const name=effect.battleStatKey ? getBattleStatGlossary(effect.battleStatKey).label : 'battle stat';
    e.label=`${signed(effect.value)}${effect.type.endsWith('percent')?'%':''} ${name}`;
    e.notes=['Applies separately from permanent attributes and innate grades. Battle stat rounding and minimums still apply.'];return e;
  }
  if (effect.type.startsWith('battle-')) return {...e,filter:'battle',status:'unverified',appliesTo:['Battle'],when:'Availability of this battle bonus is not confirmed.',notes:['Do not count this effect as an active bonus.']};
  if (effect.type.startsWith('breeding-')) {
    e.appliesTo=['Breeding'];e.when='When this creature participates in a breeding session.';
    if(effect.type==='breeding-energy-discount')e.notes=['Pair discounts combine with other reductions. The combined discount is capped at 22; current pair cost cannot fall below 13 Energy.'];
    if(effect.type==='breeding-pregnancy-chance')e.notes=['Adds percentage points before pregnancy-chance caps and eligibility rules.'];
    if(effect.type==='breeding-breeder-xp-flat'){e.appliesTo=['Player-participating breeding'];e.notes=['The player must participate to receive Breeder XP.'];}
    return e;
  }
  if (effect.type === 'growth-stat-bias') return {...e,appliesTo:['Breeding and Coliseum level-up growth'],when:'When those rewards apply creature level-up growth.',notes:['A growth preference, not a guaranteed attribute point or an innate-grade increase.']};
  if (effect.type.startsWith('inheritance-')) return {...e,status:'planned',appliesTo:['Future inheritance rolls'],when:'Planned: inheritance bonuses are not available yet.',notes:['This effect does not currently change inheritance odds.']};
  if (effect.type === 'recovery-energy-percent') return {...e,label:`Extra daily recovery: ${effect.value}% of max Energy`,appliesTo:['Daily Energy recovery'],when:'During overnight ranch recovery, while the creature is not away at training.',notes:['Food and ranch condition affect recovery. Recovery is capped at maximum Energy; maximum Energy itself does not increase.']};
  if (effect.type === 'recovery-affection') return {...e,appliesTo:['Daily Affection recovery'],when:'During overnight ranch recovery, while the creature is not away at training.',notes:['Affection remains between 0 and 100.']};
  if (effect.type === 'role-tag') return {...e,label:`Role strength: ${effect.roleTag ?? 'Specialist'}`,status:'informational',appliesTo:['Role recommendations'],when:'When creature role strengths are evaluated.',notes:['A recommendation marker, not an additional numeric bonus.']};
  return {...e,status:'unverified',when:'Availability of this bonus is not confirmed.'};
}

/** Read-only view model. Numeric effects always come from the owned talent's grade. */
export function getTalentPresentation(talent: CreatureAbility, context?: {save:GameSave;creature:CreatureRecord}) {
  const definition=getTalentDefinition(talent.id);
  const validGrade=['F','D','C','B','A','S'].includes(talent.grade);
  const known=Boolean(definition && validGrade);
  const effects=known ? getTalentEffects(talent.id,talent.grade).map(presentEffect) : [];
  const active=effects.filter(e=>e.status==='active');
  const hasDedicatedIcon=(CORE_TALENT_ICON_IDS as readonly string[]).includes(talent.id);
  const notes=known ? [] as string[] : ["This talent's effects cannot be confirmed. The original description is shown."];
  if(effects.some(e=>e.status==='planned'))notes.push('Some listed effects are planned and do not currently apply.');
  if(effects.some(e=>e.status==='retired'))notes.push('Some listed effects refer to retired chores.');
  let condition: string | null=null;
  if(known && talent.id==='guard_dog' && context){
    const security=getFarmSecurity(context.save),candidate=security.candidates.find(c=>c.id===context.creature.creatureId);
    condition=!candidate ? 'Not contributing: requires an eligible resident canine in an unlocked habitat, available at the ranch.' : security.guard?.id===candidate.id ? `Currently contributing +${candidate.bonus} farm Security.` : `Not contributing: ${security.guard?.name} provides the ranch's strongest Guard Dog bonus.`;
  }
  return {
    id:talent.id,name:definition?.name ?? talent.name,grade:talent.grade,source:talent.source,sourceLabel:SOURCES[talent.source] ?? String(talent.source),known,
    iconPath:hasDedicatedIcon ? `/images/ui/talents-c/icons/${talent.id}.webp` : '/images/ui/creature-overview-a-v2/painted-r4/talents.webp',hasDedicatedIcon,
    effects,activeEffects:active,effectSummary:active.length ? active.map(e=>e.label).join('; ') : known ? 'No active numeric bonus' : talent.description,
    appliesTo:unique(active.flatMap(e=>e.appliesTo)),when:unique(active.map(e=>e.when)),
    filters:[...new Set(effects.map(e=>e.filter))],notes,condition,
    stacking:!known ? 'Stacking is not confirmed.' : definition?.stackingRule==='highest-only' ? 'Only the strongest eligible bonus applies.' : definition?.stackingRule==='unique' ? 'This talent applies once.' : definition?.stackingRule==='multiplicative' ? 'Matching bonuses multiply.' : 'Matching distinct talent effects combine; repeated copies of the same saved talent count once.',
    inheritanceOrigin:talent.inheritanceOrigin ? {...talent.inheritanceOrigin} : null,
  };
}
export function getCreatureTalentPresentations(creature: CreatureRecord, save?: GameSave) {
  return (creature.abilities ?? []).filter((t,index,all)=>all.findIndex(other=>other.id===t.id)===index)
    .map(t=>getTalentPresentation(t,save ? {save,creature} : undefined));
}
export type TalentPresentation = ReturnType<typeof getTalentPresentation>;
