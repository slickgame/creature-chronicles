import { useEffect, useId, useRef, useState } from "react";
import { getBattleLogEventCategory } from "@/data/battleInterface";
import { gameplayArt } from "@/data/creatureGameplayArt";
import type { BattleLogEventCategory, BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import s from "./BattleLogEntries.module.css";

const BOOKMARKS_PER_GROUP = 6;
const LOG_FILTERS: ReadonlyArray<{ category: BattleLogEventCategory; label: string }> = [
  { category: "knockouts", label: "Knockouts" },
  { category: "status-changes", label: "Status changes" },
  { category: "order-shifts", label: "Order shifts" },
];

export function BattleLogEntries({ state, sourceById, playback = false }: {
  state: BattleState;
  sourceById: ReadonlyMap<string, CreatureRecord>;
  playback?: boolean;
}) {
  const [selectedRound, setSelectedRound] = useState<number>();
  const [filters, setFilters] = useState<BattleLogEventCategory[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterControl = useRef<HTMLDivElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const filterPanelId = useId();

  useEffect(() => {
    if (!filtersOpen || playback) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !filterControl.current?.contains(event.target)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [filtersOpen, playback]);

  if (playback) return null;

  function closeFilters() {
    filterTrigger.current?.focus();
    setFiltersOpen(false);
  }

  const boundaries = state.roundLogBoundaries ?? [];
  const selection = boundaries.findIndex(entry => entry.roundNumber === selectedRound);
  const activeIndex = selection >= 0 ? selection : boundaries.length - 1;
  const activeRound = boundaries[activeIndex];
  const start = activeRound?.logIndex ?? 0;
  const end = boundaries[activeIndex + 1]?.logIndex ?? state.log.length;
  const shifts = new Map(state.orderShiftLog?.map(entry => [entry.logIndex, entry]));
  const entries = state.log.slice(start, end).flatMap((line, offset) => {
    const index = start + offset;
    const category = getBattleLogEventCategory(state, index);
    if (filters.length && (!category || !filters.includes(category))) return [];

    const shift = shifts.get(index);
    if (!shift || !shift.moves.length || shift.moves.some(({ actorId }) => !state.combatants[actorId])) {
      return <p key={index} data-battle-log-event={category}>{line}</p>;
    }
    const title = `Round ${shift.roundNumber} · Order Shift`;
    return <section key={index} className={s.shiftCard} aria-label={title} data-order-shift-card={shift.roundNumber} data-battle-log-event={category}>
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

  const groupStart = Math.floor(activeIndex / BOOKMARKS_PER_GROUP) * BOOKMARKS_PER_GROUP;
  const groupEnd = Math.min(groupStart + BOOKMARKS_PER_GROUP, boundaries.length);
  const shiftRounds = new Set(state.orderShiftLog?.map(entry => entry.roundNumber));
  return <div className={s.logContainer}>
    <div className={s.logLayout} data-filters-open={filtersOpen}
      onKeyDown={event => {
        if (filtersOpen && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          closeFilters();
        }
      }}>
      {activeRound && <nav className={s.roundNav} aria-label="Round bookmarks" data-round-bookmarks>
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
      </nav>}
      <div className={s.filterControl} ref={filterControl}>
        <button type="button" className={s.filterTrigger} ref={filterTrigger} data-battle-log-filter-trigger
          aria-expanded={filtersOpen} aria-controls={filterPanelId}
          onClick={() => setFiltersOpen(open => !open)}>
          Filters{filters.length > 0 ? ` · ${filters.length}` : ""}
          <span className={s.filterCaret} aria-hidden="true"/>
        </button>
        <fieldset className={s.filterPanel} id={filterPanelId} hidden={!filtersOpen} data-battle-log-filter-panel>
          <legend className={s.srOnly}>Filter battle log by event type</legend>
          {LOG_FILTERS.map(({ category, label }) => <label key={category} className={s.filterOption}>
            <input type="checkbox" data-battle-log-filter={category} checked={filters.includes(category)}
              onChange={event => {
                const checked = event.currentTarget.checked;
                setFilters(current => checked ? [...current, category] : current.filter(value => value !== category));
              }}/>
            {label}
          </label>)}
          <div className={s.filterFooter}>
            <button type="button" onClick={closeFilters}>Done</button>
          </div>
        </fieldset>
      </div>
      <section className={s.logRows} aria-label={activeRound ? `Round ${activeRound.roundNumber} log` : "Battle events"}
        data-round-log={activeRound?.roundNumber}>
        <span className={s.srOnly} role="status">
          {filters.length ? `${entries.length} matching ${entries.length === 1 ? "event" : "events"}` : ""}
        </span>
        {entries.length ? entries : filters.length ? <div className={s.filterEmpty}>
          <p>No matching events{activeRound ? ` in Round ${activeRound.roundNumber}` : ""}.</p>
          <button type="button" onClick={() => { setFilters([]); closeFilters(); }}>Show all events</button>
        </div> : <p>{activeRound ? "No entries for this round yet." : "No battle entries yet."}</p>}
      </section>
    </div>
  </div>;
}
