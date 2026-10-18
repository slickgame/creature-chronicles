"use client";

import { getEquineGameplayProfileSprite } from "@/data/equineGameplayArt";
import { getNylaGameplayProfileSprite } from "@/data/nylaGameplayArt";

import { type CSSProperties, type ReactNode, useEffect, useId, useState } from "react";
import { getCreatureChoreSkillGroup } from "@/data/choreSkills";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  STAT_KEYS,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import {
  getCreatureGrowthProjections,
  getLevelGrowthAcceleration,
  getProjectedEnergyGainNextLevel,
} from "@/data/levelGrowth";
import { getCreatureRoleTags } from "@/data/talents/creatureRoleTags";
import { formatEnergy } from "@/lib/formatters";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";
import dossierStyles from "./CreatureDossier.module.css";
import { CreatureInventoryTab, CreatureEquipmentTab } from "./CreatureInventoryTabs";
import { CompactOverview, CompactStats } from "./CompactSummaryTabs";
import { CompactWork, CompactTalents, CompactLineage, CompactCare } from "./CompactProfileTabs";
import { CreatureSkillRadar } from "./CreatureSkillRadar";

export const SHARED_STAT_LABELS: Record<CreatureStatKey, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
};

type CreatureDetailMode = "full" | "compact" | "growth" | "lineage";
type CreatureDetailTab = "overview" | "stats" | "work" | "talents" | "lineage" | "care" | "inventory" | "equipment";

type SharedCreatureDetailProps = {
  creature: CreatureRecord;
  mode?: CreatureDetailMode;
  dayNumber?: number;
  renameValue?: string;
  onRenameValueChange?: (value: string) => void;
  onRename?: () => void;
  onToggleLock?: () => void;
  onFeed?: () => void;
  onRelease?: () => void;
  onDonate?: () => void;
  showActions?: boolean;
  fitViewport?: boolean;
  dossier?: boolean;
  ranchDossier?: boolean;
  inventoryRequest?: number;
  onEquipmentFocus?: () => void;
  showDossierPortrait?: boolean;
  statusNote?: string;
  bestStatLabels?: string[];
  // Opt-in only: this shared detail panel is also used in breeding screens.
  useGameplayArt?: boolean;
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(245,201,128,.28)",
  borderRadius: 16,
  background: "rgba(0,0,0,.22)",
  padding: 12,
  color: "#fff7dd",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#f5c980",
  fontSize: ".64rem",
  fontWeight: 950,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  textShadow: "0 2px 2px rgba(0,0,0,.72)",
};

const smallText: CSSProperties = {
  color: "#f2dfbd",
  fontSize: ".78rem",
  fontWeight: 780,
  lineHeight: 1.32,
  textShadow: "0 2px 2px rgba(0,0,0,.72)",
};

const buttonStyle: CSSProperties = {
  minHeight: 34,
  padding: "7px 12px",
  border: "2px solid rgba(45,25,13,.92)",
  borderRadius: 10,
  background: "linear-gradient(#fff4cf,#d6a25b)",
  color: "#1f1108",
  fontWeight: 950,
  cursor: "pointer",
};

const tabButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: "6px 11px",
  border: "1px solid rgba(245,201,128,.34)",
  borderRadius: 999,
  background: "rgba(255,247,221,.07)",
  color: "#f2dfbd",
  fontSize: ".74rem",
  fontWeight: 950,
  cursor: "pointer",
};

const resourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))",
  gap: 8,
};

function isInjured(creature: CreatureRecord, dayNumber?: number): boolean {
  return Boolean(
    typeof dayNumber === "number" &&
      typeof creature.injuredUntilDayNumber === "number" &&
      creature.injuredUntilDayNumber >= dayNumber,
  );
}

function percent(value: number, max: number): number {
  return max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function barStyle(value: number): CSSProperties {
  return {
    display: "block",
    width: `${Math.max(0, Math.min(100, value))}%`,
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg,rgba(127,219,255,.88),rgba(245,201,128,.9))",
  };
}

function previewBarStyle(current: number, gain: number): CSSProperties {
  return {
    position: "absolute",
    left: `${Math.max(0, Math.min(100, current))}%`,
    width: `${Math.max(0, Math.min(100 - current, gain))}%`,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    background: "rgba(126,229,168,.65)",
  };
}

