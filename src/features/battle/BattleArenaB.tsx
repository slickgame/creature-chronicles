"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BATTLE_MENU_CATEGORIES, getBattleMenuOptions, getBattleOrderPreview, getBattleSlowedOrderForecast, type BattleMenuCategory, type BattleMoveBlocker, type BattleRoundOrderShift, type BattleSlowedOrderForecast } from "@/data/battleInterface";
import { getBattleMove } from "@/data/battleMoves";
import { getBattleTargetTypeLabel, getBattleUiMoveAvailability, type BattleUiTarget } from "@/data/battleUi";
import { getBattleEffectGlossary, getBattleStatusGlossary } from "@/data/battleGlossary";
import { BATTLE_OUTCOME_STAGGER_MS, getBattleOutcomeStatusText, type BattleTargetOutcome } from "@/data/battlePresentation";
import { getBattleGuardedStatus, getEffectiveBattleStats, previewBattleAction, getLegalBattleTargetIds, hasBattleStatus, type BattleGuardedStatus, type BattleStatusApplicationPreview } from "@/data/battleEngine";
import { getSupportItemVitals } from "@/data/battleOutfitterIntegration";
import { STAT_KEYS } from "@/data/creatures";
import { BATTLE_STAT_LABELS } from "@/data/equipmentComparison";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import type { BattleAction, BattleCombatantId, BattleGuardImpact, BattleMove, BattleMoveId, BattleState, BattleStatKey, BattleStatusId } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import { useBattleOutcomeFade, type BattlePlaybackMotion, type useBattlePresentationController } from "./useBattlePresentationController";
import { BattleResultLedger, type BattleResultLedgerData } from "./BattleResultLedger";
import { BattleLogEntries } from "./BattleLogEntries";
import { BattleStatusBadges, StatusIcon, statusLabel } from "./BattleStatusBadges";
import { BattleEffectTray, EffectIcon, getEffectTraySlots } from "./BattleEffectTray";
import {BattleCreatureImage} from "./BattleCreatureImage";
import {gameplayArt} from "@/data/creatureGameplayArt";
import s from "./BattleArenaB.module.css";
import logStyles from "./BattleLogEntries.module.css";

const ART = "/images/ui/battle-v1/";
const FALLBACK = "/images/ui/coliseum-v1/circuit.webp";
type Presentation = ReturnType<typeof useBattlePresentationController>;
export type BattleArenaBProps = {
  title: string; battleState: BattleState; sourceById: ReadonlyMap<string, CreatureRecord>;
  selectedTarget: BattleUiTarget | null; activeActorId: BattleCombatantId | null;
  completedCooldowns?: readonly BattleMoveId[];
  queuedActions?: ReadonlyMap<BattleCombatantId, BattleAction>; individualOrder?: readonly BattleCombatantId[]; presentation: Presentation;
  roundOrderShift?: BattleRoundOrderShift;
  onTarget: (target: BattleUiTarget) => void; onPlan?: (id: BattleCombatantId) => void;
  onQueue: (moveId: string) => void; onConfirm?: () => void; onReturn: () => void; onForfeit: () => void;
  onItem: (item: "tonic" | "revival") => void; tonicStock: number; revivalStock: number;
  usedTonic: boolean; usedRevival: boolean; aidRestricted?: boolean;
  resultLedger?: BattleResultLedgerData; complete: boolean; recording: boolean; result: ReactNode; message: string; rules?: ReactNode;
};

function artwork(source: CreatureRecord | undefined, full = false) {
  if (!source) return FALLBACK;
  return gameplayArt(source,!full);
}

function SlowedOrderComparison({ forecast, moveName, state, sourceById }: {
  forecast: BattleSlowedOrderForecast;
  moveName: string;
  state: BattleState;
  sourceById: BattleArenaBProps["sourceById"];
}) {
  const changedSlots = forecast.baseline.filter((entry, index) => entry.actorId !== forecast.slowed[index]?.actorId);
  const slowedIds = new Set(forecast.targets.map(entry => entry.actorId));
  return <section className={s.slowOrderCompare} data-slow-order-forecast data-slots={changedSlots.length} aria-label={`Round ${forecast.roundNumber} order forecast for ${moveName}`}>
    <h2>Round {forecast.roundNumber} Forecast <span>· {moveName}</span></h2>
    {changedSlots.length > 0 ? (["baseline", "slowed"] as const).map(branch =>
      <div key={branch} className={s.slowOrderRow} data-order-forecast-row={branch}>
        <strong>{branch === "baseline" ? "Baseline" : slowedIds.size > 1 ? "If all Slowed effects apply" : "If Slowed applies"}</strong>
        {changedSlots.map(({ slot }) => {
          const entry = forecast[branch][slot - 1];
          if (!entry) return <span key={slot}>—</span>;
          const creature = state.combatants[entry.actorId];
          return <span key={slot} className={s.slowOrderEntry} data-order-slot={slot}>
            <img src={artwork(sourceById.get(String(creature.sourceCreatureId)))} alt=""/>
            <span><b>{slot} ·</b> {creature.name}</span>
            {branch === "slowed" && slowedIds.has(entry.actorId) && <EffectIcon status="slowed"/>}
          </span>;
        })}
      </div>) : <p className={s.slowSameOrder}>Same turn order {slowedIds.size > 1 ? "if all Slowed effects apply." : "if Slowed applies."}</p>}
  </section>;
}

function SlowedTargetDetail({ forecast, targetId }: { forecast: BattleSlowedOrderForecast; targetId: BattleCombatantId }) {
  const application = forecast.targets.find(entry => entry.actorId === targetId);
  const before = forecast.baseline.find(entry => entry.actorId === targetId);
  const after = forecast.slowed.find(entry => entry.actorId === targetId);
  if (!application || !before || !after) return null;
  return <section className={s.slowTargetDetail} data-slow-target-forecast aria-label="Target's next-round Slowed forecast">
    <h3><EffectIcon status="slowed"/> Round {forecast.roundNumber} · {forecast.targets.length > 1 ? "If all Slowed effects apply" : "If Slowed applies"}</h3>
    <dl>
      <div><dt>Turn slot</dt><dd>{before.slot === after.slot ? `${before.slot} (same)` : `${before.slot} → ${after.slot}`}</dd></div>
      <div><dt>Speed</dt><dd>{before.speed === after.speed ? `${before.speed} (same)` : `${before.speed} → ${after.speed}`}</dd></div>
    </dl>
  </section>;
}
type HealthForecast = { id: string; kind: "attack" | "heal" | "support" };
type EnergyRecovery = { before: number; after: number; eventId: string; durationMs: number; playback: BattlePlaybackMotion };
const ENERGY_SURGE_FADE: Keyframe[] = [{ opacity: 1 }, { opacity: 1, offset: 0.65 }, { opacity: 0 }];

function EnergyRecoverySegment({ start, end, recovery }: { start: number; end: number; recovery: EnergyRecovery }) {
  const { node } = useBattleOutcomeFade<HTMLElement>(recovery.playback, ENERGY_SURGE_FADE, 0, recovery.durationMs);
  return <i ref={node} aria-hidden="true" data-energy-surge style={{ left: `${start}%`, width: `${end - start}%` }}/>;
}

function Meter({ label, value, max, after, forecast, recovery }: {
  label: "HP" | "BE"; value: number; max: number; after?: number; forecast?: HealthForecast; recovery?: EnergyRecovery;
}) {
  const percent = (amount: number) => Math.max(0, Math.min(100, amount / Math.max(1, max) * 100));
  const projected = Math.max(0, Math.min(max, after ?? value));
  const isLoss = projected < value;
  const isGain = projected > value;
  const solid = isLoss ? projected : value;
  const segmentEnd = isGain ? projected : value;
  const amount = isLoss || isGain ? `${value} → ${projected}` : value;
  let caption = `${label} ${amount}/${max}`;
  if (forecast?.kind === "attack") caption = `${amount} HP if hit`;
  if (forecast?.kind === "heal") caption = value === max && projected === max ? "Full HP" : `${amount} HP`;
  return <span className={s.meter} data-kind={label} data-forecast-hp={forecast?.kind} id={forecast?.id}>
    <i style={{ width: `${percent(solid)}%` }} />
    {(isLoss || isGain) && <i className={isGain ? s.meterGain : s.meterLoss} style={{ left: `${percent(solid)}%`, width: `${percent(segmentEnd) - percent(solid)}%` }} />}
    {recovery && <EnergyRecoverySegment key={recovery.eventId} start={percent(recovery.before)} end={percent(recovery.after)} recovery={recovery}/>}
    <b>{caption}</b>
  </span>;
}

type GuardDisplay = BattleGuardedStatus & { mode: "preview" | "active" | "breaking" };

function GuardShieldIcon() {
  return <svg className={s.shieldIcon} viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 2.5 20 6v5.6c0 4.8-3.2 8.3-8 10-4.8-1.7-8-5.2-8-10V6l8-3.5Z" />
    <path d="M12 4.5v14.7c3.9-1.8 5.8-4.4 5.8-8V7.4Z" />
  </svg>;
}

function CleanseIcon() {
  return <svg className={s.cleanseIcon} viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="5.5" fill="#ebdbf2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m3 13 10-10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>;
}

function HealthMeter({ value, max, after, guard, details = false, forecast, allyGuard }: {
  value: number; max: number; after?: number; guard?: GuardDisplay; details?: boolean;
  forecast?: HealthForecast; allyGuard?: boolean;
}) {
  const meter = <Meter label="HP" value={value} max={max} after={after} forecast={forecast}/>;
  if (!guard) return meter;

  const label = guard.mode === "preview" ? "Guard preview" : "Guarded";
  const effect = `−${guard.damageReductionPercent}% damage · ${guard.duration} round${guard.duration === 1 ? "" : "s"}`;
  return <span className={s.guardVitals} data-guard-mode={guard.mode}>
    <span className={s.brassGuardMeter} data-ally-guard-meter={allyGuard ? "" : undefined} aria-label={`${label} · ${effect}`}>
      <span className={s.guardShield} aria-hidden="true">
        <GuardShieldIcon/>
      </span>
      {meter}
    </span>
    {details && <small className={s.guardDetails}>
      <strong>{label}</strong> <span>{effect}</span>
      {guard.mode === "breaking" && <em>Guard Break removes Guarded on hit</em>}
    </small>}
  </span>;
}

type TargetForecast = { hitChance: number; statuses: BattleStatusApplicationPreview[] };
type AllyForecast = { heals: boolean; guarded: boolean; cleanses: Map<BattleStatusId, number> };

