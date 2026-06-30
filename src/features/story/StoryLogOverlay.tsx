"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { getChapterOneStoryLog, type StoryLogEntry } from "@/data/chapterOneStory";
import { STORY_IMAGE_FALLBACK_PATH } from "@/data/storyImages";
import { useGameContext } from "@/state/GameProvider";

const openButtonStyle: CSSProperties = { position: "fixed", right: 24, bottom: 24, zIndex: 70, minHeight: 46, padding: "8px 14px", border: "3px solid rgba(245,201,128,.78)", borderRadius: 999, background: "rgba(0,0,0,.88)", color: "#fff7dd", fontWeight: 950, boxShadow: "0 16px 34px rgba(0,0,0,.55)", pointerEvents: "auto" };
const backdropStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 130, display: "grid", placeItems: "center", padding: 24, background: "rgba(0,0,0,.72)", backdropFilter: "blur(5px)", pointerEvents: "auto" };
const panelStyle: CSSProperties = { width: "min(1180px, 100%)", maxHeight: "90vh", overflow: "auto", display: "grid", gridTemplateColumns: "minmax(250px,.68fr) minmax(420px,1.32fr)", gap: 14, padding: 18, border: "3px solid rgba(245,201,128,.88)", borderRadius: 22, background: "linear-gradient(rgba(44,29,22,.98),rgba(12,9,8,.98))", color: "#fff7dd", boxShadow: "0 28px 70px rgba(0,0,0,.7)" };
const listStyle: CSSProperties = { display: "grid", gap: 8, alignContent: "start" };
const buttonStyle: CSSProperties = { minHeight: 40, border: "2px solid rgba(45,25,13,.92)", borderRadius: 12, background: "linear-gradient(#fff4cf,#d6a25b)", color: "#1f1108", fontWeight: 950, padding: "9px 16px", boxShadow: "0 3px 0 rgba(0,0,0,.34)" };
const kickerStyle: CSSProperties = { margin: 0, color: "#f5c980", fontSize: ".66rem", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const bodyStyle: CSSProperties = { margin: 0, color: "#f2dfbd", fontSize: ".94rem", fontWeight: 780, lineHeight: 1.45, textShadow: "0 2px 2px rgba(0,0,0,.72)" };

export function StoryLogOverlay() {
  const { appScreen, currentSave } = useGameContext();
  const [open, setOpen] = useState(false);
  const entries = useMemo(() => currentSave ? getChapterOneStoryLog(currentSave) : [], [currentSave]);
  const seenEntries = entries.filter((entry) => entry.seen);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!currentSave || appScreen !== "ranch-office") return null;
  const selected = entries.find((entry) => entry.id === selectedId) ?? seenEntries[seenEntries.length - 1] ?? entries[0] ?? null;
  if (!open) return <button type="button" style={openButtonStyle} onClick={() => setOpen(true)}>Story Log ({seenEntries.length}/{entries.length})</button>;
  return <div style={backdropStyle} role="presentation" onClick={() => setOpen(false)}><section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="story-log-title" onClick={(event) => event.stopPropagation()}><aside style={listStyle}><div><p style={kickerStyle}>Ranch Office Codex</p><h2 id="story-log-title" style={{ margin: "4px 0", color: "#fff", fontSize: "2rem", lineHeight: 1 }}>Story Log</h2><p style={bodyStyle}>Reread Chapter 1 scenes you have unlocked. Entries preserve page order, speaker changes, and manifest-tracked story images.</p></div><div style={{ display: "grid", gap: 7 }}>{entries.map((entry) => <button key={entry.id} type="button" onClick={() => setSelectedId(entry.id)} style={{ textAlign: "left", padding: 10, border: `1px solid ${selected?.id === entry.id ? "rgba(127,219,255,.72)" : entry.seen ? "rgba(245,201,128,.34)" : "rgba(120,120,120,.26)"}`, borderRadius: 12, background: selected?.id === entry.id ? "rgba(127,219,255,.12)" : "rgba(0,0,0,.24)", color: entry.seen ? "#fff7dd" : "#a99d8b", fontWeight: 900 }}><span style={{ display: "block", color: entry.seen ? "#7fdbff" : "#8d8376", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".1em" }}>{entry.seen ? "Unlocked" : "Locked"} • {entry.kind} • {entry.pages.length}p</span>{entry.title}</button>)}</div><button type="button" style={buttonStyle} onClick={() => setOpen(false)}>Close Log</button></aside>{selected ? <StoryLogDetail entry={selected} /> : null}</section></div>;
}

function StoryLogDetail({ entry }: { entry: StoryLogEntry }) {
  const pages = entry.pages?.length ? entry.pages : entry.lines.map((line) => ({ speaker: entry.speaker, portraitPath: entry.portraitPath, imageId: entry.imageId, imagePath: entry.imagePath, text: line }));
  return <article style={{ display: "grid", gap: 12, alignContent: "start", padding: 14, border: "1px solid rgba(245,201,128,.3)", borderRadius: 18, background: "rgba(0,0,0,.22)", maxHeight: "calc(90vh - 42px)", overflow: "auto" }}><header style={{ display: "grid", gridTemplateColumns: "82px 1fr", gap: 12, alignItems: "center" }}><img src={entry.portraitPath} alt="" style={{ width: 74, height: 74, objectFit: "contain", border: "2px solid rgba(127,219,255,.58)", borderRadius: 16, padding: 6, background: "rgba(255,247,221,.08)", opacity: entry.seen ? 1 : .45 }} /><div><p style={kickerStyle}>{entry.seen ? "Recovered Record" : "Locked Record"}</p><h2 style={{ margin: "4px 0", color: "#fff", fontSize: "clamp(1.6rem,3vw,2.6rem)", lineHeight: 1 }}>{entry.title}</h2><span style={{ color: "#7fdbff", fontWeight: 950 }}>{entry.speaker}</span></div></header>{entry.seen ? <div style={{ display: "grid", gap: 10 }}>{pages.map((page, index) => <section key={`${entry.id}-${index}`} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10, padding: 10, border: "1px solid rgba(245,201,128,.22)", borderRadius: 14, background: "rgba(0,0,0,.2)" }}><div style={{ display: "grid", placeItems: "center", minHeight: 110, border: "1px solid rgba(127,219,255,.26)", borderRadius: 12, background: "rgba(127,219,255,.07)" }}><img src={page.imagePath} alt="" style={{ maxWidth: "100%", maxHeight: 100, objectFit: "contain", padding: 8 }} onError={(event) => { event.currentTarget.src = STORY_IMAGE_FALLBACK_PATH; }} /></div><div><p style={kickerStyle}>Page {index + 1} • {page.speaker}</p><p style={bodyStyle}>{page.text}</p>{"caption" in page && page.caption ? <p style={{ ...kickerStyle, color: "#7fdbff", marginTop: 7 }}>{String(page.caption)}</p> : null}</div></section>)}</div> : <div style={{ padding: 12, border: "1px solid rgba(127,219,255,.28)", borderRadius: 14, background: "rgba(127,219,255,.08)" }}><p style={bodyStyle}>This record has not been unlocked yet.</p><p style={{ ...bodyStyle, color: "#7fdbff", marginTop: 8 }}>{entry.lockedReason ?? "Continue Chapter 1 to unlock this scene."}</p></div>}</article>;
}


