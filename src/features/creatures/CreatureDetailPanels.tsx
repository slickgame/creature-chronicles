"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useState,
} from "react";
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
import { formatEnergy } from "@/lib/formatters";
import type {
  CreatureRecord,
  CreatureStatKey,
} from "@/types/creature";

export const SHARED_STAT_LABELS: Record<CreatureStatKey, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
};

type CreatureDetailMode = "full" | "compact" | "growth" | "lineage";
type CreatureDetailTab =
  | "overview"
  | "stats"
  | "talents"
  | "lineage"
  | "care";

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

const shellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(300px, .92fr) minmax(360px, 1.28fr)",
  gap: 14,
  alignItems: "start",
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

const statGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 8,
};

const resourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: 8,
};

const buttonStyle: CSSProperties = {
  minHeight: 34,
  border: "2px solid rgba(45,25,13,.92)",
  borderRadius: 10,
  background: "linear-gradient(#fff4cf,#d6a25b)",
  color: "#1f1108",
  fontWeight: 950,
  cursor: "pointer",
};

const tabButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: "7px 12px",
  border: "1px solid rgba(245,201,128,.34)",
  borderRadius: 999,
  background: "rgba(255,247,221,.07)",
  color: "#f2dfbd",
  fontSize: ".76rem",
  fontWeight: 950,
  cursor: "pointer",
};

function isInjured(creature: CreatureRecord, dayNumber?: number): boolean {
  return (
    typeof dayNumber === "number" &&
    typeof creature.injuredUntilDayNumber === "number" &&
    creature.injuredUntilDayNumber >= dayNumber
  );
}

function barStyle(percent: number): CSSProperties {
  return {
    display: "block",
    width: `${Math.max(0, Math.min(100, percent))}%`,
    height: "100%",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(127,219,255,.88), rgba(245,201,128,.9))",
  };
}

function previewBarStyle(
  currentPercent: number,
  nextGainPercent: number,
): CSSProperties {
  return {
    position: "absolute",
    left: `${Math.max(0, Math.min(100, currentPercent))}%`,
    width: `${Math.max(0, Math.min(100 - currentPercent, nextGainPercent))}%`,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    background: "rgba(126,229,168,.65)",
  };
}

