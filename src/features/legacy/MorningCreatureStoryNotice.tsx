"use client";

import { useEffect, useState } from "react";
import { getMorningCreatureStory } from "@/data/creatureStoryNotifications";
import type { GameSave } from "@/types/save";

export function MorningCreatureStoryNotice({ save }: { save: GameSave }) {
  const story = getMorningCreatureStory(save);
  const [dismissedEntryId, setDismissedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (dismissedEntryId && story?.entry.entryId !== dismissedEntryId) {
      setDismissedEntryId(null);
    }
  }, [dismissedEntryId, story?.entry.entryId]);

  if (save.ranchDay?.phase !== "morning" || !story || dismissedEntryId === story.entry.entryId) {
    return null;
  }

  return (
    <aside
      data-morning-creature-story="true"
      aria-label="Previous Ranch Day creature story"
      style={{
        position: "fixed",
        right: "max(14px, env(safe-area-inset-right))",
        bottom: "max(18px, calc(env(safe-area-inset-bottom) + 12px))",
        zIndex: 95,
        width: "min(430px, calc(100vw - 28px))",
        padding: 16,
        border: "2px solid rgba(245,201,128,.72)",
        borderRadius: 18,
        background:
          "radial-gradient(circle at top right,rgba(245,201,128,.18),transparent 42%),linear-gradient(145deg,rgba(45,24,18,.98),rgba(13,18,20,.98))",
        color: "#fff7dd",
        boxShadow: "0 18px 48px rgba(0,0,0,.52)",
      }}
    >
      <button
        type="button"
        aria-label="Dismiss creature story"
        onClick={() => setDismissedEntryId(story.entry.entryId)}
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
          color: "#f5c980",
          fontSize: ".68rem",
          fontWeight: 950,
          letterSpacing: ".14em",
          textTransform: "uppercase",
        }}
      >
        Morning Brief · Creature Story
      </p>
      <h2 style={{ margin: "7px 34px 5px 0", fontSize: "1.18rem" }}>{story.entry.title}</h2>
      <p style={{ margin: 0, color: "#ead8b7", lineHeight: 1.48 }}>{story.entry.description}</p>
      <div style={{ marginTop: 11, display: "flex", flexWrap: "wrap", gap: 7 }}>
        <span
          style={{
            padding: "5px 9px",
            borderRadius: 999,
            background: "rgba(245,201,128,.12)",
            color: "#f5c980",
            fontSize: ".72rem",
            fontWeight: 850,
          }}
        >
          {story.dayLabel}
        </span>
        {story.creatureNames.map((name) => (
          <span
            key={name}
            style={{
              padding: "5px 9px",
              borderRadius: 999,
              background: "rgba(127,219,255,.12)",
              color: "#d9f4ff",
              fontSize: ".72rem",
              fontWeight: 850,
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </aside>
  );
}
