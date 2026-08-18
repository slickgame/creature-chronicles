"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getTotalTownUpgradeTiers } from "@/data/upgrades";
import { getNextTrustThreshold, getNpcNextUnlock, getNpcTrustRecord, getTrustTierLabel, TOWN_NPCS } from "@/data/townNpcs";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { GuildContract } from "@/types/guild";
import styles from "./GuildHallCharacterHub.module.css";
import polishStyles from "./GuildHallCharacterHub.polish.module.css";

const MARA = TOWN_NPCS.mara_vell;
const ICONS = {
  board: "/images/ui/icons/icon_contract_scroll.png",
  services: "/images/ui/icons/icon_guild_points.png",
  records: "/images/ui/icons/icon_ranch_ledger.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
} as const;

type HubPanel = "menu" | "relationship" | "records";

type SuppressedElement = {
  element: HTMLElement;
  hidden: boolean;
  display: string;
  displayPriority: string;
  ariaHidden: string | null;
};

function classNames(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(" ");
}

function isHomeMaraButton(button: HTMLButtonElement): boolean {
  const text = button.textContent ?? "";
  return text.includes("Mara Vell") && text.includes("upgrade tiers purchased");
}

function findGuildHallHomeHost(): HTMLElement | null {
  const maraButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(isHomeMaraButton);
  return maraButton?.closest<HTMLElement>("section") ?? null;
}

function getDynamicGreeting(
  availableCount: number,
  acceptedCount: number,
  completedCount: number,
  trustLevel: number,
): string {
  if (acceptedCount > 0) {
    return `Back again? You still have ${acceptedCount} accepted ${acceptedCount === 1 ? "request" : "requests"} on the ledger. I can pull the board up whenever you're ready.`;
  }
  if (trustLevel >= 5) {
    return availableCount > 0
      ? `Good timing. I've kept an eye out for work worth your ranch's reputation. There ${availableCount === 1 ? "is" : "are"} ${availableCount} open ${availableCount === 1 ? "request" : "requests"} today.`
      : "Quiet board today. That gives us a rare chance to look over the Guild ledger without someone shouting about an emergency.";
  }
  if (trustLevel >= 3) {
    return availableCount > 0
      ? `You're becoming one of my reliable names. I've got ${availableCount} open ${availableCount === 1 ? "request" : "requests"}, plus the town-service ledger if you want to put those Guild Points to work.`
      : "Nothing urgent on the board right now. We can still talk upgrades, Trust, or how your Guild record is shaping up.";
  }
  if (completedCount === 0) {
    return availableCount > 0
      ? `Welcome in. I'm Mara Vell. The board has ${availableCount} open ${availableCount === 1 ? "request" : "requests"}; finish good work and I'll turn that Guild credit into better town services.`
      : "Welcome in. I'm Mara Vell. The request board is quiet for the moment, but I can still show you how Guild work and town services fit together.";
  }
  return availableCount > 0
    ? `Back again? I've got ${availableCount} open ${availableCount === 1 ? "request" : "requests"} on the board. What do you need?`
    : "Back again? The board is quiet, but there's always paperwork. What do you need?";
}

function sortRecentCompleted(contracts: GuildContract[]): GuildContract[] {
  return contracts
    .filter((contract) => contract.status === "completed")
    .sort((a, b) => (b.completedAtDayNumber ?? 0) - (a.completedAtDayNumber ?? 0))
    .slice(0, 4);
}