function percent(value: number, max: number): number {
  return max <= 0
    ? 0
    : Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function progressTrack(children: ReactNode) {
  return (
    <div
      style={{
        position: "relative",
        height: 10,
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

function getAvailableTabs(
  mode: CreatureDetailMode,
  hasCareActions: boolean,
): CreatureDetailTab[] {
  if (mode === "growth") return ["stats"];
  if (mode === "lineage") return ["lineage"];
  if (mode === "compact") return ["overview", "talents"];
  return [
    "overview",
    "stats",
    "talents",
    "lineage",
    ...(hasCareActions ? (["care"] as CreatureDetailTab[]) : []),
  ];
}

function getTabLabel(tab: CreatureDetailTab): string {
  if (tab === "stats") return "Stats & Growth";
  if (tab === "talents") return "Talents";
  if (tab === "lineage") return "Lineage";
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
  onRelease,
  onDonate,
  showActions = true,
}: SharedCreatureDetailProps) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  const injury = isInjured(creature, dayNumber);
  const lineage = creature.lineage;
  const growth = getCreatureGrowthProjections(creature);
  const energyPreview = getProjectedEnergyGainNextLevel(creature);
  const xpPercent = percent(creature.xp, creature.xpToNext);
  const acceleration = getLevelGrowthAcceleration(creature.level);
  const hasCareActions = Boolean(
    renameValue !== undefined ||
      onToggleLock ||
      (showActions && (onRelease || onDonate)),
  );
  const tabs = getAvailableTabs(mode, hasCareActions);
  const [activeTab, setActiveTab] = useState<CreatureDetailTab>(tabs[0]);

  useEffect(() => {
    setActiveTab(getAvailableTabs(mode, hasCareActions)[0]);
  }, [creature.creatureId, mode, hasCareActions]);

  const portraitCardStyle: CSSProperties = creature.shiny
    ? {
        ...cardStyle,
        position: "relative",
        border: "2px solid rgba(139,233,255,.95)",
        boxShadow:
          "0 0 0 2px rgba(255,218,128,.34), 0 0 26px rgba(139,233,255,.35), 0 0 42px rgba(255,155,229,.18), inset 0 1px 0 rgba(255,255,255,.12)",
        background:
          "radial-gradient(circle at top right, rgba(139,233,255,.16), transparent 36%), rgba(0,0,0,.24)",
      }
    : { ...cardStyle, position: "relative" };

  return (
    <div style={shellStyle}>
      <section style={portraitCardStyle}>
        <p style={kickerStyle}>{variant.rarity} Variant</p>
        <h2
          style={{
            margin: "3px 0",
            color: "#fff",
            fontSize: "1.5rem",
            lineHeight: 1,
          }}
        >
          {creature.nickname}
        </h2>
        <p style={{ ...smallText, margin: 0 }}>
          {variant.name} {species.name} • Gen {creature.generation} • Lv {creature.level}
        </p>

        <div
          style={{
            position: "relative",
            height: "clamp(420px, 58vh, 640px)",
            marginTop: 10,
            display: "grid",
            placeItems: "center",
            borderRadius: 16,
            overflow: "hidden",
            background: creature.shiny
              ? "radial-gradient(circle at 50% 38%, rgba(139,233,255,.15), rgba(255,247,221,.05) 58%, rgba(0,0,0,.18))"
              : "radial-gradient(circle at 50% 38%, rgba(245,201,128,.12), rgba(255,247,221,.05) 58%, rgba(0,0,0,.18))",
            border: creature.shiny
              ? "2px solid rgba(139,233,255,.82)"
              : "1px solid rgba(245,201,128,.24)",
          }}
        >
          {creature.shiny ? (
            <span
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                zIndex: 2,
                padding: "5px 10px",
                border: "1px solid rgba(255,255,255,.6)",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(139,233,255,.94), rgba(255,218,128,.94), rgba(255,155,229,.94))",
                color: "#271124",
                fontSize: ".72rem",
                fontWeight: 1000,
                letterSpacing: ".08em",
                boxShadow: "0 4px 14px rgba(0,0,0,.4)",
              }}
            >
              ✦ SHINY
            </span>
          ) : null}
          <img
            src={
              variant.profilePath ||
              variant.portraitPath ||
              CREATURE_PLACEHOLDER_IMAGE
            }
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              filter: creature.shiny
                ? "drop-shadow(0 16px 20px rgba(139,233,255,.22)) drop-shadow(0 10px 20px rgba(0,0,0,.5))"
                : "drop-shadow(0 14px 18px rgba(0,0,0,.5))",
            }}
            onError={(event) => {
              event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
            }}
          />
        </div>
      </section>

      <section style={{ display: "grid", gap: 10, minWidth: 0 }}>
        {tabs.length > 1 ? (
          <nav
            aria-label="Creature detail tabs"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 7,
              padding: 8,
              border: "1px solid rgba(245,201,128,.26)",
              borderRadius: 14,
              background: "rgba(0,0,0,.2)",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={
                  activeTab === tab
                    ? {
                        ...tabButtonStyle,
                        borderColor: creature.shiny
                          ? "rgba(139,233,255,.9)"
                          : "rgba(127,219,255,.88)",
                        background: creature.shiny
                          ? "linear-gradient(90deg, rgba(139,233,255,.18), rgba(255,155,229,.12))"
                          : "rgba(86,199,255,.16)",
                        color: "#fff7dd",
                      }
                    : tabButtonStyle
                }
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </nav>
        ) : null}

        {activeTab === "overview" ? (
          <OverviewTab
            creature={creature}
            injury={injury}
            lineageLabel={lineage?.label ?? "No Risk"}
            variantName={variant.name}
            speciesName={species.name}
          />
        ) : null}

        {activeTab === "stats" ? (
          <StatsTab
            creature={creature}
            growth={growth}
            energyPreview={energyPreview}
            xpPercent={xpPercent}
            acceleration={acceleration}
          />
        ) : null}

        {activeTab === "talents" ? (
          <TalentsTab creature={creature} />
        ) : null}

        {activeTab === "lineage" ? (
          <LineageTab creature={creature} />
        ) : null}

        {activeTab === "care" ? (
          <CareTab
            creature={creature}
            renameValue={renameValue}
            onRenameValueChange={onRenameValueChange}
            onRename={onRename}
            onToggleLock={onToggleLock}
            onRelease={showActions ? onRelease : undefined}
            onDonate={showActions ? onDonate : undefined}
          />
        ) : null}
      </section>
    </div>
  );
}