function TargetForecastOdds({ id, forecast }: { id: string; forecast: TargetForecast }) {
  return <span className={s.targetForecast} id={id} data-target-forecast>
    <span>{forecast.hitChance}% hit</span>
    {forecast.statuses.map(({ stack, effectChance, requiresHit }) => <span key={`${stack.status}-${stack.stat ?? ""}`}>
      {(stack.status === "slowed" || stack.status === "bleed") && <EffectIcon status={stack.status}/>}
      <span>{effectChance}% {getBattleStatusGlossary(stack.status).label}{requiresHit ? " if hit" : ""}</span>
    </span>)}
  </span>;
}

function AllyForecastEffects({ id, cleanses, guard, rows }: {
  id: string; cleanses: ReadonlyMap<BattleStatusId, number>; guard?: BattleGuardedStatus; rows: number;
}) {
  const empty = !guard && !cleanses.size;
  return <span className={`${s.targetForecast} ${s.allyForecastEffects}`} id={empty ? undefined : id}
    aria-hidden={empty || undefined} data-empty={empty ? "" : undefined}
    style={{ minHeight: `calc(${rows} * max(1.2em, 13px) + ${rows + 5}px)` }}>
    {guard && <span data-ally-guard>Guarded · −{guard.damageReductionPercent}% damage · <span className={s.guardRound}>{guard.duration} {guard.duration === 1 ? "round" : "rounds"}</span></span>}
    {[...cleanses].map(([status, chance]) => <span key={status} data-clears-status={status}>
      <CleanseIcon/>
      <span>{chance === 100 ? "Clears" : `${chance}% to clear`} {getBattleStatusGlossary(status).label}</span>
    </span>)}
  </span>;
}

type EffectForecast = ReturnType<typeof previewBattleAction>[number];
type DamageForecast = EffectForecast & Required<Pick<EffectForecast, "damageBreakdown">>;
type HitChanceForecast = NonNullable<EffectForecast["hitBreakdown"]>;

function effectForecastText(effect: EffectForecast) {
  return [
    effect.description,
    effect.requiresHit ? `${effect.hitChance}% hit` : "",
    effect.effectChance < 100 ? `${effect.effectChance}% effect${effect.requiresHit ? " if hit" : ""}` : "",
  ].filter(Boolean).join(" · ");
}

function HitChanceBreakdown({ breakdown, effects, name, targetId }: {
  breakdown: HitChanceForecast;
  effects: EffectForecast[];
  name: string;
  targetId: BattleCombatantId;
}) {
  const conditionalEffects = effects.filter(effect => effect.requiresHit && effect.effectChance < 100);
  return <section className={s.damageBreakdown} data-hit-breakdown data-target-id={targetId}>
    <h3 className={s.damageBreakdownTitle}>{name}</h3>
    <dl className={s.damageBreakdownSteps}>
      <div><dt>Base move accuracy</dt><dd>{breakdown.baseAccuracy}%</dd></div>
      {breakdown.modifiers.map(({ kind, label, points, before, after }) => <div key={kind} data-hit-modifier={kind}>
        <dt>{label}{kind === "accuracy" && <small> · {breakdown.attackerAccuracy}</small>}
          {kind === "evasion" && <small> · {breakdown.targetEvasion}</small>}</dt>
        <dd data-direction={points > 0 ? "up" : points < 0 ? "down" : undefined}>
          <small>{points < 0 ? "−" : points > 0 ? "+" : ""}{Math.abs(points)} {Math.abs(points) === 1 ? "pt" : "pts"}</small>
          <span>{before}% → {after}%</span>
        </dd>
      </div>)}
    </dl>
    <p className={s.damageBreakdownFinal}><span>Hit chance</span><strong>{breakdown.hitChance}%</strong></p>
    {conditionalEffects.length > 0 && <dl className={`${s.damageBreakdownSteps} ${s.hitConditionalEffects}`} aria-label="Effects if the move hits">
      {conditionalEffects.map((effect, index) => <div key={index}>
        <dt>{effect.statusApplication ? getBattleStatusGlossary(effect.statusApplication.stack.status).label
          : getBattleEffectGlossary(effect.effectType).label}</dt>
        <dd>{effect.effectChance}% if hit</dd>
      </div>)}
    </dl>}
  </section>;
}

function ForecastBreakdownDialog({ move, effects, targetId, onClose }: {
  move: BattleMove;
  effects: EffectForecast[];
  targetId?: BattleCombatantId;
  onClose: () => void;
}) {
  const targets = new Map(effects.map(({ targetId, name }) => [targetId, name]));
  const [visibleTargetId, setVisibleTargetId] = useState(targetId);
  const [view, setView] = useState<"damage" | "hit">("damage");
  const activeId = visibleTargetId && targets.has(visibleTargetId) ? visibleTargetId : effects[0].targetId;
  const targetEffects = effects.filter(effect => effect.targetId === activeId);
  const hits = targetEffects.filter((effect): effect is DamageForecast => !!effect.damageBreakdown);
  const hitBreakdown = targetEffects.find(effect => effect.hitBreakdown)?.hitBreakdown;
  const activeHitBreakdown = view === "hit" || hits.length === 0 ? hitBreakdown : undefined;
  return <GameDialog title={activeHitBreakdown ? "Hit chance breakdown" : "Damage breakdown"} dialogClassName={s.damageBreakdownDialog} onClose={onClose}>
    <p className={s.damageBreakdownMove}><strong>{move.name}</strong> · Current matchup</p>
    {hitBreakdown && hits.length > 0 && <div className={`${s.damageBreakdownTargets} ${s.forecastBreakdownViews}`} role="group" aria-label="Forecast view">
      <button type="button" aria-pressed={!activeHitBreakdown} onClick={() => setView("damage")}>Damage</button>
      <button type="button" aria-pressed={Boolean(activeHitBreakdown)} onClick={() => setView("hit")}>Hit chance</button>
    </div>}
    {targets.size > 1 && <div className={s.damageBreakdownTargets} role="group" aria-label="Forecast target">
      {[...targets].map(([id, name]) => <button key={id} type="button" data-damage-forecast-target={id}
        aria-pressed={id === activeId} onClick={() => setVisibleTargetId(id)}>{name}</button>)}
    </div>}
    {activeHitBreakdown ? <HitChanceBreakdown breakdown={activeHitBreakdown} effects={targetEffects} name={targetEffects[0].name} targetId={activeId}/>
      : hits.map(({ name, hitChance, requiresHit, effectChance, hpAfter, damageBreakdown }, index) => {
      const { baseDamage, modifiers, finalDamage, hpLost } = damageBreakdown;
      const breaksGuard = modifiers.some(modifier => modifier.kind === "guard-break");
      return <section key={index} className={s.damageBreakdown} data-damage-breakdown data-target-id={activeId}>
        <h3 className={s.damageBreakdownTitle}>{name}{hits.length > 1 ? ` · Hit ${index + 1}` : ""}</h3>
        <dl className={s.damageBreakdownSteps}>
          <div><dt>Base damage</dt><dd>{baseDamage} HP</dd></div>
          {modifiers.map(({ kind, label, operation, percent, damageBefore, damageAfter }) => {
            const change = percent ?? damageAfter - damageBefore;
            return <div key={`${kind}:${label}`} data-damage-modifier={kind}>
              <dt>{label}</dt>
              <dd data-direction={change > 0 ? "up" : change < 0 ? "down" : undefined}>
                {percent !== undefined && <small>{percent < 0 ? "−" : "+"}{Math.abs(percent)}{operation === "additive" ? " pts" : "%"}</small>}
                <span>{damageBefore} → {damageAfter} HP</span>
              </dd>
            </div>;
          })}
        </dl>
        <p className={s.damageBreakdownFinal}><span>Estimated damage{requiresHit ? " if hit" : ""}</span><strong>{finalDamage} HP</strong></p>
        <div className={s.damageBreakdownVitals}>
          <span><strong>Target HP{requiresHit ? " if hit" : ""}</strong> {hpAfter + hpLost} → {hpAfter}</span>
          {requiresHit && <span><strong>Hit chance</strong> {hitChance}%</span>}
          {effectChance < 100 && <span><strong>Effect chance{requiresHit ? " if hit" : ""}</strong> {effectChance}%</span>}
        </div>
        {hpLost < finalDamage && <p>HP loss is capped at {hpLost}.</p>}
        {breaksGuard && <p>Removes Guarded on hit.</p>}
        {modifiers.length > 0 && <p>Step values are rounded for display.{modifiers.some(modifier => modifier.operation === "additive") &&
          " Species adjustments add percentage points to the damage multiplier."}</p>}
      </section>;
    })}
  </GameDialog>;
}

const TARGET_OUTCOME_FADE: Keyframe[] = [
  { opacity: 0 },
  { opacity: 1, offset: 0.16 },
  { opacity: 1, offset: 0.73 },
  { opacity: 0 },
];
const SKIPPED_TURN_FADE: Keyframe[] = [{ opacity: 1 }, { opacity: 1, offset: 0.72 }, { opacity: 0 }];
const GUARD_IMPACT_LABELS: Record<BattleGuardImpact, string> = { held: "Guard held", broken: "Guard broken" };
const GUARD_IMPACT_FADE: Keyframe[] = [
  { opacity: 0, scale: ".84" },
  { opacity: 1, scale: "1", offset: 0.15 },
  { opacity: 0.85, scale: "1.04", offset: 0.54 },
  { opacity: 0, scale: "1.13" },
];

function GuardImpactFlare({ impact, staggerIndex = 0, presentation }: {
  impact: BattleGuardImpact;
  staggerIndex?: number;
  presentation: BattlePlaybackMotion;
}) {
  const { node, animateFade } = useBattleOutcomeFade<HTMLSpanElement>(presentation, GUARD_IMPACT_FADE,
    staggerIndex * BATTLE_OUTCOME_STAGGER_MS, 500);
  if (!animateFade) return null;
  const broken = impact === "broken";
  return <span ref={node} className={s.guardImpactFlare} data-guard-flare data-guard-impact={impact} data-outcome-fade="" aria-hidden="true">
    <svg viewBox="0 0 96 96" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 22a34 34 0 0 1 56 16M18 58a34 34 0 0 0 55 18" stroke="var(--guard-flare-light)" strokeWidth="1.5" opacity=".7"/>
      <path d="M48 15 71 24v17c0 15-9 27-23 34-14-7-23-19-23-34V24Z" stroke="currentColor" strokeWidth="2.5" fill="var(--guard-flare-fill)"/>
      <path d="m48 21 17 7v13c0 12-6 21-17 28-11-7-17-16-17-28V28Z" stroke="var(--guard-flare-light)" strokeWidth="1.25"/>
      {broken ? <>
        <path d="m51 15-8 21 12 7-12 11 5 21m-5-39-18 5m30 2 15-10" stroke="var(--guard-flare-light)" strokeWidth="2.5"/>
        <path d="m78 40 8-4-3 9Zm-4 14 9 1-5 6Zm-59-15-7-3 2 8Z" fill="var(--guard-flare-spark)"/>
      </> : <path d="m76 39 11-6m-10 14 13 1m-16 6 8 6" stroke="var(--guard-flare-spark)" strokeWidth="2"/>}
    </svg>
  </span>;
}

