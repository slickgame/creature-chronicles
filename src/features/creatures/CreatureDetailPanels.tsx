"use client";

import type { CSSProperties } from "react";
import { CREATURE_PLACEHOLDER_IMAGE, STAT_KEYS, getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { getCreatureGrowthProjections, getProjectedEnergyGainNextLevel } from "@/data/levelGrowth";
import { formatEnergy } from "@/lib/formatters";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";

export const SHARED_STAT_LABELS: Record<CreatureStatKey, string> = { STR: "Strength", DEX: "Dexterity", STA: "Stamina", CHA: "Charm", WIL: "Willpower", FER: "Fertility" };

type CreatureDetailMode = "full" | "compact" | "growth" | "lineage";

type SharedCreatureDetailProps = {
  creature: CreatureRecord;
  mode?: CreatureDetailMode;
  dayNumber?: number;
  renameValue?: string;
  onRenameValueChange?: (value: string) => void;
  onRename?: () => void;
  onToggleLock?: () => void;
  onRelease?: () => void;
  onDonate?: () => void;
  showActions?: boolean;
};

const shellStyle: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(220px, 0.82fr) minmax(280px, 1.18fr)", gap: 14, alignItems: "start" };
const cardStyle: CSSProperties = { border: "1px solid rgba(245,201,128,.28)", borderRadius: 16, background: "rgba(0,0,0,.22)", padding: 12, color: "#fff7dd", boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)" };
const kickerStyle: CSSProperties = { margin: 0, color: "#f5c980", fontSize: ".64rem", fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const smallText: CSSProperties = { color: "#f2dfbd", fontSize: ".78rem", fontWeight: 780, lineHeight: 1.32, textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const statGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 };
const resourceGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 };
const buttonStyle: CSSProperties = { minHeight: 34, border: "2px solid rgba(45,25,13,.92)", borderRadius: 10, background: "linear-gradient(#fff4cf,#d6a25b)", color: "#1f1108", fontWeight: 950 };

function isInjured(creature: CreatureRecord, dayNumber?: number): boolean { return typeof dayNumber === "number" && typeof creature.injuredUntilDayNumber === "number" && creature.injuredUntilDayNumber >= dayNumber; }
function barStyle(percent: number): CSSProperties { return { display: "block", width: `${Math.max(0, Math.min(100, percent))}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, rgba(127,219,255,.88), rgba(245,201,128,.9))" }; }
function previewBarStyle(currentPercent: number, nextGainPercent: number): CSSProperties { return { position: "absolute", left: `${Math.max(0, Math.min(100, currentPercent))}%`, width: `${Math.max(0, Math.min(100 - currentPercent, nextGainPercent))}%`, top: 0, bottom: 0, borderRadius: 999, background: "rgba(126,229,168,.65)" }; }
function percent(value: number, max: number): number { return max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100))); }
function progressTrack(children: React.ReactNode) { return <div style={{ position: "relative", height: 10, border: "1px solid rgba(127,219,255,.34)", borderRadius: 999, background: "rgba(0,0,0,.32)", overflow: "hidden" }}>{children}</div>; }

export function SharedCreatureDetail({ creature, mode = "full", dayNumber, renameValue, onRenameValueChange, onRename, onToggleLock, onRelease, onDonate, showActions = true }: SharedCreatureDetailProps) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  const injury = isInjured(creature, dayNumber);
  const lineage = creature.lineage;
  const growth = getCreatureGrowthProjections(creature);
  const energyPreview = getProjectedEnergyGainNextLevel(creature);
  const xpPercent = percent(creature.xp, creature.xpToNext);
  const showFull = mode === "full";
  const showGrowth = showFull || mode === "growth";
  const showLineage = showFull || mode === "lineage";
  return <div style={shellStyle}><section style={cardStyle}><p style={kickerStyle}>{variant.rarity} Variant</p><h2 style={{ margin: "3px 0", color: "#fff", fontSize: "1.5rem", lineHeight: 1 }}>{creature.nickname}</h2><p style={{ ...smallText, margin: 0 }}>{variant.name} {species.name} • Gen {creature.generation} • Lv {creature.level}</p><div style={{ marginTop: 10, borderRadius: 16, overflow: "hidden", background: "rgba(255,247,221,.08)", border: "1px solid rgba(245,201,128,.24)" }}><img src={variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt="" style={{ display: "block", width: "100%", maxHeight: 390, objectFit: "cover" }} onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} /></div><div style={{ display: "grid", gap: 7, marginTop: 10 }}><span style={{ ...smallText, color: injury ? "#ffb4a4" : creature.isLocked ? "#7fdbff" : "#f2dfbd" }}>{injury ? `${creature.injuryLabel ?? "Injured"} until recovery` : creature.isLocked ? "Locked / Protected" : "Unlocked"}</span><p style={{ ...smallText, margin: 0 }}>{variant.description}</p></div></section><section style={{ display: "grid", gap: 10 }}><section style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><div><p style={kickerStyle}>Creature Profile</p><h3 style={{ margin: "3px 0", color: "#fff" }}>{creature.originLabel}</h3></div>{onToggleLock ? <button type="button" style={buttonStyle} onClick={onToggleLock}>{creature.isLocked ? "Unlock" : "Lock"}</button> : null}</div><div style={resourceGridStyle}><MiniStat label="Energy" value={formatEnergy(creature.energy, creature.maxEnergy)} /><MiniStat label="Hearts" value={`${creature.hearts}/${creature.maxHearts}`} /><MiniStat label="Affection" value={`${creature.affection}/100`} /><MiniStat label="XP" value={`${creature.xp}/${creature.xpToNext}`} /><MiniStat label="Lineage" value={lineage?.label ?? "No Risk"} /><MiniStat label="Shiny" value={creature.shiny ? "Yes" : "No"} /></div>{renameValue !== undefined && onRenameValueChange && onRename ? <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 10 }}><input value={renameValue} onChange={(event) => onRenameValueChange(event.target.value)} maxLength={24} style={{ minHeight: 34, borderRadius: 10, border: "1px solid rgba(245,201,128,.34)", background: "rgba(0,0,0,.28)", color: "#fff7dd", padding: "0 10px", fontWeight: 850 }} /><button type="button" style={buttonStyle} onClick={onRename}>Save Name</button></div> : null}</section>{showGrowth ? <section style={cardStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><p style={kickerStyle}>Growth Preview</p><h3 style={{ margin: "3px 0", color: "#fff" }}>Next Level</h3></div><strong style={{ color: "#7fdbff" }}>{xpPercent}% XP</strong></div>{progressTrack(<span style={barStyle(xpPercent)} />)}<p style={{ ...smallText, margin: "8px 0" }}>Energy preview: {energyPreview.currentMaxEnergy} → {energyPreview.nextLevelMaxEnergy} {energyPreview.delta >= 0 ? `(+${energyPreview.delta})` : `(${energyPreview.delta})`}.</p><div style={statGridStyle}>{STAT_KEYS.map((statKey) => { const projection = growth[statKey]; return <article key={statKey} style={{ padding: 8, border: `1px solid ${projection.willIncreaseNextLevel ? "rgba(126,229,168,.5)" : "rgba(245,201,128,.22)"}`, borderRadius: 10, background: projection.willIncreaseNextLevel ? "rgba(126,229,168,.08)" : "rgba(0,0,0,.18)" }}><span style={kickerStyle}>{SHARED_STAT_LABELS[statKey]}</span><strong style={{ display: "block", color: "#fff7dd" }}>{creature.stats[statKey]} <small style={{ color: "#f5c980" }}>Grade {creature.statGrades[statKey]}</small></strong>{progressTrack(<><span style={barStyle(projection.currentProgressPercent)} /><i style={previewBarStyle(projection.currentProgressPercent, projection.nextLevelGainPercent)} /></>)}<p style={{ ...smallText, margin: "5px 0 0" }}>{projection.willIncreaseNextLevel ? `Next level +${projection.statGainNextLevel} ${statKey}` : `~${projection.levelsUntilIncrease} level${projection.levelsUntilIncrease === 1 ? "" : "s"} away`}</p></article>; })}</div></section> : null}{showLineage ? <section style={cardStyle}><p style={kickerStyle}>Lineage</p><h3 style={{ margin: "3px 0", color: "#fff" }}>{lineage?.label ?? "No Risk"}</h3><p style={{ ...smallText, margin: 0 }}>{lineage?.parentNames?.length ? `Parents: ${lineage.parentNames.join(" × ")}` : "Parents not tracked."}</p><p style={{ ...smallText, margin: "6px 0 0" }}>{lineage?.notes?.length ? lineage.notes.join(" ") : "No close lineage risk detected or this creature predates lineage tracking."}</p>{lineage?.traits?.length ? <p style={{ ...smallText, margin: "6px 0 0" }}>Trait markers: {lineage.traits.join(", ")}</p> : null}</section> : null}{showFull || mode === "compact" ? <section style={cardStyle}><p style={kickerStyle}>Abilities</p>{creature.abilities.length ? <div style={{ display: "grid", gap: 8 }}>{creature.abilities.map((ability) => <article key={ability.id} style={{ border: "1px solid rgba(127,219,255,.24)", borderRadius: 10, padding: 8, background: "rgba(0,0,0,.18)" }}><strong style={{ color: "#fff7dd" }}>{ability.name}</strong><span style={{ display: "block", color: "#7fdbff", fontSize: ".74rem", fontWeight: 900 }}>Grade {ability.grade} • {ability.source}</span><p style={{ ...smallText, margin: "5px 0 0" }}>{ability.description}</p></article>)}</div> : <p style={{ ...smallText, margin: 0 }}>No ability. Hatch abilities usually come from parents; new ability mutations are rare.</p>}</section> : null}{showActions && showFull ? <section style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{onRelease ? <button type="button" style={buttonStyle} onClick={onRelease}>Release</button> : null}{onDonate ? <button type="button" style={buttonStyle} onClick={onDonate}>Donate</button> : null}</section> : null}</section></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: 8, border: "1px solid rgba(245,201,128,.22)", borderRadius: 10, background: "rgba(0,0,0,.18)" }}><span style={kickerStyle}>{label}</span><strong style={{ display: "block", color: "#fff7dd", marginTop: 3 }}>{value}</strong></div>;
}
