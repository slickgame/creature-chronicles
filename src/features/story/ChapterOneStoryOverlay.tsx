"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { STORY_IMAGE_PLACEHOLDERS, getNextChapterOneStoryScene, type StoryScene } from "@/data/chapterOneStory";
import { useGameContext } from "@/state/GameProvider";

const backdropStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 120, display: "grid", placeItems: "center", padding: 24, background: "rgba(0,0,0,.72)", backdropFilter: "blur(5px)", pointerEvents: "auto" };
const panelStyle: CSSProperties = { width: "min(980px, 100%)", maxHeight: "92vh", overflow: "auto", display: "grid", gap: 14, padding: 22, border: "3px solid rgba(245,201,128,.88)", borderRadius: 22, background: "linear-gradient(rgba(62,31,22,.98),rgba(15,9,8,.98))", color: "#fff7dd", boxShadow: "0 28px 70px rgba(0,0,0,.7)" };
const imagePanelStyle: CSSProperties = { minHeight: 260, display: "grid", placeItems: "center", border: "2px solid rgba(127,219,255,.38)", borderRadius: 18, background: "radial-gradient(circle at 50% 20%, rgba(127,219,255,.16), rgba(0,0,0,.28) 55%)", overflow: "hidden" };
const portraitStyle: CSSProperties = { width: 64, height: 64, objectFit: "contain", border: "2px solid rgba(127,219,255,.58)", borderRadius: 16, background: "rgba(255,247,221,.08)", padding: 5 };
const kickerStyle: CSSProperties = { margin: 0, color: "#f5c980", fontSize: ".68rem", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const bodyStyle: CSSProperties = { margin: 0, color: "#f2dfbd", fontSize: "1.02rem", fontWeight: 820, lineHeight: 1.48, textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const buttonStyle: CSSProperties = { minHeight: 40, border: "2px solid rgba(45,25,13,.92)", borderRadius: 12, background: "linear-gradient(#fff4cf,#d6a25b)", color: "#1f1108", fontWeight: 950, padding: "9px 16px", boxShadow: "0 3px 0 rgba(0,0,0,.34)" };
const secondaryButtonStyle: CSSProperties = { ...buttonStyle, background: "rgba(0,0,0,.28)", color: "#fff7dd", borderColor: "rgba(245,201,128,.42)" };

export function ChapterOneStoryOverlay() {
  const { appScreen, currentSave, saveCurrentGame, goToRanchJobs, goToTown } = useGameContext();
  const scene = useMemo(() => currentSave ? getNextChapterOneStoryScene(currentSave) : null, [currentSave]);
  const [pageIndex, setPageIndex] = useState(0);
  useEffect(() => { setPageIndex(0); }, [scene?.id]);
  if (!currentSave || appScreen !== "ranch-hub" || !scene) return null;
  const pages = scene.pages?.length ? scene.pages : scene.lines.map((line) => ({ speaker: scene.speaker, portraitPath: scene.portraitPath, imagePath: scene.imagePath, text: line }));
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const isFirst = pageIndex <= 0;
  const isLast = pageIndex >= pages.length - 1;

  function closeScene(nextAction?: "chores" | "town") {
    if (!currentSave || !scene) return;
    saveCurrentGame({ ...currentSave, updatedAt: new Date().toISOString(), flags: { ...currentSave.flags, [scene.flag]: true, m24ChapterOneStoryBeats: true, m26PagedStoryScenes: true, chapterOneLastStoryScene: scene.id } });
    if (nextAction === "chores") goToRanchJobs();
    if (nextAction === "town") goToTown();
  }

  return <div style={backdropStyle} role="presentation"><section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="chapter-one-story-title"><header style={{ display: "grid", gridTemplateColumns: "76px 1fr", gap: 14, alignItems: "center" }}><img src={page.portraitPath} alt="" style={portraitStyle} /><div><p style={kickerStyle}>{getSceneKicker(scene)} • Page {pageIndex + 1}/{pages.length}</p><h2 id="chapter-one-story-title" style={{ margin: "4px 0", color: "#fff", fontSize: "clamp(1.75rem,4vw,3rem)", lineHeight: .95, textShadow: "0 3px 3px rgba(0,0,0,.72)" }}>{scene.title}</h2><span style={{ color: "#7fdbff", fontWeight: 950 }}>{page.speaker}</span></div></header><section style={{ display: "grid", gridTemplateColumns: "minmax(280px,.95fr) minmax(300px,1.05fr)", gap: 14, alignItems: "stretch" }}><div style={imagePanelStyle}><img src={page.imagePath} alt="" style={{ width: "100%", height: "100%", maxHeight: 360, objectFit: "contain", padding: 18 }} onError={(event) => { event.currentTarget.src = STORY_IMAGE_PLACEHOLDERS.completion; }} /></div><article style={{ display: "grid", gap: 10, alignContent: "center", padding: 14, border: "1px solid rgba(245,201,128,.26)", borderRadius: 16, background: "rgba(0,0,0,.24)" }}><p style={bodyStyle}>{page.text}</p>{page.caption ? <p style={{ ...kickerStyle, color: "#7fdbff" }}>{page.caption}</p> : null}</article></section><div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>{pages.map((_, index) => <span key={`${scene.id}-dot-${index}`} style={{ width: 10, height: 10, borderRadius: 999, background: index === pageIndex ? "#f5c980" : "rgba(255,247,221,.26)", border: "1px solid rgba(0,0,0,.42)" }} />)}</div><footer style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}><span style={{ color: "#e7c991", fontSize: ".78rem", fontWeight: 850 }}>{getFooterHint(scene)}</span><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" style={secondaryButtonStyle} disabled={isFirst} onClick={() => setPageIndex((value) => Math.max(0, value - 1))}>Back</button>{!isLast ? <button type="button" style={buttonStyle} onClick={() => setPageIndex((value) => Math.min(pages.length - 1, value + 1))}>Next</button> : null}{isLast && scene.kind === "intro" ? <button type="button" style={buttonStyle} onClick={() => closeScene("chores")}>Open Chore Board</button> : null}{isLast && scene.kind === "completion" ? <button type="button" style={buttonStyle} onClick={() => closeScene("town")}>Visit Town</button> : null}{isLast ? <button type="button" style={buttonStyle} onClick={() => closeScene()}>{scene.actionLabel}</button> : null}</div></footer></section></div>;
}

function getSceneKicker(scene: StoryScene): string {
  if (scene.kind === "intro") return "Chapter 1 Opening";
  if (scene.kind === "completion") return "Chapter 1 Complete";
  return "Chapter 1 Beat";
}

function getFooterHint(scene: StoryScene): string {
  if (scene.kind === "intro") return "Story art uses placeholders until final scene images are added.";
  if (scene.kind === "completion") return "Chapter 1 onboarding is complete.";
  return "Goal dialogue appears once per completed tutorial goal.";
}
