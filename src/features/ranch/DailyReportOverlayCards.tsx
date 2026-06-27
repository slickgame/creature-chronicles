"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useGameContext } from "@/state/GameProvider";

function readJsonList(value: boolean | number | string | undefined): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function getActiveReportTab(dialog: Element): string {
  const activeButton = Array.from(dialog.querySelectorAll("button")).find((button) => button.className.toString().toLowerCase().includes("activereporttab"));
  return activeButton?.textContent?.trim() ?? "";
}

function ensureContainer(dialog: Element): HTMLElement | null {
  const reportBody = Array.from(dialog.querySelectorAll("div")).find((node) => node.className.toString().includes("reportPageBody"));
  if (!reportBody) return null;
  let container = dialog.querySelector<HTMLElement>('[data-daily-report-visual="true"]');
  if (!container) {
    container = document.createElement("section");
    container.dataset.dailyReportVisual = "true";
    reportBody.prepend(container);
  }
  return container;
}

export function DailyReportOverlayCards() {
  const { appScreen, currentSave } = useGameContext();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const highlights = useMemo(() => readJsonList(currentSave?.flags.dailyReportHighlights), [currentSave?.flags.dailyReportHighlights]);
  const warnings = useMemo(() => readJsonList(currentSave?.flags.dailyReportWarnings), [currentSave?.flags.dailyReportWarnings]);
  const nextSteps = useMemo(() => readJsonList(currentSave?.flags.dailyReportNextSteps), [currentSave?.flags.dailyReportNextSteps]);

  useEffect(() => {
    if (appScreen !== "ranch-hub" || !currentSave) { setTarget(null); return; }
    function syncTarget() {
      const dialog = document.querySelector('[aria-labelledby="summary-title"]');
      if (!dialog || getActiveReportTab(dialog) !== "Overview") { setTarget(null); return; }
      setTarget(ensureContainer(dialog));
    }
    syncTarget();
    const observer = new MutationObserver(syncTarget);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
    return () => observer.disconnect();
  }, [appScreen, currentSave, highlights.length, warnings.length, nextSteps.length]);

  if (!target || (!highlights.length && !warnings.length && !nextSteps.length)) return null;
  return createPortal(<div style={{ display: "grid", gap: 10, marginBottom: 12 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}><ReportCard title="Highlights" tone="good" items={highlights} fallback="No major highlights recorded." /><ReportCard title="Warnings" tone={warnings.length ? "warn" : "good"} items={warnings} fallback="No major warnings today." /><ReportCard title="Next Steps" tone="info" items={nextSteps} fallback="Review the ranch and plan the day." /></div></div>, target);
}

function ReportCard({ title, tone, items, fallback }: { title: string; tone: "good" | "warn" | "info"; items: string[]; fallback: string }) {
  const border = tone === "warn" ? "rgba(255,132,104,.66)" : tone === "good" ? "rgba(126,229,168,.52)" : "rgba(127,219,255,.54)";
  const glow = tone === "warn" ? "rgba(255,88,88,.12)" : tone === "good" ? "rgba(126,229,168,.10)" : "rgba(127,219,255,.10)";
  const label = tone === "warn" ? "Watch" : tone === "good" ? "Good" : "Plan";
  const displayItems = items.length ? items.slice(0, 4) : [fallback];
  return <article style={{ minWidth: 0, padding: 10, border: `1px solid ${border}`, borderRadius: 14, background: `linear-gradient(145deg, ${glow}, rgba(0,0,0,.24))`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)" }}><span style={{ display: "block", color: "#f5c980", fontSize: ".62rem", fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase", textShadow: "0 2px 2px rgba(0,0,0,.75)" }}>{label}</span><strong style={{ display: "block", marginTop: 2, color: "#fff7dd", fontSize: "1rem", textShadow: "0 2px 2px rgba(0,0,0,.75)" }}>{title}</strong><ul style={{ display: "grid", gap: 6, margin: "8px 0 0", padding: 0, listStyle: "none" }}>{displayItems.map((item, index) => <li key={`${title}-${index}-${item}`} style={{ color: "#f2dfbd", fontSize: ".76rem", fontWeight: 820, lineHeight: 1.25, textShadow: "0 2px 2px rgba(0,0,0,.75)" }}>• {item}</li>)}</ul></article>;
}
