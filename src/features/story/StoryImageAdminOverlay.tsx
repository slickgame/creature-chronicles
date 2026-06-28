"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { STORY_IMAGE_FALLBACK_PATH, getStoryImagesByChapter, type StoryImageManifestEntry } from "@/data/storyImages";
import { useGameContext } from "@/state/GameProvider";

const openButtonStyle: CSSProperties = { position: "fixed", right: 24, bottom: 82, zIndex: 70, minHeight: 46, padding: "8px 14px", border: "3px solid rgba(127,219,255,.72)", borderRadius: 999, background: "rgba(0,0,0,.88)", color: "#fff7dd", fontWeight: 950, boxShadow: "0 16px 34px rgba(0,0,0,.55)", pointerEvents: "auto" };
const backdropStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 132, display: "grid", placeItems: "center", padding: 24, background: "rgba(0,0,0,.72)", backdropFilter: "blur(5px)", pointerEvents: "auto" };
const panelStyle: CSSProperties = { width: "min(1220px, 100%)", maxHeight: "90vh", overflow: "auto", display: "grid", gridTemplateColumns: "minmax(280px,.78fr) minmax(460px,1.22fr)", gap: 14, padding: 18, border: "3px solid rgba(127,219,255,.72)", borderRadius: 22, background: "linear-gradient(rgba(31,35,44,.98),rgba(10,9,12,.98))", color: "#fff7dd", boxShadow: "0 28px 70px rgba(0,0,0,.7)" };
const kickerStyle: CSSProperties = { margin: 0, color: "#7fdbff", fontSize: ".66rem", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const bodyStyle: CSSProperties = { margin: 0, color: "#f2dfbd", fontSize: ".9rem", fontWeight: 780, lineHeight: 1.42, textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const buttonStyle: CSSProperties = { minHeight: 38, border: "2px solid rgba(45,25,13,.92)", borderRadius: 12, background: "linear-gradient(#fff4cf,#d6a25b)", color: "#1f1108", fontWeight: 950, padding: "8px 13px", boxShadow: "0 3px 0 rgba(0,0,0,.34)" };
const selectStyle: CSSProperties = { minHeight: 36, borderRadius: 10, border: "1px solid rgba(127,219,255,.42)", background: "rgba(0,0,0,.32)", color: "#fff7dd", padding: "0 10px", fontWeight: 850 };

type StatusFilter = "all" | "placeholder" | "final";

export function StoryImageAdminOverlay() {
  const { appScreen, currentSave } = useGameContext();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const images = useMemo(() => getStoryImagesByChapter("chapter1"), []);
  const visibleImages = useMemo(() => statusFilter === "all" ? images : images.filter((entry) => entry.status === statusFilter), [images, statusFilter]);
  if (!currentSave || appScreen !== "ranch-office") return null;
  const placeholderCount = images.filter((entry) => entry.status === "placeholder").length;
  const finalCount = images.filter((entry) => entry.status === "final").length;
  const selected = visibleImages.find((entry) => entry.id === selectedId) ?? visibleImages[0] ?? images[0] ?? null;
  if (!open) return <button type="button" style={openButtonStyle} onClick={() => setOpen(true)}>Story Images ({finalCount}/{images.length})</button>;
  return <div style={backdropStyle} role="presentation" onClick={() => setOpen(false)}><section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="story-image-admin-title" onClick={(event) => event.stopPropagation()}><aside style={{ display: "grid", gap: 10, alignContent: "start" }}><header><p style={kickerStyle}>Story Art Tracker</p><h2 id="story-image-admin-title" style={{ margin: "4px 0", color: "#fff", fontSize: "2rem", lineHeight: 1 }}>Image Manifest</h2><p style={bodyStyle}>Use this as a checklist when replacing placeholder story art with final files.</p></header><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><Summary label="Final" value={finalCount} /><Summary label="Placeholders" value={placeholderCount} /></div><label style={{ display: "grid", gap: 4, color: "#f5c980", fontWeight: 950, fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase" }}>Filter<select style={selectStyle} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">All Images</option><option value="placeholder">Placeholders</option><option value="final">Final Only</option></select></label><div style={{ display: "grid", gap: 7 }}>{visibleImages.map((entry) => <button key={entry.id} type="button" onClick={() => setSelectedId(entry.id)} style={{ textAlign: "left", padding: 10, border: `1px solid ${selected?.id === entry.id ? "rgba(127,219,255,.78)" : entry.status === "final" ? "rgba(126,229,168,.4)" : "rgba(245,201,128,.32)"}`, borderRadius: 12, background: selected?.id === entry.id ? "rgba(127,219,255,.13)" : "rgba(0,0,0,.24)", color: "#fff7dd", fontWeight: 900 }}><span style={{ display: "block", color: entry.status === "final" ? "#7ee5a8" : "#f5c980", fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".1em" }}>{entry.status} • {entry.recommendedAspectRatio}</span>{entry.title}</button>)}</div><button type="button" style={buttonStyle} onClick={() => setOpen(false)}>Close Images</button></aside>{selected ? <StoryImageDetail entry={selected} /> : null}</section></div>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div style={{ padding: 10, border: "1px solid rgba(127,219,255,.3)", borderRadius: 12, background: "rgba(0,0,0,.24)" }}><span style={kickerStyle}>{label}</span><strong style={{ display: "block", marginTop: 3, color: "#fff", fontSize: "1.45rem" }}>{value}</strong></div>;
}

function StoryImageDetail({ entry }: { entry: StoryImageManifestEntry }) {
  return <article style={{ display: "grid", gap: 12, alignContent: "start", padding: 14, border: "1px solid rgba(127,219,255,.34)", borderRadius: 18, background: "rgba(0,0,0,.22)", maxHeight: "calc(90vh - 42px)", overflow: "auto" }}><header style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 14, alignItems: "center" }}><div style={{ minHeight: 140, display: "grid", placeItems: "center", border: "1px solid rgba(127,219,255,.28)", borderRadius: 14, background: "rgba(127,219,255,.07)" }}><img src={entry.status === "final" ? entry.path : entry.placeholderPath} alt="" style={{ maxWidth: "100%", maxHeight: 132, objectFit: "contain", padding: 10 }} onError={(event) => { event.currentTarget.src = STORY_IMAGE_FALLBACK_PATH; }} /></div><div><p style={kickerStyle}>{entry.status} • {entry.id}</p><h2 style={{ margin: "4px 0", color: "#fff", fontSize: "clamp(1.5rem,3vw,2.5rem)", lineHeight: 1 }}>{entry.title}</h2><p style={bodyStyle}>{entry.description}</p></div></header><InfoGrid entry={entry} /><section style={{ display: "grid", gap: 7, padding: 12, border: "1px solid rgba(245,201,128,.24)", borderRadius: 14, background: "rgba(0,0,0,.2)" }}><p style={kickerStyle}>Prompt Notes</p><textarea readOnly value={entry.promptNotes} style={{ minHeight: 104, resize: "vertical", border: "1px solid rgba(127,219,255,.28)", borderRadius: 12, background: "rgba(0,0,0,.35)", color: "#fff7dd", padding: 10, fontWeight: 760, lineHeight: 1.35 }} /></section><section style={{ display: "grid", gap: 7, padding: 12, border: "1px solid rgba(127,219,255,.22)", borderRadius: 14, background: "rgba(127,219,255,.07)" }}><p style={kickerStyle}>Replacement Path</p><code style={{ whiteSpace: "pre-wrap", color: "#fff7dd", fontWeight: 850 }}>{entry.path}</code><p style={bodyStyle}>When final art is ready, save it at this filename and change this manifest entry status from placeholder to final.</p></section></article>;
}

function InfoGrid({ entry }: { entry: StoryImageManifestEntry }) {
  const items = [
    ["Filename", entry.filename],
    ["Scene", entry.sceneId],
    ["Aspect", entry.recommendedAspectRatio],
    ["Placeholder", entry.placeholderPath],
  ];
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>{items.map(([label, value]) => <div key={label} style={{ padding: 10, border: "1px solid rgba(245,201,128,.22)", borderRadius: 12, background: "rgba(0,0,0,.2)" }}><span style={kickerStyle}>{label}</span><strong style={{ display: "block", marginTop: 4, color: "#fff7dd", wordBreak: "break-word" }}>{value}</strong></div>)}</div>;
}
