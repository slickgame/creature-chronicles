import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { getBattleLogSearchTextParts, searchBattleLog, type BattleLogSearchContext, type BattleLogSearchResult } from "@/data/battleLogSearch";
import type { BattleLogEventCategory, BattleState } from "@/types/battle";
import s from "./BattleLogEntries.module.css";

export type BattleLogQuickFindPanel = "search" | "tips";

export function BattleLogSearchText({ text, query, context }: { text: string; query: string; context?: BattleLogSearchContext }) {
  return getBattleLogSearchTextParts(text, query, context).map((part, index) =>
    part.matched ? <mark className={s.searchHighlight} key={index}>{part.text}</mark> : part.text,
  );
}

export function BattleLogQuickFind({ state, filters, panel, onOpen, onClose, onJump, onClear }: {
  state: BattleState;
  filters: readonly BattleLogEventCategory[];
  panel?: BattleLogQuickFindPanel;
  onOpen: (panel: BattleLogQuickFindPanel) => void;
  onClose: () => void;
  onJump: (result: BattleLogSearchResult, query: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const tipsTrigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const tipsId = useId();
  const tipsOpen = panel === "tips";
  const expanded = panel === "search" && !!query.trim();
  const results = expanded ? searchBattleLog(state, query, filters) : [];
  const activePosition = results.findIndex(result => result.index === activeIndex);
  const activeId = activePosition >= 0 ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    if (!expanded && !tipsOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) onClose();
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [expanded, tipsOpen, onClose]);

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function showResults() {
    if (!expanded && query.trim()) {
      setActiveIndex(undefined);
      onOpen("search");
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
        onOpen("search");
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
    onBlur={event => {
      if (tipsOpen && !event.currentTarget.contains(event.relatedTarget)) onClose();
    }}
    onKeyDown={event => {
      if (tipsOpen && event.key === "Escape" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        tipsTrigger.current?.focus({ preventScroll: true });
        onClose();
      }
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
          if (value.trim()) onOpen("search");
          else { onClear(); onClose(); }
        }}/>
      <div className={s.searchActions}>
        {query && <button type="button" className={s.clearSearch} aria-label="Clear search" onClick={() => {
          input.current?.focus({ preventScroll: true });
          setQuery("");
          setActiveIndex(undefined);
          onClear();
          onClose();
        }}>×</button>}
        <button type="button" ref={tipsTrigger} className={s.searchTipsTrigger} aria-label="Search tips"
          aria-expanded={tipsOpen} aria-controls={tipsOpen ? tipsId : undefined}
          onClick={() => tipsOpen ? onClose() : onOpen("tips")}>
          <span aria-hidden="true">?</span> Tips
        </button>
      </div>
    </div>
    {tipsOpen && <section className={`${s.searchResults} ${s.searchTips}`} id={tipsId} aria-labelledby={`${tipsId}-title`}>
      <div className={s.searchResultsHeading}><strong id={`${tipsId}-title`}>Search tips</strong></div>
      <dl>
        <dt>Creature, move, or event</dt>
        <dd><kbd>Lilt</kbd> · <kbd>Checking Blow</kbd> · <kbd>wore off</kbd></dd>
        <dt>Signed Speed change</dt>
        <dd><kbd>-6 Speed</kbd> · <kbd>+8 Speed</kbd></dd>
        <dt>Move and Speed change</dt>
        <dd><kbd>Checking Blow -6</kbd></dd>
        <dt>Acting creature and move</dt>
        <dd><kbd>Willow Glen Checking Blow -6</kbd></dd>
      </dl>
      <p>Use the Order shifts filter to find the linked move.</p>
    </section>}
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
