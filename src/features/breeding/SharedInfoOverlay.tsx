"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { useGameContext } from "@/state/GameProvider";

function getInfoTarget() {
  const nav = document.querySelector('nav[aria-label="Creature info pages"]');
  return nav?.closest<HTMLElement>('section[role="dialog"]') ?? null;
}

export function SharedInfoOverlay() {
  const { appScreen, currentSave } = useGameContext();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [name, setName] = useState("");
  const creature = useMemo(() => (currentSave?.creatures ?? []).find((item) => item.nickname === name) ?? null, [currentSave?.creatures, name]);

  useEffect(() => {
    if (appScreen !== "breeding" || !currentSave) { setTarget(null); setName(""); return; }
    function sync() {
      const dialog = getInfoTarget();
      if (!dialog) { setTarget(null); setName(""); return; }
      const nextName = dialog.querySelector("h2")?.textContent?.trim() ?? "";
      let host = dialog.querySelector<HTMLElement>('[data-shared-info-host="true"]');
      if (!host) {
        host = document.createElement("div");
        host.dataset.sharedInfoHost = "true";
        host.style.display = "block";
        dialog.appendChild(host);
      }
      Array.from(dialog.children).forEach((child) => {
        const el = child as HTMLElement;
        if (el === host || el.tagName.toLowerCase() === "button") return;
        el.style.display = "none";
      });
      setName(nextName);
      setTarget(host);
    }
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [appScreen, currentSave]);

  if (!target || !creature) return null;
  return createPortal(<SharedCreatureDetail creature={creature} mode="full" dayNumber={currentSave?.dayState.dayNumber} showActions={false} />, target);
}
