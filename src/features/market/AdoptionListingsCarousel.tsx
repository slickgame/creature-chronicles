"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getMarketListingDescription,
  getMarketListingImage,
  getMarketListingPreview,
  getMarketListingPrice,
  getMarketRerollCost,
} from "@/data/market";
import { getVariantDefinition } from "@/data/creatures";
import { getNpcNextUnlock, getNpcTrustRecord, getTrustTierLabel, TOWN_NPCS } from "@/data/townNpcs";
import { getTownUpgradeEffects } from "@/data/upgrades";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, HabitatId } from "@/types/ids";
import type { MarketListing } from "@/types/market";
import type { GameSave } from "@/types/save";
import styles from "./AdoptionListingsCarousel.module.css";

const TAMSIN = TOWN_NPCS.tamsin_vale;
const GRADE_RANK: Record<string, number> = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
const STAT_LABELS: Record<string, string> = {
  str: "STR",
  end: "END",
  wil: "WIL",
  spd: "SPD",
  cha: "CHA",
  fer: "FER",
  hp: "HP",
  atk: "ATK",
  def: "DEF",
};

const ICONS = {
  gold: "/images/ui/currency/icon_currency_gold.png",
  reroll: "/images/ui/icons/icon_reroll.png",
  ledger: "/images/ui/icons/icon_ranch_ledger.png",
  sold: "/images/ui/icons/icon_sold.png",
} as const;

type SuppressedElement = { element: HTMLElement; display: string };

function findListingsPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('section[aria-label="Adoption listings"]');
}

function findButtonByText(root: HTMLElement | null, label: string): HTMLButtonElement | undefined {
  if (!root) return undefined;
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find((button) =>
    (button.textContent ?? "").includes(label),
  );
}

function createMarketPreviewCreature(save: GameSave, listing: MarketListing): CreatureRecord {
  const variant = getVariantDefinition(listing.variantId);
  const preview = getMarketListingPreview(save, listing);
  return {
    creatureId: `preview_${listing.listingId}` as CreatureId,
    ownerSaveId: save.saveId,
    speciesId: listing.speciesId,
    variantId: listing.variantId,
    habitatId: `habitat_${listing.family}` as HabitatId,
    nickname: listing.displayName,
    level: 1,
    xp: 0,
    xpToNext: 75,
    stats: preview.stats,
    statGrades: preview.statGrades,
    abilities: preview.abilities,
    energy: preview.maxEnergy,
    maxEnergy: preview.maxEnergy,
    hearts: preview.maxHearts,
    maxHearts: preview.maxHearts,
    affection: 35,
    generation: 1,
    shiny: false,
    cosmeticVariant: null,
    origin: "market",
    originLabel: `Adoption Preview · Week ${listing.weekNumber}`,
    isLocked: false,
    createdAt: listing.createdAt,
    notes: variant.description,
  };
}

function getPlacementFit(family: string): string {
  switch (family) {
    case "equine": return "Field work & hauling";
    case "canine": return "Ranch utility & companionship";
    case "lapine": return "Garden work & fast growth";
    case "feline": return "Pest control & companionship";
    case "bovine": return "Heavy ranch work & production";
    default: return "General ranch placement";
  }
}

function getTopGrades(save: GameSave, listing: MarketListing) {
  const preview = getMarketListingPreview(save, listing);
  return Object.entries(preview.statGrades)
    .map(([key, grade]) => ({ key, label: STAT_LABELS[key.toLowerCase()] ?? key.toUpperCase(), grade: String(grade) }))
    .sort((a, b) => (GRADE_RANK[b.grade] ?? 0) - (GRADE_RANK[a.grade] ?? 0) || a.label.localeCompare(b.label))
    .slice(0, 3);
}

function getPremiumGradeCount(save: GameSave, listing: MarketListing): number {
  return Object.values(getMarketListingPreview(save, listing).statGrades).filter((grade) => grade === "A" || grade === "S").length;
}

