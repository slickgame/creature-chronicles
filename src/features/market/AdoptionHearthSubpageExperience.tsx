"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getNextTrustThreshold,
  getNpcNextUnlock,
  getNpcTrustRecord,
  getTamsinAdoptionFeeMultiplier,
  getTamsinArrivalRefreshMultiplier,
  getTamsinSpecialPlacementBonus,
  getTrustTierLabel,
  TOWN_NPCS,
} from "@/data/townNpcs";
import { getMarketRerollCost } from "@/data/market";
import { getTownUpgradeEffects } from "@/data/upgrades";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "./AdoptionHearthSubpageExperience.module.css";

const TAMSIN = TOWN_NPCS.tamsin_vale;
const TRUST_THRESHOLDS = [0, 20, 50, 90, 140] as const;
const ICONS = {
  gold: "/images/ui/currency/icon_currency_gold.png",
  board: "/images/buildings/town/market_stall.png",
  reroll: "/images/ui/icons/icon_reroll.png",
  ledger: "/images/ui/icons/icon_ranch_ledger.png",
  trust: "/images/ui/icons/icon_affection.png",
  check: "/images/ui/icons/icon_contract_scroll.png",
} as const;

type SubpageMode = "talk" | "trust";
type ConversationTopic = "welcome" | "hearth" | "choosing" | "special" | "standing";
type SuppressedElement = { element: HTMLElement; display: string };

type AttachedSubpage = {
  host: HTMLElement;
  root: HTMLElement;
  mode: SubpageMode;
};

function findHeading(text: string): HTMLHeadingElement | null {
  return Array.from(document.querySelectorAll<HTMLHeadingElement>("h2")).find(
    (heading) => (heading.textContent ?? "").trim() === text,
  ) ?? null;
}

function findSubpage(): { root: HTMLElement; mode: SubpageMode } | null {
  const talkHeading = findHeading("Placement Philosophy");
  if (talkHeading) {
    const detail = talkHeading.closest("section");
    const root = detail?.parentElement;
    if (root instanceof HTMLElement && root.tagName === "SECTION") return { root, mode: "talk" };
  }

  const trustHeading = findHeading("Current Benefits");
  if (trustHeading) {
    const detail = trustHeading.closest("section");
    const root = detail?.parentElement;
    if (root instanceof HTMLElement && root.tagName === "SECTION") return { root, mode: "trust" };
  }

  return null;
}

function findButtonByText(root: HTMLElement | null, label: string): HTMLButtonElement | undefined {
  if (!root) return undefined;
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    (button.textContent ?? "").includes(label),
  );
}