export function GuildHallCharacterHub() {
  const { currentSave, goToMainMenu, goToTown } = useGameContext();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useState<HubPanel>("menu");
  const hostRef = useRef<HTMLElement | null>(null);
  const suppressedRef = useRef<SuppressedElement[]>([]);

  useEffect(() => {
    let frame = 0;

    const restoreSuppressed = () => {
      for (const item of suppressedRef.current) {
        item.element.hidden = item.hidden;
        if (item.display) item.element.style.setProperty("display", item.display, item.displayPriority);
        else item.element.style.removeProperty("display");
        if (item.ariaHidden === null) item.element.removeAttribute("aria-hidden");
        else item.element.setAttribute("aria-hidden", item.ariaHidden);
      }
      suppressedRef.current = [];
    };

    const suppressBaseHomeUi = (nextHost: HTMLElement) => {
      restoreSuppressed();
      const candidates = Array.from(nextHost.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
      for (const element of candidates) {
        if (element.dataset.guildCharacterHubOverlay === "true") continue;
        if (element.tagName !== "HEADER" && element.tagName !== "SECTION" && element.tagName !== "BUTTON") continue;
        suppressedRef.current.push({
          element,
          hidden: element.hidden,
          display: element.style.getPropertyValue("display"),
          displayPriority: element.style.getPropertyPriority("display"),
          ariaHidden: element.getAttribute("aria-hidden"),
        });
        element.hidden = true;
        element.setAttribute("aria-hidden", "true");
        element.style.setProperty("display", "none", "important");
      }
      nextHost.dataset.guildCharacterHubActive = "true";
    };

    const detachHost = () => {
      if (hostRef.current) delete hostRef.current.dataset.guildCharacterHubActive;
      restoreSuppressed();
      hostRef.current = null;
      setHost(null);
    };

    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const nextHost = findGuildHallHomeHost();
        if (!nextHost) {
          if (hostRef.current) detachHost();
          return;
        }
        if (nextHost === hostRef.current) return;
        if (hostRef.current) delete hostRef.current.dataset.guildCharacterHubActive;
        hostRef.current = nextHost;
        suppressBaseHomeUi(nextHost);
        setPanel("menu");
        setHost(nextHost);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      if (hostRef.current) delete hostRef.current.dataset.guildCharacterHubActive;
      restoreSuppressed();
      hostRef.current = null;
    };
  }, []);

  const contracts = currentSave?.guild?.contracts ?? [];
  const availableCount = contracts.filter((contract) => contract.status === "available").length;
  const acceptedCount = contracts.filter((contract) => contract.status === "accepted").length;
  const completedContracts = useMemo(() => sortRecentCompleted(contracts), [contracts]);
  const completedCount = currentSave?.guild?.completedCount ?? completedContracts.length;
  const guildRank = currentSave?.guild?.guildRank ?? 1;
  const marketLevel = currentSave ? getTotalTownUpgradeTiers(currentSave, "market") + 1 : 1;
  const boardLevel = currentSave ? getTotalTownUpgradeTiers(currentSave, "guild") + 1 : 1;
  const maraTrust = currentSave ? getNpcTrustRecord(currentSave, "mara_vell") : null;
  const trustTier = maraTrust ? getTrustTierLabel(maraTrust.level) : "New Contact";
  const nextTrustThreshold = maraTrust ? getNextTrustThreshold(maraTrust.points) : 20;
  const nextTrustUnlock = currentSave ? getNpcNextUnlock(currentSave, "mara_vell") : MARA.trustUnlocks[2];
  const greeting = getDynamicGreeting(availableCount, acceptedCount, completedCount, maraTrust?.level ?? 1);

  function clickBaseHomeAction(kind: "board" | "services") {
    if (!host) return;
    const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>(":scope > button"));
    const button = kind === "board"
      ? buttons.find((candidate) => (candidate.textContent ?? "").includes("Request Board"))
      : buttons.find(isHomeMaraButton);
    button?.click();
  }

  if (!host || !currentSave) return null;

  return createPortal(
    <section
      className={styles.hubRoot}
      data-guild-character-hub-overlay="true"
      data-guild-character-hub="mara"
      aria-label="Guild Hall with Mara Vell"
    >
      <header className={styles.topBar}>
        <div className={styles.locationIdentity}>
          <span>Guild Hall</span>
          <strong>Mara Vell</strong>
          <small>Guild Quartermaster</small>
        </div>
        <div className={styles.topActions}>
          <div className={styles.currencyPill}>
            <img src={ICONS.gold} alt="" />
            <span><small>Gold</small><strong>{formatGold(currentSave.currencies.gold)}</strong></span>
          </div>
          <div className={styles.currencyPill}>
            <img src={ICONS.gp} alt="" />
            <span><small>Guild Points</small><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></span>
          </div>
          <button type="button" onClick={goToTown}>Back to Town</button>
          <button type="button" onClick={goToMainMenu}>Main Menu</button>
        </div>
      </header>

      <button
        type="button"
        className={classNames(styles.physicalBoardHotspot, polishStyles.physicalBoardHotspot)}
        data-guild-hub-action="board"
        onClick={() => clickBaseHomeAction("board")}
        aria-label={`Open Request Board, ${availableCount} available`}
      >
        <span className={styles.hotspotGlow} aria-hidden="true" />
        <span className={classNames(styles.hotspotLabel, polishStyles.hotspotLabel)}>
          <img src={ICONS.board} alt="" />
          <span><strong>Request Board</strong><small>{availableCount} available · Board Lv. {boardLevel}</small></span>
        </span>
      </button>

      <figure className={classNames(styles.maraFigure, polishStyles.maraFigure)} aria-label="Mara Vell, Guild Quartermaster">
        <img src={MARA.profilePath} alt="Mara Vell" />
      </figure>

      <section className={classNames(styles.dialoguePanel, polishStyles.dialoguePanel)} data-guild-hub-panel={panel}>
        <div className={styles.speakerRow}>
          <img src={MARA.portraitPath} alt="" />
          <div>
            <span>{MARA.title}</span>
            <h2>{MARA.name}</h2>
          </div>
          <span className={styles.trustBadge}>{trustTier}{maraTrust ? ` · ${maraTrust.points} Trust` : ""}</span>
        </div>

        {panel === "menu" ? (
          <>
            <p className={styles.greeting}>“{greeting}”</p>
            <div className={styles.menuPrompt}>What do you need?</div>
            <div className={styles.actionList}>
              <button type="button" data-guild-hub-action="board-menu" onClick={() => clickBaseHomeAction("board")}>
                <img src={ICONS.board} alt="" />
                <span><strong>Request Board</strong><small>Browse current Guild contracts</small></span>
                <b>{availableCount} open</b>
              </button>
              <button type="button" data-guild-hub-action="services" onClick={() => clickBaseHomeAction("services")}>
                <img src={ICONS.services} alt="" />
                <span><strong>Guild Services</strong><small>Spend GP on Market and Board upgrades</small></span>
                <b>{formatGuildPoints(currentSave.currencies.guildPoints)}</b>
              </button>
              <button type="button" data-guild-hub-action="relationship" onClick={() => setPanel("relationship")}>
                <img src={MARA.portraitPath} alt="" />
                <span><strong>My Standing with Mara</strong><small>Trust benefits and the next relationship unlock</small></span>
                <b>{trustTier}</b>
              </button>
              <button type="button" data-guild-hub-action="records" onClick={() => setPanel("records")}>
                <img src={ICONS.records} alt="" />
                <span><strong>Guild Records</strong><small>Rank, completed work, and recent contracts</small></span>
                <b>Rank {guildRank}</b>
              </button>
            </div>
            <button type="button" className={styles.leaveButton} onClick={goToTown}>Leave Guild Hall</button>
          </>
        ) : null}

        {panel === "relationship" ? (
          <div className={styles.subPanel} data-guild-hub-relationship="true">
            <div className={styles.subPanelHeader}>
              <div><span>Personal Trust</span><h3>{trustTier}</h3></div>
              <button type="button" onClick={() => setPanel("menu")}>Back</button>
            </div>
            <p>{MARA.intro}</p>
            <div className={styles.trustMeter}>
              <div className={styles.trustMeterTop}>
                <strong>{maraTrust?.points ?? 0} Trust</strong>
                <span>{nextTrustThreshold ? `Next at ${nextTrustThreshold}` : "Maximum standing"}</span>
              </div>
              <div className={styles.trustTrack}>
                <span style={{ width: `${nextTrustThreshold ? Math.min(100, ((maraTrust?.points ?? 0) / nextTrustThreshold) * 100) : 100}%` }} />
              </div>
            </div>
            <div className={styles.relationshipBenefit}>
              <span>Current Benefit</span>
              <strong>{MARA.trustUnlocks[maraTrust?.level ?? 1] ?? "Standard Guild work orders"}</strong>
            </div>
            <div className={styles.relationshipBenefit}>
              <span>Next Unlock</span>
              <strong>{nextTrustThreshold ? nextTrustUnlock : "Mara's maximum Trust benefits are active."}</strong>
            </div>
            <button type="button" className={styles.primaryPanelButton} onClick={() => clickBaseHomeAction("board")}>See Mara's Requests</button>
          </div>
        ) : null}

        {panel === "records" ? (
          <div className={styles.subPanel} data-guild-hub-records="true">
            <div className={styles.subPanelHeader}>
              <div><span>Guild Ledger</span><h3>Ranch Record</h3></div>
              <button type="button" onClick={() => setPanel("menu")}>Back</button>
            </div>
            <div className={styles.recordGrid}>
              <div><span>Guild Rank</span><strong>{guildRank}</strong></div>
              <div><span>Completed</span><strong>{completedCount}</strong></div>
              <div><span>Accepted</span><strong>{acceptedCount}</strong></div>
              <div><span>Open Board</span><strong>{availableCount}</strong></div>
              <div><span>Market</span><strong>Lv. {marketLevel}</strong></div>
              <div><span>Board</span><strong>Lv. {boardLevel}</strong></div>
            </div>
            <div className={styles.recentLedger}>
              <span>Recent Completed Work</span>
              {completedContracts.length ? completedContracts.map((contract) => (
                <div key={String(contract.contractId)}>
                  <strong>{contract.title}</strong>
                  <small>{contract.requesterName} · {contract.tier} · Ranch Day {contract.completedAtDayNumber ?? "—"}</small>
                </div>
              )) : <p>No completed Guild contracts yet.</p>}
            </div>
            <button type="button" className={styles.primaryPanelButton} onClick={() => clickBaseHomeAction("board")}>Open Request Board</button>
          </div>
        ) : null}
      </section>
    </section>,
    host,
  );
}