function SkippedTurnCallout({ event, presentation }: {
  event: NonNullable<Presentation["activeEvent"]>;
  presentation: Presentation;
}) {
  const { node } = useBattleOutcomeFade<HTMLSpanElement>(presentation, SKIPPED_TURN_FADE, 0, event.durationMs);
  return <span ref={node} className={s.skippedTurnCallout} data-skipped-turn-callout aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 1 2.1 5.4 5.7-2.1-2.1 5.6L23 12l-5.3 2.1 2.1 5.6-5.7-2.1L12 23l-2.1-5.4-5.7 2.1 2.1-5.6L1 12l5.3-2.1-2.1-5.6 5.7 2.1L12 1Zm0 6-1.4 3.6L7 12l3.6 1.4L12 17l1.4-3.6L17 12l-3.6-1.4L12 7Z"/>
    </svg>
    <span><strong>Turn skipped</strong><em>Stun</em></span>
  </span>;
}

function TargetOutcome({ event, staggerIndex, presentation, grouped }: {
  event: NonNullable<Presentation["activeEvent"]>;
  staggerIndex?: number;
  presentation: Presentation;
  grouped?: BattleTargetOutcome;
}) {
  const energy = event.roundEndEffect?.kind === "energy" ? event.roundEndEffect : undefined;
  const { node, animateFade } = useBattleOutcomeFade<HTMLSpanElement>(presentation, TARGET_OUTCOME_FADE,
    energy ? 0 : staggerIndex === undefined ? undefined : staggerIndex * BATTLE_OUTCOME_STAGGER_MS,
    energy ? event.durationMs : undefined);

  const outcome = event.statusOutcome;
  const staggered = staggerIndex !== undefined;
  const supportStatuses = grouped?.supportStatuses;
  const shownStatus = outcome && (staggered || outcome.status === "bleed" || outcome.status === "slowed") ? outcome : undefined;
  if (!energy && !supportStatuses && !shownStatus && event.kind !== "damage" && event.kind !== "miss") {
    return <b className={s.effect} data-kind={event.kind}>{event.label}</b>;
  }

  const bleed = event.roundEndEffect?.kind === "bleed" ? event.roundEndEffect : undefined;
  const damage = bleed ? `−${bleed.hpLost} HP` : event.kind === "damage" ? event.label : event.precedingDamage;
  const guardImpact = event.guardImpact;
  return <span ref={node} className={s.targetOutcome} data-kind={event.kind}
    data-guard-impact={guardImpact}
    data-staggered-outcome={staggered ? staggerIndex : undefined}
    data-support-outcome={supportStatuses ? "" : undefined}
    data-bleed-tick={bleed ? "" : undefined}
    data-energy-recovery={energy ? "" : undefined}
    data-outcome-fade={animateFade ? "" : undefined}>
    {damage && <strong>{damage.replace(/^-/, "−")}</strong>}
    {guardImpact && <span className={s.guardImpactBadge} data-guard-impact-badge>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 2.5 8 3.6v5.5c0 4.8-3.2 8.3-8 10-4.8-1.7-8-5.2-8-10V6.1Z" fill="var(--guard-badge-icon)"/>
        {guardImpact === "broken" && <path d="m13 3-3 7 4 2-4 4 2 5.4" strokeWidth="2"/>}
      </svg>
      {GUARD_IMPACT_LABELS[guardImpact]}
    </span>}
    {energy && <strong>+{energy.after - energy.before} BE</strong>}
    {event.kind === "miss" && <strong>Miss</strong>}
    {shownStatus && <span className={s.outcomeChip} data-status={shownStatus.status} data-result={shownStatus.result}>
      <StatusIcon status={shownStatus.status}/>{getBattleOutcomeStatusText(shownStatus)}
    </span>}
    {supportStatuses && event.kind === "heal" && <span className={s.outcomeChip} data-result="healed">{event.label}</span>}
    {supportStatuses?.map(status => {
      const guarded = status.status === "guarded" && status.result !== "cleared";
      return <span key={`${status.status}-${status.result}`} className={s.outcomeChip} data-status={status.status} data-result={status.result}>
        {guarded ? <GuardShieldIcon/> : <CleanseIcon/>}
        {guarded && status.result !== "failed" ? "Guarded" : getBattleOutcomeStatusText(status)}
      </span>;
    })}
    {grouped?.knockedOut && <span className={s.outcomeChip} data-result="failed">K.O.</span>}
  </span>;
}

function TurnIcon({ kind }: { kind: "moves" | "items" | "inspect" }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {kind === "moves" && <><path fill="currentColor" d="m9 21 13-15 7-3-2 8-14 14z"/><path d="m5 18 9 9M8 23l-5 6 2 2 6-5"/></>}
    {kind === "items" && <><path d="M12 3h8v4h-8zM13 7v7a10 10 0 1 0 6 0V7"/><path fill="currentColor" d="M9 21c1-2 4-2 7-1s5 1 7-1a8 8 0 1 1-14 2Z"/></>}
    {kind === "inspect" && <><circle cx="20" cy="12" r="8"/><path strokeWidth="5" d="m14 18-10 10"/></>}
  </svg>;
}

function MoveAvailabilityIcon({ kind }: { kind: BattleMoveBlocker["kind"] | "ready" }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {kind === "ready" && <path d="m4.5 10.5 3.6 3.6 7.4-8"/>}
    {kind === "target" && <><circle cx="10" cy="10" r="5.3"/><path d="M10 2v4m0 8v4M2 10h4m8 0h4"/></>}
    {kind === "cooldown" && <path d="M5 3h10M5 17h10M6.5 3v2.5c0 2 1.3 3.3 3.5 4.5-2.2 1.2-3.5 2.5-3.5 4.5V17m7-14v2.5c0 2-1.3 3.3-3.5 4.5 2.2 1.2 3.5 2.5 3.5 4.5V17"/>}
    {kind === "energy" && <path fill="currentColor" stroke="none" d="m11.7 1.8-7.5 9.5h5l-.9 6.9 7.5-9.7h-5l.9-6.7Z"/>}
  </svg>;
}

function OrderCrest({ ally }: { ally: boolean }) {
  return <svg className={s.orderCrest} viewBox="0 0 24 28" aria-hidden="true">
    <path d="M2 2h20v15l-10 9L2 17Z" fill="var(--order-banner)" stroke="#e6bd70" strokeWidth="1.5"/>
    {ally ? <path d="M12 19v-8m0 3C7 14 5 11 5 7c4 1 6 3 7 7Zm0 0c5 0 7-3 7-7-4 1-6 3-7 7Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      : <path d="m7 18 10-11m-10 0 10 11M6 14l4 4m4 0 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}
  </svg>;
}

function MoveDetails({ move }: { move: BattleMove }) {
  return <><h3>{move.name}</h3><p>{move.description}</p><p>Power {move.power} · Move accuracy {move.accuracy}% · Energy {move.battleEnergyCost} · Cooldown {move.cooldown} rounds · Priority {move.priority}</p><p>Targets: {getBattleTargetTypeLabel(move.targetType)}. Move accuracy is a base value; actual hit chance also depends on combat stats and effects.</p>{move.effects.map((effect,i)=>{const entry=getBattleEffectGlossary(effect.type);return <section key={i}><h4>{entry.label}{effect.status?` · ${getBattleStatusGlossary(effect.status).label}`:""}</h4><p>{entry.mechanics}</p><p>{effect.amount!==undefined?`Amount: ${effect.amount}. `:""}{effect.chance!==undefined?`Base chance: ${effect.chance}%. `:""}{effect.duration!==undefined?`Duration: ${effect.duration} rounds. `:""}{effect.target?`Recipient: ${effect.target.replaceAll("_"," ")}. `:""}{effect.note}</p></section>;})}</>;
}