function getConversationCopy(topic: ConversationTopic, trustLevel: number): { title: string; body: string; note?: string } {
  switch (topic) {
    case "hearth":
      return {
        title: "About the Adoption Hearth",
        body: "Vale's Adoption Hearth is a placement service, not an ordinary creature shop. I screen each arrival, document what I can, and try to match them with a ranch that can actually support their needs.",
        note: "A placement is successful when the creature settles safely, not simply when the fee is paid.",
      };
    case "choosing":
      return {
        title: "Choosing the Right Creature",
        body: "Use the listing profile as a starting point. Premium grades can suggest unusual potential, but family, work fit, temperament, and the kind of routine your ranch can provide matter just as much.",
        note: "The full-details view is there when you want to inspect the complete creature profile before committing.",
      };
    case "special":
      if (trustLevel >= 4) {
        return {
          title: "Special Placements",
          body: "You've earned enough of my trust that I can show you some of the harder-to-place or unusually promising arrivals when they come through. Those cases are still rare, and I won't rush them for the sake of novelty.",
          note: "Favored standing adds a small bonus to special-placement arrivals and unlocks Gold personal requests.",
        };
      }
      if (trustLevel >= 2) {
        return {
          title: "Special Placements",
          body: "I do receive delicate and unusual cases, but I reserve them for ranches whose placement record I know well. Keep building your standing with me and I'll open more of that network to you.",
          note: "Higher Trust unlocks priority requests and eventually improves special-placement access.",
        };
      }
      return {
        title: "Special Placements",
        body: "I don't know your ranch well enough yet to recommend the difficult cases. Show me what kind of keeper you are through steady placements and responsible Guild work.",
        note: "Your next relationship tier begins opening Tamsin's personal request network.",
      };
    case "standing":
      return {
        title: "My Standing With You",
        body: trustLevel >= 5
          ? "You've proven what kind of keeper you are. I can trust you with the cases I would never post openly, and I know you'll tell me when a placement isn't right for your ranch."
          : trustLevel >= 3
            ? "You've built a real reputation here. I'm willing to prioritize your ranch for more sensitive work, but I still pay attention to what happens after every placement."
            : trustLevel >= 2
              ? "We're past introductions now. Your placements are giving me enough confidence to advocate for better fees and send some personal work your way."
              : "We're still getting to know each other. I care much more about consistent follow-through than a quick stack of completed transactions.",
        note: "Open the Welfare Ledger for your exact Trust progress, perks, and next unlock.",
      };
    default:
      return {
        title: "Placement Philosophy",
        body: "Start with steady care. I watch what happens after the adoption, not just whether you can pay the fee.",
        note: "Every listing represents a creature whose needs were screened, documented, and matched to a ranch that can support its family and temperament.",
      };
  }
}

function getThresholdForLevel(level: number): number {
  return TRUST_THRESHOLDS[Math.max(0, Math.min(TRUST_THRESHOLDS.length - 1, level - 1))] ?? 0;
}

