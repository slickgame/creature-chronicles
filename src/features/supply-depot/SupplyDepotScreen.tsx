"use client";

import { useState } from "react";
import { PELLA_MOSSWICK, SUPPLY_DEPOT_ITEMS, getSupplyDepotStockLabel } from "@/data/supplyDepot";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import styles from "@/features/market/MarketScreen.module.css";

const ICONS = {
  gold: "/images/ui/currency/icon_currency_gold.png",
  shop: "/images/ui/icons/icon_shop_bag.png",
  price: "/images/ui/icons/icon_price_tag.png",
} as const;

export function SupplyDepotScreen() {
  const { buySupplyDepotItem, currentSave, goToMainMenu, goToTown } = useGameContext();
  const [message, setMessage] = useState("Pella has the basics ready: feed, materials, energy snacks, and repair kits.");

  if (!currentSave) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before entering the Supply Depot.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function handleBuy(itemId: string) {
    setMessage(buySupplyDepotItem(itemId));
  }

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.shade} aria-hidden="true" /><header className={styles.header}><div><p className={styles.kicker}>M35 Supply Depot</p><h1>The Supply Depot</h1><p>{PELLA_MOSSWICK.name}, {PELLA_MOSSWICK.title}, keeps the ranch stocked with practical goods and unsolicited local gossip.</p><p className={styles.message}>{message}</p></div><div className={styles.headerActions}><div className={styles.statBox}><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div className={styles.statBox}><span>Stock</span><strong>{getSupplyDepotStockLabel(currentSave)}</strong></div><button type="button" className={styles.backButton} onClick={goToTown}>Back to Town</button><button type="button" className={styles.backButton} onClick={goToMainMenu}>Main Menu</button></div></header><section className={styles.grid}><aside className={styles.panel}><h2>Pella Mosswick</h2><div className={styles.sideList}><div className={styles.infoCard}><img src={PELLA_MOSSWICK.portraitPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} /><span>Keeper</span><strong>{PELLA_MOSSWICK.name}</strong></div><div className={styles.infoCard}><span>Role</span><strong>{PELLA_MOSSWICK.title}</strong></div><div className={styles.infoCard}><span>Current Stock</span><strong>{getSupplyDepotStockLabel(currentSave)}</strong></div><div className={styles.infoCard}><span>Note</span><strong>{PELLA_MOSSWICK.intro}</strong></div></div></aside><section className={styles.panel} aria-label="Supply Depot stock"><h2>Depot Stock</h2><div className={styles.listings}>{SUPPLY_DEPOT_ITEMS.map((item) => { const canAfford = currentSave.currencies.gold >= item.price; return <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} /></div><div className={styles.listingBody}><div className={styles.listingHeaderRow}><div><span className={styles.listingMeta}>{item.category} • {item.quantityLabel}</span><h3 className={styles.listingName}>{item.name}</h3></div></div><p className={styles.listingDesc}>{item.description}</p><p className={styles.gradePreview}>{item.purchaseLabel}</p><div className={styles.price}><img src={ICONS.price} alt="" /><div><span>Price</span><strong>{formatGold(item.price)}</strong></div></div><div className={styles.actions}><button type="button" className={styles.buyButton} onClick={() => handleBuy(item.itemId)} disabled={!canAfford}>Buy</button></div></div></article>; })}</div></section></section></section></main>;
}
