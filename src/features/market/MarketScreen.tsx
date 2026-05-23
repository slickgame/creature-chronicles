"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureCurrentMarketState,
  getMarketListingDescription,
  getMarketListingImage,
  getMarketListingPreview,
  getMarketListingProfileImage,
  getMarketRerollCost,
} from "@/data/market";
import { getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { getTotalTownUpgradeTiers, getTownUpgradeEffects } from "@/data/upgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureStats } from "@/types/creature";
import type { MarketListing } from "@/types/market";
import styles from "./MarketScreen.module.css";

const ICONS = {
  shop: "/images/ui/icons/icon_shop_bag.png",
  reroll: "/images/ui/icons/icon_reroll.png",
  price: "/images/ui/icons/icon_price_tag.png",
  sold: "/images/ui/icons/icon_sold.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
} as const;

const STAT_LABELS: Record<keyof CreatureStats, string> = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
};

export function MarketScreen() {
  const { buyMarketCreature, currentSave, goToMainMenu, goToTown, rerollMarket, saveCurrentGame } = useGameContext();
  const [message, setMessage] = useState("Weekly creature listings are available.");
  const [activeListing, setActiveListing] = useState<MarketListing | null>(null);

  useEffect(() => {
    if (!currentSave) return;
    const syncedSave = ensureCurrentMarketState(currentSave);
    if (syncedSave !== currentSave) saveCurrentGame(syncedSave);
  }, [currentSave, saveCurrentGame]);

  const syncedSave = useMemo(() => (currentSave ? ensureCurrentMarketState(currentSave) : null), [currentSave]);
  const market = syncedSave?.market;
  const rerollCost = syncedSave ? getMarketRerollCost(syncedSave) : 0;
  const marketLevel = syncedSave ? getTotalTownUpgradeTiers(syncedSave, "market") + 1 : 1;
  const marketEffects = syncedSave ? getTownUpgradeEffects(syncedSave) : null;

  if (!currentSave || !syncedSave || !market || !marketEffects) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before entering the market.</p>
          <button type="button" onClick={goToMainMenu}>Return to Main Menu</button>
        </section>
      </main>
    );
  }

  function handleBuy(listing: MarketListing) {
    const resultMessage = buyMarketCreature(listing.listingId);
    setMessage(resultMessage);
    setActiveListing(null);
  }

  function handleReroll() {
    const resultMessage = rerollMarket();
    setMessage(resultMessage);
    setActiveListing(null);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M10.5 Town Market</p>
            <h1>Market Stall Lv. {marketLevel}</h1>
            <p>Buy weekly creature listings or pay Gold to reroll the market stock.</p>
            <p className={styles.message}>{message}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statBox}>
              <span>Gold</span>
              <strong>{formatGold(currentSave.currencies.gold)}</strong>
            </div>
            <div className={styles.statBox}>
              <span>GP</span>
              <strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong>
            </div>
            <button type="button" className={styles.backButton} onClick={goToTown}>Back to Town</button>
            <button type="button" className={styles.backButton} onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        <section className={styles.grid}>
          <aside className={styles.panel}>
            <h2>Market Info</h2>
            <div className={styles.sideList}>
              <div className={styles.infoCard}>
                <img src={ICONS.shop} alt="" />
                <span>Restock Week</span>
                <strong>Week {market.weekNumber}</strong>
              </div>
              <div className={styles.infoCard}>
                <img src={ICONS.shop} alt="" />
                <span>Listings</span>
                <strong>{market.listings.length} / {marketEffects.marketListingCount}</strong>
              </div>
              <div className={styles.infoCard}>
                <img src={ICONS.reroll} alt="" />
                <span>Reroll Cost</span>
                <strong>{formatGold(rerollCost)}</strong>
              </div>
              <div className={styles.infoCard}>
                <span>Upgrade Bonuses</span>
                <strong>{(marketEffects.marketVariantChance * 100).toFixed(2)}% variant chance • {Math.round(marketEffects.marketRerollDiscount * 100)}% reroll discount</strong>
              </div>
              <div className={styles.infoCard}>
                <span>Rules</span>
                <strong>Habitat capacity is checked before purchase.</strong>
              </div>
              <button type="button" className={styles.rerollButton} onClick={handleReroll} disabled={currentSave.currencies.gold < rerollCost}>
                Reroll Listings
              </button>
            </div>
          </aside>

          <section className={styles.panel} aria-label="Market listings">
            <h2>Creature Listings</h2>
            <div className={styles.listings}>
              {market.listings.map((listing) => {
                const variant = getVariantDefinition(listing.variantId);
                const isSold = listing.status === "sold";
                const canAfford = currentSave.currencies.gold >= listing.price;
                const preview = getMarketListingPreview(syncedSave, listing);
                const bestGrades = Object.values(preview.statGrades).filter((grade) => grade === "A" || grade === "S").length;

                return (
                  <article key={listing.listingId} className={`${styles.listing} ${isSold ? styles.sold : ""}`}>
                    <div className={styles.listingArt}>
                      <img src={getMarketListingImage(listing)} alt="" />
                    </div>
                    <div className={styles.listingBody}>
                      <div className={styles.listingHeaderRow}>
                        <div>
                          <span className={styles.listingMeta}>{variant.rarity} • {variant.family}</span>
                          <h3 className={styles.listingName}>{variant.name}</h3>
                        </div>
                        <button type="button" className={styles.infoButton} onClick={() => setActiveListing(listing)} aria-label={`View ${variant.name} details`}>i</button>
                      </div>
                      <p className={styles.listingDesc}>{getMarketListingDescription(listing)}</p>
                      <p className={styles.gradePreview}>{bestGrades > 0 ? `${bestGrades} premium stat grade${bestGrades === 1 ? "" : "s"}` : "Standard stat grade spread"}</p>
                      <div className={styles.price}>
                        <img src={ICONS.price} alt="" />
                        <div>
                          <span>Price</span>
                          <strong>{formatGold(listing.price)}</strong>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        {isSold ? (
                          <span className={styles.soldBadge}><img src={ICONS.sold} alt="" /> Sold</span>
                        ) : (
                          <button type="button" className={styles.buyButton} onClick={() => handleBuy(listing)} disabled={!canAfford}>Buy Creature</button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      </section>

      {activeListing ? (
        <MarketListingModal save={syncedSave} listing={activeListing} canAfford={currentSave.currencies.gold >= activeListing.price} onBuy={handleBuy} onClose={() => setActiveListing(null)} />
      ) : null}
    </main>
  );
}

function MarketListingModal({ save, listing, canAfford, onBuy, onClose }: { save: NonNullable<ReturnType<typeof ensureCurrentMarketState>>; listing: MarketListing; canAfford: boolean; onBuy: (listing: MarketListing) => void; onClose: () => void }) {
  const variant = getVariantDefinition(listing.variantId);
  const species = getSpeciesDefinition(variant.speciesId);
  const preview = getMarketListingPreview(save, listing);
  const isSold = listing.status === "sold";

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section className={styles.infoModal} role="dialog" aria-modal="true" aria-labelledby="market-listing-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.closeModalButton} onClick={onClose} aria-label="Close listing details">×</button>
        <div className={styles.infoModalGrid}>
          <div className={styles.infoModalArtWrap}><img src={getMarketListingProfileImage(listing)} alt="" /></div>
          <div className={styles.infoModalDetails}>
            <p className={styles.kicker}>{variant.rarity} Market Listing</p>
            <h2 id="market-listing-title">{variant.name}</h2>
            <p className={styles.modalSubtitle}>{variant.name} {species.name}</p>
            <p>{variant.description}</p>
            <div className={styles.modalResourceGrid}><div><span>Price</span><strong>{formatGold(listing.price)}</strong></div><div><span>Energy</span><strong>{preview.maxEnergy}</strong></div><div><span>Hearts</span><strong>{preview.maxHearts} / {preview.maxHearts}</strong></div></div>
            <div className={styles.modalStatGrid}>{Object.entries(preview.stats).map(([statKey, value]) => { const grade = preview.statGrades[statKey as keyof CreatureStats]; return <div key={statKey}><span>{STAT_LABELS[statKey as keyof CreatureStats]}</span><strong className={styles.statValueRow}>{value}<b>Grade {grade}</b></strong></div>; })}</div>
            <section className={styles.modalAbilityPanel}><h3>Projected Abilities</h3>{preview.abilities.map((ability) => <article key={ability.id}><strong>{ability.name}</strong><span>Grade {ability.grade} • {ability.source}</span><p>{ability.description}</p></article>)}</section>
            <div className={styles.modalActions}>{isSold ? <span className={styles.soldBadge}><img src={ICONS.sold} alt="" /> Sold</span> : <button type="button" className={styles.buyButton} disabled={!canAfford} onClick={() => onBuy(listing)}>Buy Creature</button>}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