export function AdoptionHearthSubpageExperience() {
  const { currentSave, goToTown, rerollMarket } = useGameContext();
  const [attached, setAttached] = useState<AttachedSubpage | null>(null);
  const [topic, setTopic] = useState<ConversationTopic>("welcome");
  const attachedRef = useRef<AttachedSubpage | null>(null);
  const suppressedRef = useRef<SuppressedElement[]>([]);

  useEffect(() => {
    let frame = 0;

    const restoreSuppressed = () => {
      for (const item of suppressedRef.current) item.element.style.display = item.display;
      suppressedRef.current = [];
    };

    const detach = () => {
      restoreSuppressed();
      const previous = attachedRef.current;
      if (previous) delete previous.host.dataset.adoptionSubpageExperience;
      attachedRef.current = null;
      setAttached(null);
    };

    const attach = (root: HTMLElement, mode: SubpageMode) => {
      const host = root.parentElement as HTMLElement | null;
      if (!host) return;
      const previous = attachedRef.current;
      if (previous?.root === root && previous.mode === mode) return;

      restoreSuppressed();
      if (previous) delete previous.host.dataset.adoptionSubpageExperience;

      host.dataset.adoptionSubpageExperience = mode;
      const header = Array.from(host.children).find(
        (element): element is HTMLElement => element instanceof HTMLElement && element.tagName === "HEADER",
      );
      for (const element of [header, root]) {
        if (!element) continue;
        suppressedRef.current.push({ element, display: element.style.display });
        element.style.setProperty("display", "none", "important");
      }

      const next = { host, root, mode };
      attachedRef.current = next;
      setAttached(next);
      setTopic("welcome");
    };

    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const found = findSubpage();
        if (!found) {
          if (attachedRef.current) detach();
          return;
        }
        if (attachedRef.current?.root === found.root && attachedRef.current.mode === found.mode) return;
        attach(found.root, found.mode);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      restoreSuppressed();
      const previous = attachedRef.current;
      if (previous) delete previous.host.dataset.adoptionSubpageExperience;
      attachedRef.current = null;
    };
  }, []);

  const trust = currentSave ? getNpcTrustRecord(currentSave, "tamsin_vale") : null;
  const marketEffects = useMemo(() => (currentSave ? getTownUpgradeEffects(currentSave) : null), [currentSave]);
  const rerollCost = currentSave ? getMarketRerollCost(currentSave) : 0;

  if (!attached || !currentSave || !trust || !marketEffects) return null;

  const clickBaseAction = (label: string) => findButtonByText(attached.root, label)?.click();
  const backToHearth = () => clickBaseAction("Back to Hearth");
  const reviewListings = () => clickBaseAction("Review Listings");
  const openTrustLedger = () => clickBaseAction("Open Trust Ledger");
  const trustTier = getTrustTierLabel(trust.level);
  const nextThreshold = getNextTrustThreshold(trust.points);
  const currentThreshold = getThresholdForLevel(trust.level);
  const tierSpan = nextThreshold ? Math.max(1, nextThreshold - currentThreshold) : 1;
  const tierProgress = nextThreshold
    ? Math.max(0, Math.min(100, ((trust.points - currentThreshold) / tierSpan) * 100))
    : 100;
  const adoptionDiscount = Math.round((1 - getTamsinAdoptionFeeMultiplier(currentSave)) * 100);
  const refreshDiscount = Math.round((1 - getTamsinArrivalRefreshMultiplier(currentSave)) * 100);
  const specialBonus = getTamsinSpecialPlacementBonus(currentSave);
  const totalSpecialChance = Math.max(0, marketEffects.marketVariantChance + specialBonus);
  const adoptedCount = (currentSave.creatures ?? []).filter((creature) => creature.origin === "market").length;
  const listingCount = currentSave.market?.listings.length ?? 0;
  const restockWeek = currentSave.market?.weekNumber ?? currentSave.dayState.weekNumber;

  const handleRefresh = () => {
    rerollMarket();
  };

  return createPortal(
    <section className={styles.root} data-adoption-subpage={attached.mode} aria-label={`Vale's Adoption Hearth ${attached.mode === "talk" ? "conversation" : "Welfare Ledger"}`}>
      <div className={styles.sceneShade} aria-hidden="true" />
      <header className={styles.topBar}>
        <div className={styles.identity}>
          <span>Vale&apos;s Adoption Hearth · {attached.mode === "talk" ? "Conversation" : "Welfare Ledger"}</span>
          <strong>{TAMSIN.name}</strong>
          <small>{TAMSIN.title}</small>
        </div>
        <div className={styles.topActions}>
          <div className={styles.currencyPill}><img src={ICONS.gold} alt="" /><span><small>Gold</small><strong>{formatGold(currentSave.currencies.gold)}</strong></span></div>
          <button type="button" onClick={backToHearth}>Back to Hearth</button>
          <button type="button" onClick={goToTown}>Back to Town</button>
        </div>
      </header>

      {attached.mode === "talk" ? (
        <ConversationScene
          trustTier={trustTier}
          trustPoints={trust.points}
          trustLevel={trust.level}
          topic={topic}
          onTopic={setTopic}
          onOpenLedger={openTrustLedger}
          onListings={reviewListings}
        />
      ) : (
        <WelfareLedger
          trustTier={trustTier}
          trustLevel={trust.level}
          trustPoints={trust.points}
          nextThreshold={nextThreshold}
          tierProgress={tierProgress}
          nextUnlock={getNpcNextUnlock(currentSave, "tamsin_vale")}
          adoptionDiscount={adoptionDiscount}
          refreshDiscount={refreshDiscount}
          specialBonus={specialBonus}
          totalSpecialChance={totalSpecialChance}
          adoptedCount={adoptedCount}
          listingCount={listingCount}
          restockWeek={restockWeek}
          rerollCost={rerollCost}
          canReroll={currentSave.currencies.gold >= rerollCost}
          onListings={reviewListings}
          onRefresh={handleRefresh}
        />
      )}
    </section>,
    attached.host,
  );
}

