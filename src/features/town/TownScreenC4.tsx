"use client";

import { useState } from "react";
import { getColiseumC3Summary } from "@/data/coliseumC3";
import { getColiseumC4Summary, getColiseumC4WeeklyBoss } from "@/data/coliseumC4";
import { useGameContext } from "@/state/GameProvider";
import { TownScreen as BaseTownScreen } from "./TownScreen";

const ROSE_LANTERN_ICON = "/images/buildings/town/rose_lantern.svg";

export function TownScreen() {
  const { currentSave, goToBattleDebug } = useGameContext();
  const [showRoseLantern, setShowRoseLantern] = useState(false);
  const c3 = currentSave ? getColiseumC3Summary(currentSave) : null;
  const c4 = currentSave ? getColiseumC4Summary(currentSave) : null;
  const boss = currentSave ? getColiseumC4WeeklyBoss(currentSave) : null;
  return (
    <>
      <BaseTownScreen />

      <button
        type="button"
        onClick={() => setShowRoseLantern(true)}
        aria-label="The Rose Lantern, planned mature social venue"
        style={{
          position: "fixed",
          left: "75%",
          top: "31%",
          zIndex: 24,
          width: "clamp(82px, 8vw, 132px)",
          border: "2px solid rgba(239,185,120,.68)",
          borderRadius: 16,
          padding: 7,
          background: "rgba(18,9,18,.88)",
          color: "#fff0c8",
          boxShadow: "0 12px 28px rgba(0,0,0,.54)",
          cursor: "pointer",
        }}
      >
        <img src={ROSE_LANTERN_ICON} alt="" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", borderRadius: 10 }} />
        <strong style={{ display: "block", marginTop: 4, fontSize: ".72rem" }}>The Rose Lantern</strong>
        <small style={{ color: "#e6b16d", fontWeight: 900 }}>PLANNED</small>
      </button>

      {showRoseLantern ? (
        <div
          role="presentation"
          onMouseDown={(event) => { if (event.currentTarget === event.target) setShowRoseLantern(false); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 260,
            display: "grid",
            placeItems: "center",
            padding: 16,
            background: "rgba(0,0,0,.72)",
            backdropFilter: "blur(5px)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="rose-lantern-title"
            style={{
              width: "min(100%, 680px)",
              maxHeight: "88dvh",
              overflow: "auto",
              display: "grid",
              gridTemplateColumns: "minmax(160px, .65fr) minmax(0, 1.35fr)",
              gap: 18,
              padding: 20,
              border: "2px solid rgba(239,185,120,.78)",
              borderRadius: 20,
              background: "linear-gradient(145deg, rgba(64,28,48,.98), rgba(12,11,17,.98))",
              color: "#fff0d0",
              boxShadow: "0 26px 70px rgba(0,0,0,.68)",
            }}
          >
            <img src={ROSE_LANTERN_ICON} alt="The Rose Lantern" style={{ width: "100%", borderRadius: 14 }} />
            <div>
              <span style={{ color: "#eeb768", fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".72rem" }}>Planned Town Location</span>
              <h2 id="rose-lantern-title" style={{ margin: "6px 0 8px", fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}>The Rose Lantern</h2>
              <p style={{ color: "#eadfce", lineHeight: 1.5 }}>A future adults-only social house for mature storylines, relationships, hospitality work, town rumors, and optional character-focused contracts.</p>
              <p style={{ color: "#cdbfae", lineHeight: 1.45 }}>This update reserves the location and tone only. Its full systems, staff, progression, consent boundaries, economy, and story content will receive a dedicated design and implementation milestone.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, margin: "14px 0" }}>
                {[
                  "Relationship scenes",
                  "Mature social contracts",
                  "Hospitality management",
                  "Town rumor network",
                ].map((item) => <div key={item} style={{ padding: 9, border: "1px solid rgba(239,185,120,.28)", borderRadius: 10, background: "rgba(0,0,0,.2)", fontWeight: 800 }}>{item}</div>)}
              </div>
              <button type="button" onClick={() => setShowRoseLantern(false)} style={{ minHeight: 44, padding: "9px 15px", border: "1px solid #efb978", borderRadius: 10, background: "linear-gradient(#ffe5ab,#d98a56)", color: "#25131d", fontWeight: 900 }}>Return to Town</button>
            </div>
          </section>
        </div>
      ) : null}

      {c3 && c4 && boss ? (
        <button
          type="button"
          onClick={goToBattleDebug}
          style={{
            position: "fixed",
            right: 18,
            bottom: 18,
            zIndex: 190,
            display: "grid",
            gap: 2,
            minWidth: 210,
            padding: "10px 14px",
            border: "1px solid rgba(241,195,105,.72)",
            borderRadius: 10,
            background: "rgba(18,9,6,.95)",
            color: "#fff0c8",
            boxShadow: "0 14px 34px rgba(0,0,0,.5)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ color: "#d6ad67", fontSize: ".72rem", fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Coliseum C4</span>
          <strong>{c3.marks} Marks · {c4.weeklyScore} Weekly Score</strong>
          <small>{c4.activeRun ? `Gauntlet stage ${c4.activeRun.stageIndex + 1} waiting` : `${boss.name} · ${c4.bossClaimed ? "reward claimed" : "reward available"}`}</small>
        </button>
      ) : null}
    </>
  );
}
