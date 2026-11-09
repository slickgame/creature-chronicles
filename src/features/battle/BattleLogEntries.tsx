import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { getBattleLogEventCategory } from "@/data/battleInterface";
import { getOrderShiftDetails, type BattleLogSearchResult } from "@/data/battleLogSearch";
import { gameplayArt } from "@/data/creatureGameplayArt";
import type { BattleLogEventCategory, BattleOrderShiftLogEntry, BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import { BattleLogQuickFind, BattleLogSearchText } from "./BattleLogQuickFind";
import { BattleLogTargetCards } from "./BattleLogTargetCards";
import s from "./BattleLogEntries.module.css";

const BOOKMARKS_PER_GROUP = 6;
const LOG_FILTERS: ReadonlyArray<{ category: BattleLogEventCategory; label: string }> = [
  { category: "knockouts", label: "Knockouts" },
  { category: "status-changes", label: "Status changes" },
  { category: "order-shifts", label: "Order shifts" },
];

function OrderShiftDetails({ move, combatants, match }: {
  move: BattleOrderShiftLogEntry["moves"][number];
  combatants: BattleState["combatants"];
  match?: { detailId: string; query: string; targetId: string };
}) {
  const details = getOrderShiftDetails(move, combatants);
  if (!details.length) return null;
  const name = combatants[move.actorId].name;
  return <ul className={s.shiftReasons} role="list" aria-label={`${name} shift details`}>
    {details.map(detail => {
      const selected = match?.detailId === detail.id;
      return <li key={detail.id} id={selected ? match.targetId : undefined} tabIndex={selected ? -1 : undefined}
        aria-label={selected ? `${name} · ${detail.text}` : undefined}
        data-search-jump={selected ? "" : undefined} data-order-shift-detail-match={selected ? "" : undefined}
        data-order-shift-speed={detail.kind === "speed" ? "" : undefined}
        data-order-shift-reason={detail.kind === "speed" ? undefined : detail.kind}>
        {selected ? <BattleLogSearchText text={detail.text} query={match.query}/> : detail.text}
      </li>;
    })}
  </ul>;
}

export function BattleLogEntries({ state, sourceById, playback = false, initialOrderShift }: {
  state: BattleState;
  sourceById: ReadonlyMap<string, CreatureRecord>;
  playback?: boolean;
  initialOrderShift?: Pick<BattleOrderShiftLogEntry, "roundNumber" | "logIndex">;
}) {
  const [selectedRound, setSelectedRound] = useState(initialOrderShift?.roundNumber);
  const [filters, setFilters] = useState<BattleLogEventCategory[]>([]);
  const [openPanel, setOpenPanel] = useState<"filters" | "search">();
  const [jump, setJump] = useState<(Pick<BattleLogSearchResult, "index" | "orderShiftDetail"> & { query: string }) | undefined>(
    () => initialOrderShift ? { index: initialOrderShift.logIndex, query: "" } : undefined,
  );
  const [openMoves, setOpenMoves] = useState<Partial<Record<number, boolean>>>({});
  const [openNotes, setOpenNotes] = useState<Partial<Record<number, boolean>>>({});
  const filtersOpen = openPanel === "filters";
  const entryId = useId();
  const filterControl = useRef<HTMLDivElement>(null);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const filterPanelId = useId();

  useEffect(() => {
    if (!filtersOpen || playback) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !filterControl.current?.contains(event.target)) {
        setOpenPanel(current => current === "filters" ? undefined : current);
      }
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [filtersOpen, playback]);

  const closeSearch = useCallback(() => {
    setOpenPanel(current => current === "search" ? undefined : current);
  }, []);

  useEffect(() => {
    if (!jump || playback) return;
    // On initial entry, let the parent dialog open and reset its scroll position first.
    const frame = requestAnimationFrame(() => {
      const targetId = `${entryId}-${jump.index}`;
      const detail = jump.orderShiftDetail ? document.getElementById(`${targetId}-detail`) : null;
      const target = detail ?? document.getElementById(targetId);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(frame);
  }, [entryId, jump, playback]);

  if (playback) return null;

  function closeFilters() {
    filterTrigger.current?.focus();
    setOpenPanel(undefined);
  }

  const boundaries = state.roundLogBoundaries ?? [];
  const selection = boundaries.findIndex(entry => entry.roundNumber === selectedRound);
  const activeIndex = selection >= 0 ? selection : boundaries.length - 1;
  const activeRound = boundaries[activeIndex];
  const start = activeIndex <= 0 ? 0 : activeRound.logIndex;
  const end = boundaries[activeIndex + 1]?.logIndex ?? state.log.length;
  const shifts = new Map(state.orderShiftLog?.map(entry => [entry.logIndex, entry]));
  const moveGroups = new Map(state.moveLog?.map(group => [group.logIndex, group]));
  const isFiltered = filters.length > 0;

  function matchesEventFilter(index: number) {
    if (!isFiltered) return true;
    const category = getBattleLogEventCategory(state, index);
    return category !== undefined && filters.includes(category);
  }

  function logEntryProps(index: number) {
    const selected = jump?.index === index;
    const orderShiftJump = selected && !jump.query;
    return {
      id: `${entryId}-${index}`,
      "data-battle-log-entry": index,
      "data-battle-log-event": getBattleLogEventCategory(state, index),
      "data-search-jump": selected && jump.query && !jump.orderShiftDetail ? "" : undefined,
      "data-order-shift-jump": orderShiftJump ? "" : undefined,
      "data-initial-focus": orderShiftJump ? "" : undefined,
      tabIndex: selected ? -1 : undefined,
    };
  }

  function renderLogLine(index: number) {
    const line = state.log[index];
    const selected = jump?.index === index;
    const entryProps = logEntryProps(index);
    const shift = shifts.get(index);
    if (!shift || !shift.moves.length || shift.moves.some(({ actorId }) => !state.combatants[actorId])) {
      return <p key={index} {...entryProps}>
        {selected ? <BattleLogSearchText text={line} query={jump.query}/> : line}
      </p>;
    }
    const title = `Round ${shift.roundNumber} · Order Shift`;
    const detailJump = selected && jump.orderShiftDetail
      ? { ...jump.orderShiftDetail, query: jump.query, targetId: `${entryProps.id}-detail` }
      : undefined;
    return <section key={index} className={s.shiftCard} aria-label={title} data-order-shift-card={shift.roundNumber} {...entryProps}>
      <h3 className={s.shiftTitle}>{title}</h3>
      {shift.moves.some(move => move.speed || move.reasons?.length) && <p className={s.shiftCaption}>
        Slots compare creatures present at the start of both rounds.
      </p>}
      <ul>
        {shift.moves.map(move => {
          const { actorId, from, to } = move;
          const creature = state.combatants[actorId];
          const source = sourceById.get(String(creature.sourceCreatureId));
          return <li key={actorId} className={s.shiftRow} data-order-shift-row={from > to ? "up" : "down"} data-order-shift-actor={actorId}>
            <span className={s.portrait} aria-hidden="true">
              {source ? <img src={gameplayArt(source, true)} alt=""/> : creature.name.slice(0, 1)}
            </span>
            <strong>{selected && !detailJump ? <BattleLogSearchText text={creature.name} query={jump.query}/> : creature.name}</strong>
            <span className={s.slots}>
              <span data-order-shift-slots aria-hidden="true">{from} → {to}</span>
              <span className={s.slotDescription}>Slot {from} to slot {to}</span>
            </span>
            <OrderShiftDetails move={move} combatants={state.combatants}
              match={detailJump?.actorId === actorId ? detailJump : undefined}/>
          </li>;
        })}
      </ul>
    </section>;
  }

  const entries: ReactNode[] = [];
  let matchingEventCount = 0;
  for (let index = start; index < end; index++) {
    const group = moveGroups.get(index);
    if (!group || group.endLogIndex <= index || group.endLogIndex > end) {
      if (matchesEventFilter(index)) {
        entries.push(renderLogLine(index));
        matchingEventCount++;
      }
      continue;
    }

    const moveIndex = index;
    const detailIndexes = [];
    for (let detail = index + 1; detail < group.endLogIndex; detail++) {
      if (matchesEventFilter(detail)) detailIndexes.push(detail);
    }
    index = group.endLogIndex - 1;
    const headingMatches = matchesEventFilter(moveIndex);
    if (!headingMatches && !detailIndexes.length) continue;

    const filteredDetails = new Set(detailIndexes);
    const targets = isFiltered
      ? group.targets.filter(target => target.logIndexes.some(logIndex => filteredDetails.has(logIndex)))
      : group.targets;
    const expanded = openMoves[moveIndex] ?? isFiltered;
    const notesOpen = openNotes[moveIndex] ?? isFiltered;
    const highlightedTarget = jump && targets.find(target => target.logIndexes.includes(jump.index));

    entries.push(
      <BattleLogTargetCards key={moveIndex} group={group} targets={targets} combatants={state.combatants}
        sourceById={sourceById} expanded={expanded} onToggle={() => setOpenMoves(current => ({ ...current, [moveIndex]: !expanded }))}
        headingProps={{ ...logEntryProps(moveIndex), tabIndex: undefined }}
        heading={jump?.index === moveIndex ? <BattleLogSearchText text={state.log[moveIndex]} query={jump.query}/> : undefined}
        notesOpen={notesOpen} onToggleNotes={() => setOpenNotes(current => ({ ...current, [moveIndex]: !notesOpen }))}
        highlightedTargetId={highlightedTarget?.targetId}>
        {detailIndexes.length ? detailIndexes.map(renderLogLine) : undefined}
      </BattleLogTargetCards>,
    );
    matchingEventCount += detailIndexes.length + Number(headingMatches);
  }

  const groupStart = Math.floor(activeIndex / BOOKMARKS_PER_GROUP) * BOOKMARKS_PER_GROUP;
  const groupEnd = Math.min(groupStart + BOOKMARKS_PER_GROUP, boundaries.length);
  const shiftRounds = new Set(state.orderShiftLog?.map(entry => entry.roundNumber));
  function browseRound(roundNumber: number) {
    setSelectedRound(roundNumber);
    setJump(undefined);
  }
  return <div className={s.logContainer}>
    <div className={s.logLayout} data-filters-open={filtersOpen}
      onKeyDown={event => {
        if (openPanel && event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          if (filtersOpen) closeFilters();
          else closeSearch();
        }
      }}>
      {activeRound && <nav className={s.roundNav} aria-label="Round bookmarks" data-round-bookmarks>
        <div className={s.roundButtons}>
          {boundaries.slice(groupStart, groupEnd).map(({ roundNumber }) => {
            const hasShift = shiftRounds.has(roundNumber);
            return <button key={roundNumber} type="button" className={s.bookmarkButton}
              data-round-bookmark={roundNumber} data-order-shift-bookmark={hasShift ? "" : undefined}
              aria-label={`Round ${roundNumber}${hasShift ? ", order shift" : ""}`}
              aria-pressed={activeRound.roundNumber === roundNumber} onClick={() => browseRound(roundNumber)}>
              {roundNumber}{hasShift && <span className={s.shiftMark} aria-hidden="true"/>}
            </button>;
          })}
        </div>
        {shiftRounds.size > 0 && <span className={s.shiftLegend}><span className={s.shiftMark} aria-hidden="true"/> Order shift</span>}
        {boundaries.length > BOOKMARKS_PER_GROUP && <div className={s.roundPager}>
          <button type="button" className={s.bookmarkButton} aria-label="Previous round bookmarks" disabled={groupStart === 0}
            onClick={() => browseRound(boundaries[groupStart - BOOKMARKS_PER_GROUP].roundNumber)}>‹</button>
          <span>{boundaries[groupStart].roundNumber}–{boundaries[groupEnd - 1].roundNumber} of {boundaries.length}</span>
          <button type="button" className={s.bookmarkButton} aria-label="Next round bookmarks" disabled={groupEnd === boundaries.length}
            onClick={() => browseRound(boundaries[groupEnd].roundNumber)}>›</button>
        </div>}
      </nav>}
      <div className={s.filterControl} ref={filterControl}>
        <button type="button" className={s.filterTrigger} ref={filterTrigger} data-battle-log-filter-trigger
          aria-expanded={filtersOpen} aria-controls={filterPanelId}
          onClick={() => setOpenPanel(current => current === "filters" ? undefined : "filters")}>
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
      <BattleLogQuickFind state={state} filters={filters} open={openPanel === "search"}
        onOpen={() => setOpenPanel("search")} onClose={closeSearch} onClear={() => setJump(undefined)}
        onJump={(result, query) => {
          setSelectedRound(result.roundNumber ?? boundaries[0]?.roundNumber);
          const group = state.moveLog?.find(move => result.index >= move.logIndex && result.index < move.endLogIndex);
          if (group) {
            setOpenMoves(current => ({ ...current, [group.logIndex]: true }));
            if (result.index > group.logIndex) {
              setOpenNotes(current => ({ ...current, [group.logIndex]: true }));
            }
          }
          setJump({ index: result.index, query, orderShiftDetail: result.orderShiftDetail });
        }}/>
      <section className={s.logRows} aria-label={activeRound ? `Round ${activeRound.roundNumber} log` : "Battle events"}
        data-round-log={activeRound?.roundNumber}>
        <span className={s.srOnly} role="status">
          {isFiltered ? `${matchingEventCount} matching ${matchingEventCount === 1 ? "event" : "events"}` : ""}
        </span>
        {entries.length ? entries : filters.length ? <div className={s.filterEmpty}>
          <p>No matching events{activeRound ? ` in Round ${activeRound.roundNumber}` : ""}.</p>
          <button type="button" onClick={() => { setFilters([]); closeFilters(); }}>Show all events</button>
        </div> : <p>{activeRound ? "No entries for this round yet." : "No battle entries yet."}</p>}
      </section>
    </div>
  </div>;
}
