"use client";

import { useEffect, useMemo, useState } from "react";
import {
  auditCreatureTalents,
  auditTalentDefinitions,
} from "@/data/talents/talentAudit";
import {
  describeTalentEffect,
  getAllTalentDefinitions,
} from "@/data/talents/talentDefinitions";
import { getVariantDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import type { AbilityGrade } from "@/types/creature";
import type { TalentAuditStatus, TalentCategory } from "@/types/talent";
import styles from "./TalentAuditPanel.module.css";

type AuditTab = "overview" | "definitions" | "creatures" | "grades";
type StatusFilter = "all" | TalentAuditStatus;

const GRADES: AbilityGrade[] = ["F", "D", "C", "B", "A", "S"];

function labelFromSlug(value: string): string {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(status: TalentAuditStatus): string {
  if (status === "fully-implemented") return "Implemented";
  if (status === "partially-implemented") return "Partial";
  if (status === "description-only") return "Description Only";
  return "Unknown Definition";
}

export function TalentAuditPanel() {
  const { currentSave } = useGameContext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AuditTab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TalentCategory>("all");
  const [selectedTalentId, setSelectedTalentId] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<AbilityGrade>("C");

  const audit = useMemo(() => auditTalentDefinitions(currentSave), [currentSave]);
  const definitions = useMemo(() => getAllTalentDefinitions(), []);
  const selectedDefinition = definitions.find((definition) => definition.id === selectedTalentId) ?? definitions[0] ?? null;
  const creatureAudits = useMemo(
    () => (currentSave?.creatures ?? []).map(auditCreatureTalents),
    [currentSave],
  );
  const categories = useMemo(
    () => Array.from(new Set(definitions.map((definition) => definition.category))).sort(),
    [definitions],
  );

  useEffect(() => {
    if (!selectedTalentId && definitions[0]) setSelectedTalentId(definitions[0].id);
  }, [definitions, selectedTalentId]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [open]);

  if (!currentSave) return null;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRecords = audit.records.filter((record) => {
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    if (categoryFilter !== "all" && record.category !== categoryFilter) return false;
    if (!normalizedSearch) return true;
    return [record.name, record.talentId, record.category, ...record.tags, ...record.systems]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  return (
    <>
      <button type="button" className={styles.launchButton} onClick={() => setOpen(true)}>
        Talent Audit
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Structured talent audit"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <div>
                <p>Developer Capability Audit</p>
                <h1>Talent System</h1>
                <span>Read-only review of definitions, exact F–S effects, runtime coverage, saved instances, and derived creature roles.</span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </header>

            <nav className={styles.tabs} aria-label="Talent audit sections">
              {([
                ["overview", "Overview"],
                ["definitions", "Definitions"],
                ["creatures", "Owned Creatures"],
                ["grades", "Grade Preview"],
              ] as Array<[AuditTab, string]>).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tab === id ? styles.activeTab : undefined}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className={styles.content}>
              {tab === "overview" ? (
                <div className={styles.stack}>
                  <section className={styles.metricGrid}>
                    <Metric label="Definitions" value={audit.definitionCount} />
                    <Metric label="Owned Instances" value={audit.ownedInstanceCount} />
                    <Metric label="Creatures With Talents" value={audit.ownedCreatureCount} />
                    <Metric label="Implemented" value={audit.fullyImplementedCount} tone="good" />
                    <Metric label="Partial" value={audit.partiallyImplementedCount} tone="warning" />
                    <Metric label="Unknown" value={audit.unknownDefinitionCount} tone={audit.unknownDefinitionCount ? "bad" : "good"} />
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Grade Coverage</h2>
                    <p><strong>{audit.gradeCoverageCount} / {audit.gradeCoverageExpected}</strong> definition-grade combinations have both structured effects and exact text.</p>
                    <p>Definition version: {audit.definitionVersion}. The existing save field remains <code>abilities</code> for compatibility, while the player-facing and runtime system is now unified as Talents.</p>
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Connected Runtime Hooks</h2>
                    <div className={styles.chipRow}>
                      {["Breeding parity", "Growth bias", "Ranch chores", "Daily recovery", "Battle stats", "Role tags"].map((item) => <span key={item} className={styles.goodChip}>{item}</span>)}
                    </div>
                    <p>Breeding definitions deliberately preserve the current live formula. Chores, recovery, battle-stat calculation, and role recommendations now consume the same central definition registry.</p>
                  </section>
                  {audit.globalWarnings.map((warning) => (
                    <section key={warning} className={styles.warningCard} data-ui-text-box="auto">
                      <strong>Audit Note</strong>
                      <p>{warning}</p>
                    </section>
                  ))}
                </div>
              ) : null}

              {tab === "definitions" ? (
                <div className={styles.stack}>
                  <section className={styles.filterBar}>
                    <label>
                      <span>Search</span>
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, id, tag, or system" />
                    </label>
                    <label>
                      <span>Status</span>
                      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                        <option value="all">All statuses</option>
                        <option value="fully-implemented">Implemented</option>
                        <option value="partially-implemented">Partial</option>
                        <option value="description-only">Description only</option>
                        <option value="unknown-definition">Unknown definition</option>
                      </select>
                    </label>
                    <label>
                      <span>Category</span>
                      <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | TalentCategory)}>
                        <option value="all">All categories</option>
                        {categories.map((category) => <option key={category} value={category}>{labelFromSlug(category)}</option>)}
                      </select>
                    </label>
                  </section>
                  <p className={styles.resultCount}>{filteredRecords.length} talent definition{filteredRecords.length === 1 ? "" : "s"} shown.</p>
                  <div className={styles.definitionGrid}>
                    {filteredRecords.map((record) => {
                      const definition = definitions.find((item) => item.id === record.talentId);
                      return (
                        <article key={record.talentId} className={styles.card} data-ui-text-box="auto">
                          <div className={styles.cardHeader}>
                            <div>
                              <p className={styles.kicker}>{labelFromSlug(record.category)}</p>
                              <h2>{record.name}</h2>
                              <code>{record.talentId}</code>
                            </div>
                            <span className={styles[`status_${record.status.replace(/-/g, "_")}`]}>{statusLabel(record.status)}</span>
                          </div>
                          <div className={styles.chipRow}>
                            {record.systems.map((system) => <span key={system}>{labelFromSlug(system)}</span>)}
                            {record.tags.slice(0, 6).map((tag) => <span key={tag}>{labelFromSlug(tag)}</span>)}
                          </div>
                          <p>Owned: {record.ownedCount}. Grades present: {record.gradesOwned.length ? record.gradesOwned.join(", ") : "none"}.</p>
                          {definition ? <p><strong>Current grade-C effect:</strong> {definition.exactDescriptionByGrade.C}</p> : null}
                          {record.warnings.length ? <ul>{record.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p className={styles.goodText}>No definition warnings.</p>}
                          {definition ? <button type="button" onClick={() => { setSelectedTalentId(definition.id); setTab("grades"); }}>Review F–S Effects</button> : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {tab === "creatures" ? (
                <div className={styles.creatureGrid}>
                  {creatureAudits.map((entry) => {
                    const variant = getVariantDefinition(entry.creature.variantId);
                    return (
                      <article key={entry.creature.creatureId} className={styles.creatureCard} data-ui-text-box="auto">
                        <img src={variant.portraitPath} alt="" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                        <div>
                          <p className={styles.kicker}>{variant.name} · Level {entry.creature.level}</p>
                          <h2>{entry.creature.nickname}</h2>
                          <p>{entry.talentCount} talent{entry.talentCount === 1 ? "" : "s"}. {entry.unknownTalentIds.length ? `${entry.unknownTalentIds.length} unknown.` : "All saved talent ids are recognized."}</p>
                          <div className={styles.chipRow}>
                            {entry.roleTags.slice(0, 6).map((tag) => <span key={tag.id} title={tag.reasons.join(" ")}>{tag.label} · {tag.score.toFixed(1)}</span>)}
                          </div>
                          {(entry.creature.abilities ?? []).map((talent) => (
                            <p key={talent.id} className={styles.talentLine}><strong>{talent.name} {talent.grade}</strong> — {talent.description}</p>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}

              {tab === "grades" && selectedDefinition ? (
                <div className={styles.gradeLayout}>
                  <aside className={styles.definitionPicker}>
                    <label>
                      <span>Talent</span>
                      <select value={selectedDefinition.id} onChange={(event) => setSelectedTalentId(event.target.value)}>
                        {definitions.map((definition) => <option key={definition.id} value={definition.id}>{definition.name}</option>)}
                      </select>
                    </label>
                    <div className={styles.gradeButtons}>
                      {GRADES.map((grade) => (
                        <button key={grade} type="button" className={selectedGrade === grade ? styles.selectedGrade : undefined} onClick={() => setSelectedGrade(grade)}>
                          {grade}
                        </button>
                      ))}
                    </div>
                    <div className={styles.chipRow}>
                      {selectedDefinition.tags.map((tag) => <span key={tag}>{labelFromSlug(tag)}</span>)}
                    </div>
                  </aside>
                  <section className={styles.card} data-ui-text-box="auto">
                    <p className={styles.kicker}>{labelFromSlug(selectedDefinition.category)} · Grade {selectedGrade}</p>
                    <h2>{selectedDefinition.name}</h2>
                    <p className={styles.exactDescription}>{selectedDefinition.exactDescriptionByGrade[selectedGrade]}</p>
                    <h3>Structured Effects</h3>
                    <div className={styles.effectGrid}>
                      {selectedDefinition.gradeEffects[selectedGrade].map((effect, index) => (
                        <article key={`${effect.type}-${effect.jobId ?? effect.battleStatKey ?? index}`}>
                          <strong>{labelFromSlug(effect.type)}</strong>
                          <span>{describeTalentEffect(effect)}</span>
                          {effect.note ? <small>{effect.note}</small> : null}
                        </article>
                      ))}
                    </div>
                    <h3>Hooks</h3>
                    <p>Systems: {selectedDefinition.systems.map(labelFromSlug).join(", ")}.</p>
                    <p>Triggers: {selectedDefinition.triggers.map(labelFromSlug).join(", ")}.</p>
                    <p>Stacking: {labelFromSlug(selectedDefinition.stackingRule)}.</p>
                  </section>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "good" | "warning" | "bad" }) {
  return (
    <div className={`${styles.metric} ${styles[`metric_${tone}`]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
