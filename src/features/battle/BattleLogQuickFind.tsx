import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { getBattleLogSearchTextParts, searchBattleLog, type BattleLogSearchResult } from "@/data/battleLogSearch";
import type { BattleLogEventCategory, BattleState } from "@/types/battle";
import s from "./BattleLogEntries.module.css";

export function BattleLogSearchText({ text, query }: { text: string; query: string }) {
  return getBattleLogSearchTextParts(text, query).map((part, index) =>
    part.matched ? <mark className={s.searchHighlight} key={index}>{part.text}</mark> : part.text,
  );
}

export function BattleLogQuickFind({ state, filters, open, onOpen, onClose, onJump, onClear }: {
  state: BattleState;
  filters: readonly BattleLogEventCategory[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onJump: (result: BattleLogSearchResult, query: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const expanded = open && !!query.trim();
  const results = expanded ? searchBattleLog(state, query, filters) : [];
  const activePosition = results.findIndex(result => result.index === activeIndex);
  const activeId = activePosition >= 0 ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (!expanded) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) onClose();
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [expanded, onClose]);

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function showResults() {
    if (!expanded && query.trim()) {
      setActiveIndex(undefined);
      onOpen();
    }
  }

  function jumpTo(result: BattleLogSearchResult) {
    onJump(result, query);
    setActiveIndex(undefined);
    onClose();
  }

  function handleSearchKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!query.trim()) return;
      event.preventDefault();
      const backwards = event.key === "ArrowUp";
      if (!expanded) {
        const reopened = searchBattleLog(state, query, filters);
        setActiveIndex((backwards ? reopened.at(-1) : reopened[0])?.index);
        onOpen();
        return;
      }
      if (!results.length) return;
      const next = backwards
        ? (activePosition <= 0 ? results.length - 1 : activePosition - 1)
        : (activePosition + 1) % results.length;
      setActiveIndex(results[next]?.index);
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      const result = results[Math.max(0, activePosition)];
      if (result) jumpTo(result);
    }
  }

  return <div className={s.quickFind} ref={root}
    onKeyDown={event => {
      if (event.key === "Tab" && (event.shiftKey === (event.target === input.current))) onClose();
    }}>
    <div className={s.searchField}>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>
      </svg>
      <input ref={input} type="text" role="combobox" aria-label="Find in battle log"
        aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? listId : undefined}
        aria-activedescendant={activeId} autoComplete="off" spellCheck={false} enterKeyHint="search"
        placeholder="Find in battle log" value={query} data-battle-log-search
        onFocus={showResults} onClick={showResults} onKeyDown={handleSearchKey}
        onChange={event => {
          const value = event.target.value;
          setQuery(value);
          setActiveIndex(undefined);
          if (value.trim()) onOpen();
          else { onClear(); onClose(); }
        }}/>
      {query && <button type="button" className={s.clearSearch} aria-label="Clear search" onClick={() => {
        input.current?.focus({ preventScroll: true });
        setQuery("");
        setActiveIndex(undefined);
        onClear();
        onClose();
      }}>×</button>}
    </div>
    {expanded && <div className={s.searchResults} data-battle-log-search-results>
      <div className={s.searchResultsHeading}>
        <strong>Matches in all rounds</strong>
        <span role="status">{results.length} {results.length === 1 ? "match" : "matches"}</span>
      </div>
      <ul className={s.searchResultList} id={listId} role="listbox" aria-label="Battle log matches">
        {results.map(result => <li key={result.index} id={`${listId}-${result.index}`}
          role="option" aria-selected={result.index === activeIndex} data-battle-log-search-result={result.index}
          data-search-round={result.roundNumber} data-search-order-shift-detail={result.orderShiftDetail?.detailId}
          onClick={() => jumpTo(result)}>
          <span className={s.searchRound}>{result.roundNumber === undefined ? "Battle log" : `Round ${result.roundNumber}`}</span>
          <span><BattleLogSearchText text={result.text} query={query}/></span>
          <span className={s.resultChevron} aria-hidden="true">›</span>
        </li>)}
      </ul>
      {!results.length && <p className={s.searchEmpty}>{filters.length ? "No matches with the current filters." : "No matching battle log entries."}</p>}
    </div>}
  </div>;
}
