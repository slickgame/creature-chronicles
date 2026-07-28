"use client";

import { useMemo, useState } from "react";
import {
  filterBreedingAttempts,
  getAttemptOffspring,
  getAttemptOutcome,
  getBreedingLedgerOverview,
  getBreedingPairSummaries,
  getCreatureBreedingSummaries,
  getFocusedFamilyTree,
  type BreedingPairSummary,
  type BreedingRecordOutcomeFilter,
  type FamilyTreeNode,
} from "@/data/breedingRecords";
import { useGameContext } from "@/state/GameProvider";
import type { BreedingAttemptRecord } from "@/types/breeding";
import styles from "./BreedingRecordsScreen.module.css";

const BREEDING_HANDOFF_KEY = "creature_chronicles_breeding_focus";
const ATTEMPTS_PER_PAGE = 12;
type LedgerTab = "overview" | "attempts" | "pairs" | "creatures" | "tree";

type Props = {
  onClose: () => void;
};

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "No recorded timestamp";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function pct(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className={styles.metric} data-ui-text-box="auto">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Portrait({ path, name }: { path: string; name: string }) {
  return (
    <img
      className={styles.portrait}
      src={path || "/images/ui/icons/icon_parent_compare.png"}
      alt=""
      title={name}
      onError={(event) => {
        event.currentTarget.src = "/images/ui/icons/icon_parent_compare.png";
      }}
    />
  );
}

function TreeNodeCard({
  node,
  onSelect,
}: {
  node: FamilyTreeNode;
  onSelect: (node: FamilyTreeNode) => void;
}) {
  const selectable = Boolean(node.creatureId && node.status !== "unknown");
  return (
    <button
      type="button"
      className={`${styles.treeNode} ${styles[`treeNode_${node.status}`]}`}
      disabled={!selectable}
      onClick={() => onSelect(node)}
    >
      <Portrait path={node.portraitPath} name={node.displayName} />
      <span>
        <strong>{node.displayName}{node.shiny ? " ✦" : ""}</strong>
        <small>{node.variantName}</small>
        <em>{node.generation ? `Generation ${node.generation}` : node.status}</em>
      </span>
    </button>
  );
}

export function BreedingRecordsScreen({ onClose }: Props) {
  const { currentSave } = useGameContext();
  const [tab, setTab] = useState<LedgerTab>("overview");
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<BreedingRecordOutcomeFilter>("all");
  const [creatureFilter, setCreatureFilter] = useState<string>("all");
  const [role, setRole] = useState<"either" | "giver" | "receiver">("either");
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(0);
  const [detailAttempt, setDetailAttempt] = useState<BreedingAttemptRecord | null>(null);
  const [treeFocusId, setTreeFocusId] = useState<string | null>(null);

  const overview = useMemo(
    () => (currentSave ? getBreedingLedgerOverview(currentSave) : null),
    [currentSave],
  );
  const pairs = useMemo(
    () => (currentSave ? getBreedingPairSummaries(currentSave) : []),
    [currentSave],
  );
  const creatureSummaries = useMemo(
    () => (currentSave ? getCreatureBreedingSummaries(currentSave) : []),
    [currentSave],
  );
  const attempts = useMemo(
    () =>
      currentSave
        ? filterBreedingAttempts(currentSave, {
            query,
            creatureId: creatureFilter === "all" ? null : creatureFilter,
            outcome,
            role,
            newestFirst,
          })
        : [],
    [currentSave, query, creatureFilter, outcome, role, newestFirst],
  );
  const pageCount = Math.max(1, Math.ceil(attempts.length / ATTEMPTS_PER_PAGE));
  const visibleAttempts = attempts.slice(
    Math.min(page, pageCount - 1) * ATTEMPTS_PER_PAGE,
    Math.min(page, pageCount - 1) * ATTEMPTS_PER_PAGE + ATTEMPTS_PER_PAGE,
  );

  const treeChoices = useMemo(() => {
    if (!currentSave) return [];
    const current = (currentSave.creatures ?? []).map((creature) => ({
      id: creature.creatureId,
      name: creature.nickname,
    }));
    const archived = (currentSave.birthHistory ?? [])
      .filter((birth) => !current.some((choice) => choice.id === birth.creatureId))
      .map((birth) => ({ id: birth.creatureId, name: `${birth.nickname} (Archived)` }));
    return [...current, ...archived].sort((a, b) => a.name.localeCompare(b.name));
  }, [currentSave]);
  const effectiveTreeId = treeFocusId ?? treeChoices[0]?.id ?? null;
  const tree = useMemo(
    () => currentSave && effectiveTreeId ? getFocusedFamilyTree(currentSave, effectiveTreeId) : null,
    [currentSave, effectiveTreeId],
  );

  if (!currentSave || !overview) {
    return (
      <main className={styles.screen}>
        <section className={styles.emptyPanel}>
          <h1>No active breeding ledger</h1>
          <button type="button" onClick={onClose}>Return</button>
        </section>
      </main>
    );
  }

  function usePair(pair: BreedingPairSummary) {
    window.sessionStorage.setItem(
      BREEDING_HANDOFF_KEY,
      JSON.stringify({ giverId: pair.participantAId, receiverId: pair.participantBId }),
    );
    onClose();
  }

  function useCreature(participantId: string) {
    window.sessionStorage.setItem(
      BREEDING_HANDOFF_KEY,
      JSON.stringify({ creatureId: participantId, preferredRole: "receiver" }),
    );
    onClose();
  }

  function switchTab(next: LedgerTab) {
    setTab(next);
    setPage(0);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Ranch Archive</p>
            <h1>Breeding Ledger</h1>
            <p>{currentSave.player.ranchName} · {overview.totalAttempts} recorded sessions</p>
          </div>
          <button type="button" onClick={onClose}>Back to Breeding Pen</button>
        </header>

        <nav className={styles.tabs} aria-label="Breeding ledger sections">
          {(["overview", "attempts", "pairs", "creatures", "tree"] as LedgerTab[]).map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? styles.activeTab : ""}
              onClick={() => switchTab(item)}
            >
              {item === "tree" ? "Family Tree" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <section className={styles.workspace}>
          {tab === "overview" ? (
            <div className={styles.overviewGrid}>
              <section className={styles.metricsGrid}>
                <Metric label="Total Attempts" value={overview.totalAttempts} />
                <Metric label="Successful Pregnancies" value={overview.successfulPregnancies} />
                <Metric label="No Pregnancy" value={overview.failedAttempts} />
                <Metric label="Blocked Sessions" value={overview.blockedSessions} />
                <Metric label="Live Offspring" value={overview.liveOffspring} />
                <Metric label="Active Pregnancies" value={overview.activePregnancies} />
                <Metric label="Eligible Success Rate" value={pct(overview.successRate)} />
              </section>
              <section className={styles.highlightGrid}>
                <article data-ui-text-box="auto">
                  <span>Most Successful Pair</span>
                  <strong>{overview.mostSuccessfulPair ? `${overview.mostSuccessfulPair.participantAName} × ${overview.mostSuccessfulPair.participantBName}` : "No successful pair yet"}</strong>
                  <p>{overview.mostSuccessfulPair ? `${overview.mostSuccessfulPair.successfulPregnancies} pregnancies · ${overview.mostSuccessfulPair.hatchedOffspring} offspring · ${pct(overview.mostSuccessfulPair.successRate)}` : "Complete breeding attempts to establish a record."}</p>
                  {overview.mostSuccessfulPair ? <button type="button" onClick={() => usePair(overview.mostSuccessfulPair!)}>Use This Pair</button> : null}
                </article>
                <article data-ui-text-box="auto">
                  <span>Most Prolific Creature</span>
                  <strong>{overview.mostProlificCreature?.displayName ?? "No offspring recorded"}</strong>
                  <p>{overview.mostProlificCreature ? `${overview.mostProlificCreature.hatchedOffspring} offspring · ${overview.mostProlificCreature.successfulPregnancies} pregnancies` : "Hatched offspring will appear here."}</p>
                </article>
                <article data-ui-text-box="auto">
                  <span>Longest Pair Streak</span>
                  <strong>{overview.longestPairStreak ? `${overview.longestPairStreak.participantAName} × ${overview.longestPairStreak.participantBName}` : "No streak recorded"}</strong>
                  <p>{overview.longestPairStreak ? `Longest historical streak: ${overview.longestPairStreak.longestStreak}` : "Failed eligible attempts build pair familiarity."}</p>
                </article>
              </section>
            </div>
          ) : null}

          {tab === "attempts" ? (
            <div className={styles.recordsLayout}>
              <section className={styles.filters}>
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setPage(0); }}
                  placeholder="Search name or variant..."
                />
                <select value={outcome} onChange={(event) => { setOutcome(event.target.value as BreedingRecordOutcomeFilter); setPage(0); }}>
                  <option value="all">All Outcomes</option>
                  <option value="pregnancy">Pregnancy</option>
                  <option value="failed">No Pregnancy</option>
                  <option value="blocked">Blocked</option>
                </select>
                <select value={creatureFilter} onChange={(event) => { setCreatureFilter(event.target.value); setPage(0); }}>
                  <option value="all">All Participants</option>
                  {creatureSummaries.map((creature) => <option key={creature.participantId} value={creature.participantId}>{creature.displayName}</option>)}
                </select>
                <select value={role} onChange={(event) => { setRole(event.target.value as typeof role); setPage(0); }}>
                  <option value="either">Either Role</option>
                  <option value="giver">Giver Only</option>
                  <option value="receiver">Receiver Only</option>
                </select>
                <button type="button" onClick={() => setNewestFirst((value) => !value)}>{newestFirst ? "Newest First" : "Oldest First"}</button>
              </section>
              <div className={styles.attemptGrid}>
                {visibleAttempts.map((attempt) => {
                  const result = getAttemptOutcome(attempt);
                  const offspring = getAttemptOffspring(currentSave, attempt);
                  return (
                    <article key={attempt.attemptId} className={`${styles.attemptCard} ${styles[`outcome_${result}`]}`} data-ui-text-box="auto">
                      <header><span>Ranch Day {attempt.dayNumber}</span><time>{formatTimestamp(attempt.createdAt)}</time></header>
                      <div className={styles.attemptPair}>
                        <Portrait path={attempt.giverSnapshot?.portraitPath ?? ""} name={attempt.giverName} />
                        <div><strong>{attempt.giverName}</strong><small>{attempt.giverSnapshot?.variantName ?? attempt.giverFamily} · Giver</small></div>
                        <b>×</b>
                        <Portrait path={attempt.receiverSnapshot?.portraitPath ?? ""} name={attempt.receiverName} />
                        <div><strong>{attempt.receiverName}</strong><small>{attempt.receiverSnapshot?.variantName ?? attempt.receiverFamily} · Receiver</small></div>
                      </div>
                      <div className={styles.attemptStats}>
                        <span>Outcome <b>{result === "pregnancy" ? "Pregnancy" : result === "blocked" ? "Blocked" : "No Pregnancy"}</b></span>
                        <span>Chance <b>{attempt.pregnancyChance}%</b></span>
                        <span>Streak <b>{attempt.streakBefore} → {attempt.streakAfter}</b></span>
                        <span>Offspring <b>{offspring.length}</b></span>
                      </div>
                      <button type="button" onClick={() => setDetailAttempt(attempt)}>View Complete Record</button>
                    </article>
                  );
                })}
                {!visibleAttempts.length ? <p className={styles.emptyMessage}>No attempt records match these filters.</p> : null}
              </div>
              <div className={styles.pagination}>
                <button type="button" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button>
                <span>Page {Math.min(page, pageCount - 1) + 1} of {pageCount} · {attempts.length} records</span>
                <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>Next</button>
              </div>
            </div>
          ) : null}

          {tab === "pairs" ? (
            <div className={styles.cardGrid}>
              {pairs.map((pair) => (
                <article key={pair.pairKey} className={styles.pairCard} data-ui-text-box="auto">
                  <div className={styles.dualPortrait}><Portrait path={pair.participantAPortrait} name={pair.participantAName} /><Portrait path={pair.participantBPortrait} name={pair.participantBName} /></div>
                  <h2>{pair.participantAName} × {pair.participantBName}</h2>
                  <div className={styles.statMatrix}>
                    <Metric label="Attempts" value={pair.totalAttempts} />
                    <Metric label="Pregnancies" value={pair.successfulPregnancies} />
                    <Metric label="Offspring" value={pair.hatchedOffspring} />
                    <Metric label="Success" value={pct(pair.successRate)} />
                    <Metric label="Current Streak" value={pair.currentStreak} />
                    <Metric label="Longest Streak" value={pair.longestStreak} />
                  </div>
                  <p>{pair.participantAName} giver: {pair.aAsGiverAttempts} · {pair.participantBName} giver: {pair.bAsGiverAttempts}</p>
                  <p>Last attempt: {formatTimestamp(pair.lastAttemptAt)}</p>
                  <button type="button" onClick={() => usePair(pair)}>Use This Pair in Breeding Pen</button>
                </article>
              ))}
              {!pairs.length ? <p className={styles.emptyMessage}>No pair records yet.</p> : null}
            </div>
          ) : null}

          {tab === "creatures" ? (
            <div className={styles.cardGrid}>
              {creatureSummaries.map((creature) => (
                <article key={creature.participantId} className={styles.creatureCard} data-ui-text-box="auto">
                  <header><Portrait path={creature.portraitPath} name={creature.displayName} /><div><h2>{creature.displayName}</h2><p>{creature.variantName} · {creature.familyLabel}{creature.isArchived ? " · Archived" : ""}</p></div></header>
                  <div className={styles.statMatrix}>
                    <Metric label="Sessions" value={creature.totalAttempts} />
                    <Metric label="As Giver" value={creature.giverAttempts} />
                    <Metric label="As Receiver" value={creature.receiverAttempts} />
                    <Metric label="Pregnancies" value={creature.successfulPregnancies} />
                    <Metric label="Offspring" value={creature.hatchedOffspring} />
                    <Metric label="Partners" value={creature.uniquePartners} />
                  </div>
                  <p>Eligible success rate: {pct(creature.successRate)}</p>
                  <p>Best partner: {creature.mostSuccessfulPartnerName ?? "No successful partner yet"}</p>
                  <p>Last bred: {formatTimestamp(creature.lastAttemptAt)}</p>
                  {creature.currentPairStreaks.length ? <p>Active familiarity: {creature.currentPairStreaks.map((item) => `${item.partnerName} (${item.streak})`).join(", ")}</p> : null}
                  <div className={styles.cardActions}>
                    {creature.participantId !== "player" ? <button type="button" onClick={() => { setTreeFocusId(creature.participantId); setTab("tree"); }}>Family Tree</button> : null}
                    <button type="button" onClick={() => useCreature(creature.participantId)}>Send to Breeding Pen</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {tab === "tree" ? (
            <div className={styles.treeWorkspace}>
              <section className={styles.treeToolbar}>
                <label>Center Creature<select value={effectiveTreeId ?? ""} onChange={(event) => setTreeFocusId(event.target.value)}>{treeChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}</select></label>
                <span>{tree ? `${tree.siblingCount} tracked sibling${tree.siblingCount === 1 ? "" : "s"}` : "No family record"}</span>
              </section>
              {tree ? (
                <div className={styles.familyTree}>
                  <section><h3>Grandparents</h3><div>{tree.grandparents.length ? tree.grandparents.map((node, index) => <TreeNodeCard key={`${node.participantId}-${index}`} node={node} onSelect={(selected) => selected.creatureId && setTreeFocusId(selected.creatureId)} />) : <p>Grandparents are not recorded.</p>}</div></section>
                  <i aria-hidden="true">↓</i>
                  <section><h3>Parents</h3><div>{tree.parents.length ? tree.parents.map((node, index) => <TreeNodeCard key={`${node.participantId}-${index}`} node={node} onSelect={(selected) => selected.creatureId && setTreeFocusId(selected.creatureId)} />) : <p>Parents are not tracked for this creature.</p>}</div></section>
                  <i aria-hidden="true">↓</i>
                  <section className={styles.centerGeneration}><h3>Selected Creature</h3><div><TreeNodeCard node={tree.center} onSelect={() => undefined} /></div></section>
                  <i aria-hidden="true">↓</i>
                  <section><h3>Children</h3><div>{tree.children.length ? tree.children.map((node) => <TreeNodeCard key={node.participantId} node={node} onSelect={(selected) => selected.creatureId && setTreeFocusId(selected.creatureId)} />) : <p>No hatched children recorded.</p>}</div></section>
                </div>
              ) : <p className={styles.emptyMessage}>No tracked creatures are available for a family tree.</p>}
            </div>
          ) : null}
        </section>
      </section>

      {detailAttempt ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setDetailAttempt(null)}>
          <section className={styles.detailModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header><div><p className={styles.kicker}>Complete Attempt Record</p><h2>{detailAttempt.giverName} × {detailAttempt.receiverName}</h2><p>Ranch Day {detailAttempt.dayNumber} · {formatTimestamp(detailAttempt.createdAt)}</p></div><button type="button" onClick={() => setDetailAttempt(null)}>Close</button></header>
            <div className={styles.detailImages}><img src={detailAttempt.pairingImagePath} alt="Pairing scene record" /><img src={detailAttempt.outcomeImagePath} alt="Outcome record" /></div>
            <div className={styles.detailStats}>
              <Metric label="Outcome" value={getAttemptOutcome(detailAttempt)} />
              <Metric label="Pregnancy Chance" value={`${detailAttempt.pregnancyChance}%`} />
              <Metric label="Energy Cost" value={detailAttempt.energyCost} />
              <Metric label="Heart Cost" value={detailAttempt.heartCost} />
              <Metric label="Streak" value={`${detailAttempt.streakBefore} → ${detailAttempt.streakAfter}`} />
              <Metric label="Pregnancy Link" value={detailAttempt.pregnancyId ?? "None"} />
            </div>
            <article data-ui-text-box="auto"><h3>Result</h3><p>{detailAttempt.resultText}</p><p>{detailAttempt.outcomeFlavorText}</p></article>
            <article data-ui-text-box="auto"><h3>Progression</h3>{detailAttempt.progressionEvents.length ? detailAttempt.progressionEvents.map((event) => <p key={`${event.participantId}-${event.displayName}`}>{event.displayName}: +{event.xpAfter - event.xpBefore} XP{event.levelUps ? ` · ${event.levelUps} level up` : ""}{event.abilityTriggers.length ? ` · ${event.abilityTriggers.join(" ")}` : ""}</p>) : <p>No progression events recorded.</p>}</article>
            <article data-ui-text-box="auto"><h3>Offspring</h3>{getAttemptOffspring(currentSave, detailAttempt).length ? getAttemptOffspring(currentSave, detailAttempt).map((birth) => <p key={birth.birthId}>{birth.nickname} · Hatched Day {birth.hatchedAtDayNumber} · {formatTimestamp(birth.hatchedAt)}</p>) : <p>No hatched offspring linked to this attempt.</p>}</article>
          </section>
        </div>
      ) : null}
    </main>
  );
}
