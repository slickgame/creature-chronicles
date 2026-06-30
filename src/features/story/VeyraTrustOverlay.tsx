"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { getNextVeyraTrustDialogue, getVeyraTrustState, type VeyraTrustDialogue } from "@/data/veyraTrust";
import { useGameContext } from "@/state/GameProvider";

const meterStyle: CSSProperties = { position: "fixed", left: 24, bottom: 24, zIndex: 68, width: 300, display: "grid", gap: 8, padding: 12, border: "3px solid rgba(245,201,128,.72)", borderRadius: 18, background: "rgba(0,0,0,.88)", color: "#fff7dd", boxShadow: "0 18px 38px rgba(0,0,0,.56)", pointerEvents: "auto" };
const backdropStyle: CSSProperties = { position: "fixed", inset: 0, zIndex: 124, display: "grid", placeItems: "center", padding: 24, background: "rgba(0,0,0,.72)", backdropFilter: "blur(5px)", pointerEvents: "auto" };
const panelStyle: CSSProperties = { width: "min(780px, 100%)", maxHeight: "90vh", overflow: "auto", display: "grid", gap: 14, padding: 22, border: "3px solid rgba(245,201,128,.88)", borderRadius: 22, background: "linear-gradient(rgba(62,31,22,.98),rgba(15,9,8,.98))", color: "#fff7dd", boxShadow: "0 28px 70px rgba(0,0,0,.7)" };
const kickerStyle: CSSProperties = { margin: 0, color: "#f5c980", fontSize: ".66rem", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const bodyStyle: CSSProperties = { margin: 0, color: "#f2dfbd", fontSize: ".93rem", fontWeight: 780, lineHeight: 1.45, textShadow: "0 2px 2px rgba(0,0,0,.72)" };
const buttonStyle: CSSProperties = { minHeight: 38, border: "2px solid rgba(45,25,13,.92)", borderRadius: 12, background: "linear-gradient(#fff4cf,#d6a25b)", color: "#1f1108", fontWeight: 950, padding: "8px 13px", boxShadow: "0 3px 0 rgba(0,0,0,.34)" };

export function VeyraTrustOverlay() {
  const { appScreen, currentSave, saveCurrentGame } = useGameContext();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const trust = useMemo(() => currentSave ? getVeyraTrustState(currentSave) : null, [currentSave]);
  const dialogue = useMemo(() => currentSave ? getNextVeyraTrustDialogue(currentSave) : null, [currentSave]);
  if (!currentSave || appScreen !== "ranch-hub" || !trust) return null;

  const activeSave = currentSave;
  const activeTrust = trust;

  function closeDialogue(scene: VeyraTrustDialogue) {
    
    saveCurrentGame({ ...activeSave, updatedAt: new Date().toISOString(), flags: { ...activeSave.flags, [scene.flag]: true, m28VeyraTrustTrack: true, veyraTrustScore: activeTrust.score, veyraTrustTier: activeTrust.tier.id, veyraLastTrustDialogue: scene.id } });
  }

  return <><section style={meterStyle} aria-label="Veyra trust meter"><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}><div><p style={kickerStyle}>Veyra Trust</p><strong style={{ display: "block", color: "#fff", fontSize: "1.08rem", lineHeight: 1.1 }}>{trust.tier.label}</strong></div><strong style={{ color: "#7fdbff" }}>{trust.score}/{trust.maxScore}</strong></div><div style={{ height: 10, border: "1px solid rgba(127,219,255,.34)", borderRadius: 999, background: "rgba(0,0,0,.34)", overflow: "hidden" }}><span style={{ display: "block", width: `${trust.nextTier ? trust.progressPercent : 100}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, rgba(127,219,255,.9), rgba(245,201,128,.95))" }} /></div><p style={bodyStyle}>{trust.nextTier ? `Next: ${trust.nextTier.label} at ${trust.nextTier.threshold} trust.` : "Max Chapter 1 trust reached."}</p><button type="button" style={buttonStyle} onClick={() => setDetailsOpen(true)}>View Trust Path</button></section>{detailsOpen ? <TrustDetailsModal trust={trust} onClose={() => setDetailsOpen(false)} /> : null}{dialogue ? <TrustDialogueModal dialogue={dialogue} onClose={() => closeDialogue(dialogue)} /> : null}</>;
}

function TrustDetailsModal({ trust, onClose }: { trust: ReturnType<typeof getVeyraTrustState>; onClose: () => void }) {
  return <div style={backdropStyle} role="presentation" onClick={onClose}><section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="veyra-trust-title" onClick={(event) => event.stopPropagation()}><header><p style={kickerStyle}>Relationship Track</p><h2 id="veyra-trust-title" style={{ margin: "4px 0", color: "#fff", fontSize: "clamp(1.8rem,4vw,3rem)", lineHeight: .95 }}>Veyra Trust</h2><p style={bodyStyle}>{trust.tier.description}</p></header><section style={{ display: "grid", gap: 8 }}><p style={kickerStyle}>Trust Sources</p>{trust.sources.map((source) => <div key={source.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: 9, border: `1px solid ${source.complete ? "rgba(126,229,168,.42)" : "rgba(245,201,128,.24)"}`, borderRadius: 12, background: source.complete ? "rgba(126,229,168,.08)" : "rgba(0,0,0,.22)" }}><span style={{ color: source.complete ? "#fff7dd" : "#b6a98f", fontWeight: 850 }}>{source.label}</span><strong style={{ color: source.complete ? "#7ee5a8" : "#f5c980" }}>{source.complete ? "+" : ""}{source.points}</strong></div>)}</section><section style={{ display: "grid", gap: 8 }}><p style={kickerStyle}>Dialogue Unlocks</p>{trust.unlockedDialogueIds.length ? <p style={bodyStyle}>Unlocked: {trust.unlockedDialogueIds.join(", ")}.</p> : <p style={bodyStyle}>Complete Chapter 1 goals to unlock Veyra dialogue beats.</p>}</section><footer style={{ display: "flex", justifyContent: "flex-end" }}><button type="button" style={buttonStyle} onClick={onClose}>Close</button></footer></section></div>;
}

function TrustDialogueModal({ dialogue, onClose }: { dialogue: VeyraTrustDialogue; onClose: () => void }) {
  return <div style={backdropStyle} role="presentation"><section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="veyra-trust-dialogue-title"><header style={{ display: "grid", gridTemplateColumns: "82px 1fr", gap: 12, alignItems: "center" }}><img src={dialogue.portraitPath} alt="" style={{ width: 74, height: 74, objectFit: "contain", border: "2px solid rgba(127,219,255,.58)", borderRadius: 16, padding: 6, background: "rgba(255,247,221,.08)" }} /><div><p style={kickerStyle}>Trust Dialogue Unlocked</p><h2 id="veyra-trust-dialogue-title" style={{ margin: "4px 0", color: "#fff", fontSize: "clamp(1.7rem,4vw,2.8rem)", lineHeight: .98 }}>{dialogue.title}</h2><span style={{ color: "#7fdbff", fontWeight: 950 }}>{dialogue.speaker}</span></div></header><div style={{ display: "grid", gap: 10 }}>{dialogue.lines.map((line, index) => <p key={`${dialogue.id}-${index}`} style={bodyStyle}>{line}</p>)}</div><section style={{ padding: 12, border: "1px solid rgba(127,219,255,.26)", borderRadius: 14, background: "rgba(127,219,255,.08)" }}><p style={kickerStyle}>Future Path</p><p style={bodyStyle}>{dialogue.nextPathLabel}</p></section><footer style={{ display: "flex", justifyContent: "flex-end" }}><button type="button" style={buttonStyle} onClick={onClose}>Continue</button></footer></section></div>;
}

