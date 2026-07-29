"use client";

import { useEffect, useMemo, useState } from "react";
import { auditBattleMoveFoundation } from "@/data/battleMoveAudit";
import { BATTLE_MOVE_COMBINATION_RECIPES } from "@/data/battleMoveRecipes";
import { BATTLE_MOVES, getBattleMove } from "@/data/battleMoves";
import { BATTLE_SPECIES_PROFILES } from "@/data/battleProfiles";
import { getCreatureBattleMoveLoadout } from "@/data/battleLoadouts";
import { getVariantDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import type { BattleMoveCategory, BattleMoveSourceType } from "@/types/battle";
import styles from "./BattleMoveAuditPanel.module.css";

type AuditTab = "overview" | "moves" | "species" | "creatures" | "recipes";
type CategoryFilter = "all" | BattleMoveCategory;
type SourceFilter = "all" | BattleMoveSourceType;

function label(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function effectSummary(moveId: string): string {
  const move = getBattleMove(moveId);
  return move.effects.map((effect) => {
    const parts = [label(effect.type)];
    if (effect.status) parts.push(label(effect.status));
    if (effect.stat) parts.push(label(effect.stat));
    if (effect.amount !== undefined) parts.push(String(effect.amount));
    if (effect.chance !== undefined) parts.push(`${effect.chance}%`);
    if (effect.duration !== undefined) parts.push(`${effect.duration}r`);
    return parts.join(" · ");
  }).join(" / ");
}

export function BattleMoveAuditPanel() {
  const { currentSave } = useGameContext();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<AuditTab>("overview");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const audit = useMemo(() => auditBattleMoveFoundation(currentSave ?? undefined), [currentSave]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onEscape, true);
    return () => window.removeEventListener("keydown", onEscape, true);
  }, [open]);

  if (!currentSave) return null;

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMoves = BATTLE_MOVES.filter((move) => {
    if (category !== "all" && move.category !== category) return false;
    if (source !== "all" && move.sourceType !== source) return false;
    if (!normalizedSearch) return true;
    return [move.id, move.name, move.description, move.category, move.sourceType, ...move.tags]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  return (
    <>
      <button type="button" className={styles.launchButton} onClick={() => setOpen(true)}>
        Move Audit
      </button>

      {open ? (
        <div className={styles.backdrop} role="presentation" onMouseDown={() => setOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Battle move audit" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.header}>
              <div>
                <p>Developer Combat Foundation</p>
                <h1>Battle Move Audit</h1>
                <span>Read-only inspection of move definitions, species compatibility, persistent loadouts, fallback safety, and future breeding-combination recipes.</span>
              </div>
              <button type="button" onClick={() => setOpen(false)}>Close</button>
            </header>

            <nav className={styles.tabs} aria-label="Battle move audit sections">
              {([
                ["overview", "Overview"],
                ["moves", `Moves (${audit.moveCount})`],
                ["species", `Species (${audit.speciesProfileCount})`],
                ["creatures", `Creatures (${audit.ownedCreatureCount})`],
                ["recipes", `Recipes (${audit.recipeCount})`],
              ] as Array<[AuditTab, string]>).map(([id, text]) => (
                <button key={id} type="button" className={tab === id ? styles.activeTab : undefined} onClick={() => setTab(id)}>{text}</button>
              ))}
            </nav>

            <div className={styles.content}>
              {tab === "overview" ? (
                <div className={styles.stack}>
                  <section className={styles.metricGrid}>
                    <Metric label="Move Definitions" value={audit.moveCount} />
                    <Metric label="Species Profiles" value={audit.speciesProfileCount} />
                    <Metric label="Combination Recipes" value={audit.recipeCount} />
                    <Metric label="Errors" value={audit.errorCount} tone={audit.errorCount ? "bad" : "good"} />
                    <Metric label="Warnings" value={audit.warningCount} tone={audit.warningCount ? "warning" : "good"} />
                    <Metric label="Owned Loadouts" value={audit.ownedCreatureCount} />
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Move Categories</h2>
                    <div className={styles.chipRow}>
                      <span>Physical {audit.physicalCount}</span>
                      <span>Special {audit.specialCount}</span>
                      <span>Support {audit.supportCount}</span>
                      <span>Status {audit.statusCount}</span>
                      <span>Healing {audit.healingCount}</span>
                    </div>
                    <p>Every move declares targeting, Battle Energy cost, cooldown, priority, tags, structured effects, scaling, resisted stat, and AI-use hints.</p>
                  </section>
                  <section className={styles.card} data-ui-text-box="auto">
                    <h2>Source Coverage</h2>
                    <div className={styles.chipRow}>
                      <span>Universal {audit.universalCount}</span>
                      <span>Species {audit.speciesCount}</span>
                      <span>Combination {audit.combinationCount}</span>
                    </div>
                    <p>Variant, manual, Talent, Coliseum, story, and event sources are supported by the type model and can be populated in later patches.</p>
                  </section>
                  {audit.issues.length ? audit.issues.map((entry) => (
                    <section key={entry.issueId} className={entry.severity === "error" ? styles.errorCard : styles.warningCard} data-ui-text-box="auto">
                      <strong>{entry.severity === "error" ? "Error" : "Warning"} · {label(entry.scope)}</strong>
                      <code>{entry.subjectId}</code>
                      <p>{entry.message}</p>
                    </section>
                  )) : (
                    <section className={styles.goodCard} data-ui-text-box="auto"><strong>Audit Clean</strong><p>No definition, profile, recipe, or owned-loadout issues were detected.</p></section>
                  )}
                </div>
              ) : null}

              {tab === "moves" ? (
                <div className={styles.stack}>
                  <section className={styles.filters}>
                    <label><span>Search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Move, id, tag, or effect" /></label>
                    <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)}><option value="all">All</option>{["physical", "special", "support", "status", "healing"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
                    <label><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)}><option value="all">All</option>{Array.from(new Set(BATTLE_MOVES.map((move) => move.sourceType))).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
                  </section>
                  <p className={styles.resultCount}>{filteredMoves.length} move{filteredMoves.length === 1 ? "" : "s"} shown.</p>
                  <div className={styles.grid}>
                    {filteredMoves.map((move) => (
                      <article key={move.id} className={styles.card} data-ui-text-box="auto">
                        <div className={styles.cardHeader}><div><p className={styles.kicker}>{label(move.sourceType)} · {label(move.category)}</p><h2>{move.name}</h2><code>{move.id}</code></div><span className={styles.cost}>{move.battleEnergyCost} BE</span></div>
                        <p>{move.description}</p>
                        <div className={styles.statLine}><span>Power {move.power}</span><span>Accuracy {move.accuracy}%</span><span>Cooldown {move.cooldown}</span><span>Priority {move.priority >= 0 ? "+" : ""}{move.priority}</span></div>
                        <p><strong>Effects:</strong> {effectSummary(move.id)}</p>
                        <p><strong>Scaling:</strong> {label(move.scalingStat ?? "none")} · <strong>Resisted by:</strong> {label(move.resistedBy ?? "none")}</p>
                        <div className={styles.chipRow}>{move.tags.map((tag) => <span key={tag}>{label(tag)}</span>)}</div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {tab === "species" ? (
                <div className={styles.grid}>
                  {BATTLE_SPECIES_PROFILES.map((profile) => (
                    <article key={profile.speciesId} className={styles.card} data-ui-text-box="auto">
                      <p className={styles.kicker}>{label(profile.family)}</p>
                      <h2>{label(String(profile.speciesId).replace("species_", ""))}</h2>
                      <p><strong>Signature:</strong> {getBattleMove(profile.signatureMoveId).name}</p>
                      <p><strong>Default learned:</strong> {profile.defaultLearnedMoveIds.map((id) => getBattleMove(id).name).join(", ")}</p>
                      <p><strong>Default equipped:</strong> {profile.defaultEquippedMoveIds.map((id) => getBattleMove(id).name).join(", ")}</p>
                      <div className={styles.chipRow}>{[...profile.roleTags, ...profile.bodyTags].map((tag) => <span key={tag}>{label(tag)}</span>)}</div>
                    </article>
                  ))}
                </div>
              ) : null}

              {tab === "creatures" ? (
                <div className={styles.grid}>
                  {(currentSave.creatures ?? []).map((creature) => {
                    const variant = getVariantDefinition(creature.variantId);
                    const loadout = getCreatureBattleMoveLoadout(creature);
                    return (
                      <article key={creature.creatureId} className={styles.creatureCard} data-ui-text-box="auto">
                        <img src={variant.portraitPath} alt="" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
                        <div>
                          <p className={styles.kicker}>{variant.name} · Level {creature.level}</p>
                          <h2>{creature.nickname}</h2>
                          <p><strong>Learned {loadout.learnedMoveIds.length}/8:</strong> {loadout.learnedMoveIds.map((id) => getBattleMove(id).name).join(", ")}</p>
                          <p><strong>Equipped {loadout.equippedMoveIds.length}/4:</strong> {loadout.equippedMoveIds.map((id) => getBattleMove(id).name).join(", ")}</p>
                          <div className={styles.chipRow}>{loadout.equippedMoveIds.map((id) => <span key={id}>{getBattleMove(id).name} · {getBattleMove(id).battleEnergyCost} BE</span>)}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}

              {tab === "recipes" ? (
                <div className={styles.grid}>
                  {BATTLE_MOVE_COMBINATION_RECIPES.map((recipe) => (
                    <article key={recipe.recipeId} className={styles.card} data-ui-text-box="auto">
                      <p className={styles.kicker}>Future Breeding Combination · {recipe.baseChance}% base</p>
                      <h2>{recipe.name}</h2>
                      <code>{recipe.recipeId}</code>
                      <p>{recipe.description}</p>
                      <p><strong>Parent group A:</strong> {recipe.parentAMoveIds.map((id) => getBattleMove(id).name).join(" or ")}</p>
                      <p><strong>Parent group B:</strong> {recipe.parentBMoveIds.map((id) => getBattleMove(id).name).join(" or ")}</p>
                      <p><strong>Result:</strong> {getBattleMove(recipe.outputMoveId).name}</p>
                      <p>{recipe.notes.join(" ")}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function Metric({ label: metricLabel, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "good" | "warning" | "bad" }) {
  return <div className={styles.metric} data-tone={tone}><span>{metricLabel}</span><strong>{value}</strong></div>;
}
