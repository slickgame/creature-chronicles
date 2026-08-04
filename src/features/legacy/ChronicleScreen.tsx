"use client";

import { ChronicleFeed } from "./ChronicleFeed";
import { LegacyOverviewPanel } from "./LegacyOverviewPanel";
import { RanchSocialRoster } from "./RanchSocialRoster";
import type { GameSave } from "@/types/save";

type ChronicleScreenProps = {
  save: GameSave;
  onBack: () => void;
};

export function ChronicleScreen({ save, onBack }: ChronicleScreenProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(18px,3vw,36px)",
        background:
          "radial-gradient(circle at top,rgba(245,201,128,.14),transparent 36%),linear-gradient(145deg,#281714,#111415)",
        color: "#fff7dd",
      }}
    >
      <section style={{ width: "min(100%,1100px)", margin: "0 auto", display: "grid", gap: 16 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: 18,
            border: "1px solid rgba(245,201,128,.3)",
            borderRadius: 18,
            background: "rgba(0,0,0,.26)",
          }}
        >
          <div>
            <p style={{ margin: 0, color: "#f5c980", fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>
              Ranch History
            </p>
            <h1 style={{ margin: "4px 0 0", fontSize: "clamp(2rem,5vw,4rem)" }}>The Chronicle</h1>
            <p style={{ margin: "8px 0 0", color: "#e8d5b4" }}>
              The enduring record of {save.player.ranchName}, its creatures, and the choices that shaped it.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            style={{
              minHeight: 42,
              padding: "9px 16px",
              border: "2px solid #2d190d",
              borderRadius: 12,
              background: "linear-gradient(#fff4cf,#d6a25b)",
              color: "#211208",
              fontWeight: 950,
            }}
          >
            Back to Ranch
          </button>
        </header>

        <LegacyOverviewPanel save={save} />
        <RanchSocialRoster save={save} />
        <ChronicleFeed save={save} limit={100} />
      </section>
    </main>
  );
}