function ConversationScene({ trustTier, trustPoints, trustLevel, topic, onTopic, onOpenLedger, onListings }: {
  trustTier: string;
  trustPoints: number;
  trustLevel: number;
  topic: ConversationTopic;
  onTopic: (topic: ConversationTopic) => void;
  onOpenLedger: () => void;
  onListings: () => void;
}) {
  const copy = getConversationCopy(topic, trustLevel);
  const topics: { id: ConversationTopic; title: string; subtitle: string }[] = [
    { id: "hearth", title: "About the Adoption Hearth", subtitle: "How Tamsin handles placements" },
    { id: "choosing", title: "Choosing the Right Creature", subtitle: "What matters beyond premium grades" },
    { id: "special", title: "Special Placements", subtitle: "Rare arrivals and sensitive cases" },
    { id: "standing", title: "My Standing With You", subtitle: "How Tamsin views your ranch" },
  ];

  return <div className={styles.conversationLayout}>
    <section className={styles.conversationPanel}>
      <div className={styles.speakerRow}>
        <img src={TAMSIN.portraitPath} alt="" />
        <div><span>{TAMSIN.title}</span><h1>{TAMSIN.name}</h1></div>
        <b>{trustTier} · {trustPoints} Trust</b>
      </div>
      <div className={styles.dialogueCard}>
        <span>{copy.title}</span>
        <p>“{copy.body}”</p>
        {copy.note ? <small>{copy.note}</small> : null}
      </div>
      <p className={styles.prompt}>What would you like to ask about?</p>
      <div className={styles.topicList}>
        {topics.map((item) => <button key={item.id} type="button" className={topic === item.id ? styles.topicActive : ""} onClick={() => onTopic(item.id)}>
          <span><strong>{item.title}</strong><small>{item.subtitle}</small></span><b>›</b>
        </button>)}
      </div>
      <div className={styles.conversationActions}>
        <button type="button" onClick={onListings}><img src={ICONS.board} alt="" /> Review Listings</button>
        <button type="button" onClick={onOpenLedger}><img src={ICONS.ledger} alt="" /> Open Welfare Ledger</button>
      </div>
    </section>
    <figure className={styles.tamsinFigure} aria-label="Tamsin Vale"><img src={TAMSIN.portraitPath} alt="Tamsin Vale" /></figure>
  </div>;
}

