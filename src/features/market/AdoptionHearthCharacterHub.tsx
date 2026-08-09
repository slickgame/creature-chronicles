"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getMarketRerollCost } from "@/data/market";
import { getNpcTrustRecord, getTrustTierLabel, TOWN_NPCS } from "@/data/townNpcs";
import { getTotalTownUpgradeTiers, getTownUpgradeEffects } from "@/data/upgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./AdoptionHearthCharacterHub.module.css";

const TAMSIN = TOWN_NPCS.tamsin_vale;
const ICONS = {
  gold: "/images/ui/currency/icon_currency_gold.png",
  gp: "/images/ui/icons/icon_guild_points.png",
  board: "/images/buildings/town/market_stall.png",
  reroll: "/images/ui/icons/icon_reroll.png",
  ledger: "/images/ui/icons/icon_ranch_ledger.png",
} as const;

type SuppressedElement = {
  element: HTMLElement;
  display: string;
};

function findInterior(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[aria-label="Vale\'s Adoption Hearth interior"]');
}

function getGreeting(listingCount: number, capacity: number, trustLevel: number): string {
  if (trustLevel >= 5) {
    return listingCount > 0
      ? `I kept a close eye on this week's arrivals. There are ${listingCount} placements ready, including a few I thought you should see personally.`
      : "The board is quiet for the moment. I will send word if a placement comes through that needs your particular care.";
  }
  if (trustLevel >= 4) {
    return listingCount > 0
      ? `I've started setting aside the more delicate cases for you. There are ${listingCount} placements on the board today.`
      : "Nothing urgent today. That is usually good news in my line of work.";
  }
  if (trustLevel >= 2) {
    return listingCount >= capacity
      ? `We've got a full board right now. Take your time with the matches; a careful placement matters more than a fast one.`
      : `Welcome back. I have ${listingCount} current placements ready for review. Let me know what kind of home you can offer.`;
  }
  return listingCount >= capacity
    ? "We've got a full board right now. Some need quiet homes, some need useful work, and a few just need someone patient enough to earn their trust."
    : "Welcome back. I've reviewed this week's placements carefully. A rushed placement helps no one, so take your time with the board.";
}

function findBaseActionButton(interior: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(interior.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    (button.textContent ?? "").includes(label),
  );
}