function progressTrack(children: ReactNode) {
  return (
    <div
      style={{
        position: "relative",
        height: 9,
        border: "1px solid rgba(127,219,255,.34)",
        borderRadius: 999,
        background: "rgba(0,0,0,.32)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function getAvailableTabs(mode: CreatureDetailMode, hasCareActions: boolean, ranchDossier = false): CreatureDetailTab[] {
  if (mode === "growth") return ["stats"];
  if (mode === "lineage") return ["lineage"];
  if (mode === "compact") return ["overview", "talents"];
  return [
    "overview",
    "stats",
    "work",
    "talents",
    "lineage",
    ...(ranchDossier ? (["inventory", "equipment"] as CreatureDetailTab[]) : []),
    ...(hasCareActions ? (["care"] as CreatureDetailTab[]) : []),
  ];
}

function getTabLabel(tab: CreatureDetailTab): string {
  if (tab === "stats") return "Stats & Growth";
  if (tab === "work") return "Work Skills";
  if (tab === "talents") return "Talents";
  if (tab === "lineage") return "Lineage";
  if (tab === "inventory") return "Inventory";
  if (tab === "equipment") return "Equipment";
  if (tab === "care") return "Care";
  return "Overview";
}

export function SharedCreatureDetail({
  creature,
  mode = "full",
  dayNumber,
  renameValue,
  onRenameValueChange,
  onRename,
  onToggleLock,
  onFeed,
  onRelease,
  onDonate,
  showActions = true,
  fitViewport = false,
  dossier = false,
  ranchDossier = false,
  inventoryRequest = 0,
  onEquipmentFocus,
  showDossierPortrait = false,
  statusNote,
  bestStatLabels = [],
  useGameplayArt = false,
}: SharedCreatureDetailProps) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  const injury = isInjured(creature, dayNumber);
  const growth = getCreatureGrowthProjections(creature);
  const energyPreview = getProjectedEnergyGainNextLevel(creature);
  const xpPercent = percent(creature.xp, creature.xpToNext);
  const acceleration = getLevelGrowthAcceleration(creature.level);
  const hasCareActions = Boolean(
    onFeed ||
      renameValue !== undefined ||
      onToggleLock ||
      statusNote ||
      bestStatLabels.length ||
      (showActions && (onRelease || onDonate)),
  );
  const tabId = useId();
  const tabs = getAvailableTabs(mode, hasCareActions, ranchDossier);
  const [activeTab, setActiveTab] = useState<CreatureDetailTab>(tabs[0]);
  function selectTab(tab:CreatureDetailTab){setActiveTab(tab);if(tab==='equipment')onEquipmentFocus?.();}
  useEffect(()=>{if(activeTab!=='equipment'||!onEquipmentFocus)return;const resize=()=>onEquipmentFocus();addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[activeTab,onEquipmentFocus]);

  useEffect(() => {
    setActiveTab(current => ranchDossier && getAvailableTabs(mode, hasCareActions, ranchDossier).includes(current) ? current : getAvailableTabs(mode, hasCareActions, ranchDossier)[0]);
  }, [creature.creatureId, mode, hasCareActions, ranchDossier]);

  useEffect(() => {
    if (ranchDossier && inventoryRequest > 0) setActiveTab("inventory");
  }, [inventoryRequest, ranchDossier]);

  const shellStyle: CSSProperties = {
    height: fitViewport ? "100%" : "auto",
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: dossier ? "minmax(0,1fr)" : "minmax(300px,.92fr) minmax(430px,1.3fr)",
    gap: 12,
    alignItems: fitViewport ? "stretch" : "start",
    overflow: "hidden",
  };

  const portraitCardStyle: CSSProperties = {
    ...cardStyle,
    position: "relative",
    minHeight: 0,
    height: fitViewport ? "100%" : "auto",
    display: "grid",
    gridTemplateRows: "auto auto auto minmax(0,1fr)",
    border: creature.shiny ? "2px solid rgba(139,233,255,.95)" : cardStyle.border,
    boxShadow: creature.shiny
      ? "0 0 0 2px rgba(255,218,128,.3),0 0 24px rgba(139,233,255,.32),0 0 38px rgba(255,155,229,.16),inset 0 1px 0 rgba(255,255,255,.12)"
      : cardStyle.boxShadow,
    background: creature.shiny
      ? "radial-gradient(circle at top right,rgba(139,233,255,.16),transparent 36%),rgba(0,0,0,.24)"
      : cardStyle.background,
  };

  const artFrameStyle: CSSProperties = {
    position: "relative",
    height: fitViewport ? "100%" : "clamp(390px,54vh,610px)",
    minHeight: fitViewport ? 0 : 390,
    marginTop: 8,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    borderRadius: 16,
    border: creature.shiny ? "2px solid rgba(139,233,255,.82)" : "1px solid rgba(245,201,128,.24)",
    background: creature.shiny
      ? "radial-gradient(circle at 50% 38%,rgba(139,233,255,.15),rgba(255,247,221,.05) 58%,rgba(0,0,0,.18))"
      : "radial-gradient(circle at 50% 38%,rgba(245,201,128,.12),rgba(255,247,221,.05) 58%,rgba(0,0,0,.18))",
  };

  return (
    <div className={dossier ? `${dossierStyles.dossier} ${ranchDossier ? dossierStyles.ranch : ""} ${showDossierPortrait ? dossierStyles.withPortrait : ""}` : undefined} style={shellStyle} data-overview-kit={ranchDossier || undefined} data-creature-section={activeTab} data-creature-detail-layout={dossier ? "dossier" : fitViewport ? "viewport" : "standard"}>
      {!dossier || showDossierPortrait ? <section className={dossier ? dossierStyles.portrait : undefined} style={portraitCardStyle}>
        <p style={kickerStyle}>{variant.rarity} Variant</p>
        <h2 style={{ margin: "3px 0", color: "#fff7dd", fontSize: "1.42rem", lineHeight: 1 }}>
          {creature.nickname}
        </h2>
        <p style={{ ...smallText, margin: 0 }}>
          {variant.name} {species.name} • Gen {creature.generation} • Lv {creature.level}
        </p>
        <div style={artFrameStyle} data-ui-fixed-size="true">
          {creature.shiny ? (
            <span
              style={{
                position: "absolute",
                top: 9,
                right: 9,
                zIndex: 2,
                padding: "5px 10px",
                border: "1px solid rgba(255,255,255,.6)",
                borderRadius: 999,
                background: "linear-gradient(90deg,rgba(139,233,255,.94),rgba(255,218,128,.94),rgba(255,155,229,.94))",
                color: "#271124",
                fontSize: ".7rem",
                fontWeight: 1000,
                letterSpacing: ".08em",
                boxShadow: "0 4px 14px rgba(0,0,0,.4)",
              }}
            >
              ✦ SHINY
            </span>
          ) : null}
          <img
            src={useGameplayArt
              ? getEquineGameplayProfileSprite(creature, getNylaGameplayProfileSprite(creature, variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE))
              : variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE}
            alt=""
            style={{
              display: "block",
              width: "94%",
              height: "94%",
              maxWidth: "94%",
              maxHeight: "94%",
              objectFit: "contain",
              objectPosition: "center bottom",
              filter: creature.shiny
                ? "drop-shadow(0 14px 20px rgba(139,233,255,.22)) drop-shadow(0 10px 18px rgba(0,0,0,.5))"
                : "drop-shadow(0 12px 18px rgba(0,0,0,.5))",
            }}
            onError={(event) => {
              event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
            }}
          />
        </div>
      </section> : null}

      <section
        style={{
          minWidth: 0,
          minHeight: 0,
          height: fitViewport ? "100%" : "auto",
          display: "grid",
          gridTemplateRows: tabs.length > 1 ? "auto minmax(0,1fr)" : "minmax(0,1fr)",
          gap: 9,
          overflow: "hidden",
        }}
      >
        {tabs.length > 1 ? <div>
          {ranchDossier&&<label className={dossierStyles.sectionPicker}>Creature section<select aria-label="Creature section" value={activeTab} onChange={event=>selectTab(event.target.value as typeof activeTab)}>{tabs.map(tab=><option key={tab} value={tab}>{getTabLabel(tab)}</option>)}</select></label>}
          <nav
            aria-label="Creature detail tabs"
            role="tablist"
            onKeyDown={(event) => {
              const index = tabs.indexOf(activeTab);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
                : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault();
              selectTab(tabs[next]);
              event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 7,
              padding: 7,
              border: "1px solid rgba(245,201,128,.26)",
              borderRadius: 14,
              background: "rgba(0,0,0,.2)",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => selectTab(tab)}
                role="tab"
                id={`${tabId}-${tab}`}
                aria-controls={`${tabId}-panel`}
                aria-selected={activeTab === tab}
                tabIndex={activeTab === tab ? 0 : -1}
                style={activeTab === tab
                  ? {
                      ...tabButtonStyle,
                      borderColor: creature.shiny ? "rgba(139,233,255,.9)" : "rgba(127,219,255,.88)",
                      background: creature.shiny
                        ? "linear-gradient(90deg,rgba(139,233,255,.18),rgba(255,155,229,.12))"
                        : "rgba(86,199,255,.16)",
                      color: "#fff7dd",
                    }
                  : tabButtonStyle}
              >
                {ranchDossier ? <img data-oa="tab-icon" src={`/images/ui/creature-overview-a-v2/painted-r4/${tab === "stats" ? "growth" : tab}.webp`} alt="" /> : dossier ? <span className={dossierStyles.icon} aria-hidden="true" style={{ maskImage: `url(/images/ui/ranch-dossier-v1/icons/${tab === "stats" ? "growth" : tab === "equipment" ? "inventory" : tab}.svg)` }} /> : null}
                {getTabLabel(tab)}
              </button>
            ))}
          </nav>
        </div> : null}

        <div key={`${activeTab}-${creature.creatureId}-${inventoryRequest}`} role="tabpanel" id={`${tabId}-panel`} aria-labelledby={tabs.length > 1 ? `${tabId}-${activeTab}` : undefined} aria-label={tabs.length === 1 ? getTabLabel(activeTab) : undefined} tabIndex={0} className={dossier ? dossierStyles.tabContent : undefined} style={{ minHeight: 0, overflow: "auto" }}>
          {activeTab === "overview" ? (
            <OverviewTab
              creature={creature}
              injury={injury}
              lineageLabel={creature.lineage?.label ?? "No Risk"}
              variantName={variant.name}
              speciesName={species.name}
              statusNote={statusNote}
              concise={dossier && !ranchDossier}
              ranchDossier={ranchDossier}
            />
          ) : null}
          {activeTab === "stats" ? (
            <StatsTab
              creature={creature}
              ranchDossier={ranchDossier}
              growth={growth}
              energyPreview={energyPreview}
              xpPercent={xpPercent}
              acceleration={acceleration}
              bestStatLabels={bestStatLabels}
            />
          ) : null}
          {activeTab === "work" ? <WorkSkillsTab creature={creature} ranchDossier={ranchDossier} /> : null}
          {activeTab === "talents" ? <TalentsTab creature={creature} ranchDossier={ranchDossier} onWorkSkills={() => selectTab('work')} /> : null}
          {activeTab === "lineage" ? <LineageTab creature={creature} ranchDossier={ranchDossier} /> : null}
          {activeTab === "inventory" ? <CreatureInventoryTab key={creature.creatureId} creature={creature} /> : null}
          {activeTab === "equipment" ? <CreatureEquipmentTab key={creature.creatureId} creature={creature} /> : null}
          {activeTab === "care" ? (
            <CareTab
              ranchDossier={ranchDossier}
              creature={creature}
              injury={injury}
              statusNote={statusNote}
              bestStatLabels={bestStatLabels}
              renameValue={renameValue}
              onRenameValueChange={onRenameValueChange}
              onRename={onRename}
              onToggleLock={onToggleLock}
              onFeed={onFeed}
              onRelease={showActions ? onRelease : undefined}
              onDonate={showActions ? onDonate : undefined}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function RoleTagChips({ creature, limit = 8 }: { creature: CreatureRecord; limit?: number }) {
  const tags = getCreatureRoleTags(creature).slice(0, limit);
  if (!tags.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" }}>
      {tags.map((tag) => (
        <span
          key={tag.id}
          title={tag.reasons.join(" ")}
          style={{
            padding: "5px 8px",
            border: `1px solid ${tag.primary ? "rgba(127,219,255,.65)" : "rgba(245,201,128,.28)"}`,
            borderRadius: 999,
            background: tag.primary ? "rgba(127,219,255,.14)" : "rgba(255,247,221,.06)",
            color: tag.primary ? "#d9f8ff" : "#f2dfbd",
            fontSize: ".67rem",
            fontWeight: 900,
          }}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}

function OverviewTab({
  creature,
  injury,
  lineageLabel,
  variantName,
  speciesName,
  statusNote,
  concise = false,
  ranchDossier = false,
}: {
  creature: CreatureRecord;
  injury: boolean;
  lineageLabel: string;
  variantName: string;
  speciesName: string;
  statusNote?: string;
  concise?: boolean;
  ranchDossier?: boolean;
}) {
  if (ranchDossier) return <CompactOverview {...{creature,injury,lineageLabel,variantName,speciesName,statusNote}}/>;
  if (concise) return <section style={cardStyle}><p style={kickerStyle}>At a glance</p><h3>{creature.originLabel}</h3><RoleTagChips creature={creature} /><p style={smallText}>Generation {creature.generation} · {creature.xp}/{creature.xpToNext} XP · {creature.hearts}/{creature.maxHearts} Hearts</p><p style={smallText}>Lineage: {lineageLabel}. {injury ? creature.injuryLabel ?? "Injured" : statusNote ?? "Available"}.</p></section>;
  return (
    <section style={{ ...cardStyle, minHeight: "100%" }}>
      <p style={kickerStyle}>Creature Profile</p>
      <h3 style={{ margin: "3px 0", color: "#fff7dd" }}>{creature.originLabel}</h3>
      <RoleTagChips creature={creature} />
      <div style={resourceGridStyle}>
        <MiniStat label="Energy" value={formatEnergy(creature.energy, creature.maxEnergy)} />
        <MiniStat label="Hearts" value={`${creature.hearts}/${creature.maxHearts}`} />
        <MiniStat label="Affection" value={`${creature.affection}/100`} />
        <MiniStat label="Level" value={String(creature.level)} />
        <MiniStat label="XP" value={`${creature.xp}/${creature.xpToNext}`} />
        <MiniStat label="Lineage" value={lineageLabel} />
        <MiniStat label="Family" value={speciesName} />
        <MiniStat label="Variant" value={variantName} />
        <MiniStat label="Generation" value={String(creature.generation)} />
        <MiniStat label="Shiny" value={creature.shiny ? "Yes ✦" : "No"} />
        <MiniStat label="Status" value={injury ? creature.injuryLabel ?? "Injured" : creature.isLocked ? "Protected" : "Available"} />
        <MiniStat label="Origin" value={creature.origin} />
      </div>
      {statusNote ? <StatusCallout text={statusNote} shiny={Boolean(creature.shiny)} /> : null}
      {creature.shiny ? <StatusCallout text="✦ Rare shiny coloration is active and tracked in this creature's breeding lineage." shiny /> : null}
    </section>
  );
}

function StatsTab({
  creature,
  ranchDossier = false,
  growth,
  energyPreview,
  xpPercent,
  acceleration,
  bestStatLabels,
}: {
  creature: CreatureRecord;
  ranchDossier?: boolean;
  growth: ReturnType<typeof getCreatureGrowthProjections>;
  energyPreview: ReturnType<typeof getProjectedEnergyGainNextLevel>;
  xpPercent: number;
  acceleration: number;
  bestStatLabels: string[];
}) {
  if (ranchDossier) return <CompactStats {...{creature,growth,energyPreview,acceleration,bestStatLabels}}/>;
  return (
    <section style={{ ...cardStyle, minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
        <div>
          <p style={kickerStyle}>Stats & Growth</p>
          <h3 style={{ margin: "3px 0", color: "#fff7dd" }}>Next Level</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ display: "block", color: "#7fdbff" }}>{ranchDossier ? `${creature.xp} / ${creature.xpToNext} XP` : `${xpPercent}% XP`}</strong>
          <span style={{ ...smallText, fontSize: ".69rem" }}>Young-growth ×{acceleration.toFixed(2)}</span>
        </div>
      </div>
      {progressTrack(<span style={barStyle(xpPercent)} />)}
      <p style={{ ...smallText, margin: "7px 0" }}>
        Energy {energyPreview.currentMaxEnergy} → {energyPreview.nextLevelMaxEnergy} ({energyPreview.delta >= 0 ? "+" : ""}{energyPreview.delta}).{" "}
        {bestStatLabels.length ? `Best: ${bestStatLabels.join(", ")}. ` : ""}
        Growth is fastest at low levels and gradually plateaus.
      </p>
      <div className={dossierStyles.statGrid} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 7 }}>
        {STAT_KEYS.map((statKey) => {
          const projection = growth[statKey];
          return (
            <article
              key={statKey}
              style={{
                padding: 8,
                border: `1px solid ${projection.willIncreaseNextLevel ? "rgba(126,229,168,.5)" : "rgba(245,201,128,.22)"}`,
                borderRadius: 10,
                background: projection.willIncreaseNextLevel ? "rgba(126,229,168,.08)" : "rgba(0,0,0,.18)",
              }}
            >
              <span className={dossierStyles.statLabel} style={kickerStyle}><span className={dossierStyles.statIcon} aria-hidden="true" style={{ maskImage: `url(/images/ui/${ranchDossier ? "ranch-dossier-v2" : "ranch-dossier-v1"}/icons/${SHARED_STAT_LABELS[statKey].toLowerCase()}.svg)` }} />{SHARED_STAT_LABELS[statKey]}</span>
              <strong style={{ display: "block", color: "#fff7dd" }}>
                {creature.stats[statKey]} <small style={{ color: "#f5c980" }}>{ranchDossier ? "" : "Grade "}{creature.statGrades[statKey]}</small>
              </strong>
              {progressTrack(
                <>
                  <span style={barStyle(projection.currentProgressPercent)} />
                  <i style={previewBarStyle(projection.currentProgressPercent, projection.nextLevelGainPercent)} />
                </>,
              )}
              <p style={{ ...smallText, margin: "4px 0 0", fontSize: ".7rem" }}>
                {projection.willIncreaseNextLevel
                  ? `Next level +${projection.statGainNextLevel} ${statKey}`
                  : `~${projection.levelsUntilIncrease} level${projection.levelsUntilIncrease === 1 ? "" : "s"} away`}
              </p>
            </article>
          );
        })}
      </div>
      {ranchDossier ? <div className={dossierStyles.nextLevel}>
        <span className={dossierStyles.growthIcon} aria-hidden="true" />
        <div><h4>Next Level Gain</h4>
          <strong>{STAT_KEYS.filter(key => growth[key].willIncreaseNextLevel).map(key => `${SHARED_STAT_LABELS[key]} +${growth[key].statGainNextLevel}`).join(" · ") || "Progress toward your next stat gains"}</strong>
          <p>Energy {energyPreview.delta >= 0 ? "+" : ""}{energyPreview.delta} ({energyPreview.currentMaxEnergy} → {energyPreview.nextLevelMaxEnergy})</p>
        </div>
      </div> : null}
    </section>
  );
}

function WorkSkillsTab({ creature, ranchDossier = false }: { creature: CreatureRecord; ranchDossier?: boolean }) {
  const domestic = getCreatureChoreSkillGroup(creature, "domestic");
  const ranch = getCreatureChoreSkillGroup(creature, "ranch");
  if (ranchDossier) return <CompactWork creature={creature}/>;
  return (
    <section style={{ ...cardStyle, minHeight: "100%" }}>
      <p style={kickerStyle}>Role Identity & Proficiency</p>
      <h3 style={{ margin: "3px 0", color: "#fff7dd" }}>Work Skills</h3>
      <p style={{ ...smallText, margin: "4px 0 0" }}>
        Species determines the starting baseline, but completed location work trains harvesting, production, or hauling. Every five levels above level 1 adds one resource per action.
      </p>
      <RoleTagChips creature={creature} limit={12} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
        <CreatureSkillRadar
          title="Domestic Skills"
          subtitle="Cooking, cleaning, crafting, caregiving, and hospitality. These skills will support household work, production recipes, care systems, and town employment."
          skills={domestic}
        />
        <CreatureSkillRadar
          title="Farm Skills"
          subtitle="Harvesting, production, and hauling improve through instant work. Farm protection comes from fortifications and Guard Dog; security and ranch care skills are reserved for future systems."
          skills={ranch}
        />
      </div>
    </section>
  );
}

function TalentsTab({ creature, ranchDossier = false, onWorkSkills }: { creature: CreatureRecord; ranchDossier?: boolean; onWorkSkills?: () => void }) {
  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil(creature.abilities.length / pageSize));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [creature.creatureId, creature.abilities.length]);

  if (ranchDossier) return <CompactTalents creature={creature} onWorkSkills={onWorkSkills}/>;
  const visibleTalents = creature.abilities.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <section className={dossierStyles.talentPage} style={{ ...cardStyle, minHeight: "100%", display: "grid", gridTemplateRows: "auto auto minmax(0,1fr) auto" }}>
      <p style={kickerStyle}>Talents</p>
      <h3 style={{ margin: "3px 0 9px", color: "#fff7dd" }}>Inherited & Learned Talents</h3>
      {creature.abilities.length ? (
        <div style={{ display: "grid", alignContent: "start", gap: 8 }}>
          {visibleTalents.map((ability) => (
            <article className={dossierStyles.talentCard} key={ability.id} data-ui-text-box="auto" style={{ border: "1px solid rgba(127,219,255,.24)", borderRadius: 10, padding: 10, background: "rgba(0,0,0,.18)" }}>
              <strong className={dossierStyles.talentName} style={{ color: "#fff7dd" }}><span className={dossierStyles.talentSeal} aria-hidden="true">✦</span>{ability.name}</strong>
              <span style={{ display: "block", color: "#7fdbff", fontSize: ".74rem", fontWeight: 900 }}>
                Grade {ability.grade} • {ability.source}{ability.category ? ` • ${ability.category}` : ""}
              </span>
              {ability.tags?.length ? <span style={{ display: "block", color: "#f5c980", fontSize: ".66rem", marginTop: 3 }}>{ability.tags.join(" • ")}</span> : null}
              <p style={{ ...smallText, margin: "5px 0 0" }}>{ability.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <p style={{ ...smallText, margin: 0 }}>No talent inherited. Hatch talents usually come from parents; new talent mutations remain rare.</p>
      )}
      {pageCount > 1 ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 9 }}>
          <button type="button" style={buttonStyle} disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button>
          <span style={{ ...smallText, color: "#7fdbff" }}>Page {page + 1} of {pageCount}</span>
          <button type="button" style={buttonStyle} disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button>
        </div>
      ) : <span />}
    </section>
  );
}

function LineageTab({ creature, ranchDossier = false }: { creature: CreatureRecord; ranchDossier?: boolean }) {
  const lineage = creature.lineage;
  if (ranchDossier) return <CompactLineage creature={creature}/>;
  return (
    <section style={{ ...cardStyle, minHeight: "100%" }}>
      <p style={kickerStyle}>Lineage & Genetics</p>
      <h3 style={{ margin: "3px 0", color: "#fff7dd" }}>{lineage?.label ?? "No Risk"}</h3>
      <p style={{ ...smallText, margin: 0 }}>
        {lineage?.parentNames?.length ? `Parents: ${lineage.parentNames.join(" × ")}` : "Parents not tracked."}
      </p>
      <p style={{ ...smallText, margin: "8px 0 0" }}>
        {lineage?.notes?.length ? lineage.notes.join(" ") : "No close lineage risk detected or this creature predates lineage tracking."}
      </p>
      {lineage?.traits?.length ? (
        <div style={{ ...resourceGridStyle, marginTop: 10 }}>
          {lineage.traits.map((trait) => <MiniStat key={trait} label="Trait Marker" value={trait} />)}
        </div>
      ) : null}
      {creature.notes ? <p data-ui-text-box="auto" style={{ ...smallText, margin: "10px 0 0", padding: 9, border: "1px solid rgba(245,201,128,.2)", borderRadius: 10, background: "rgba(0,0,0,.16)" }}>{creature.notes}</p> : null}
    </section>
  );
}

function CareTab({
  ranchDossier = false,
  creature,
  injury,
  statusNote,
  bestStatLabels,
  renameValue,
  onRenameValueChange,
  onRename,
  onToggleLock,
  onFeed,
  onRelease,
  onDonate,
}: {
  ranchDossier?: boolean;
  creature: CreatureRecord;
  injury: boolean;
  statusNote?: string;
  bestStatLabels: string[];
  renameValue?: string;
  onRenameValueChange?: (value: string) => void;
  onRename?: () => void;
  onToggleLock?: () => void;
  onFeed?: () => void;
  onRelease?: () => void;
  onDonate?: () => void;
}) {
  if (ranchDossier) return <CompactCare {...{creature,injury,statusNote,bestStatLabels,renameValue,onRenameValueChange,onRename,onToggleLock,onFeed,onRelease,onDonate}}/>;
  return (
    <section className={dossierStyles.carePage} style={{ ...cardStyle, minHeight: "100%", display: "grid", alignContent: "start", gap: 9 }}>
      <div>
        <p style={kickerStyle}>Care & Management</p>
        <h3 style={{ margin: "3px 0", color: "#fff7dd" }}>{creature.nickname}</h3>
      </div>
      <div className={dossierStyles.factGrid} style={resourceGridStyle}>
        <MiniStat label="Origin" value={creature.originLabel} />
        <MiniStat label="Protection" value={creature.isLocked ? "Locked" : "Unlocked"} />
        <MiniStat label="Health" value={injury ? creature.injuryLabel ?? "Injured" : "Healthy"} />
        <MiniStat label="Best Stats" value={bestStatLabels.length ? bestStatLabels.join(", ") : "Balanced"} />
      </div>
      {statusNote ? <StatusCallout text={statusNote} shiny={Boolean(creature.shiny)} /> : null}
      {onFeed ? <button type="button" style={buttonStyle} onClick={onFeed}>Feed Creature</button> : null}
      {renameValue !== undefined && onRenameValueChange && onRename ? (
        <div className={dossierStyles.renameGroup}><label htmlFor={`rename-${creature.creatureId}`}>Creature name</label><div className={dossierStyles.renameRow}>
          <input
            id={`rename-${creature.creatureId}`}
            aria-label="Creature name"
            value={renameValue}
            onChange={(event) => onRenameValueChange(event.target.value)}
            maxLength={24}
            style={{ minHeight: 38, borderRadius: 10, border: "1px solid rgba(245,201,128,.34)", background: "rgba(0,0,0,.28)", color: "#fff7dd", padding: "0 10px", fontWeight: 850 }}
          />
          <button type="button" style={buttonStyle} onClick={onRename}>Save Name</button>
        </div></div>
      ) : null}
      {onToggleLock ? <button type="button" style={buttonStyle} onClick={onToggleLock}>{creature.isLocked ? "Unlock Creature" : "Lock / Protect Creature"}</button> : null}
      {onRelease || onDonate ? (
        <div className={dossierStyles.removalGroup}><p>Transfer or release</p><small>Review the confirmation before removing a creature from your ranch.</small><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
          {onRelease ? <button type="button" style={buttonStyle} onClick={onRelease}>Release</button> : null}
          {onDonate ? <button type="button" style={buttonStyle} onClick={onDonate}>Donate</button> : null}
        </div></div>
      ) : null}
    </section>
  );
}

function StatusCallout({ text, shiny = false }: { text: string; shiny?: boolean }) {
  return (
    <p
      data-ui-text-box="auto"
      style={{
        ...smallText,
        margin: "9px 0 0",
        padding: 9,
        border: `1px solid ${shiny ? "rgba(139,233,255,.46)" : "rgba(245,201,128,.28)"}`,
        borderRadius: 10,
        background: shiny ? "linear-gradient(90deg,rgba(139,233,255,.1),rgba(255,155,229,.08))" : "rgba(245,201,128,.07)",
        color: shiny ? "#d9f8ff" : "#f2dfbd",
      }}
    >
      {text}
    </p>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div data-ui-text-box="auto" style={{ padding: 8, border: "1px solid rgba(245,201,128,.22)", borderRadius: 10, background: "rgba(0,0,0,.18)", minWidth: 0 }}>
      <span style={kickerStyle}>{label}</span>
      <strong style={{ display: "block", color: "#fff7dd", marginTop: 3, overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  );
}
