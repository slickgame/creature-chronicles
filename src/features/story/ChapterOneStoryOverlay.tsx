"use client";

import { type CSSProperties, useMemo } from "react";
import { getNextChapterOneStoryScene, type StoryScene } from "@/data/chapterOneStory";
import { useGameContext } from "@/state/GameProvider";

const backdropStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 120, display: "grid", placeItems: "center", padding: 24, background: "rgba(0,0,0,.72)", backdropFilter: "blur(5px)", pointerEvents: "auto" };
const panelStyle: CSSProperties = { width: "min(860px, 100%)", maxHeight: "90vh", overflow: "auto", display: "grid", gap: 14, padding: 22, border: "3px solid rgba(245,201,128,.88)", borderRadius: 22, background: "linear-gradient(rgba(62,31,22,.98),rgba(15,9,8,.98))", color: "#fff7dd", boxShadow: "0 28px 70px rgba(0,0,0,.7)" };
const portraitStyle: CSSProperties = { width: 82, height: 82, objectFit: "contain", border: "2px solid rgba(127,219,255,.58)", borderRadius: 18, background: "rgba(255,247,221,.08)", padding: 6 };
const kickerStyle: CSSProperties = { margin: 0, color: "#f5c980", fontSize: ".68rem", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const bodyStyle: CSSProperties = { margin: 0, color: "#f2dfbd", fontSize: ".98rem", fontWeight: 800, lineHeight: 1.48, textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const buttonStyle: CSSProperties = { minHeight: 40, border: "2px solid rgba(45,25,13,.92)", borderRadius: 12, background: "linear-gradient(#fff4cf,#d6a25b)", color: "#1f1108", fontWeight: 950, padding: "9px 16px", boxShadow: "0 3px 0 rgba(0,0,0,.34)" };

export function ChapterOneStoryOverlay() {
  const { appScreen, currentSave, saveCurrentGame, goToRanchJobs, goToTown } = useGameContext();
  const scene = useMemo(() => currentSave ? getNextChapterOneStoryScene(currentSave) : null, [currentSave]);
  if (!currentSave || appScreen !== "ranch-hub" || !scene) return null;

  function closeScene(nextAction?: "chores" | "town") {
    if (!currentSave || !scene) return;
    saveCurrentGame({ ...currentSave, updatedAt: new Date().toISOString(), flags: { ...currentSave.flags, [scene.flag]: true, m24ChapterOneStoryBeats: true, chapterOneLastStoryScene: scene.id } });
    if (nextAction === "chores") goToRanchJobs();
    if (nextAction === "town") goToTown();
  }

  return <div style={backdropStyle} role="presentation"><section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="chapter-one-story-title"><header style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 14, alignItems: "center" }}><img src={scene.portraitPath} alt="" style={portraitStyle} /><div><p style={kickerStyle}>{getSceneKicker(scene)}</p><h2 id="chapter-one-story-title" style={{ margin: "4px 0", color: "#fff", fontSize: "clamp(1.8rem,4vw,3.2rem)", lineHeight: .95, textShadow: "0 3px 3px rgba(0,0,0,.72)" }}>{scene.title}</h2><span style={{ color: "#7fdbff", fontWeight: 950 }}>{scene.speaker}</span></div></header><div style={{ display: "grid", gap: 10 }}>{scene.lines.map((line, index) => <p key={`${scene.id}-${index}`} style={bodyStyle}>{line}</p>)}</div><footer style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}><span style={{ color: "#e7c991", fontSize: ".78rem", fontWeight: 850 }}>{getFooterHint(scene)}</span><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{scene.kind === "intro" ? <button type="button" style={buttonStyle} onClick={() => closeScene("chores")}>Open Chore Board</button> : null}{scene.kind === "completion" ? <button type="button" style={buttonStyle} onClick={() => closeScene("town")}>Visit Town</button> : null}<button type="button" style={buttonStyle} onClick={() => closeScene()}>{scene.actionLabel}</button></div></footer></section></div>;
}

function getSceneKicker(scene: StoryScene): string {
  if (scene.kind === "intro") return "Chapter 1 Opening";
  if (scene.kind === "completion") return "Chapter 1 Complete";
  return "Chapter 1 Beat";
}

function getFooterHint(scene: StoryScene): string {
  if (scene.kind === "intro") return "This scene appears once for a new save.";
  if (scene.kind === "completion") return "Chapter 1 onboarding is complete.";
  return "Goal dialogue appears once per completed tutorial goal.";
}