function getTamsinNote(save: GameSave, listing: MarketListing): string {
  const topGrades = getTopGrades(save, listing);
  const best = topGrades[0]?.label;
  if (best === "FER") return "The fertility profile stands out. I would place this one with a ranch prepared to manage lineage carefully.";
  if (best === "WIL") return "A steady will usually makes the transition easier. Give this one structure and time to settle.";
  if (best === "STR" || best === "END") return "Dependable working potential here. This one should do well with patient, consistent ranch routines.";
  if (best === "SPD") return "Quick and energetic. I would make sure there is enough work and space to keep that energy pointed somewhere useful.";
  if (best === "CHA") return "This one presents as socially promising. A ranch with regular attention should help them settle quickly.";
  return `A sound ${listing.family} placement. I would focus less on perfect numbers and more on whether your ranch fits the creature.`;
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return (index + length) % length;
}

export function AdoptionListingsCarousel() {
  const { buyMarketCreature, currentSave, goToTown, rerollMarket } = useGameContext();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailListing, setDetailListing] = useState<MarketListing | null>(null);
  const [confirmListing, setConfirmListing] = useState<MarketListing | null>(null);
  const [feedback, setFeedback] = useState("");
  const hostRef = useRef<HTMLElement | null>(null);
  const baseGridRef = useRef<HTMLElement | null>(null);
  const suppressedRef = useRef<SuppressedElement[]>([]);

  useEffect(() => {
    let frame = 0;

    const restoreSuppressed = () => {
      for (const item of suppressedRef.current) item.element.style.display = item.display;
      suppressedRef.current = [];
    };

    const detach = () => {
      restoreSuppressed();
      if (hostRef.current) delete hostRef.current.dataset.adoptionCarouselActive;
      hostRef.current = null;
      baseGridRef.current = null;
      setHost(null);
    };

    const attach = (panel: HTMLElement) => {
      const grid = panel.parentElement as HTMLElement | null;
      const frameHost = grid?.parentElement as HTMLElement | null;
      if (!grid || !frameHost || frameHost === hostRef.current) return;

      restoreSuppressed();
      if (hostRef.current) delete hostRef.current.dataset.adoptionCarouselActive;

      hostRef.current = frameHost;
      baseGridRef.current = grid;
      frameHost.dataset.adoptionCarouselActive = "true";

      const header = Array.from(frameHost.children).find(
        (element): element is HTMLElement => element instanceof HTMLElement && element.tagName === "HEADER",
      );
      for (const element of [header, grid]) {
        if (!element) continue;
        suppressedRef.current.push({ element, display: element.style.display });
        element.style.setProperty("display", "none", "important");
      }

      setHost(frameHost);
    };

    const scan = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const panel = findListingsPanel();
        if (!panel) {
          if (hostRef.current) detach();
          return;
        }
        const nextHost = panel.parentElement?.parentElement as HTMLElement | null;
        if (nextHost === hostRef.current) return;
        attach(panel);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      restoreSuppressed();
      if (hostRef.current) delete hostRef.current.dataset.adoptionCarouselActive;
      hostRef.current = null;
      baseGridRef.current = null;
    };
  }, []);

  const listings = currentSave?.market?.listings ?? [];
  const marketEffects = useMemo(() => (currentSave ? getTownUpgradeEffects(currentSave) : null), [currentSave]);
  const trust = currentSave ? getNpcTrustRecord(currentSave, "tamsin_vale") : null;
  const trustTier = trust ? getTrustTierLabel(trust.level) : "New Contact";
  const rerollCost = currentSave ? getMarketRerollCost(currentSave) : 0;

  useEffect(() => {
    if (listings.length === 0) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= listings.length) setActiveIndex(listings.length - 1);
  }, [activeIndex, listings.length]);

  useEffect(() => {
    if (!host || listings.length <= 1) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (detailListing || confirmListing) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((index) => wrapIndex(index - 1, listings.length));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((index) => wrapIndex(index + 1, listings.length));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmListing, detailListing, host, listings.length]);

  if (!host || !currentSave || !marketEffects) return null;

  const activeListing = listings[activeIndex] ?? null;
  const previousListing = listings.length > 1 ? listings[wrapIndex(activeIndex - 1, listings.length)] : null;
  const nextListing = listings.length > 1 ? listings[wrapIndex(activeIndex + 1, listings.length)] : null;

  const goBackToHearth = () => {
    const button = findButtonByText(baseGridRef.current, "Back to Hearth");
    if (button) button.click();
  };

  const handleReroll = () => {
    const result = rerollMarket();
    setFeedback(result);
    setActiveIndex(0);
    setDetailListing(null);
    setConfirmListing(null);
  };

  const handleAdopt = (listing: MarketListing) => {
    const result = buyMarketCreature(listing.listingId);
    setFeedback(result);
    setConfirmListing(null);
    setDetailListing(null);
  };

  return createPortal(
    <section className={styles.carouselRoot} data-adoption-listings-carousel="true" aria-label="Adoption Board creature carousel">
      <div className={styles.sceneShade} aria-hidden="true" />

      <header className={styles.topBar}>
        <div className={styles.identity}>
          <span>Vale&apos;s Adoption Hearth · Adoption Board</span>
          <strong>{TAMSIN.name}</strong>
          <small>{TAMSIN.title}</small>
        </div>
        <div className={styles.topActions}>
          <div className={styles.currencyPill}>
            <img src={ICONS.gold} alt="" />
            <span><small>Gold</small><strong>{formatGold(currentSave.currencies.gold)}</strong></span>
          </div>
          <button type="button" onClick={goBackToHearth}>Back to Hearth</button>
          <button type="button" onClick={goToTown}>Back to Town</button>
        </div>
      </header>

      <aside className={styles.tamsinPanel}>
        <div className={styles.tamsinHeader}>
          <img src={TAMSIN.portraitPath} alt="" />
          <div>
            <span>{TAMSIN.title}</span>
            <h2>{TAMSIN.name}</h2>
          </div>
        </div>
        <div className={styles.trustLine}>{trustTier} · {trust?.points ?? 0}{trust && trust.level < 5 ? `/${[20, 50, 90, 140][trust.level - 1] ?? 20}` : ""} Trust</div>
        <p className={styles.tamsinQuote}>{activeListing ? `“${getTamsinNote(currentSave, activeListing)}”` : "“The board is quiet for the moment. That is usually good news.”"}</p>
        <div className={styles.factGrid}>
          <div><span>Current Listings</span><strong>{listings.length} / {marketEffects.marketListingCount}</strong></div>
          <div><span>New Arrivals</span><strong>{formatGold(rerollCost)}</strong></div>
          <div><span>Restock</span><strong>Week {currentSave.market?.weekNumber ?? 1}</strong></div>
          <div><span>Next Trust Unlock</span><strong>{getNpcNextUnlock(currentSave, "tamsin_vale")}</strong></div>
        </div>
        <button type="button" className={styles.refreshButton} onClick={handleReroll} disabled={currentSave.currencies.gold < rerollCost}>
          <img src={ICONS.reroll} alt="" /> Refresh Arrivals · {formatGold(rerollCost)}
        </button>
        <button type="button" className={styles.backButton} onClick={goBackToHearth}>Back to Hearth</button>
      </aside>

      <section className={styles.carouselStage}>
        <div className={styles.stageHeading}>
          <div><span>Adoption Listings</span><h1>Find the right placement</h1><p>Review this week&apos;s candidates one at a time.</p></div>
          <strong>{listings.length > 0 ? `${activeIndex + 1} of ${listings.length}` : "No listings"}</strong>
        </div>

        {feedback ? <button type="button" className={styles.feedback} onClick={() => setFeedback("")} aria-label="Dismiss adoption message">{feedback}</button> : null}

        {activeListing ? (
          <div className={styles.carouselViewport}>
            {previousListing ? <PreviewCard listing={previousListing} position="previous" onClick={() => setActiveIndex((index) => wrapIndex(index - 1, listings.length))} /> : null}
            {nextListing ? <PreviewCard listing={nextListing} position="next" onClick={() => setActiveIndex((index) => wrapIndex(index + 1, listings.length))} /> : null}

            {listings.length > 1 ? <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => setActiveIndex((index) => wrapIndex(index - 1, listings.length))} aria-label="Previous adoption listing">‹</button> : null}
            <FeaturedCard
              save={currentSave}
              listing={activeListing}
              onInspect={() => setDetailListing(activeListing)}
              onAdopt={() => setConfirmListing(activeListing)}
            />
            {listings.length > 1 ? <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => setActiveIndex((index) => wrapIndex(index + 1, listings.length))} aria-label="Next adoption listing">›</button> : null}
          </div>
        ) : (
          <div className={styles.emptyBoard}>
            <h2>No placements are waiting.</h2>
            <p>Tamsin has no current candidates on the board. Refresh arrivals when you&apos;re ready to review a new group.</p>
            <button type="button" onClick={handleReroll} disabled={currentSave.currencies.gold < rerollCost}>Refresh Arrivals · {formatGold(rerollCost)}</button>
          </div>
        )}

        {listings.length > 1 ? (
          <div className={styles.pagination} aria-label="Adoption listing pages">
            <div>{listings.map((listing, index) => <button key={listing.listingId} type="button" className={index === activeIndex ? styles.activeDot : ""} onClick={() => setActiveIndex(index)} aria-label={`Show adoption listing ${index + 1}`} />)}</div>
            <span>{activeIndex + 1} of {listings.length} · Use ← → to browse</span>
          </div>
        ) : null}
      </section>

      {detailListing ? <ListingDetailModal save={currentSave} listing={detailListing} onClose={() => setDetailListing(null)} onAdopt={() => setConfirmListing(detailListing)} /> : null}
      {confirmListing ? <AdoptionConfirmModal save={currentSave} listing={confirmListing} onCancel={() => setConfirmListing(null)} onConfirm={() => handleAdopt(confirmListing)} /> : null}
    </section>,
    host,
  );
}