function WelfareLedger({ trustTier, trustLevel, trustPoints, nextThreshold, tierProgress, nextUnlock, adoptionDiscount, refreshDiscount, specialBonus, totalSpecialChance, adoptedCount, listingCount, restockWeek, rerollCost, canReroll, onListings, onRefresh }: {
  trustTier: string;
  trustLevel: number;
  trustPoints: number;
  nextThreshold: number | null;
  tierProgress: number;
  nextUnlock: string;
  adoptionDiscount: number;
  refreshDiscount: number;
  specialBonus: number;
  totalSpecialChance: number;
  adoptedCount: number;
  listingCount: number;
  restockWeek: number;
  rerollCost: number;
  canReroll: boolean;
  onListings: () => void;
  onRefresh: () => void;
}) {
  const benefits = [
    { level: 1, icon: ICONS.board, title: "Adoption Board Access", detail: "Browse Tamsin's screened weekly placements." },
    { level: 2, icon: ICONS.gold, title: "Adoption Fee Advocacy", detail: `${adoptionDiscount || 5}% cheaper adoption fees and personal Guild requests.` },
    { level: 3, icon: ICONS.reroll, title: "Priority Arrival Network", detail: `${refreshDiscount || 10}% cheaper arrival refreshes and priority personal requests.` },
    { level: 4, icon: ICONS.trust, title: "Special Placements", detail: `+${(specialBonus * 100).toFixed(1)}% special placement chance and Gold personal requests.` },
    { level: 5, icon: ICONS.check, title: "Confidant Network", detail: "10% cheaper adoption fees and Confidant request rewards." },
  ];

  return <div className={styles.ledgerLayout}>
    <aside className={styles.ledgerTamsin}>
      <img src={TAMSIN.portraitPath} alt="Tamsin Vale" />
      <span>{TAMSIN.title}</span>
      <h2>{TAMSIN.name}</h2>
      <p>“Every placement matters. Trust is what lets me put the difficult cases in the right hands.”</p>
      <div className={styles.miniRecord}><span>Hearth Adoptions</span><strong>{adoptedCount}</strong></div>
      <div className={styles.miniRecord}><span>Current Listings</span><strong>{listingCount}</strong></div>
      <div className={styles.miniRecord}><span>Restock</span><strong>Week {restockWeek}</strong></div>
    </aside>

    <main className={styles.ledgerMain}>
      <section className={styles.standingCard}>
        <div className={styles.standingHeader}><div><span>Your Standing</span><h1>{trustTier}</h1></div><strong>{nextThreshold ? `${trustPoints} / ${nextThreshold} Trust` : `${trustPoints} Trust · Max`}</strong></div>
        <div className={styles.progressTrack} aria-label={`${Math.round(tierProgress)} percent toward next Trust tier`}><span style={{ width: `${tierProgress}%` }} /></div>
        <div className={styles.nextUnlock}><span>Next relationship unlock</span><strong>{trustLevel >= 5 ? "Maximum Trust reached" : nextUnlock}</strong></div>
      </section>

      <section className={styles.pathSection}>
        <div className={styles.sectionHeading}><span>Relationship Path</span><small>Trust with Tamsin unlocks placement and Guild benefits.</small></div>
        <div className={styles.trustPath}>
          {TRUST_THRESHOLDS.map((threshold, index) => {
            const level = index + 1;
            const reached = trustPoints >= threshold;
            const current = trustLevel === level;
            return <div key={threshold} className={`${styles.pathStep} ${reached ? styles.pathReached : ""} ${current ? styles.pathCurrent : ""}`}>
              <div className={styles.pathMarker}>{reached ? "✓" : level}</div>
              <strong>{getTrustTierLabel(level)}</strong>
              <small>{threshold} Trust</small>
              <span>{TAMSIN.trustUnlocks[level as 1 | 2 | 3 | 4 | 5]}</span>
            </div>;
          })}
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.sectionHeading}><span>Adoption Network Benefits</span><small>Unlocked perks are active immediately.</small></div>
        <div className={styles.benefitGrid}>
          {benefits.map((benefit) => {
            const active = trustLevel >= benefit.level;
            const next = !active && benefit.level === trustLevel + 1;
            return <article key={benefit.level} className={`${styles.benefitCard} ${active ? styles.benefitActive : ""} ${next ? styles.benefitNext : ""}`}>
              <img src={benefit.icon} alt="" />
              <div><span>{active ? "Active" : next ? "Next" : "Locked"}</span><h3>{benefit.title}</h3><p>{benefit.detail}</p></div>
            </article>;
          })}
        </div>
      </section>

      <section className={styles.placementRecord}>
        <div className={styles.sectionHeading}><span>Placement Record</span><small>Current values from Tamsin's live network.</small></div>
        <div className={styles.recordGrid}>
          <div><span>Adoption Discount</span><strong>{adoptionDiscount}%</strong></div>
          <div><span>Arrival Refresh Discount</span><strong>{refreshDiscount}%</strong></div>
          <div><span>Special Arrival Chance</span><strong>{(totalSpecialChance * 100).toFixed(2)}%</strong></div>
          <div><span>Refresh Cost</span><strong>{formatGold(rerollCost)}</strong></div>
        </div>
      </section>

      <div className={styles.ledgerActions}>
        <button type="button" onClick={onListings}><img src={ICONS.board} alt="" /> Review Listings</button>
        <button type="button" onClick={onRefresh} disabled={!canReroll}><img src={ICONS.reroll} alt="" /> Refresh Arrivals · {formatGold(rerollCost)}</button>
      </div>
    </main>
  </div>;
}