function MoveMenu({ state, actorId, target, resolving, onQueue, onTarget, onSelectMove }: { onSelectMove:(id:string|null)=>void; onTarget:(target:BattleUiTarget)=>void; state: BattleState; actorId: string | null; target: BattleUiTarget | null; resolving: boolean; onQueue: (id:string)=>void }) {
  const [category,setCategory]=useState<BattleMenuCategory>("All");
  const [page,setPage]=useState(0),[moveId,setMoveId]=useState<string|null>(null),[details,setDetails]=useState(false);
  const [view,setView]=useState<"moves"|"preview">("moves");
  const [effectPage,setEffectPage]=useState(0);
  const options=getBattleMenuOptions(state,actorId,target);
  const filtered=options.filter(option=>category==="All"||option.category===category);
  const pages=Math.max(1,Math.ceil(filtered.length/3)),currentPage=Math.min(page,pages-1);
  const shown=filtered.slice(currentPage*3,currentPage*3+3);
  const selected=shown.find(option=>option.move.id===moveId)??shown[0];
  const actor=actorId?state.combatants[actorId]:null;
  const targetName=target?.kind==="field"?"Battlefield":target?.kind==="combatant"?state.combatants[target.combatantId]?.name:"Choose target";
  const availability=actor&&selected&&target?getBattleUiMoveAvailability(state,actor.battleCombatantId,selected.move.id,target):null;
  const targetNames=availability?.normalizedTargetIds.map(id=>state.combatants[id].name)??[];
  const projections=actor&&selected&&target&&availability?.compatible?previewBattleAction(state,{actorId:actor.battleCombatantId,moveId:selected.move.id,targetIds:target.kind==="combatant"?[target.combatantId]:[]}):[];
  return <div className={s.moveMenu} data-view={view}>
    <div className={s.moveTabs}><button aria-pressed={view==="moves"} onClick={()=>setView("moves")}>Choose move</button><button aria-pressed={view==="preview"} onClick={()=>setView("preview")}>Preview & queue</button></div>
    <h2>{actor?`${actor.name} · Choose a Move`:"All actions planned"}</h2>
    <div className={s.categories} role="group" aria-label="Move categories">{BATTLE_MENU_CATEGORIES.map(name=><button key={name} aria-pressed={category===name} disabled={resolving||!actor} onClick={()=>{setCategory(name);setPage(0);setMoveId(null);onSelectMove(null);}}><img src={ART+name.toLowerCase()+".webp"} alt=""/><span>{name} ({options.filter(o=>name==="All"||o.category===name).length})</span></button>)}</div>
    <div className={s.moves} aria-label="Equipped moves">{shown.map(option=><button key={option.move.id} aria-pressed={selected?.move.id===option.move.id} data-unavailable={!option.usable} disabled={resolving} onClick={()=>{setMoveId(option.move.id);onSelectMove(option.move.id);setEffectPage(0);setView("preview");}}><strong>{option.move.name}</strong><small>Energy {option.move.battleEnergyCost}{option.cooldown>0?` · Cooldown ${option.cooldown}`:""}</small><small>{option.reasons[0]??"Ready"}</small></button>)}{!shown.length&&<p>{actor?"No equipped moves in this category.":"Edit a teammate’s action or confirm the round."}</p>}</div>
    <div className={s.pager}><button aria-label="Previous moves" disabled={currentPage===0||resolving} onClick={()=>{setPage(currentPage-1);setMoveId(null);onSelectMove(null);}}>‹</button><span>Page {currentPage+1}/{pages} · {filtered.length} moves</span><button aria-label="Next moves" disabled={currentPage===pages-1||resolving} onClick={()=>{setPage(currentPage+1);setMoveId(null);onSelectMove(null);}}>›</button></div>
    <section className={s.moveSummary}>{selected?<><h3>{selected.move.name}</h3><p>Energy {selected.move.battleEnergyCost} · Power {selected.move.power} · Accuracy {selected.move.accuracy}%</p><div className={s.targetPicker}><strong title={targetNames.join(", ")}>{targetNames.length>1?`Targets · ${targetNames.join(", ")}`:`Target · ${targetName}`}</strong>{selected.move.targetType==="field"?<button onClick={()=>onTarget({kind:"field"})}>Select battlefield</button>:<small>Click a target, then click it again to queue.</small>}</div>
      <div className={s.projections} aria-label="Projected effects">{!availability?.compatible?<p>Choose a compatible target to preview effects.</p>:projections.slice(Math.min(effectPage,Math.max(0,projections.length-1)),Math.min(effectPage,Math.max(0,projections.length-1))+1).map((entry,i)=><p key={i}><strong>{entry.name}</strong>: {entry.description}<small>Hit {entry.hitChance}%{entry.effectChance<100?` · Effect ${entry.effectChance}% if hit`:""}</small></p>)}{projections.length>1&&<div className={s.effectPager}><button aria-label="Previous projected effect" disabled={effectPage===0} onClick={()=>setEffectPage(Math.max(0,effectPage-1))}>‹</button><span>Effect {Math.min(effectPage+1,projections.length)}/{projections.length}</span><button aria-label="Next projected effect" disabled={effectPage>=projections.length-1} onClick={()=>setEffectPage(effectPage+1)}>›</button></div>}<small>Estimate · earlier actions can change effects.</small></div><p className={s.reason}>{selected.reasons.join(" ")||getBattleTargetTypeLabel(selected.move.targetType)}</p><div className={s.moveActions}><button onClick={()=>setDetails(true)}>Full details</button><button className={s.primary} disabled={resolving||!selected.usable} onClick={()=>onQueue(selected.move.id)}>Queue Move</button></div></>:<p>Choose a target on the battlefield, then inspect and queue an equipped move.</p>}</section>
    {details&&selected&&<GameDialog title="Move Details" onClose={()=>setDetails(false)}><MoveDetails move={selected.move}/><h3>Projected effects</h3>{projections.map((entry,i)=><p key={i}>{entry.name}: {entry.description} · Hit {entry.hitChance}% · Effect {entry.effectChance}% if hit</p>)}<p>{selected.reasons.join(" ")}</p><button disabled={resolving||!selected.usable} onClick={()=>{onQueue(selected.move.id);setDetails(false);}}>Queue {selected.move.name}</button></GameDialog>}
  </div>;
}