function PreviewCard({ listing, position, onClick }: { listing: MarketListing; position: "previous" | "next"; onClick: () => void }) {
  const variant = getVariantDefinition(listing.variantId);
  return (
    <button type="button" className={`${styles.previewCard} ${position === "previous" ? styles.previewPrevious : styles.previewNext}`} onClick={onClick} aria-label={`${position === "previous" ? "Previous" : "Next"}: ${variant.name}`}>
      <img src={getMarketListingImage(listing)} alt="" />
      <span>{variant.rarity} · {variant.family}</span>
      <strong>{variant.name}</strong>
    </button>
  );
}

function FeaturedCard({ save, listing, onInspect, onAdopt }: { save: GameSave; listing: MarketListing; onInspect: () => void; onAdopt: () => void }) {
  const variant = getVariantDefinition(listing.variantId);
  const price = getMarketListingPrice(save, listing);
  const canAfford = save.currencies.gold >= price;
  const isSold = listing.status === "sold";
  const premiumCount = getPremiumGradeCount(save, listing);
  const topGrades = getTopGrades(save, listing);

  return (
    <article className={`${styles.featuredCard} ${isSold ? styles.soldCard : ""}`} data-adoption-featured-listing={listing.listingId}>
      <div className={styles.cardHeader}>
        <div><span>{variant.rarity} · {variant.family}</span><h2>{variant.name}</h2></div>
        <span className={styles.listingNumber}>Listing #{String(listing.listingId).slice(-4)}</span>
      </div>
      <div className={styles.tagRow}><span>{getPlacementFit(listing.family)}</span><span>Week {listing.weekNumber}</span>{premiumCount > 0 ? <span>{premiumCount} Premium Grade{premiumCount === 1 ? "" : "s"}</span> : null}</div>
      <button type="button" className={styles.portraitButton} onClick={onInspect} aria-label={`View full details for ${variant.name}`}>
        <span aria-hidden="true" />
        <img src={getMarketListingImage(listing)} alt={variant.name} />
        <small>View full creature profile</small>
      </button>
      <p className={styles.description}>{getMarketListingDescription(listing)}</p>
      <div className={styles.gradeStrip}>
        <div><span>Stat Highlights</span><strong>{premiumCount > 0 ? `★ ${premiumCount} premium grade${premiumCount === 1 ? "" : "s"}` : "Balanced grade spread"}</strong></div>
        <div className={styles.gradePills}>{topGrades.map((entry) => <span key={entry.key}><b>{entry.label}</b><strong>{entry.grade}</strong></span>)}</div>
      </div>
      <div className={styles.placementSummary}><span>Best suited for</span><strong>{getPlacementFit(listing.family)}</strong></div>
      <div className={styles.noteBox}><span>Tamsin&apos;s Note</span><p>“{getTamsinNote(save, listing)}”</p></div>
      <footer className={styles.cardFooter}>
        <div className={styles.fee}><img src={ICONS.gold} alt="" /><span><small>Adoption Fee</small><strong>{formatGold(price)}</strong>{price < listing.price ? <em>Trust price · normally {formatGold(listing.price)}</em> : null}{!canAfford && !isSold ? <em>Need {formatGold(price - save.currencies.gold)} more</em> : null}</span></div>
        <div className={styles.cardActions}>
          <button type="button" className={styles.detailsButton} onClick={onInspect}>View Full Details</button>
          {isSold ? <span className={styles.adoptedBadge}><img src={ICONS.sold} alt="" /> Adopted</span> : <button type="button" className={styles.adoptButton} onClick={onAdopt} disabled={!canAfford}>Adopt</button>}
        </div>
      </footer>
    </article>
  );
}