export function AdoptionHearthCharacterHub() {
  const { currentSave, goToTown } = useGameContext();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const interiorRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLElement | null>(null);
  const suppressedRef = useRef<SuppressedElement[]>([]);

  useEffect(() => {
    let frame = 0;

    const restoreSuppressed = () => {
      for (const item of suppressedRef.current) item.element.style.display = item.display;
      suppressedRef.current = [];
    };

    const detach = () => {
      restoreSuppressed();
      if (hostRef.current) delete hostRef.current.dataset.adoptionCharacterHubActive;
      hostRef.current = null;
      interiorRef.current = null;
      setHost(null);
    };

    const attach = (interior: HTMLElement) => {
      const nextHost = interior.parentElement as HTMLElement | null;
      if (!nextHost || nextHost === hostRef.current) return;

      restoreSuppressed();
      if (hostRef.current) delete hostRef.current.dataset.adoptionCharacterHubActive;

      hostRef.current = nextHost;
      interiorRef.current = interior;
      nextHost.dataset.adoptionCharacterHubActive = "true";

      const candidates = Array.from(nextHost.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement && child.dataset.adoptionCharacterHubOverlay !== "true",
      );
      for (const element of candidates) {
        suppressedRef.current.push({ element, display: element.style.display });
        element.style.setProperty("display", "none", "important");
      }

      setHost(nextHost);
    };

    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const interior = findInterior();
        if (!interior) {
          if (hostRef.current) detach();
          return;
        }
        const nextHost = interior.parentElement as HTMLElement | null;
        if (nextHost === hostRef.current) return;
        attach(interior);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      restoreSuppressed();
      if (hostRef.current) delete hostRef.current.dataset.adoptionCharacterHubActive;
      hostRef.current = null;
      interiorRef.current = null;
    };
  }, []);

  const syncedSave = currentSave;
  const marketEffects = useMemo(() => (syncedSave ? getTownUpgradeEffects(syncedSave) : null), [syncedSave]);
  const listingCount = syncedSave?.market?.listings.length ?? 0;
  const capacity = marketEffects?.marketListingCount ?? listingCount;
  const rerollCost = syncedSave ? getMarketRerollCost(syncedSave) : 0;
  const adoptionLevel = syncedSave ? getTotalTownUpgradeTiers(syncedSave, "market") + 1 : 1;
  const trust = syncedSave ? getNpcTrustRecord(syncedSave, "tamsin_vale") : null;
  const trustTier = trust ? getTrustTierLabel(trust.level) : "New Contact";
  const greeting = getGreeting(listingCount, capacity, trust?.level ?? 1);

  function clickBaseAction(label: string) {
    const interior = interiorRef.current;
    if (!interior) return;
    findBaseActionButton(interior, label)?.click();
  }

  if (!host || !syncedSave || !marketEffects) return null;

  const canReroll = syncedSave.currencies.gold >= rerollCost;

  return createPortal(
    <section
      className={styles.hubRoot}
      data-adoption-character-hub-overlay="true"
      data-adoption-character-hub="tamsin"
      aria-label="Vale's Adoption Hearth with Tamsin Vale"
    >
      <header className={styles.topBar}>
        <div className={styles.identity}>
          <span>Vale&apos;s Adoption Hearth · Lv. {adoptionLevel}</span>
          <strong>{TAMSIN.name}</strong>
          <small>{TAMSIN.title}</small>
        </div>
        <div className={styles.topActions}>
          <div className={styles.currencyPill}>
            <img src={ICONS.gold} alt="" />
            <span><small>Gold</small><strong>{formatGold(syncedSave.currencies.gold)}</strong></span>
          </div>
          <div className={styles.currencyPill}>
            <img src={ICONS.gp} alt="" />
            <span><small>GP</small><strong>{formatGuildPoints(syncedSave.currencies.guildPoints)}</strong></span>
          </div>
          <button type="button" onClick={goToTown}>Back to Town</button>
        </div>
      </header>

      <button
        type="button"
        className={styles.boardHotspot}
        data-adoption-hub-action="board"
        onClick={() => clickBaseAction("View Adoption Listings")}
        aria-label={`Open Adoption Board, ${listingCount} of ${capacity} listings ready`}
      >
        <span className={styles.hotspotGlow} aria-hidden="true" />
        <span className={styles.hotspotLabel}>
          <img src={ICONS.board} alt="" />
          <span><strong>Adoption Board</strong><small>{listingCount} / {capacity} listings ready</small></span>
        </span>
      </button>

      <figure className={styles.tamsinFigure} aria-label="Tamsin Vale, Adoption Steward">
        <img src={TAMSIN.portraitPath} alt="Tamsin Vale" />
      </figure>

      <section className={styles.dialoguePanel}>
        <div className={styles.speakerRow}>
          <img src={TAMSIN.portraitPath} alt="" />
          <div>
            <span>{TAMSIN.title}</span>
            <h2>{TAMSIN.name}</h2>
          </div>
          <span className={styles.trustBadge}>{trustTier} · {trust?.points ?? 0}{trust && trust.level < 5 ? `/${[20, 50, 90, 140][trust.level - 1] ?? 20}` : ""} Trust</span>
        </div>

        <p className={styles.greeting}>“{greeting}”</p>
        <div className={styles.menuPrompt}>What do you need?</div>
        <div className={styles.actionList}>
          <button type="button" data-adoption-hub-action="listings" onClick={() => clickBaseAction("View Adoption Listings")}>
            <img src={ICONS.board} alt="" />
            <span><strong>View Adoption Listings</strong><small>Browse available placements</small></span>
            <b>{listingCount} ready</b>
          </button>
          <button type="button" data-adoption-hub-action="talk" onClick={() => clickBaseAction("Talk to Tamsin")}>
            <img src={TAMSIN.portraitPath} alt="" />
            <span><strong>Talk to Tamsin</strong><small>Ask for guidance and placement advice</small></span>
            <b>Talk</b>
          </button>
          <button type="button" data-adoption-hub-action="trust" onClick={() => clickBaseAction("Trust / Welfare Ledger")}>
            <img src={ICONS.ledger} alt="" />
            <span><strong>Trust / Welfare Ledger</strong><small>Review trust, history, and welfare notes</small></span>
            <b>{trustTier}</b>
          </button>
          <button type="button" data-adoption-hub-action="refresh" onClick={() => clickBaseAction("Refresh Arrivals")} disabled={!canReroll}>
            <img src={ICONS.reroll} alt="" />
            <span><strong>Refresh Arrivals</strong><small>Bring in a new set of potential placements</small></span>
            <b>{formatGold(rerollCost)}</b>
          </button>
        </div>
        <button type="button" className={styles.leaveButton} onClick={goToTown}>Leave Adoption Hearth</button>
      </section>
    </section>,
    host,
  );
}
