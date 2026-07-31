"use client";

import type { CSSProperties } from "react";
import { getBattlePortraitConfig, type BattlePresentationEvent } from "@/data/battlePresentation";
import { getEffectiveBattleStats } from "@/data/battleEngine";
import { getBattleMove } from "@/data/battleMoves";
import { getVariantDefinition } from "@/data/creatures";
import type { BattleUiTarget } from "@/data/battleUi";
import type { BattleAction, BattleCombatant, BattleCombatantId, BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { BattlePresentationSpeed } from "./useBattlePresentationController";
import styles from "./BattlePortraitStage.module.css";

const FALLBACK_IMAGE = "/images/ui/icons/icon_paw_crest.png";

type PortraitStyle = CSSProperties & {
  "--portrait-scale": number;
  "--portrait-offset-x": string;
  "--portrait-offset-y": string;
};

export type BattlePortraitStageProps = {
  battleState: BattleState;
  sourceById: ReadonlyMap<string, CreatureRecord>;
  selectedTarget: BattleUiTarget | null;
  activeActorId: BattleCombatantId | null;
  queuedActions: ReadonlyMap<BattleCombatantId, BattleAction>;
  activeEvent: BattlePresentationEvent | null;
  isResolving: boolean;
  queuedEventCount: number;
  speed: BattlePresentationSpeed;
  reducedMotion: boolean;
  onSpeedChange: (speed: BattlePresentationSpeed) => void;
  onReducedMotionChange: (reduced: boolean) => void;
  onTarget: (combatantId: BattleCombatantId) => void;
  onPlan: (combatantId: BattleCombatantId) => void;
  onFieldTarget: () => void;
};

function creatureProfile(source?: CreatureRecord): string {
  if (!source) return FALLBACK_IMAGE;
  const variant = getVariantDefinition(source.variantId);
  return source.profilePath || variant.profilePath || source.portraitPath || variant.portraitPath || FALLBACK_IMAGE;
}

function creaturePortrait(source?: CreatureRecord): string {
  if (!source) return FALLBACK_IMAGE;
  const variant = getVariantDefinition(source.variantId);
  return source.portraitPath || variant.portraitPath || source.profilePath || variant.profilePath || FALLBACK_IMAGE;
}

function compactStatus(combatant: BattleCombatant): string[] {
  return combatant.statuses
    .filter((status) => status.duration > 0)
    .slice(0, 2)
    .map((status) => `${status.status}${(status.stacks ?? 1) > 1 ? ` ×${status.stacks}` : ""}`);
}

function hpTone(combatant: BattleCombatant): string {
  const ratio = combatant.maxHp > 0 ? combatant.currentHp / combatant.maxHp : 0;
  if (ratio <= 0.25) return "critical";
  if (ratio <= 0.6) return "warning";
  return "healthy";
}

function CombatantFigure({
  combatant,
  source,
  selected,
  active,
  queuedAction,
  activeEvent,
  resolving,
  onTarget,
}: {
  combatant: BattleCombatant;
  source?: CreatureRecord;
  selected: boolean;
  active: boolean;
  queuedAction?: BattleAction;
  activeEvent: BattlePresentationEvent | null;
  resolving: boolean;
  onTarget: () => void;
}) {
  const portrait = getBattlePortraitConfig(combatant.speciesId);
  const effective = getEffectiveBattleStats(combatant);
  const statuses = compactStatus(combatant);
  const isActor = activeEvent?.actorId === combatant.battleCombatantId;
  const isEventTarget = activeEvent?.targetIds.includes(combatant.battleCombatantId) ?? false;
  const eventKind = isEventTarget ? activeEvent?.kind : isActor ? activeEvent?.kind : null;
  const canTarget = !combatant.isFainted || combatant.sideId === "player";
  const profileStyle: PortraitStyle = {
    "--portrait-scale": Math.min(0.82, Math.max(0.45, portrait.scale * 0.64)),
    "--portrait-offset-x": `${Math.round(portrait.offsetX * 0.55)}px`,
    "--portrait-offset-y": `${Math.round(portrait.offsetY * 0.55)}px`,
  };
  const classNames = [
    styles.combatant,
    styles[combatant.sideId],
    styles[`slot${combatant.slotIndex}`],
    selected ? styles.selected : "",
    active ? styles.active : "",
    combatant.isFainted ? styles.fainted : "",
    isActor && activeEvent?.kind === "attack" ? styles.attacking : "",
    isEventTarget && activeEvent?.kind === "damage" ? styles.hit : "",
    isEventTarget && activeEvent?.kind === "heal" ? styles.healed : "",
    isEventTarget && activeEvent?.kind === "status" ? styles.statused : "",
    isEventTarget && activeEvent?.kind === "knockout" ? styles.knockedOut : "",
    isEventTarget && activeEvent?.kind === "miss" ? styles.missed : "",
  ].filter(Boolean).join(" ");

  const hpPercent = Math.max(0, Math.min(100, Math.round((combatant.currentHp / Math.max(1, combatant.maxHp)) * 100)));
  const queuedMove = queuedAction ? getBattleMove(queuedAction.moveId).name : null;
  const detailTitle = [
    combatant.name,
    `Level ${combatant.level}`,
    `Speed ${effective.speed}`,
    `HP ${combatant.currentHp}/${combatant.maxHp}`,
    `Battle Energy ${combatant.currentBattleEnergy}/${combatant.maxBattleEnergy}`,
    statuses.length ? `Statuses: ${statuses.join(", ")}` : "No status effects",
    queuedMove ? `Queued: ${queuedMove}` : combatant.sideId === "enemy" ? "Enemy action hidden" : "Action not queued",
  ].join("\n");

  return (
    <article className={classNames} style={profileStyle} data-side={combatant.sideId} data-slot={combatant.slotIndex} title={detailTitle}>
      <button
        type="button"
        className={styles.figureButton}
        onClick={onTarget}
        disabled={!canTarget || resolving}
        aria-label={`${selected ? "Selected target" : "Select"} ${combatant.name}`}
      >
        <span className={styles.shadow} aria-hidden="true" />
        <span className={styles.selectionRing} aria-hidden="true" />
        <span className={styles.portraitWindow} data-ui-fixed-size="true">
          <img
            src={creatureProfile(source)}
            alt=""
            onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
          />
        </span>
        {isEventTarget && activeEvent ? <span className={`${styles.targetEffect} ${styles[`effect_${activeEvent.preset}`]}`} aria-hidden="true" /> : null}
        {isEventTarget && activeEvent && activeEvent.kind !== "attack" ? (
          <span className={`${styles.floatingText} ${styles[`text_${activeEvent.kind}`]}`}>{activeEvent.label}</span>
        ) : null}
        {isActor && activeEvent?.kind === "attack" ? <span className={styles.attackFlash} aria-hidden="true" /> : null}
      </button>

      <section className={styles.nameplate} data-tone={hpTone(combatant)}>
        <div className={styles.identityLine}>
          <strong>{combatant.name}</strong>
          {active ? <em className={styles.activeMarker} title="Current actor">●</em> : queuedMove ? <em title={`Queued: ${queuedMove}`}>✓</em> : null}
        </div>
        <div className={styles.hpTrack}><span style={{ width: `${hpPercent}%` }} /></div>
        <div className={styles.compactMeta}>
          <span>{combatant.isFainted ? "K.O." : statuses[0] ?? `BE ${combatant.currentBattleEnergy}`}</span>
          <strong>{combatant.currentHp}/{combatant.maxHp}</strong>
        </div>
      </section>
      {eventKind === "knockout" ? <span className={styles.koStamp}>K.O.</span> : null}
    </article>
  );
}

export function BattlePortraitStage({
  battleState,
  sourceById,
  selectedTarget,
  activeActorId,
  queuedActions,
  activeEvent,
  isResolving,
  queuedEventCount,
  speed,
  reducedMotion,
  onSpeedChange,
  onReducedMotionChange,
  onTarget,
  onPlan,
  onFieldTarget,
}: BattlePortraitStageProps) {
  const combatants = Object.values(battleState.combatants).sort((left, right) => left.slotIndex - right.slotIndex);
  const players = combatants.filter((combatant) => combatant.sideId === "player");
  const enemies = combatants.filter((combatant) => combatant.sideId === "enemy");
  const actorSide = activeEvent?.actorId ? battleState.combatants[activeEvent.actorId]?.sideId : undefined;
  const fieldSelected = selectedTarget?.kind === "field";
  const hasCombatantTarget = selectedTarget?.kind === "combatant";
  const projectedOrder = combatants
    .filter((combatant) => !combatant.isFainted)
    .sort((left, right) => {
      const leftAction = queuedActions.get(left.battleCombatantId);
      const rightAction = queuedActions.get(right.battleCombatantId);
      const leftPriority = leftAction ? getBattleMove(leftAction.moveId).priority : 0;
      const rightPriority = rightAction ? getBattleMove(rightAction.moveId).priority : 0;
      if (rightPriority !== leftPriority) return rightPriority - leftPriority;
      const speedDifference = getEffectiveBattleStats(right).speed - getEffectiveBattleStats(left).speed;
      if (speedDifference !== 0) return speedDifference;
      return left.slotIndex - right.slotIndex;
    });

  const renderCombatant = (combatant: BattleCombatant) => (
    <CombatantFigure
      key={combatant.battleCombatantId}
      combatant={combatant}
      source={sourceById.get(String(combatant.sourceCreatureId))}
      selected={selectedTarget?.kind === "combatant" && selectedTarget.combatantId === combatant.battleCombatantId}
      active={activeActorId === combatant.battleCombatantId}
      queuedAction={queuedActions.get(combatant.battleCombatantId)}
      activeEvent={activeEvent}
      resolving={isResolving}
      onTarget={() => onTarget(combatant.battleCombatantId)}
    />
  );

  return (
    <section
      className={styles.stage}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-has-target={hasCombatantTarget ? "true" : "false"}
      aria-label="3 versus 3 battle stage"
    >
      <header className={styles.stageHeader}>
        <div className={`${styles.teamLabel} ${styles.playerTeamLabel}`}><span>Ranch</span><strong>{battleState.teams.player.name}</strong></div>

        <div className={styles.turnOrderStrip}>
          <span>Projected Order</span>
          <div>
            {projectedOrder.map((combatant, index) => {
              const action = queuedActions.get(combatant.battleCombatantId);
              const source = sourceById.get(String(combatant.sourceCreatureId));
              const effective = getEffectiveBattleStats(combatant);
              const title = combatant.sideId === "enemy"
                ? `${index + 1}. ${combatant.name} · Enemy · SPD ${effective.speed} · Action hidden`
                : `${index + 1}. ${combatant.name} · Ranch · SPD ${effective.speed} · ${action ? `Queued ${getBattleMove(action.moveId).name}` : "Action not queued"}`;
              return (
                <button
                  key={combatant.battleCombatantId}
                  type="button"
                  className={styles.orderToken}
                  data-side={combatant.sideId}
                  data-active={activeActorId === combatant.battleCombatantId ? "true" : "false"}
                  data-queued={action ? "true" : "false"}
                  onClick={combatant.sideId === "player" ? () => onPlan(combatant.battleCombatantId) : undefined}
                  disabled={isResolving || combatant.sideId === "enemy"}
                  title={title}
                  aria-label={title}
                >
                  <img src={creaturePortrait(source)} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }} />
                  <small>{index + 1}</small>
                  {action ? <em>✓</em> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.presentationControls}>
          <span>{isResolving ? `${queuedEventCount} FX` : "FX"}</span>
          <button type="button" className={speed === 1 ? styles.controlActive : ""} onClick={() => onSpeedChange(1)}>1×</button>
          <button type="button" className={speed === 2 ? styles.controlActive : ""} onClick={() => onSpeedChange(2)}>2×</button>
          <button type="button" className={reducedMotion ? styles.controlActive : ""} onClick={() => onReducedMotionChange(!reducedMotion)}>Reduced</button>
        </div>

        <div className={`${styles.teamLabel} ${styles.enemyTeamLabel}`}><span>Enemy</span><strong>{battleState.teams.enemy.name}</strong></div>
      </header>

      <div className={styles.arena}>
        <div className={styles.environmentGlow} aria-hidden="true" />
        <div className={styles.playerFormation}>{players.map(renderCombatant)}</div>
        <div className={styles.enemyFormation}>{enemies.map(renderCombatant)}</div>

        <button type="button" className={`${styles.fieldTarget} ${fieldSelected ? styles.fieldSelected : ""}`} onClick={onFieldTarget} disabled={isResolving}>
          <span>VS</span>
          <small>{fieldSelected ? "Field selected" : "Target field"}</small>
        </button>

        {activeEvent ? (
          <div className={styles.actionBanner}>
            <span>{activeEvent.kind === "attack" ? "Action" : activeEvent.kind}</span>
            <strong>{activeEvent.moveName ?? activeEvent.label}</strong>
          </div>
        ) : null}

        {activeEvent?.kind === "attack" && activeEvent.preset === "projectile" ? (
          <span className={`${styles.projectile} ${actorSide === "enemy" ? styles.projectileEnemy : styles.projectilePlayer}`} aria-hidden="true" />
        ) : null}
      </div>
    </section>
  );
}