function ListingDetailModal({ save, listing, onClose, onAdopt }: { save: GameSave; listing: MarketListing; onClose: () => void; onAdopt: () => void }) {
  const creature = createMarketPreviewCreature(save, listing);
  const variant = getVariantDefinition(listing.variantId);
  const price = getMarketListingPrice(save, listing);
  const canAfford = save.currencies.gold >= price;
  const isSold = listing.status === "sold";
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section className={styles.detailModal} data-adoption-carousel-detail="true" role="dialog" aria-modal="true" aria-labelledby="adoption-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span>Adoption Placement Profile · {variant.rarity} {variant.family}</span><h2 id="adoption-detail-title">{variant.name}</h2><p>{getTamsinNote(save, listing)}</p></div>
          <div className={styles.modalHeaderActions}><div><small>Adoption Fee</small><strong>{formatGold(price)}</strong></div>{!isSold ? <button type="button" onClick={onAdopt} disabled={!canAfford}>Adopt</button> : <span>Adopted</span>}<button type="button" onClick={onClose}>Close</button></div>
        </header>
        <div className={styles.detailBody}><SharedCreatureDetail creature={creature} mode="full" showActions={false} /></div>
      </section>
    </div>
  );
}

function AdoptionConfirmModal({ save, listing, onCancel, onConfirm }: { save: GameSave; listing: MarketListing; onCancel: () => void; onConfirm: () => void }) {
  const variant = getVariantDefinition(listing.variantId);
  const price = getMarketListingPrice(save, listing);
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onCancel}>
      <section className={styles.confirmModal} data-adoption-confirm="true" role="dialog" aria-modal="true" aria-labelledby="adoption-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <img src={getMarketListingImage(listing)} alt="" />
        <span>Complete Placement</span>
        <h2 id="adoption-confirm-title">Adopt {variant.name}?</h2>
        <p>Tamsin will complete this placement for <strong>{formatGold(price)}</strong>. The creature will permanently join your ranch.</p>
        <div><button type="button" onClick={onCancel}>Cancel</button><button type="button" className={styles.adoptButton} onClick={onConfirm}>Complete Adoption</button></div>
      </section>
    </div>
  );
}
