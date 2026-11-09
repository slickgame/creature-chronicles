import { useState } from "react";
import { gameplayArt } from "@/data/creatureGameplayArt";
import type { BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import s from "./BattleLogEntries.module.css";

const BOOKMARKS_PER_GROUP = 6;

export function BattleLogEntries({ state, sourceById, playback = false }: {
  state: BattleState;
  sourceById: ReadonlyMap<string, CreatureRecord>;
  playback?: boolean;
}) {
  const [selectedRound, setSelectedRound] = useState<number>();
  if (playback) return null;

  const boundaries = state.roundLogBoundaries ?? [];
  const selection = boundaries.findIndex(entry => entry.roundNumber === selectedRound);
  const activeIndex = selection >= 0 ? selection : boundaries.length - 1;
  const activeRound = boundaries[activeIndex];
  const start = activeRound?.logIndex ?? 0;
  const end = boundaries[activeIndex + 1]?.logIndex ?? state.log.length;
  const shifts = new Map(state.orderShiftLog?.map(entry => [entry.logIndex, entry]));
  const entries = state.log.slice(start, end).map((line, offset) => {
    const index = start + offset;
    const shift = shifts.get(index);
    if (!shift || !shift.moves.length || shift.moves.some(({ actorId }) => !state.combatants[actorId])) {
      return <p key={index}>{line}</p>;
    }
    const title = `Round ${shift.roundNumber} · Order Shift`;
    return <section key={index} className={s.shiftCard} aria-label={title} data-order-shift-card={shift.roundNumber}>
      <h3 className={s.shiftTitle}>{title}</h3>
      <ul>
        {shift.moves.map(({ actorId, from, to }) => {
          const creature = state.combatants[actorId];
          const source = sourceById.get(String(creature.sourceCreatureId));
          return <li key={actorId} className={s.shiftRow} data-order-shift-row={from > to ? "up" : "down"}>
            <span className={s.portrait} aria-hidden="true">
              {source ? <img src={gameplayArt(source, true)} alt=""/> : creature.name.slice(0, 1)}
            </span>
            <strong>{creature.name}</strong>
            <span className={s.slots}>
              <span data-order-shift-slots aria-hidden="true">{from} → {to}</span>
              <span className={s.slotDescription}>Slot {from} to slot {to}</span>
            </span>
          </li>;
        })}
      </ul>
    </section>;
  });

  if (!activeRound) return entries;
  const groupStart = Math.floor(activeIndex / BOOKMARKS_PER_GROUP) * BOOKMARKS_PER_GROUP;
  const groupEnd = Math.min(groupStart + BOOKMARKS_PER_GROUP, boundaries.length);
  const shiftRounds = new Set(state.orderShiftLog?.map(entry => entry.roundNumber));
  return <>
    <nav className={s.roundNav} aria-label="Round bookmarks" data-round-bookmarks>
      <div className={s.roundButtons}>
        {boundaries.slice(groupStart, groupEnd).map(({ roundNumber }) => {
          const hasShift = shiftRounds.has(roundNumber);
          return <button key={roundNumber} type="button" className={s.bookmarkButton}
            data-round-bookmark={roundNumber} data-order-shift-bookmark={hasShift ? "" : undefined}
            aria-label={`Round ${roundNumber}${hasShift ? ", order shift" : ""}`}
            aria-pressed={activeRound.roundNumber === roundNumber} onClick={() => setSelectedRound(roundNumber)}>
            {roundNumber}{hasShift && <span className={s.shiftMark} aria-hidden="true"/>}
          </button>;
        })}
      </div>
      {shiftRounds.size > 0 && <span className={s.shiftLegend}><span className={s.shiftMark} aria-hidden="true"/> Order shift</span>}
      {boundaries.length > BOOKMARKS_PER_GROUP && <div className={s.roundPager}>
        <button type="button" className={s.bookmarkButton} aria-label="Previous round bookmarks" disabled={groupStart === 0}
          onClick={() => setSelectedRound(boundaries[groupStart - BOOKMARKS_PER_GROUP].roundNumber)}>‹</button>
        <span>{boundaries[groupStart].roundNumber}–{boundaries[groupEnd - 1].roundNumber} of {boundaries.length}</span>
        <button type="button" className={s.bookmarkButton} aria-label="Next round bookmarks" disabled={groupEnd === boundaries.length}
          onClick={() => setSelectedRound(boundaries[groupEnd].roundNumber)}>›</button>
      </div>}
    </nav>
    <section aria-label={`Round ${activeRound.roundNumber} log`} data-round-log={activeRound.roundNumber}>
      {entries.length ? entries : <p>No entries for this round yet.</p>}
    </section>
  </>;
}
