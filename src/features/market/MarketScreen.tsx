"use client";

import { useEffect, useMemo, useState } from "react";
import { ensureCurrentMarketState, getMarketListingDescription, getMarketListingImage, getMarketListingPreview, getMarketRerollCost } from "@/data/market";
import { getVariantDefinition } from "@/data/creatures";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { getTotalTownUpgradeTiers, getTownUpgradeEffects } from "@/data/upgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, HabitatId } from "@/types/ids";
import type { MarketListing } from "@/types/market";
import type { GameSave } from "@/types/save";
import styles from "./MarketScreen.module.css";

const ICONS = { shop: "/images/ui/icons/icon_shop_bag.png", reroll: "/images/ui/icons/icon_reroll.png", price: "/images/ui/icons/icon_price_tag.png", sold: "/images/ui/icons/icon_sold.png", gold: "/images/ui/currency/icon_currency_gold.png" } as const;

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
    originLabel: `Market Preview · Week ${listing.weekNumber}`,
    isLocked: false,
    createdAt: listing.createdAt,
    notes: variant.description,
  };
}

export function MarketScreen() {
  const { buyMarketCreature, currentSave, goToMainMenu, goToTown, rerollMarket, saveCurrentGame } = useGameContext();
  const [message, setMessage] = useState("Weekly creature listings are available.");
  const [activeListing, setActiveListing] = useState<MarketListing | null>(null);

  useEffect(() => { if (!currentSave) return; const syncedSave = ensureCurrentMarketState(currentSave); if (syncedSave !== currentSave) saveCurrentGame(syncedSave); }, [currentSave, saveCurrentGame]);

  const syncedSave = useMemo(() => (currentSave ? ensureCurrentMarketState(currentSave) : null), [currentSave]);
  const market = syncedSave?.market;
  const rerollCost = syncedSave ? getMarketRerollCost(syncedSave) : 0;
  const marketLevel = syncedSave ? getTotalTownUpgradeTiers(syncedSave, "market") + 1 : 1;
  const marketEffects = syncedSave ? getTownUpgradeEffects(syncedSave) : null;

  if (!currentSave || !syncedSave || !market || !marketEffects) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before entering the market.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function handleBuy(listing: MarketListing) { const resultMessage = buyMarketCreature(listing.listingId); setMessage(resultMessage); setActiveListing(null); }
  function handleReroll() { const resultMessage = rerollMarket(); setMessage(resultMessage); setActiveListing(null); }

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.shade} aria-hidden="true" /><header className={styles.header}><div><p className={styles.kicker}>M23 Shared Creature Details</p><h1>Market Stall Lv. {marketLevel}</h1><p>Buy weekly creature listings or pay Gold to reroll the market stock.</p><p className={styles.message}>{message}</p></div><div className={styles.headerActions}><div className={styles.statBox}><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div className={styles.statBox}><span>GP</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div><button type="button" className={styles.backButton} onClick={goToTown}>Back to Town</button><button type="button" className={styles.backButton} onClick={goToMainMenu}>Main Menu</button></div></header><section className={styles.grid}><aside className={styles.panel}><h2>Market Info</h2><div className={styles.sideList}><div className={styles.infoCard}><img src={ICONS.shop} alt="" /><span>Restock Week</span><strong>Week {market.weekNumber}</strong></div><div className={styles.infoCard}><img src={ICONS.shop} alt="" /><span>Listings</span><strong>{market.listings.length} / {marketEffects.marketListingCount}</strong></div><div className={styles.infoCard}><img src={ICONS.reroll} alt="" /><span>Reroll Cost</span><strong>{formatGold(rerollCost)}</strong></div><div className={styles.infoCard}><span>Upgrade Bonuses</span><strong>{(marketEffects.marketVariantChance * 100).toFixed(2)}% variant chance • {Math.round(marketEffects.marketRerollDiscount * 100)}% reroll discount</strong></div><div className={styles.infoCard}><span>Rules</span><strong>Habitat capacity is checked before purchase.</strong></div><button type="button" className={styles.rerollButton} onClick={handleReroll} disabled={currentSave.currencies.gold < rerollCost}>Reroll Listings</button></div></aside><section className={styles.panel} aria-label="Market listings"><h2>Creature Listings</h2><div className={styles.listings}>{market.listings.map((listing) => { const variant = getVariantDefinition(listing.variantId); const isSold = listing.status === "sold"; const canAfford = currentSave.currencies.gold >= listing.price; const preview = getMarketListingPreview(syncedSave, listing); const bestGrades = Object.values(preview.statGrades).filter((grade) => grade === "A" || grade === "S").length; return <article key={listing.listingId} className={`${styles.listing} ${isSold ? styles.sold : ""}`}><div className={styles.listingArt}><img src={getMarketListingImage(listing)} alt="" /></div><div className={styles.listingBody}><div className={styles.listingHeaderRow}><div><span className={styles.listingMeta}>{variant.rarity} • {variant.family}</span><h3 className={styles.listingName}>{variant.name}</h3></div><button type="button" className={styles.infoButton} onClick={() => setActiveListing(listing)} aria-label={`View ${variant.name} details`}>i</button></div><p className={styles.listingDesc}>{getMarketListingDescription(listing)}</p><p className={styles.gradePreview}>{bestGrades > 0 ? `${bestGrades} premium stat grade${bestGrades === 1 ? "" : "s"}` : "Standard stat grade spread"}</p><div className={styles.price}><img src={ICONS.price} alt="" /><div><span>Price</span><strong>{formatGold(listing.price)}</strong></div></div><div className={styles.actions}>{isSold ? <span className={styles.soldBadge}><img src={ICONS.sold} alt="" /> Sold</span> : <button type="button" className={styles.buyButton} onClick={() => handleBuy(listing)} disabled={!canAfford}>Buy Creature</button>}</div></div></article>; })}</div></section></section></section>{activeListing ? <MarketListingModal save={syncedSave} listing={activeListing} canAfford={currentSave.currencies.gold >= activeListing.price} onBuy={handleBuy} onClose={() => setActiveListing(null)} /> : null}</main>;
}

function MarketListingModal({ save, listing, canAfford, onBuy, onClose }: { save: GameSave; listing: MarketListing; canAfford: boolean; onBuy: (listing: MarketListing) => void; onClose: () => void }) {
  const previewCreature = createMarketPreviewCreature(save, listing);
  const isSold = listing.status === "sold";
  return <div className={styles.modalBackdrop} role="presentation" onClick={onClose}><section className={styles.infoModal} role="dialog" aria-modal="true" aria-labelledby="market-listing-title" onClick={(event) => event.stopPropagation()}><button type="button" className={styles.closeModalButton} onClick={onClose} aria-label="Close listing details">×</button><div style={{ display: "grid", gap: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", paddingRight: 44 }}><div><p className={styles.kicker}>Shared Market Preview</p><h2 id="market-listing-title">{listing.displayName}</h2><p className={styles.modalSubtitle}>{formatGold(listing.price)} • habitat capacity checked on purchase</p></div>{isSold ? <span className={styles.soldBadge}><img src={ICONS.sold} alt="" /> Sold</span> : <button type="button" className={styles.buyButton} disabled={!canAfford} onClick={() => onBuy(listing)}>Buy Creature</button>}</div><SharedCreatureDetail creature={previewCreature} mode="full" showActions={false} /></div></section></div>;
}
