"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureCurrentMarketState,
  getMarketListingDescription,
  getMarketListingImage,
  getMarketRerollCost,
} from "@/data/market";
import { getVariantDefinition } from "@/data/creatures";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { MarketListing } from "@/types/market";
import styles from "./MarketScreen.module.css";

const ICONS = {
  shop: "/images/ui/icons/icon_shop_bag.png",
  reroll: "/images/ui/icons/icon_reroll.png",
  price: "/images/ui/icons/icon_price_tag.png",
  sold: "/images/ui/icons/icon_sold.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
} as const;

export function MarketScreen() {
  const { buyMarketCreature, currentSave, goToMainMenu, goToTown, rerollMarket, saveCurrentGame } = useGameContext();
  const [message, setMessage] = useState("Weekly creature listings are available.");

  useEffect(() => {
    if (!currentSave) return;
    const syncedSave = ensureCurrentMarketState(currentSave);
    if (syncedSave !== currentSave) saveCurrentGame(syncedSave);
  }, [currentSave, saveCurrentGame]);

  const syncedSave = useMemo(() => (currentSave ? ensureCurrentMarketState(currentSave) : null), [currentSave]);
  const market = syncedSave?.market;
  const rerollCost = syncedSave ? getMarketRerollCost(syncedSave) : 0;

  if (!currentSave || !syncedSave || !market) {
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
  }

  function handleReroll() {
    const resultMessage = rerollMarket();
    setMessage(resultMessage);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M6 Town Market</p>
            <h1>Market Stall</h1>
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
                <img src={ICONS.reroll} alt="" />
                <span>Reroll Cost</span>
                <strong>{formatGold(rerollCost)}</strong>
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

                return (
                  <article key={listing.listingId} className={`${styles.listing} ${isSold ? styles.sold : ""}`}>
                    <div className={styles.listingArt}>
                      <img src={getMarketListingImage(listing)} alt="" />
                    </div>
                    <div className={styles.listingBody}>
                      <div>
                        <span className={styles.listingMeta}>{variant.rarity} • {variant.family}</span>
                        <h3 className={styles.listingName}>{variant.name}</h3>
                      </div>
                      <p className={styles.listingDesc}>{getMarketListingDescription(listing)}</p>
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
                          <button type="button" className={styles.buyButton} onClick={() => handleBuy(listing)} disabled={!canAfford}>
                            Buy Creature
                          </button>
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
    </main>
  );
}
