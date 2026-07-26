"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { STAT_KEYS } from "@/data/creatures";
import { formatEnergy } from "@/lib/formatters";
import type { BreedingParticipant } from "@/types/breeding";
import type { CreatureStatKey } from "@/types/creature";
import type { GameSave } from "@/types/save";

const STAT_LABELS: Record<CreatureStatKey, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
};

type PlayerTab = "overview" | "stats" | "progression" | "breeding";

type SharedPlayerDetailProps = {
  save: GameSave;
  participant?: BreedingParticipant | null;
};

const shellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(260px,.78fr) minmax(360px,1.22fr)",
  gap: 14,
  alignItems: "start",
};

const cardStyle: CSSProperties = {
  padding: 14,
  border: "1px solid rgba(245,201,128,.3)",
  borderRadius: 16,
  background: "rgba(0,0,0,.24)",
  color: "#fff7dd",
};

const kickerStyle: CSSProperties = {
  margin: 0,
  color: "#f5c980",
  fontSize: ".66rem",
  fontWeight: 950,
  letterSpacing: ".12em",
  textTransform: "uppercase",
};

const smallText: CSSProperties = {
  margin: 0,
  color: "#f2dfbd",
  fontSize: ".82rem",
  fontWeight: 780,
  lineHeight: 1.4,
};

const tabStyle: CSSProperties = {
  minHeight: 36,
  padding: "7px 12px",
  border: "1px solid rgba(245,201,128,.34)",
  borderRadius: 999,
  background: "rgba(255,247,221,.07)",
  color: "#f2dfbd",
  fontWeight: 950,
  cursor: "pointer",
};

function percent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function statusText(participant?: BreedingParticipant | null): string {
  if (!participant) return "Available";
  if (!participant.canBreed) return participant.unavailableReason ?? "Unavailable";
  return "Ready";
}

