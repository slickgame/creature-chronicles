"use client";

import { getLegacyPrestige } from "@/data/legacyProgressReconciliation";
import type { GameSave } from "@/types/save";

export function LegacyPrestigeBadge({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const prestige = getLegacyPrestige(save);
  return (
    <div
      aria-label={`Legacy Prestige ${prestige}`}
      data-legacy-prestige="true"
      title="Legacy Prestige is earned by fulfilling creature ambitions."
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        padding: compact ? "5px 8px" : "7px 10px",
        border: "1px solid rgba(245,201,128,.35)",
        borderRadius: 999,
        background: "rgba(25,18,10,.72)",
        color: "#fff1c7",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">✦</span>
      {!compact ? <span style={{ fontSize: 12, opacity: 0.78 }}>Legacy Prestige</span> : null}
      <strong>{prestige.toLocaleString()}</strong>
    </div>
  );
}