function OverviewTab({
  creature,
  injury,
  lineageLabel,
  variantName,
  speciesName,
}: {
  creature: CreatureRecord;
  injury: boolean;
  lineageLabel: string;
  variantName: string;
  speciesName: string;
}) {
  return (
    <section style={cardStyle}>
      <div>
        <p style={kickerStyle}>Creature Profile</p>
        <h3 style={{ margin: "3px 0", color: "#fff" }}>
          {creature.originLabel}
        </h3>
      </div>
      <div style={resourceGridStyle}>
        <MiniStat
          label="Energy"
          value={formatEnergy(creature.energy, creature.maxEnergy)}
        />
        <MiniStat
          label="Hearts"
          value={`${creature.hearts}/${creature.maxHearts}`}
        />
        <MiniStat label="Affection" value={`${creature.affection}/100`} />
        <MiniStat label="Level" value={String(creature.level)} />
        <MiniStat label="XP" value={`${creature.xp}/${creature.xpToNext}`} />
        <MiniStat label="Lineage" value={lineageLabel} />
        <MiniStat label="Family" value={speciesName} />
        <MiniStat label="Variant" value={variantName} />
        <MiniStat label="Generation" value={String(creature.generation)} />
        <MiniStat label="Shiny" value={creature.shiny ? "Yes ✦" : "No"} />
        <MiniStat
          label="Status"
          value={
            injury
              ? creature.injuryLabel ?? "Injured"
              : creature.isLocked
                ? "Protected"
                : "Available"
          }
        />
        <MiniStat label="Origin" value={creature.origin} />
      </div>
      {creature.shiny ? (
        <p
          style={{
            ...smallText,
            margin: "10px 0 0",
            padding: 9,
            border: "1px solid rgba(139,233,255,.46)",
            borderRadius: 10,
            background:
              "linear-gradient(90deg, rgba(139,233,255,.1), rgba(255,155,229,.08))",
            color: "#d9f8ff",
          }}
        >
          ✦ Rare shiny coloration is active on this creature and is tracked in its breeding lineage.
        </p>
      ) : null}
    </section>
  );
}