export function SharedPlayerDetail({
  save,
  participant,
}: SharedPlayerDetailProps) {
  const [activeTab, setActiveTab] = useState<PlayerTab>("overview");
  const player = save.player;
  const xpPercent = percent(player.breederXp, player.breederXpToNext);
  const energy = participant?.energy ?? save.currencies.energy;
  const maxEnergy = participant?.maxEnergy ?? save.currencies.maxEnergy;
  const portrait =
    participant?.profilePath ||
    participant?.portraitPath ||
    "/images/ui/icons/icon_breeder_level.png";
  const strongestStats = useMemo(() => {
    const highest = Math.max(...STAT_KEYS.map((key) => player.stats[key]));
    return STAT_KEYS.filter((key) => player.stats[key] === highest).map(
      (key) => STAT_LABELS[key],
    );
  }, [player.stats]);

  const tabs: Array<{ id: PlayerTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "stats", label: "Stats" },
    { id: "progression", label: "Progression" },
    { id: "breeding", label: "Breeding Role" },
  ];

  return (
    <div style={shellStyle}>
      <section
        style={{
          ...cardStyle,
          display: "grid",
          gap: 10,
          alignContent: "start",
          background:
            "radial-gradient(circle at 50% 30%, rgba(127,219,255,.13), transparent 48%), rgba(0,0,0,.24)",
        }}
      >
        <div>
          <p style={kickerStyle}>Breeder Profile</p>
          <h2 style={{ margin: "4px 0", color: "#fff", fontSize: "1.8rem" }}>
            {player.name}
          </h2>
          <p style={smallText}>{player.ranchName}</p>
        </div>
        <div
          style={{
            minHeight: 360,
            height: "clamp(360px,52vh,560px)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            border: "2px solid rgba(127,219,255,.34)",
            borderRadius: 16,
            background: "rgba(255,247,221,.06)",
          }}
        >
          <img
            src={portrait}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 18,
              filter: "drop-shadow(0 16px 20px rgba(0,0,0,.48))",
            }}
          />
        </div>
      </section>

      <section style={{ display: "grid", gap: 10 }}>
        <nav
          aria-label="Breeder detail tabs"
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
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={
                activeTab === tab.id
                  ? {
                      ...tabStyle,
                      borderColor: "rgba(127,219,255,.88)",
                      background: "rgba(86,199,255,.16)",
                      color: "#fff7dd",
                    }
                  : tabStyle
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "overview" ? (
          <section style={cardStyle}>
            <p style={kickerStyle}>At a Glance</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                gap: 8,
                marginTop: 8,
              }}
            >
              <MiniStat label="Breeder Rank" value={String(player.breederRank)} />
              <MiniStat label="Ranch Rank" value={String(player.ranchRank)} />
              <MiniStat label="Energy" value={formatEnergy(energy, maxEnergy)} />
              <MiniStat label="Hearts" value={`${player.hearts}/${player.maxHearts}`} />
              <MiniStat
                label="Breeder XP"
                value={`${player.breederXp}/${player.breederXpToNext}`}
              />
              <MiniStat label="Status" value={statusText(participant)} />
              <MiniStat label="Strongest" value={strongestStats.join(", ")} />
              <MiniStat label="Talents" value="Not applicable" />
            </div>
          </section>
        ) : null}

        {activeTab === "stats" ? (
          <section style={cardStyle}>
            <p style={kickerStyle}>Breeder Stats</p>
            <h3 style={{ margin: "4px 0 10px", color: "#fff" }}>
              Raw Attributes
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                gap: 8,
              }}
            >
              {STAT_KEYS.map((key) => (
                <MiniStat
                  key={key}
                  label={STAT_LABELS[key]}
                  value={`${player.stats[key]} • Grade ${player.statGrades[key]}`}
                />
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "progression" ? (
          <section style={cardStyle}>
            <p style={kickerStyle}>Progression</p>
            <h3 style={{ margin: "4px 0", color: "#fff" }}>Next Breeder Rank</h3>
            <div
              style={{
                height: 10,
                overflow: "hidden",
                border: "1px solid rgba(127,219,255,.34)",
                borderRadius: 999,
                background: "rgba(0,0,0,.34)",
              }}
            >
              <span
                style={{
                  display: "block",
                  width: `${xpPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#7fdbff,#f5c980)",
                }}
              />
            </div>
            <p style={{ ...smallText, marginTop: 9 }}>
              Player characters cannot inherit creature talents, so breeder-rank gains are intentionally stronger raw-stat gains.
            </p>
            <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
              <ProgressionRule
                title="Ranks 2–10"
                text="Gain +2 to a primary stat and +1 to a secondary stat every rank."
              />
              <ProgressionRule
                title="Ranks 11–25"
                text="Gain +1 to a primary stat every rank and +1 to a secondary stat every third rank."
              />
              <ProgressionRule
                title="Ranks 26+"
                text="Gain +1 to a primary stat every rank and a secondary bonus every fifth rank."
              />
            </div>
          </section>
        ) : null}

        {activeTab === "breeding" ? (
          <section style={cardStyle}>
            <p style={kickerStyle}>Breeding Role</p>
            <h3 style={{ margin: "4px 0", color: "#fff" }}>Breeder Participation</h3>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <ProgressionRule
                title="Giver"
                text="The breeder can participate normally and contributes stats, affection stability, XP, and pair familiarity."
              />
              <ProgressionRule
                title="Receiver"
                text="The breeder may complete a session for progression, but player characters cannot become pregnant."
              />
              <ProgressionRule
                title="Offspring Influence"
                text="Breeder stats can influence offspring values when the player participates, but the breeder supplies no inheritable creature talent."
              />
              <ProgressionRule
                title="Current Status"
                text={statusText(participant)}
              />
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 9,
        border: "1px solid rgba(245,201,128,.24)",
        borderRadius: 10,
        background: "rgba(0,0,0,.2)",
      }}
    >
      <span style={kickerStyle}>{label}</span>
      <strong
        style={{
          display: "block",
          marginTop: 3,
          color: "#fff7dd",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ProgressionRule({ title, text }: { title: string; text: string }) {
  return (
    <article
      style={{
        padding: 10,
        border: "1px solid rgba(127,219,255,.22)",
        borderRadius: 10,
        background: "rgba(0,0,0,.18)",
      }}
    >
      <strong style={{ display: "block", color: "#7fdbff" }}>{title}</strong>
      <p style={{ ...smallText, marginTop: 4 }}>{text}</p>
    </article>
  );
}
