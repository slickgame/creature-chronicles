import Image from "next/image";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { getBattleStatGlossary, getBattleStatusGlossary } from "@/data/battleGlossary";
import { getBattleOutcomeStatusText } from "@/data/battlePresentation";
import { gameplayArt } from "@/data/creatureGameplayArt";
import type { BattleMoveLogGroup, BattleMoveLogTarget, BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import { EffectIcon } from "./BattleEffectTray";
import { StatusIcon } from "./BattleStatusBadges";
import s from "./BattleLogTargetCards.module.css";

type HeadingProps = Pick<ComponentPropsWithoutRef<"button">, "id" | "tabIndex"> & {
  "data-battle-log-entry"?: number;
  "data-battle-log-event"?: string;
  "data-search-jump"?: string;
  "data-order-shift-source-jump"?: string;
};

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function signedDelta(delta: number) {
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

function TargetCard({ target, source, highlighted }: {
  target: BattleMoveLogTarget;
  source?: CreatureRecord;
  highlighted: boolean;
}) {
  const { targetId, targetName, hit, hpDelta, battleEnergyDelta, knockedOut, statuses } = target;
  const fullHp = target.hpWasFull && hpDelta === 0;
  const fullEnergy = target.battleEnergyWasFull && battleEnergyDelta === 0;
  const hasOutcome = hpDelta || battleEnergyDelta || fullHp || fullEnergy || knockedOut || statuses.length || hit === false;

  return <li className={s.targetCard} data-move-target-card={targetId} data-target-hit={hit}
    data-search-target-card={highlighted ? "" : undefined}>
    <span className={s.portrait} aria-hidden="true">
      {source ? <Image src={gameplayArt(source, true)} width={72} height={72} alt="" unoptimized/> : targetName.slice(0, 1)}
    </span>
    <div className={s.targetCopy}>
      <strong>{targetName}</strong>
      {(hpDelta !== 0 || battleEnergyDelta !== 0) && <div className={s.deltas}>
        {hpDelta !== 0 && <b data-vital="hp" data-direction={hpDelta < 0 ? "loss" : "gain"}>{signedDelta(hpDelta)} HP</b>}
        {battleEnergyDelta !== 0 && <b data-vital="energy">{signedDelta(battleEnergyDelta)} BE</b>}
      </div>}
      {fullHp && <span className={s.badge} data-result="full-hp">Full HP</span>}
      {fullEnergy && <span className={s.badge} data-result="full-energy">Full BE</span>}
      {statuses.map((status, index) => {
        const duration = status.duration && countLabel(status.duration, "round");
        const stacks = status.stacks && status.stacks > 1 ? ` ×${status.stacks}` : "";
        const statusName = getBattleStatusGlossary(status.status).label;
        const modifier = status.stat && status.amount
          ? ` · ${getBattleStatGlossary(status.stat).label} ${signedDelta(status.amount)}`
          : "";
        let label = status.result === "applied" ? statusName : getBattleOutcomeStatusText(status);
        if (status.attemptedClear) label = `${statusName} cleanse failed`;
        return <span key={`${status.status}-${index}`} className={s.badge} data-status={status.status} data-result={status.result}>
          {status.status === "bleed" || status.status === "slowed" ? <EffectIcon status={status.status}/> : <StatusIcon status={status.status}/>}
          <span>{label}{stacks}{modifier}{duration ? ` · ${duration}` : ""}</span>
        </span>;
      })}
      {knockedOut && <span className={s.badge} data-result="knockout">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M12 2a9 9 0 0 0-9 9c0 3 1.6 5 4 6v4h10v-4c2.4-1 4-3 4-6a9 9 0 0 0-9-9Zm-4 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-4 4-1.5 2h3L12 14Z"/>
        </svg>
        Knocked out
      </span>}
      {hit === false && <span className={s.badge} data-result="miss">Missed</span>}
      {!hasOutcome && <span className={s.badge} data-result="no-change">{hit === true ? "Hit" : "No change"}</span>}
    </div>
  </li>;
}

export function BattleLogTargetCards({
  group, targets, combatants, sourceById, heading, headingProps,
  expanded, onToggle, notesOpen, onToggleNotes, highlightedTargetId, children,
}: {
  group: BattleMoveLogGroup;
  targets: readonly BattleMoveLogTarget[];
  combatants: BattleState["combatants"];
  sourceById: ReadonlyMap<string, CreatureRecord>;
  heading?: ReactNode;
  headingProps?: HeadingProps;
  expanded: boolean;
  onToggle: () => void;
  notesOpen: boolean;
  onToggleNotes: () => void;
  highlightedTargetId?: string;
  children?: ReactNode;
}) {
  const contentId = useId();
  const notesId = `${contentId}-notes`;
  const hits = group.targets.filter(target => target.hit === true).length;
  const misses = group.targets.filter(target => target.hit === false).length;
  const knockouts = group.targets.filter(target => target.knockedOut).length;
  const summary = [hits && countLabel(hits, "hit"), misses && countLabel(misses, "miss", "misses"), knockouts && countLabel(knockouts, "KO")]
    .filter(Boolean).join(" · ");
  const targetSummary = group.targets.length ? countLabel(group.targets.length, "target") : "Action details";

  return <section className={s.group} data-battle-move-group={group.logIndex} data-round={group.roundNumber}>
    <button {...headingProps} type="button" className={s.heading} onClick={onToggle}
      aria-expanded={expanded} aria-controls={contentId} data-move-group-toggle>
      <span className={s.round}>Round {group.roundNumber}</span>
      <strong className={s.moveName}>{heading ?? `${group.actorName} used ${group.moveName}`}</strong>
      <span className={s.summary}>{summary || targetSummary}</span>
      <span className={s.chevron} aria-hidden="true"/>
    </button>
    <div id={contentId} className={s.details} hidden={!expanded}>
      {expanded && <>
        {targets.length > 0 && <ul className={s.targetCards} aria-label="Target outcomes">
          {targets.map(target => {
            const combatant = combatants[target.targetId];
            const source = combatant && sourceById.get(String(combatant.sourceCreatureId));
            return <TargetCard key={target.targetId} target={target} source={source}
              highlighted={target.targetId === highlightedTargetId}/>;
          })}
        </ul>}
        {children && <div className={s.notes}>
          <button type="button" className={s.notesToggle} aria-expanded={notesOpen}
            aria-controls={notesId} onClick={onToggleNotes}>Event notes <span aria-hidden="true">{notesOpen ? "−" : "+"}</span></button>
          <div id={notesId} className={s.notesRows} hidden={!notesOpen} data-move-log-details>{children}</div>
        </div>}
      </>}
    </div>
  </section>;
}