export function BattleArenaB(props: BattleArenaBProps) {
  const { battleState:resolvedState, sourceById, activeActorId, selectedTarget, queuedActions, individualOrder, presentation, complete, recording }=props;
  const queue = queuedActions ?? new Map<BattleCombatantId, BattleAction>();
  const individual = individualOrder !== undefined;
  const state=presentation.displayState??resolvedState;
  const { open }=useNavigation();
  const [popup,setPopup]=useState<"planning"|"statuses"|"inspect"|"order-inspect"|"items"|"log"|"menu"|"order"|"result"|"leave"|"forfeit"|null>(null);
  const [reviewClosed,setReviewClosed]=useState(false);
  const [movesOpen,setMovesOpen]=useState(false);
  const [draft,setDraft]=useState<{actorId:string;moveId:string}|null>(null);
  const [tappedTarget,setTappedTarget]=useState<string|null>(null);
  const [moveTip, setMoveTip] = useState<{ id: BattleMoveId; via: "pointer" | "focus" | "tap" } | null>(null);
  const turnCardsRef = useRef<HTMLDivElement>(null);
  const orderTokensRef = useRef<HTMLDivElement>(null);
  const [movePage, setMovePage] = useState(0);
  const [turnDetails, setTurnDetails] = useState<"move" | "forecast" | null>(null);
  const [statusId,setStatusId]=useState<string|null>(null);
  const [inspectId,setInspectId]=useState<string|null>(null);
  const combatants=Object.values(state.combatants);
  const players=state.teams.player.combatantIds.map(id=>state.combatants[id]);
  const living=players.filter(c=>!c.isFainted),resolving=presentation.isPlaying,finished=complete&&!resolving;
  const target=selectedTarget?.kind==="combatant"?state.combatants[selectedTarget.combatantId]:null;
  const selectedInspect=inspectId?state.combatants[inspectId]:target;
  const preview=getBattleOrderPreview(state,queue);
  const actionIndex=presentation.activeEvent?.actorId?presentation.actionOrder.indexOf(presentation.activeEvent.actorId):-1;
  const currentEvent=presentation.activeEvent;
  const roundShift = individual ? props.roundOrderShift : undefined;
  const settledShift = roundShift?.roundNumber === state.roundNumber ? roundShift : undefined;
  const currentActorId = currentEvent?.actorId;
  // The controller already holds next round's queue while the previous round's last action and recovery are playing.
  const sameRound = state.roundNumber === resolvedState.roundNumber;
  const remainingOrder = sameRound && !finished ? individualOrder?.filter(id => state.combatants[id] && !state.combatants[id].isFainted) ?? [] : [];
  const order = individual
    ? [...new Set([...(currentActorId ? [currentActorId] : []), ...remainingOrder])]
    : resolving ? (actionIndex >= 0 ? presentation.actionOrder.slice(actionIndex) : []) : preview.map(entry => entry.actorId);
  const orderMoves = useMemo(() => {
    const moves = new Map<BattleCombatantId, { from: number; to: number }>();
    settledShift?.after.forEach((id, to) => {
      const from = settledShift.before.indexOf(id);
      if (from >= 0 && from !== to) moves.set(id, { from, to });
    });
    return moves;
  }, [settledShift]);
  const reducedMotion = presentation.reducedMotion;
  useLayoutEffect(() => {
    if (!settledShift || !orderTokensRef.current || reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const portraits = new Map<BattleCombatantId, HTMLImageElement>();
    for (const token of orderTokensRef.current.querySelectorAll<HTMLButtonElement>("[data-order-actor]")) {
      const portrait = token.querySelector("img");
      if (token.dataset.orderActor && portrait) portraits.set(token.dataset.orderActor, portrait);
    }
    // Map the former slots onto the current strip before animating any portrait.
    const positions = settledShift.after.map(id => portraits.get(id)?.getBoundingClientRect());
    const animations: Animation[] = [];
    for (const [id, { from, to }] of orderMoves) {
      const portrait = portraits.get(id);
      const start = positions[from];
      const end = positions[to];
      if (!portrait || !start?.width || !end?.width) continue;
      const x = start.x + start.width / 2 - end.x - end.width / 2;
      const y = start.y + start.height / 2 - end.y - end.height / 2;
      const earlier = from > to;
      const arc = Math.min(10, end.height / 3) * (earlier ? -1 : 1);
      const accent = `0 0 0 2px ${earlier ? "#69a64e" : "#cf7135"}`;
      const animation = portrait.animate([
        { transform: `translate(${x}px, ${y}px) scale(${start.width / end.width})`, boxShadow: accent },
        { transform: `translate(${x / 2}px, ${y / 2 + arc}px)`, boxShadow: accent, offset: 0.5 },
        { transform: "none", boxShadow: accent, offset: 0.85 },
        { transform: "none", boxShadow: "0 0 0 transparent" },
      ], { duration: 460, easing: "ease-in-out" });
      animation.id = "coliseum-order-slide";
      animations.push(animation);
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [settledShift, orderMoves, reducedMotion]);
  const skippedActorId = individual && currentEvent?.skipReason === "stun" ? currentActorId : undefined;
  const nextSlotId = remainingOrder[0];
  const nextSlot = nextSlotId ? state.combatants[nextSlotId] : undefined;
  const nextSlotCanAct = nextSlot && !hasBattleStatus(nextSlot, "stun");
  const handoffActorId = skippedActorId && nextSlotCanAct ? nextSlotId : undefined;
  const orderActiveId = individual
    ? skippedActorId ? handoffActorId : currentActorId ?? (!resolving && nextSlotCanAct ? nextSlotId : undefined)
    : resolving ? order[0] : undefined;
  const nextOrderId = individual
    ? remainingOrder.find(id => id !== orderActiveId && id !== skippedActorId && !hasBattleStatus(state.combatants[id], "stun"))
    : order[1];
  const orderEntries = order.flatMap((id, index) => {
    const combatant = state.combatants[id];
    if (!combatant) return [];
    const role = id === skippedActorId ? "skipped" : id === orderActiveId ? "now" : id === nextOrderId ? "next" : "later";
    const stunned = individual && role === "later" && hasBattleStatus(combatant, "stun");
    const rankLabel = role === "skipped" ? "Skipped · Stun" : role === "now" ? (individual ? "Now" : "ACTING NOW")
      : role === "next" ? (individual ? "Next" : resolving ? "UP NEXT" : "NEXT")
        : !individual && index === 0 ? "FIRST" : `${index + 1}`;
    const ally = combatant.sideId === "player";
    const sideLabel = ally ? (role === "now" && !resolving ? "Your turn" : "Ally") : "Rival";
    const accessibleRank = role === "later" ? `Slot ${rankLabel}${stunned ? " · Stunned" : ""}` : rankLabel;
    return [{ id, index, combatant, role, stunned, rankLabel, ally, sideLabel, accessibleRank, change: orderMoves.get(id) }];
  });
  const emptyOrderLabel = finished ? "Battle complete" : "Round recovery";
  const roundEndEffect = individual ? currentEvent?.roundEndEffect : undefined;
  const energyRecovery = roundEndEffect?.kind === "energy" && currentEvent
    ? { ...roundEndEffect, eventId: currentEvent.eventId, durationMs: currentEvent.durationMs, playback: presentation }
    : undefined;
  const actionCaption=skippedActorId ? state.combatants[skippedActorId]?.name : currentEvent?`${currentEvent.actorId?state.combatants[currentEvent.actorId]?.name:"End of round"}${currentEvent.moveName?` · ${currentEvent.moveName}`:""}${currentEvent.targetIds.length?` → ${currentEvent.targetIds.map(id=>state.combatants[id]?.name).join(", ")}`:""}`:"";
  const highlight=resolving ? (skippedActorId ? undefined : currentEvent?.actorId) : activeActorId;
  const windup = individual && currentEvent?.kind === "attack" && currentEvent.moveName ? currentEvent : undefined;
  const cueActor = windup?.actorId ? state.combatants[windup.actorId] : undefined;
  const cueTargets = windup?.targetIds.map(id => state.combatants[id]).filter(Boolean) ?? [];
  const singleCueTarget = cueTargets.length === 1 ? cueTargets[0] : undefined;
  const cueIsSelf = !!singleCueTarget && singleCueTarget.battleCombatantId === cueActor?.battleCombatantId;
  const cueTargetLabel = singleCueTarget ? (cueIsSelf ? "Self" : singleCueTarget.name)
    : cueTargets.length ? `${cueTargets.length} ${cueTargets.every(recipient => recipient.sideId === cueActor?.sideId) ? "allies" : "targets"}`
      : "Battlefield";
  function inspect(id?:string, fromOrder = false){setInspectId(id??target?.battleCombatantId??activeActorId??players[0]?.battleCombatantId??null);setPopup(fromOrder ? "order-inspect" : "inspect");}
  function clearDraft(){setDraft(null);setTappedTarget(null);setMoveTip(null);setMovePage(0);setTurnDetails(null);}
  function queueMove(id:string){props.onQueue(id);clearDraft();setMovesOpen(false);setPopup(null);}
  const draftMove=movesOpen&&draft?.actorId===activeActorId&&!resolving&&!complete?getBattleMove(draft.moveId):null;
  const draftActor=activeActorId?state.combatants[activeActorId]:null;
  const validTargets=draftMove&&draftActor?getLegalBattleTargetIds(state,draftActor,draftMove):[];
  const draftAvailability=draftMove&&activeActorId&&selectedTarget?getBattleUiMoveAvailability(state,activeActorId,draftMove.id,selectedTarget):null;
  const highlightedTargets=draftAvailability?.compatible?draftAvailability.normalizedTargetIds:[];
  const turnOptions = individual && !resolving && !complete ? getBattleMenuOptions(state, activeActorId, selectedTarget) : [];
  const completedMoves = turnOptions.filter(option => option.cooldown === 0 && props.completedCooldowns?.includes(option.move.id));
  const turnPage = Math.min(movePage, Math.max(0, Math.ceil(turnOptions.length / 4) - 1));
  const selectedMove = turnOptions.find(option => draft?.actorId === activeActorId && option.move.id === draft.moveId);
  const tipOption = !popup && !turnDetails ? turnOptions.find(option => option.move.id === moveTip?.id) : undefined;
  const tooltipMove = moveTip?.via === "tap" && tipOption?.usable ? undefined : tipOption;
  const tooltipOpen = Boolean(tooltipMove);
  useEffect(() => {
    if (!tooltipOpen) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !turnCardsRef.current?.contains(event.target)) setMoveTip(null);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMoveTip(null);
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [tooltipOpen]);
  const previewMove = tooltipMove?.usable && (moveTip?.via === "pointer" || !selectedMove) ? tooltipMove : selectedMove;
  const effectsFor = (option: typeof previewMove) => option?.usable && activeActorId && selectedTarget
    ? previewBattleAction(state, { actorId: activeActorId, moveId: option.move.id,
      targetIds: selectedTarget.kind === "combatant" ? [selectedTarget.combatantId] : [] }) : [];
  const projectedEffects = effectsFor(previewMove);
  const selectedEffects = previewMove === selectedMove ? projectedEffects : effectsFor(selectedMove);
  const selectedForecast = selectedEffects.filter(effect => effect.damageBreakdown || effect.hitBreakdown);
  const hasDamageForecast = selectedForecast.some(effect => effect.damageBreakdown);
  const slowedForecast = selectedMove?.usable && selectedMove.move.effects.some(effect => effect.status === "slowed")
    ? getBattleSlowedOrderForecast(state, selectedEffects)
    : null;
  const projectionById = new Map(projectedEffects.map(effect => [effect.targetId, effect]));
  const forecastById = new Map<BattleCombatantId, TargetForecast>();
  const allyForecastById = new Map<BattleCombatantId, AllyForecast>();
  if (previewMove?.move.targetType === "all_enemies") {
    for (const effect of projectedEffects) {
      if (!effect.requiresHit) continue;
      const forecast: TargetForecast = forecastById.get(effect.targetId) ?? { hitChance: effect.hitChance, statuses: [] };
      if (effect.statusApplication) forecast.statuses.push(effect.statusApplication);
      forecastById.set(effect.targetId, forecast);
    }
  }
  if (previewMove?.move.targetType === "all_allies") {
    for (const effect of projectedEffects) {
      const heals = effect.effectType === "heal";
      const guarded = effect.statusApplication?.stack.status === "guarded";
      const cleanses = effect.effectChance > 0 ? effect.cleansedStatuses ?? [] : [];
      if (!heals && !guarded && !cleanses.length) continue;
      const forecast: AllyForecast = allyForecastById.get(effect.targetId) ??
        { heals: false, guarded: false, cleanses: new Map() };
      forecast.heals ||= heals;
      forecast.guarded ||= guarded;
      for (const status of cleanses) forecast.cleanses.set(status, effect.effectChance);
      allyForecastById.set(effect.targetId, forecast);
    }
  }
  const allyForecastRows = Math.max(0, ...Array.from(allyForecastById.values(), forecast =>
    forecast.cleanses.size + Number(forecast.guarded)));
  const recoveryTarget = roundEndEffect && currentEvent ? state.combatants[currentEvent.targetIds[0]] : undefined;
  const dockTarget = recoveryTarget ?? target ?? (individual
    ? currentEvent?.targetIds.map(id => state.combatants[id]).find(c => c && !c.isFainted && (getBattleGuardedStatus(c) || getEffectTraySlots(c.statuses) > 0))
    : undefined);
  const effectTraySlots = dockTarget && (!dockTarget.isFainted || roundEndEffect)
    ? getEffectTraySlots(dockTarget.statuses, turnOptions.filter(option => option.usable).map(option => option.move))
    : 0;
  function energyAfter(id: string) {
    return projectionById.get(id)?.battleEnergyAfter ??
      (id === activeActorId && previewMove?.usable ? state.combatants[id].currentBattleEnergy - previewMove.move.battleEnergyCost : undefined);
  }
  function guardFor(id: string): GuardDisplay | undefined {
    if (!individual || state.combatants[id].isFainted) return undefined;
    const active = getBattleGuardedStatus(state.combatants[id]);
    const projected = projectionById.get(id)?.guardedAfter;
    if (projected && (!active || projected.damageReductionPercent !== active.damageReductionPercent || projected.duration !== active.duration)) {
      return { ...projected, mode: "preview" };
    }
    if (active) {
      const breaksOnHit = projected === null && previewMove?.move.tags.includes("guard_break");
      return { ...active, mode: breaksOnHit ? "breaking" : "active" };
    }
    return undefined;
  }
  function selectTarget(next:BattleUiTarget){
    if(resolving)return;
    if (individual) {
      setMoveTip(null);
      props.onTarget(next);
      return;
    }
    const key=next.kind==="field"?"field":next.combatantId;
    const sameSelection=selectedTarget?.kind===next.kind&&(next.kind==="field"||selectedTarget?.kind==="combatant"&&selectedTarget.combatantId===next.combatantId);
    if(draftMove&&activeActorId&&tappedTarget===key&&sameSelection&&getBattleUiMoveAvailability(state,activeActorId,draftMove.id,next).usable){queueMove(draftMove.id);return;}
    props.onTarget(next);setTappedTarget(draftMove?key:null);
  }
  function openStatuses(id:string){setStatusId(id);setPopup("statuses");if(resolving)presentation.setPaused(true);}
  const statusCreature=statusId?state.combatants[statusId]:null;
  const menu=<MoveMenu key={activeActorId??"none"} state={state} actorId={activeActorId} target={selectedTarget} resolving={resolving||complete} onQueue={queueMove} onTarget={selectTarget} onSelectMove={id=>{setDraft(id&&activeActorId?{actorId:activeActorId,moveId:id}:null);setTappedTarget(null);}}/>;
  const targetPlans=new Map<string,string[]>();
  for(const c of living){const action=queue.get(c.battleCombatantId);if(action)for(const id of new Set(action.targetIds)){targetPlans.set(id,[...(targetPlans.get(id)??[]),c.battleCombatantId]);}}
  const sharedTargets=[...targetPlans].filter(([,actors])=>actors.length>1);
  const canConfirm=living.length>0&&living.every(c=>queue.has(c.battleCombatantId))&&!resolving&&!complete;
  const itemTarget=target?.sideId==="player"?target:null;
  const canTonic=!!itemTarget&&!itemTarget.isFainted&&!props.usedTonic&&props.tonicStock>0&&!complete&&!resolving&&!props.aidRestricted;
  const canRevive=!!itemTarget&&itemTarget.isFainted&&!props.usedRevival&&props.revivalStock>0&&(!complete||state.outcome==="enemy_won")&&!resolving&&!props.aidRestricted;
  const guardFeedback = currentEvent?.targetOutcomes?.flatMap(outcome => outcome.guardImpact
    ? [`${state.combatants[outcome.targetId].name}: ${GUARD_IMPACT_LABELS[outcome.guardImpact]}`] : []).join(". ")
    ?? (currentEvent?.guardImpact && GUARD_IMPACT_LABELS[currentEvent.guardImpact]);
  const playback = resolving && <div className={individual ? s.dockPlayback : s.playback} aria-live="polite">
    <strong>{actionCaption}</strong>
    <span className={currentEvent?.targetOutcomes || roundEndEffect ? s.resultAnnouncement : undefined}>
      {currentEvent?.kind === "attack" ? "Preparing action…" : currentEvent?.label}
    </span>
    {individual && guardFeedback && <span className={s.resultAnnouncement}>{guardFeedback}</span>}
    <div>
      <button onClick={() => presentation.setPaused(!presentation.paused)}>{presentation.paused ? "Resume" : "Pause"}</button>
      <button disabled={!presentation.paused} onClick={presentation.step}>Next beat</button>
      <button onClick={() => presentation.setSpeed(presentation.speed === 1 ? 2 : 1)}>{presentation.speed}×</button>
    </div>
  </div>;
  if(finished&&props.resultLedger&&!reviewClosed) return <BattleResultLedger title={props.title} outcome={state.outcome} creatures={players.map(c=>sourceById.get(String(c.sourceCreatureId))).filter((c):c is CreatureRecord=>!!c)} data={props.resultLedger} recording={recording} onBack={()=>setReviewClosed(true)} details={props.result} log={<BattleLogEntries state={state} sourceById={sourceById}/>}/>;
  return <main className={s.arena} data-battle-b data-individual={individual} data-moves-open={movesOpen&&!resolving&&!complete} data-resolving={resolving} data-reduced-motion={presentation.reducedMotion} data-round-end-effect={roundEndEffect?.kind} data-skipped-turn={skippedActorId ? "stun" : undefined} data-slow-forecast={slowedForecast ? "" : undefined}>
    <header className={s.header}><strong data-battle-round>Round {resolving?state.roundNumber:complete?Math.max(1,state.roundNumber-1):state.roundNumber}</strong><h1>{props.title}</h1><div><button onClick={()=>setPopup("log")}>Battle Log</button><button onClick={()=>setPopup("menu")} data-navigation-launcher>Menu</button></div></header>
    <section className={s.order} aria-label={individual ? "Turn order" : resolving ? "Resolution order" : "Order preview"}
      data-turn-queue={individual ? "" : undefined} data-round-order-shift={settledShift?.roundNumber}>
      <button className={s.orderHeading} aria-haspopup="dialog" onClick={() => setPopup("order")}>
        <strong>{individual ? "Full order" : resolving ? currentActorId ? "ACTING NOW → UP NEXT" : "ROUND RECOVERY" : "ORDER PREVIEW"}</strong>
        <small>{individual ? `Round ${state.roundNumber}${settledShift ? " · Shift" : ""}` : resolving ? "" : "Estimate · changes with moves"}</small>
      </button>
      <span className={s.resultAnnouncement} role="status">
        {settledShift && `Round ${settledShift.roundNumber}. ${Array.from(orderMoves, ([id, { from, to }]) =>
          `${state.combatants[id].name} moves ${from > to ? "up" : "down"} ${Math.abs(from - to)} in the order.`).join(" ")}`}
      </span>
      <div className={s.tokens} ref={orderTokensRef}>{orderEntries.map(({ id, index, combatant, role, rankLabel, accessibleRank, ally, sideLabel, change, stunned }) => {
        const direction = change ? (change.from > change.to ? "up" : "down") : undefined;
        return <button key={id} data-side={combatant.sideId} data-rank={index} data-active={role === "now"} data-order-actor={id}
          data-order-role={individual ? role : undefined} data-order-stunned={stunned ? "" : undefined}
          data-skipped-turn={role === "skipped" ? "stun" : undefined} data-turn-handoff={id === handoffActorId ? "" : undefined}
          aria-current={role === "now" ? "step" : undefined} aria-haspopup="dialog"
          aria-label={`Inspect ${combatant.name} in turn order${individual ? ` · ${accessibleRank} · ${sideLabel}` : ""}`}
          onClick={() => inspect(id)}>
          <img src={artwork(sourceById.get(String(combatant.sourceCreatureId)))} alt="" data-order-slide={direction}/>
          {change && <b className={s.orderSlideFallback} data-order-slide-fallback={direction} aria-hidden="true">
            {direction === "up" ? "↑" : "↓"}{Math.abs(change.from - change.to)}
          </b>}
          <span><small>{rankLabel}</small><strong>{combatant.name}</strong>
            {id === currentActorId && role !== "skipped" && currentEvent?.moveName && <em data-action-move={windup ? "" : undefined}>{currentEvent.moveName}</em>}
            {individual && <i>{stunned ? `${sideLabel} · Stunned` : sideLabel}</i>}
          </span>
          {individual && <OrderCrest ally={ally}/>}
        </button>;
      })}{individual && !orderEntries.length && <span className={s.orderEmpty} role="status">{emptyOrderLabel}</span>}</div>
    </section>
    {slowedForecast && selectedMove && <SlowedOrderComparison forecast={slowedForecast} moveName={selectedMove.move.name} state={state} sourceById={sourceById}/>}
    <section className={s.field} aria-label="3 versus 3 battle stage">
      {cueActor && <div className={s.actionRibbon} data-action-cue data-side={cueActor.sideId} aria-hidden="true">
        <img src={artwork(sourceById.get(String(cueActor.sourceCreatureId)))} alt=""/>
        <span>{cueActor.name} <b>→</b> {cueTargetLabel}</span>
        {singleCueTarget && !cueIsSelf && <img src={artwork(sourceById.get(String(singleCueTarget.sourceCreatureId)))} alt=""/>}
      </div>}
      {!individual && <><span className={s.teamLabel} data-side="player">YOUR TEAM</span><span className={s.teamLabel} data-side="enemy">OPPONENTS</span></>}{combatants.map(c=>{
      const selected=target?.battleCombatantId===c.battleCombatantId,acting=highlight===c.battleCombatantId;
      const forecast = forecastById.size > 1 ? forecastById.get(c.battleCombatantId) : undefined;
      const forecastId = `forecast-${c.battleCombatantId}`;
      const allyForecast = allyForecastById.get(c.battleCombatantId);
      const guard = guardFor(c.battleCombatantId);
      const allyGuard = allyForecast?.guarded ? guard : undefined;
      const showAllyEffects = allyForecast && (allyGuard || allyForecast.cleanses.size > 0);
      const healthForecast: HealthForecast | undefined = forecast || allyForecast
        ? { id: `${forecastId}-hp`, kind: forecast ? "attack" : allyForecast?.heals ? "heal" : "support" }
        : undefined;
      const groupedIndex = currentEvent?.targetOutcomes?.findIndex(outcome => outcome.targetId === c.battleCombatantId) ?? -1;
      const grouped = groupedIndex >= 0 ? currentEvent?.targetOutcomes?.[groupedIndex] : undefined;
      const event = grouped && currentEvent ? {
        ...currentEvent,
        kind: grouped.kind,
        label: grouped.label,
        targetIds: [grouped.targetId],
        statusOutcome: grouped.statusOutcome,
        guardImpact: grouped.guardImpact,
        precedingDamage: undefined,
      } : currentEvent;
      const affected=event?.targetIds.includes(c.battleCombatantId);
      const skipped = c.battleCombatantId === skippedActorId;
      const resolvingTarget = affected && !roundEndEffect && !skipped;
      const actionSource = c.battleCombatantId === cueActor?.battleCombatantId;
      const actionTarget = cueActor && windup?.targetIds.includes(c.battleCombatantId)
        ? (c.sideId === cueActor.sideId ? "support" : "hostile") : undefined;
      const supportOutcome = grouped?.supportStatuses;
      const guardResult = supportOutcome?.some(status => status.status === "guarded" && status.result !== "failed" && status.result !== "cleared");
      return <article key={c.battleCombatantId} data-combatant-id={c.battleCombatantId} className={s.figure} data-side={c.sideId} data-slot={c.slotIndex} data-selected={resolving?!!resolvingTarget:draftMove?highlightedTargets.includes(c.battleCombatantId):selected} data-valid-target={!resolving&&(!!healthForecast||validTargets.includes(c.battleCombatantId))} data-area-forecast={healthForecast ? "" : undefined} data-ally-forecast={allyForecast ? "" : undefined} data-active={acting} data-fainted={c.isFainted} data-event={acting&&resolving&&event?.kind==="attack"?"attack":affected&&event?.kind!=="attack"?event?.kind:""}
        data-action-source={actionSource ? "" : undefined} data-action-target={actionTarget}>
        <button className={s.figureButton} aria-label={`Select ${c.name}`} aria-describedby={healthForecast ? [healthForecast.id, forecast || showAllyEffects ? forecastId : null].filter(Boolean).join(" ") : undefined} disabled={resolving||c.isFainted&&c.sideId==="enemy"} onClick={()=>selectTarget({kind:"combatant",combatantId:c.battleCombatantId})}>
          <span className={s.art}>
            <BattleCreatureImage source={sourceById.get(String(c.sourceCreatureId))} combatant={c} event={resolving ? event : null} playback={presentation}/>
            {individual && affected && event?.guardImpact && <GuardImpactFlare key={`guard-flare-${event.eventId}`}
              impact={event.guardImpact} staggerIndex={grouped ? groupedIndex : undefined} presentation={presentation}/>}
            {(actionSource || actionTarget) && <span className={s.actionFloorCue} aria-hidden="true"/>}
            {actionSource ? <span className={s.actionMovePlaque} data-action-plaque><strong>{windup?.moveName}</strong></span>
              : acting && <b className={s.marker}>{resolving ? "ACTING" : individual ? "ACTIVE TURN" : "PLANNING"}</b>}
            {!actionSource && (resolving ? resolvingTarget && !supportOutcome : draftMove ? highlightedTargets.includes(c.battleCombatantId) : selected) &&
              <b className={s.targetMarker} data-action-target={actionTarget}>{individual ? `${actionTarget === "support" ? "ALLY" : "TARGET"} · ${c.name}` : "TARGET"}</b>}
            {skipped && event && <SkippedTurnCallout key={event.eventId} event={event} presentation={presentation}/>}{!skipped && affected && event && event.kind !== "attack" && roundEndEffect?.kind !== "expiry" && (individual
            ? <TargetOutcome key={event.eventId} event={event} presentation={presentation} staggerIndex={grouped ? groupedIndex : undefined} grouped={grouped}/>
            : <b key={event.eventId} className={s.effect} data-kind={event.kind}>{event.label}</b>)}</span>
          <span className={s.nameplate}>
            <strong title={c.name}>{c.name}</strong>
            <HealthMeter value={c.currentHp} max={c.maxHp} after={projectionById.get(c.battleCombatantId)?.hpAfter} guard={guard} forecast={healthForecast} allyGuard={!!(allyGuard || guardResult)}/>
            {forecast && <TargetForecastOdds id={forecastId} forecast={forecast}/>}
            {allyForecast && allyForecastRows > 0 && <AllyForecastEffects id={forecastId} cleanses={allyForecast.cleanses} guard={allyGuard} rows={allyForecastRows}/>}
            <Meter label="BE" value={c.currentBattleEnergy} max={c.maxBattleEnergy} after={energyAfter(c.battleCombatantId)} recovery={affected ? energyRecovery : undefined}/>
            {c.isFainted&&<small>K.O.</small>}
          </span>
        </button>
        <BattleStatusBadges name={c.name} effects={c.statuses} onOpen={()=>openStatuses(c.battleCombatantId)}/>
      </article>;
    })}</section>
    {!individual && playback}
    {individual ? <footer className={s.turnDock} aria-label="Turn options">
      <nav className={s.turnNav} aria-label="Turn commands">
        <h2>Turn Options</h2>
        <button aria-pressed={popup === null} onClick={() => setPopup(null)}><TurnIcon kind="moves"/>Moves</button>
        <button onClick={() => setPopup("items")}><TurnIcon kind="items"/>Items</button>
        <button onClick={() => inspect()}><TurnIcon kind="inspect"/>Inspect</button>
      </nav>
      <section className={s.turnMoves} aria-label="Choose a move">
        <h2>{skippedActorId ? "Turn skipped" : draftActor ? `${draftActor.name} · Choose a move` : resolving ? "Resolving action…" : finished ? "Battle complete" : "Waiting for next turn"}</h2>
        {playback}
        <span className={s.resultAnnouncement} role="status">
          {completedMoves.map(({ move }) => `${move.name} cooldown complete.`).join(" ")}
        </span>
        <div ref={turnCardsRef} className={s.turnCards}>{turnOptions.slice(turnPage * 4, turnPage * 4 + 4).map(option => {
          const tooltip = tooltipMove === option;
          const blocker = option.blockers[0];
          const availabilityKind = blocker?.kind ?? "ready";
          const cooldownComplete = completedMoves.includes(option);
          const details = !tooltip ? [] : option === previewMove ? projectedEffects : effectsFor(option);
          const effect = details.find(entry => entry.targetId === target?.battleCombatantId) ?? details[0];
          return <div key={`${activeActorId}:${option.move.id}`} className={s.turnTile}
            onPointerEnter={event => { if (event.pointerType === "mouse") setMoveTip(current => current?.id === option.move.id ? current : { id: option.move.id, via: "pointer" }); }}
            onPointerLeave={event => { if (event.pointerType === "mouse") setMoveTip(current => current?.id === option.move.id && current.via === "pointer" ? null : current); }}>
            <button aria-pressed={selectedMove?.move.id === option.move.id} data-turn-move data-usable={option.usable} data-cooldown-complete={cooldownComplete ? "" : undefined}
              onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setMoveTip({ id: option.move.id, via: "focus" }); }}
              onBlur={() => setMoveTip(current => current?.id === option.move.id && current.via !== "pointer" ? null : current)}
              aria-describedby={tooltip ? `move-tip-${option.move.id}` : undefined}
              onClick={() => {
                if (!activeActorId) return;
                setDraft({ actorId: activeActorId, moveId: option.move.id });
                if (option.move.targetType === "field") props.onTarget({ kind: "field" });
                setMoveTip(current => blocker
                  ? current?.id === option.move.id && current.via === "tap" ? null : { id: option.move.id, via: "tap" }
                  : current?.via === "tap" ? null : current);
              }}>
              <img src={ART + option.category.toLowerCase() + ".webp"} alt=""/>
              <span className={s.turnTileLabel}>
                <strong>{option.move.name}</strong>
                <span className={s.moveCostRow}>
                  <small>{option.move.battleEnergyCost} BE</small>
                  <span className={s.moveAvailabilityBadge} data-move-availability={availabilityKind}>
                    <MoveAvailabilityIcon kind={availabilityKind}/>{blocker?.label ?? "Ready"}
                  </span>
                </span>
                {cooldownComplete && <span className={s.cooldownBadge}>Cooldown complete</span>}
              </span>
            </button>
            {tooltip && <div className={s.moveTooltip} id={`move-tip-${option.move.id}`} role="tooltip" data-blocked={blocker ? "" : undefined}>
              <strong>{option.move.name}</strong><span>{getBattleTargetTypeLabel(option.move.targetType)} · {option.move.battleEnergyCost} BE</span>
              {blocker ? <ul className={s.moveBlockers} aria-label="Move requirements">
                {option.blockers.map(({ kind, detail }) => <li key={kind} data-move-blocker={kind}>
                  <MoveAvailabilityIcon kind={kind}/><span>{detail}{kind === "energy" && draftActor ? ` You have ${draftActor.currentBattleEnergy} BE.` : ""}</span>
                </li>)}
              </ul> : <span>{effect ? `Est. ${effectForecastText(effect)}` : option.move.description}</span>}
            </div>}
          </div>;
        })}</div>
        {turnOptions.length > 4 && <div className={s.turnPager}><button aria-label="Previous moves" disabled={turnPage === 0} onClick={() => setMovePage(turnPage - 1)}>‹</button><button aria-label="Next moves" disabled={(turnPage+1)*4 >= turnOptions.length} onClick={() => setMovePage(turnPage + 1)}>›</button></div>}
      </section>
      <section className={s.turnTarget} aria-label="Target and action">
        <h2>{recoveryTarget ? `Recovery · ${recoveryTarget.name}` : dockTarget ? `Target · ${dockTarget.name}` : selectedTarget?.kind === "field" ? "Target · Battlefield" : "Choose a target"}</h2>
        {dockTarget && <div className={s.turnTargetVitals}>
          <img src={artwork(sourceById.get(String(dockTarget.sourceCreatureId)))} alt=""/>
          <div>
            <HealthMeter value={dockTarget.currentHp} max={dockTarget.maxHp} after={projectionById.get(dockTarget.battleCombatantId)?.hpAfter} guard={guardFor(dockTarget.battleCombatantId)} details />
            <Meter label="BE" value={dockTarget.currentBattleEnergy} max={dockTarget.maxBattleEnergy} after={energyAfter(dockTarget.battleCombatantId)} recovery={recoveryTarget ? energyRecovery : undefined}/>
          </div>
          {slowedForecast && <SlowedTargetDetail forecast={slowedForecast} targetId={dockTarget.battleCombatantId}/>}
          {(effectTraySlots > 0 || roundEndEffect?.kind === "expiry") && <div className={s.effectTraySlot} data-slots={effectTraySlots}>
            <BattleEffectTray key={dockTarget.battleCombatantId} statuses={dockTarget.statuses} recovery={roundEndEffect && roundEndEffect.kind !== "energy" ? { effect: roundEndEffect, playback: presentation } : undefined} applications={projectedEffects.flatMap(effect =>
              effect.targetId === dockTarget.battleCombatantId && effect.statusApplication ? [effect.statusApplication] : [])} />
          </div>}
        </div>}
        {finished ? <button className={s.primary} disabled={recording} onClick={() => { setReviewClosed(false); if (!props.resultLedger) setPopup("result"); }}>Review Result</button>
          : <button className={s.primary} disabled={!selectedMove?.usable} onFocus={() => setMoveTip(null)} onClick={() => { if (selectedMove?.usable) queueMove(selectedMove.move.id); }}>{selectedMove ? `Use ${selectedMove.move.name}` : "Use Move"}</button>}
        {selectedMove ? selectedForecast.length > 0 ? <div className={s.forecastBreakdownActions}>
          <button type="button" className={s.forecastBreakdownButton} aria-label={hasDamageForecast ? "Damage breakdown" : "Hit chance breakdown"}
            aria-haspopup="dialog" onClick={() => setTurnDetails("forecast")}><span>{hasDamageForecast ? "Damage " : "Hit chance "}</span>breakdown</button>
          <button type="button" className={s.turnDetailButton} aria-label="Move details" aria-haspopup="dialog" onClick={() => setTurnDetails("move")}>Details</button>
        </div> : <button type="button" className={s.turnDetailButton} onClick={() => setTurnDetails("move")}>Move details</button>
          : effectTraySlots > 0 && turnOptions.length > 0 && <span className={s.turnDetailSpace} aria-hidden="true"/>}
      </section>
    </footer> :     <footer className={s.queue} aria-label="Planned ranch actions">
      <section className={s.planLedger} aria-label="Round ledger">
        <div className={s.planHead}><span>Creature</span><span>Move</span><span>Target</span><span>Energy</span><span/></div>
        {players.map(c=>{const action=queue.get(c.battleCombatantId),move=action?getBattleMove(action.moveId):null;const names=action? action.targetIds.map(id=>state.combatants[id]?.name??"Unknown").join(", ")||"Battlefield":"—";return <button className={s.planRow} key={c.battleCombatantId} aria-label={`Plan ${c.name}`} aria-pressed={activeActorId===c.battleCombatantId} disabled={resolving||complete||c.isFainted} onClick={()=>{clearDraft();props.onPlan?.(c.battleCombatantId);setMovesOpen(true);}}>
          <span className={s.planCreature}><img src={artwork(sourceById.get(String(c.sourceCreatureId)))} alt=""/><strong>{c.name}</strong></span>
          <span title={move?.name}>{c.isFainted?"K.O.":move?.name??"Choose a move"}</span><span title={names}>{names}</span><span>{move?`${move.battleEnergyCost} BE`:"—"}</span><span aria-hidden="true">{c.isFainted?"—":action?"✎":"+"}</span>
        </button>})}
        <button className={s.planNotice} onClick={()=>setPopup("planning")} disabled={resolving||complete}>{sharedTargets.length?`${sharedTargets.map(([id,actors])=>`${state.combatants[id]?.name}: ${actors.length} planned actions`).join(" · ")} · Review`:"Round ledger · Review plans"}</button>
      </section>
      <div className={s.planControls}><div className={s.confirm}><small aria-live="polite">{resolving?"Resolving…":`${living.filter(c=>queue.has(c.battleCombatantId)).length}/${living.length} ready`}</small>{finished?<button className={s.primary} disabled={recording} onClick={()=>{setReviewClosed(false);if(!props.resultLedger)setPopup("result");}}>Review Result</button>:<button className={s.primary} disabled={!canConfirm} onClick={()=>{clearDraft();setMovesOpen(false);props.onConfirm?.();}}>Confirm Round</button>}</div>
      <div className={s.dockTools}><button disabled={resolving||finished||!activeActorId} aria-expanded={movesOpen} aria-controls="battle-move-dock" onClick={()=>{clearDraft();setMovesOpen(!movesOpen);}}>{movesOpen?"Collapse":"Moves"}</button><button onClick={()=>setPopup("items")}>Items</button><button onClick={()=>inspect()}>Inspect</button></div></div>
    </footer>}
    {turnDetails === "move" && selectedMove && <GameDialog title="Move Details" onClose={() => setTurnDetails(null)}>
      <MoveDetails move={selectedMove.move}/>
      {selectedEffects.map((effect, index) => <p key={index}>{effect.name} · {effectForecastText(effect)}</p>)}
    </GameDialog>}
    {turnDetails === "forecast" && selectedMove && selectedForecast.length > 0 && <ForecastBreakdownDialog
      move={selectedMove.move} effects={selectedForecast} targetId={target?.battleCombatantId} onClose={() => setTurnDetails(null)}/>}
    {popup==="planning"&&<GameDialog title="Round Ledger" onClose={()=>setPopup(null)}><p>Plans can be edited until you confirm. Shared targets are allowed; estimates do not guarantee hits or effects.</p>{players.map(c=>{const a=queue.get(c.battleCombatantId),m=a?getBattleMove(a.moveId):null;return <section className={s.statusDetail} key={c.battleCombatantId}><h3>{c.name}</h3><p>{c.isFainted?"K.O. · No action required":m&&a?`${m.name} → ${a.targetIds.map(id=>state.combatants[id]?.name??"Unknown").join(", ")||"Battlefield"} · ${m.battleEnergyCost} BE (currently ${c.currentBattleEnergy})`:"Action needed"}</p><button disabled={resolving||complete||c.isFainted} onClick={()=>{clearDraft();props.onPlan?.(c.battleCombatantId);setMovesOpen(true);setPopup(null);}}>Edit {c.name}</button></section>})}</GameDialog>}

    {movesOpen&&!resolving&&!complete&&<section id="battle-move-dock" className={s.expandedDock} aria-label="Choose a move">{menu}</section>}
    {popup==="statuses"&&statusCreature&&<GameDialog title={`${statusCreature.name} · Active Effects`} onClose={()=>setPopup(null)}><p>Durations are remaining rounds. During playback, inspecting effects pauses the action. Close this panel, then select Resume to continue.</p>{statusCreature.statuses.filter(e=>e.duration>0).map((effect,i)=><section className={s.statusDetail} key={i}><h3><StatusIcon status={effect.status}/>{statusLabel(effect)}</h3><p><strong>{effect.duration} rounds · {effect.stacks??1} stack(s)</strong>{effect.amount!==undefined?` · Amount ${effect.amount}`:""}</p><p>{getBattleStatusGlossary(effect.status).mechanics}</p>{effect.sourceCombatantId&&<p>Source: {state.combatants[effect.sourceCombatantId]?.name??"Unknown"}</p>}</section>)}{!statusCreature.statuses.some(e=>e.duration>0)&&<p>No active effects.</p>}</GameDialog>}
    {(popup === "order" || popup === "order-inspect") && <GameDialog title="Turn Order" onClose={() => setPopup(null)}>
      {individual ? <>
        <h3>Round {state.roundNumber} · Remaining turns</h3>
        {orderEntries.length ? <ol className={s.fullOrderList} data-full-turn-order aria-label="Remaining turns">
          {orderEntries.map(({ id, combatant, role, rankLabel, accessibleRank, sideLabel, stunned, change }) => <li key={id}>
            <button className={s.fullOrderEntry} data-side={combatant.sideId} data-order-role={role}
              aria-current={role === "now" ? "step" : undefined} aria-haspopup="dialog"
              aria-label={`Inspect ${combatant.name} in turn order · ${accessibleRank} · ${sideLabel}`}
              onClick={() => inspect(id, true)}>
              <img src={artwork(sourceById.get(String(combatant.sourceCreatureId)))} alt=""/>
              <span><strong>{combatant.name}</strong><small>{sideLabel}{stunned ? " · Stunned" : ""}</small></span>
              <b>{rankLabel}</b>
              {change && <em aria-label={`Moved from slot ${change.from + 1} to slot ${change.to + 1}`}>
                {change.from > change.to ? "↑" : "↓"}{Math.abs(change.from - change.to)}
              </em>}
            </button>
          </li>)}
        </ol> : <p>{emptyOrderLabel}</p>}
        <p>Effective Speed sets the order at the start of each round. Select a portrait to inspect that creature.</p>
      </> : <><p>During planning this is an estimate: effective Speed + 10 × the queued move’s Priority. Unplanned allies and hidden enemy choices use zero Priority in this preview. Ties use the engine’s seeded initiative rule.</p><p>During resolution the strip follows the recorded action order and highlights the creature whose action is being shown. Enemy moves remain hidden during planning.</p><p>Allies plan one move per round. The bottom slots show your plans, not execution order.</p></>}
    </GameDialog>}
    {(popup==="inspect" || popup==="order-inspect")&&selectedInspect&&<GameDialog title={`${selectedInspect.name} · Battle Profile`} onClose={()=>setPopup(popup === "order-inspect" ? "order" : null)} wide><div className={s.profile}><img src={artwork(sourceById.get(String(selectedInspect.sourceCreatureId)),true)} alt={`${selectedInspect.name}, full body`}/><div><p>Level {selectedInspect.level} · HP {selectedInspect.currentHp}/{selectedInspect.maxHp} · Battle Energy {selectedInspect.currentBattleEnergy}/{selectedInspect.maxBattleEnergy}</p><h3>Current battle numbers</h3><dl className={s.stats}>{Object.entries(getEffectiveBattleStats(selectedInspect)).map(([key,value])=><div key={key}><dt>{BATTLE_STAT_LABELS[key as BattleStatKey]}</dt><dd>{value}</dd></div>)}</dl><h3>Statuses</h3>{selectedInspect.statuses.length?selectedInspect.statuses.map((status,i)=><p key={i}><strong>{getBattleStatusGlossary(status.status).label} · {status.duration} rounds{(status.stacks??1)>1?` · ${status.stacks} stacks`:""}</strong><br/>{getBattleStatusGlossary(status.status).mechanics}</p>):<p>No status effects.</p>}{(()=>{const source=sourceById.get(String(selectedInspect.sourceCreatureId));return source?<><h3>Base numbers · Innate grades</h3><dl className={s.stats}>{STAT_KEYS.map(key=><div key={key}><dt>{key}</dt><dd>{source.stats[key]} · {source.statGrades[key]}</dd></div>)}</dl><p>Equipment and battle effects change numeric battle values; innate grades stay unchanged.</p></>:null;})()}</div></div></GameDialog>}
    {popup === "items" && <GameDialog title="Support Items" onClose={() => setPopup(null)}>
      <p role="status">{props.message}</p>
      <p>{props.aidRestricted ? "Restricted Aid: Field Tonics and Revival Salves cannot be used in this challenge." : "Each item type can be used once per battle. Select a ranch creature below before using an item."}</p>
      <div className={s.itemTargets}>{players.map(c => <button key={c.battleCombatantId} aria-pressed={itemTarget?.battleCombatantId === c.battleCombatantId} disabled={resolving} onClick={() => props.onTarget({kind:"combatant",combatantId:c.battleCombatantId})}>{c.name} · {c.isFainted ? "K.O." : `${c.currentHp}/${c.maxHp} HP`}</button>)}</div>
      <div className={s.itemCards}>
        <section>
          <img src="/images/ui/outfitter-v1/field_tonic.webp" alt="" />
          <h3>Field Tonic ({props.tonicStock})</h3>
          <p>Restore 30% maximum HP and 20% maximum Battle Energy to a living ally.</p>
          {canTonic && itemTarget && <div className={s.itemHealthPreview}>
            <Meter label="HP" value={itemTarget.currentHp} max={itemTarget.maxHp} after={getSupportItemVitals(itemTarget, "tonic").currentHp} />
            {itemTarget.currentHp === itemTarget.maxHp && <small>Already at full HP</small>}
          </div>}
          <button disabled={!canTonic} onClick={() => props.onItem("tonic")}>{props.usedTonic ? "Used this battle" : "Use Field Tonic"}</button>
        </section>
        <section>
          <img src="/images/ui/outfitter-v1/revival_salve.webp" alt="" />
          <h3>Revival Salve ({props.revivalStock})</h3>
          <p>Revive a fainted ally at 35% HP and 10% Battle Energy, clearing statuses.</p>
          {canRevive && itemTarget && <div className={s.itemHealthPreview}>
            <Meter label="HP" value={itemTarget.currentHp} max={itemTarget.maxHp} after={getSupportItemVitals(itemTarget, "revival").currentHp} />
          </div>}
          <button disabled={!canRevive} onClick={() => props.onItem("revival")}>{props.usedRevival ? "Used this battle" : "Use Revival Salve"}</button>
        </section>
      </div>
    </GameDialog>}
    {popup==="log"&&<GameDialog title="Battle Log" dialogClassName={logStyles.logDialog} onClose={()=>setPopup(null)} wide>{resolving&&<p>Playback in progress. The action log appears when playback finishes.</p>}{resolving&&<p>{actionCaption} · {currentEvent?.label}</p>}<BattleLogEntries state={state} sourceById={sourceById} playback={resolving}/></GameDialog>}
    {popup==="menu"&&<GameDialog title="Battle Menu" onClose={()=>setPopup(null)}><p role="status">{props.message}</p><div className={s.menuButtons}><button onClick={()=>{setPopup(null);open("menu");}}>Game Menu</button><button onClick={()=>presentation.setSpeed(presentation.speed===1?2:1)}>Animation speed · {presentation.speed}×</button><button aria-pressed={presentation.reducedMotion} onClick={()=>presentation.setReducedMotion(!presentation.reducedMotion)}>Reduced motion · {presentation.reducedMotion?"On":"Off"}</button><button disabled={resolving||recording||complete} onClick={()=>setPopup("forfeit")}>Forfeit & Record Loss</button><button disabled={resolving||recording} onClick={()=>setPopup("leave")}>Leave Without Record</button></div>{props.rules}</GameDialog>}
    {popup==="leave"&&<GameDialog title="Leave Without Record?" onClose={()=>setPopup("menu")}><p>This match grants no result, XP or rewards. Items already used remain spent.</p><button onClick={()=>setPopup(null)}>Keep Playing</button><button disabled={resolving||recording} onClick={props.onReturn}>Confirm Leave</button></GameDialog>}
    {popup==="forfeit"&&<GameDialog title="Record a Loss?" onClose={()=>setPopup("menu")}><p>End this match as a defeat and record its result? Items already used remain spent.</p><button onClick={()=>setPopup(null)}>Keep Playing</button><button disabled={resolving||recording||complete} onClick={props.onForfeit}>Confirm Forfeit</button></GameDialog>}
    {popup==="result"&&finished&&<GameDialog title="Battle Result" onClose={()=>setPopup(null)}>{props.result}</GameDialog>}
  </main>;
}
