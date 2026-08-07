"use client";

import { useEffect, useState } from "react";
import { getMorningLegacyAnnouncement } from "@/data/creatureLegacyNotifications";
import { getMorningCreatureStory } from "@/data/creatureStoryNotifications";
import type { GameSave } from "@/types/save";

export function MorningCreatureStoryNotice({ save }: { save: GameSave }) {
  const story = getMorningCreatureStory(save);
  const legacy = getMorningLegacyAnnouncement(save);
  const [dismissedStoryId, setDismissedStoryId] = useState<string | null>(null);
  const [dismissedLegacyId, setDismissedLegacyId] = useState<string | null>(null);

  useEffect(() => {
    if (dismissedStoryId && story?.entry.entryId !== dismissedStoryId) setDismissedStoryId(null);
  }, [dismissedStoryId, story?.entry.entryId]);

  useEffect(() => {
    if (dismissedLegacyId && legacy?.entryId !== dismissedLegacyId) setDismissedLegacyId(null);
  }, [dismissedLegacyId, legacy?.entryId]);

  if (save.ranchDay?.phase !== "morning") return null;
  const showLegacy = Boolean(legacy && dismissedLegacyId !== legacy.entryId);
  const showStory = Boolean(story && dismissedStoryId !== story.entry.entryId);
  if (!showLegacy && !showStory) return null;

  return (
    <aside
      data-morning-brief-legacy-stack="true"
      aria-label="Morning Brief creature updates"
      style={{
        position: "fixed",
        right: "max(14px, env(safe-area-inset-right))",
        bottom: "max(18px, calc(env(safe-area-inset-bottom) + 12px))",
        zIndex: 95,
        width: "min(430px, calc(100vw - 28px))",
        maxHeight: "min(76vh, 680px)",
        overflow: "auto",
        display: "grid",
        gap: 10,
      }}
    >
      {showLegacy && legacy ? (
        <MorningCard
          kicker={legacy.kind === "hall" ? "Morning Brief · Hall of Legends" : "Morning Brief · Retirement"}
          title={legacy.title}
          description={legacy.description}
          dayLabel={legacy.dayLabel}
          creatureNames={legacy.creatureNames}
          accent={legacy.kind === "hall" ? "gold" : "blue"}
          dataAttribute="legacy"
          onDismiss={() => setDismissedLegacyId(legacy.entryId)}
        />
      ) : null}
      {showStory && story ? (
        <MorningCard
          kicker="Morning Brief · Creature Story"
          title={story.entry.title}
          description={story.entry.description}
          dayLabel={story.dayLabel}
          creatureNames={story.creatureNames}
          accent="gold"
          dataAttribute="story"
          onDismiss={() => setDismissedStoryId(story.entry.entryId)}
        />
      ) : null}
    </aside>
  );
}

function MorningCard({
  kicker,
  title,
  description,
  dayLabel,
  creatureNames,
  accent,
  dataAttribute,
  onDismiss,
}: {
  kicker: string;
  title: string;
  description: string;
  dayLabel: string;
  creatureNames: string[];
  accent: "gold" | "blue";
  dataAttribute: "legacy" | "story";
  onDismiss: () => void;
}) {
  const gold = accent === "gold";
  return (
    <section
      data-morning-creature-story={dataAttribute === "story" ? "true" : undefined}
      data-morning-legacy-announcement={dataAttribute === "legacy" ? "true" : undefined}
      style={{
        position: "relative",
        padding: 16,
        border: gold ? "2px solid rgba(245,201,128,.72)" : "2px solid rgba(127,219,255,.66)",
        borderRadius: 18,
        background: gold
          ? "radial-gradient(circle at top right,rgba(245,201,128,.18),transparent 42%),linear-gradient(145deg,rgba(45,24,18,.98),rgba(13,18,20,.98))"
          : "radial-gradient(circle at top right,rgba(127,219,255,.16),transparent 42%),linear-gradient(145deg,rgba(20,31,39,.98),rgba(13,18,20,.98))",
        color: "#fff7dd",
        boxShadow: "0 18px 48px rgba(0,0,0,.52)",
      }}
    >
      <button
        type="button"
        aria-label={`Dismiss ${kicker}`}
        onClick={onDismiss}
        style={{
          position: "absolute",
          top: 8,
          right: 9,
          width: 30,
          height: 30,
          border: "1px solid rgba(245,201,128,.35)",
          borderRadius: 999,
          background: "rgba(0,0,0,.28)",
          color: "#fff7dd",
          fontWeight: 900,
        }}
      >
        ×
      </button>
      <p
        style={{
          margin: 0,
          color: gold ? "#f5c980" : "#7fdbff",
          fontSize: ".68rem",
          fontWeight: 950,
          letterSpacing: ".14em",
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </p>
      <h2 style={{ margin: "7px 34px 5px 0", fontSize: "1.18rem" }}>{title}</h2>
      <p style={{ margin: 0, color: "#ead8b7", lineHeight: 1.48 }}>{description}</p>
      <div style={{ marginTop: 11, display: "flex", flexWrap: "wrap", gap: 7 }}>
        <span
          style={{
            padding: "5px 9px",
            borderRadius: 999,
            background: gold ? "rgba(245,201,128,.12)" : "rgba(127,219,255,.12)",
            color: gold ? "#f5c980" : "#d9f4ff",
            fontSize: ".72rem",
            fontWeight: 850,
          }}
        >
          {dayLabel}
        </span>
        {creatureNames.map((name) => (
          <span
            key={name}
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(255,255,255,.07)",
              color: "#fff7dd",
              fontSize: ".72rem",
              fontWeight: 850,
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