function StatsTab({
  creature,
  growth,
  energyPreview,
  xpPercent,
  acceleration,
}: {
  creature: CreatureRecord;
  growth: ReturnType<typeof getCreatureGrowthProjections>;
  energyPreview: ReturnType<typeof getProjectedEnergyGainNextLevel>;
  xpPercent: number;
  acceleration: number;
}) {
  return (
    <section style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "start",
        }}
      >
        <div>
          <p style={kickerStyle}>Stats & Growth</p>
          <h3 style={{ margin: "3px 0", color: "#fff" }}>Next Level</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ display: "block", color: "#7fdbff" }}>
            {xpPercent}% XP
          </strong>
          <span style={{ ...smallText, fontSize: ".7rem" }}>
            Young-growth rate ×{acceleration.toFixed(2)}
          </span>
        </div>
      </div>
      {progressTrack(<span style={barStyle(xpPercent)} />)}
      <p style={{ ...smallText, margin: "8px 0" }}>
        Energy preview: {energyPreview.currentMaxEnergy} → {energyPreview.nextLevelMaxEnergy}{" "}
        {energyPreview.delta >= 0
          ? `(+${energyPreview.delta})`
          : `(${energyPreview.delta})`}.
        Low-level creatures gain stats quickly, then gradually settle toward their adult growth rate.
      </p>
      <div style={statGridStyle}>
        {STAT_KEYS.map((statKey) => {
          const projection = growth[statKey];
          return (
            <article
              key={statKey}
              style={{
                padding: 8,
                border: `1px solid ${
                  projection.willIncreaseNextLevel
                    ? "rgba(126,229,168,.5)"
                    : "rgba(245,201,128,.22)"
                }`,
                borderRadius: 10,
                background: projection.willIncreaseNextLevel
                  ? "rgba(126,229,168,.08)"
                  : "rgba(0,0,0,.18)",
              }}
            >
              <span style={kickerStyle}>{SHARED_STAT_LABELS[statKey]}</span>
              <strong style={{ display: "block", color: "#fff7dd" }}>
                {creature.stats[statKey]}{" "}
                <small style={{ color: "#f5c980" }}>
                  Grade {creature.statGrades[statKey]}
                </small>
              </strong>
              {progressTrack(
                <>
                  <span style={barStyle(projection.currentProgressPercent)} />
                  <i
                    style={previewBarStyle(
                      projection.currentProgressPercent,
                      projection.nextLevelGainPercent,
                    )}
                  />
                </>,
              )}
              <p style={{ ...smallText, margin: "5px 0 0" }}>
                {projection.willIncreaseNextLevel
                  ? `Next level +${projection.statGainNextLevel} ${statKey}`
                  : `~${projection.levelsUntilIncrease} level${
                      projection.levelsUntilIncrease === 1 ? "" : "s"
                    } away`}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TalentsTab({ creature }: { creature: CreatureRecord }) {
  return (
    <section style={cardStyle}>
      <p style={kickerStyle}>Talents</p>
      <h3 style={{ margin: "3px 0 10px", color: "#fff" }}>
        Inherited & Learned Abilities
      </h3>
      {creature.abilities.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {creature.abilities.map((ability) => (
            <article
              key={ability.id}
              style={{
                border: "1px solid rgba(127,219,255,.24)",
                borderRadius: 10,
                padding: 10,
                background: "rgba(0,0,0,.18)",
              }}
            >
              <strong style={{ color: "#fff7dd" }}>{ability.name}</strong>
              <span
                style={{
                  display: "block",
                  color: "#7fdbff",
                  fontSize: ".74rem",
                  fontWeight: 900,
                }}
              >
                Grade {ability.grade} • {ability.source}
              </span>
              <p style={{ ...smallText, margin: "5px 0 0" }}>
                {ability.description}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p style={{ ...smallText, margin: 0 }}>
          No talent inherited. Hatch talents usually come from parents; new ability mutations remain rare.
        </p>
      )}
    </section>
  );
}

function LineageTab({ creature }: { creature: CreatureRecord }) {
  const lineage = creature.lineage;
  return (
    <section style={cardStyle}>
      <p style={kickerStyle}>Lineage & Genetics</p>
      <h3 style={{ margin: "3px 0", color: "#fff" }}>
        {lineage?.label ?? "No Risk"}
      </h3>
      <p style={{ ...smallText, margin: 0 }}>
        {lineage?.parentNames?.length
          ? `Parents: ${lineage.parentNames.join(" × ")}`
          : "Parents not tracked."}
      </p>
      <p style={{ ...smallText, margin: "8px 0 0" }}>
        {lineage?.notes?.length
          ? lineage.notes.join(" ")
          : "No close lineage risk detected or this creature predates lineage tracking."}
      </p>
      {lineage?.traits?.length ? (
        <div style={{ ...resourceGridStyle, marginTop: 10 }}>
          {lineage.traits.map((trait) => (
            <MiniStat key={trait} label="Trait Marker" value={trait} />
          ))}
        </div>
      ) : null}
      {creature.notes ? (
        <p
          style={{
            ...smallText,
            margin: "10px 0 0",
            padding: 9,
            border: "1px solid rgba(245,201,128,.2)",
            borderRadius: 10,
            background: "rgba(0,0,0,.16)",
          }}
        >
          {creature.notes}
        </p>
      ) : null}
    </section>
  );
}

function CareTab({
  creature,
  renameValue,
  onRenameValueChange,
  onRename,
  onToggleLock,
  onRelease,
  onDonate,
}: {
  creature: CreatureRecord;
  renameValue?: string;
  onRenameValueChange?: (value: string) => void;
  onRename?: () => void;
  onToggleLock?: () => void;
  onRelease?: () => void;
  onDonate?: () => void;
}) {
  return (
    <section style={{ ...cardStyle, display: "grid", gap: 10 }}>
      <div>
        <p style={kickerStyle}>Care & Management</p>
        <h3 style={{ margin: "3px 0", color: "#fff" }}>
          {creature.nickname}
        </h3>
      </div>

      {renameValue !== undefined && onRenameValueChange && onRename ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
          }}
        >
          <input
            value={renameValue}
            onChange={(event) => onRenameValueChange(event.target.value)}
            maxLength={24}
            style={{
              minHeight: 38,
              borderRadius: 10,
              border: "1px solid rgba(245,201,128,.34)",
              background: "rgba(0,0,0,.28)",
              color: "#fff7dd",
              padding: "0 10px",
              fontWeight: 850,
            }}
          />
          <button type="button" style={buttonStyle} onClick={onRename}>
            Save Name
          </button>
        </div>
      ) : null}

      {onToggleLock ? (
        <button type="button" style={buttonStyle} onClick={onToggleLock}>
          {creature.isLocked ? "Unlock Creature" : "Lock / Protect Creature"}
        </button>
      ) : null}

      {onRelease || onDonate ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 8,
          }}
        >
          {onRelease ? (
            <button type="button" style={buttonStyle} onClick={onRelease}>
              Release
            </button>
          ) : null}
          {onDonate ? (
            <button type="button" style={buttonStyle} onClick={onDonate}>
              Donate
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 8,
        border: "1px solid rgba(245,201,128,.22)",
        borderRadius: 10,
        background: "rgba(0,0,0,.18)",
        minWidth: 0,
      }}
    >
      <span style={kickerStyle}>{label}</span>
      <strong
        style={{
          display: "block",
          color: "#fff7dd",
          marginTop: 3,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
