"use client";

import { useMemo, useState } from "react";
import { PELLA_MOSSWICK, SUPPLY_DEPOT_ITEMS, getSupplyDepotPrice, getSupplyDepotStockLabel } from "@/data/supplyDepot";
import { getNpcNextUnlock, getNpcTrustRecord, getNpcTrustSummary } from "@/data/townNpcs";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { SupplyDepotItem } from "@/data/supplyDepot";
import styles from "@/features/market/MarketScreen.module.css";

const ICONS = {
  gold: "/images/ui/currency/icon_currency_gold.png",
  shop: "/images/ui/icons/icon_shop_bag.png",
  price: "/images/ui/icons/icon_price_tag.png",
  shelves: "/images/buildings/town/supply_depot_interior.png",
  register: "/images/ui/icons/icon_material_crate.png",
  pella: PELLA_MOSSWICK.portraitPath,
} as const;

type DepotMode = "interior" | "shop" | "talk" | "trust";
type DepotShelf = "all" | "ranch" | "special";

const PELLA_GREETING = "Come in, wipe your boots, and do not knock over the feed sacks. I have the practical goods up front and the delicate ranch supplies behind the counter.";

function getInteriorButtonStyle() {
  return {
    display: "grid",
    gap: 4,
    justifyItems: "center",
    minWidth: 220,
    padding: "18px 20px",
    border: "2px solid rgba(245,201,128,.72)",
    borderRadius: 4,
    background: "rgba(0,0,0,.42)",
    color: "#fff7dd",
    boxShadow: "0 14px 28px rgba(0,0,0,.35)",
    cursor: "pointer",
  } as const;
}

function getPanelStyle() {
  return {
    position: "relative",
    zIndex: 3,
    padding: 18,
    border: "1px solid rgba(245,201,128,.55)",
    borderRadius: 4,
    background: "rgba(21, 10, 5, .72)",
    color: "#fff0c9",
    boxShadow: "0 14px 34px rgba(0,0,0,.42)",
    backdropFilter: "blur(2px)",
  } as const;
}

function getShelfItems(shelf: DepotShelf): SupplyDepotItem[] {
  if (shelf === "ranch") return SUPPLY_DEPOT_ITEMS.filter((item) => item.category === "Feed" || item.category === "Materials" || item.category === "Energy" || item.category === "Repair");
  if (shelf === "special") return SUPPLY_DEPOT_ITEMS.filter((item) => item.category === "Breeding" || item.category === "Nursery");
  return SUPPLY_DEPOT_ITEMS;
}

export function SupplyDepotScreen() {
  const { buySupplyDepotItem, currentSave, goToMainMenu, goToTown } = useGameContext();
  const [message, setMessage] = useState(PELLA_GREETING);
  const [depotMode, setDepotMode] = useState<DepotMode>("interior");
  const [activeShelf, setActiveShelf] = useState<DepotShelf>("all");
  const shownItems = useMemo(() => getShelfItems(activeShelf), [activeShelf]);

  if (!currentSave) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before entering the Supply Depot.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function handleBuy(itemId: string) { setMessage(buySupplyDepotItem(itemId)); setDepotMode("shop"); }
  function openShop(shelf: DepotShelf = "all") { setActiveShelf(shelf); setMessage(shelf === "special" ? "Pella unlocks the counter cabinet with the breeding and nursery supplies." : shelf === "ranch" ? "Pella points you toward the everyday ranch shelves." : "Pella opens the shop ledger and starts counting your coin before you even choose anything."); setDepotMode("shop"); }
  function openTalk() { const trust = getNpcTrustRecord(currentSave, "pella_mosswick"); setMessage(trust.level >= 3 ? "Pella grins. 'You are becoming one of my regulars. That means I can start keeping a few things aside before other ranchers clean me out.'" : "Pella taps the counter. 'A rancher who stocks up before trouble is a rancher who sleeps better. Remember that.'"); setDepotMode("talk"); }
  function openTrust() { setMessage("Pella flips open a supply ledger full of notes, discounts, favors, and warnings about who still owes her for rope."); setDepotMode("trust"); }

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.shade} aria-hidden="true" /><header className={styles.header}><div><p className={styles.kicker}>M43 Supply Depot Interior</p><h1>The Supply Depot</h1><p>{PELLA_MOSSWICK.name}, {PELLA_MOSSWICK.title}, keeps the ranch stocked with practical goods and unsolicited local gossip.</p><p className={styles.message}>{message}</p></div><div className={styles.headerActions}><div className={styles.statBox}><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div className={styles.statBox}><span>Stock</span><strong>{getSupplyDepotStockLabel(currentSave)}</strong></div><button type="button" className={styles.backButton} onClick={goToTown}>Back to Town</button><button type="button" className={styles.backButton} onClick={goToMainMenu}>Main Menu</button></div></header>{depotMode === "interior" ? <DepotInterior save={currentSave} onTalk={openTalk} onShop={openShop} onTrust={openTrust} /> : null}{depotMode === "talk" ? <PellaTalkPanel save={currentSave} onBack={() => setDepotMode("interior")} onShop={openShop} onTrust={openTrust} /> : null}{depotMode === "trust" ? <PellaTrustPanel save={currentSave} onBack={() => setDepotMode("interior")} onShop={openShop} /> : null}{depotMode === "shop" ? <DepotShopPanel save={currentSave} shownItems={shownItems} activeShelf={activeShelf} onShelf={setActiveShelf} onBuy={handleBuy} onBack={() => setDepotMode("interior")} /> : null}</section></main>;
}

function DepotInterior({ save, onTalk, onShop, onTrust }: { save: ReturnType<typeof useGameContext>["currentSave"] & NonNullable<ReturnType<typeof useGameContext>["currentSave"]>; onTalk: () => void; onShop: (shelf?: DepotShelf) => void; onTrust: () => void }) {
  return <section aria-label="Supply Depot interior" style={{ position: "relative", zIndex: 2, minHeight: "calc(100vh - 230px)", padding: "28px 34px 34px", overflow: "hidden" }}><div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.58)), url(${ICONS.shelves}) center/cover`, opacity: .44 }} /><div style={{ position: "relative", zIndex: 3, display: "grid", gridTemplateColumns: "minmax(260px, 360px) minmax(0, 1fr)", gap: 26, alignItems: "end", minHeight: "58vh" }}><aside style={getPanelStyle()}><div style={{ display: "grid", gridTemplateColumns: "76px minmax(0,1fr)", gap: 12, alignItems: "center" }}><img src={ICONS.pella} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 999, border: "1px solid rgba(245,201,128,.55)" }} /><div><p className={styles.kicker}>Supply Depot Keeper</p><h2 style={{ margin: 0 }}>Pella Mosswick</h2><p style={{ margin: "6px 0 0" }}>{getNpcTrustSummary(save, "pella_mosswick")}</p></div></div><p style={{ marginTop: 16, lineHeight: 1.55 }}>{PELLA_GREETING}</p><div style={{ display: "grid", gap: 8 }}><button type="button" className={styles.buyButton} onClick={onTalk}>Talk to Pella</button><button type="button" className={styles.buyButton} onClick={() => onShop("all")}>Open Depot Stock</button><button type="button" className={styles.buyButton} onClick={() => onShop("special")}>Special Supplies</button><button type="button" className={styles.buyButton} onClick={onTrust}>Trust / Stock Ledger</button></div></aside><div style={{ position: "relative", minHeight: 430 }}><button type="button" style={{ ...getInteriorButtonStyle(), position: "absolute", left: "10%", top: "38%" }} onClick={() => onShop("ranch")}><img src={ICONS.register} alt="" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 999 }} /><strong>Ranch Shelves</strong><span style={{ color: "#7fdbff", fontWeight: 900 }}>Feed • Materials • Repairs</span></button><button type="button" style={{ ...getInteriorButtonStyle(), position: "absolute", right: "7%", top: "31%" }} onClick={onTalk}><img src={ICONS.pella} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} style={{ width: 66, height: 66, objectFit: "cover", borderRadius: 999 }} /><strong>Pella Mosswick</strong><span style={{ color: "#7fdbff", fontWeight: 900 }}>Talk • Trust • Notes</span></button><button type="button" style={{ ...getInteriorButtonStyle(), position: "absolute", left: "38%", bottom: "8%" }} onClick={() => onShop("special")}><img src={ICONS.shop} alt="" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 999 }} /><strong>Counter Cabinet</strong><span style={{ color: "#7fdbff", fontWeight: 900 }}>Breeding • Nursery</span></button></div></div></section>;
}

function PellaTalkPanel({ save, onBack, onShop, onTrust }: { save: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>; onBack: () => void; onShop: (shelf?: DepotShelf) => void; onTrust: () => void }) {
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  const line = trust.level >= 4 ? "You have earned a place on my better customer list. That means I warn you before shortages and keep the stranger little supplies off the open shelf until you ask." : trust.level >= 2 ? "You buy regularly and you do not haggle like a raccoon in a grain bin. I can shave a little off the price and still sleep at night." : "Buy feed before you run out, buy repair kits before a wall breaks, and never trust a rancher who says they only need one crate of rope.";
  return <section style={{ position: "relative", zIndex: 3, padding: 24, display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 18 }}><aside style={getPanelStyle()}><img src={ICONS.pella} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(245,201,128,.45)" }} /><h2>Pella Mosswick</h2><p>{getNpcTrustSummary(save, "pella_mosswick")}</p></aside><section style={getPanelStyle()}><p className={styles.kicker}>Conversation</p><h2>Practical Advice</h2><p style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>{line}</p><p style={{ lineHeight: 1.6 }}>Pella explains which shelves hold everyday ranch supplies and which counter cabinet stores the more delicate breeding and nursery items.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><button type="button" className={styles.buyButton} onClick={() => onShop("all")}>Open Stock</button><button type="button" className={styles.buyButton} onClick={() => onShop("special")}>Special Supplies</button><button type="button" className={styles.buyButton} onClick={onTrust}>Open Ledger</button><button type="button" className={styles.backButton} onClick={onBack}>Back to Depot</button></div></section></section>;
}

function PellaTrustPanel({ save, onBack, onShop }: { save: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>; onBack: () => void; onShop: (shelf?: DepotShelf) => void }) {
  return <section style={{ position: "relative", zIndex: 3, padding: 24, display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 18 }}><aside style={getPanelStyle()}><h2>Stock Ledger</h2><p>{getNpcTrustSummary(save, "pella_mosswick")}</p><p><strong>Next:</strong> {getNpcNextUnlock(save, "pella_mosswick")}</p><p>{PELLA_MOSSWICK.intro}</p></aside><section style={getPanelStyle()}><p className={styles.kicker}>Current Supplies</p><h2>Ranch Inventory</h2><div className={styles.listings}>{getSupplyDepotStockLabel(save).split(" • ").map((item) => <article key={item} className={styles.infoCard}><strong>{item}</strong></article>)}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}><button type="button" className={styles.buyButton} onClick={() => onShop("all")}>Open All Stock</button><button type="button" className={styles.buyButton} onClick={() => onShop("special")}>Special Supplies</button><button type="button" className={styles.backButton} onClick={onBack}>Back to Depot</button></div></section></section>;
}

function DepotShopPanel({ save, shownItems, activeShelf, onShelf, onBuy, onBack }: { save: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>; shownItems: SupplyDepotItem[]; activeShelf: DepotShelf; onShelf: (shelf: DepotShelf) => void; onBuy: (itemId: string) => void; onBack: () => void }) {
  return <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: "14px 18px 24px" }}><aside className={styles.panel}><h2>Pella Mosswick</h2><div className={styles.sideList}><div className={styles.infoCard}><img src={PELLA_MOSSWICK.portraitPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} /><span>Keeper</span><strong>{PELLA_MOSSWICK.name}</strong></div><div className={styles.infoCard}><span>Role</span><strong>{PELLA_MOSSWICK.title}</strong></div><div className={styles.infoCard}><span>Trust</span><strong>{getNpcTrustSummary(save, "pella_mosswick")}</strong></div><div className={styles.infoCard}><span>Next Unlock</span><strong>{getNpcNextUnlock(save, "pella_mosswick")}</strong></div><div className={styles.infoCard}><span>Current Stock</span><strong>{getSupplyDepotStockLabel(save)}</strong></div><div className={styles.infoCard}><span>Note</span><strong>{PELLA_MOSSWICK.intro}</strong></div><button type="button" className={styles.backButton} onClick={onBack}>Back to Depot</button></div></aside><section className={styles.panel} aria-label="Supply Depot stock"><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><h2>Depot Stock</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className={styles.buyButton} disabled={activeShelf === "all"} onClick={() => onShelf("all")}>All</button><button type="button" className={styles.buyButton} disabled={activeShelf === "ranch"} onClick={() => onShelf("ranch")}>Ranch</button><button type="button" className={styles.buyButton} disabled={activeShelf === "special"} onClick={() => onShelf("special")}>Special</button></div></div><div className={styles.listings}>{shownItems.map((item) => { const itemPrice = getSupplyDepotPrice(save, item); const canAfford = save.currencies.gold >= itemPrice; return <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} /></div><div className={styles.listingBody}><div className={styles.listingHeaderRow}><div><span className={styles.listingMeta}>{item.category} • {item.quantityLabel}</span><h3 className={styles.listingName}>{item.name}</h3></div></div><p className={styles.listingDesc}>{item.description}</p><p className={styles.gradePreview}>{item.purchaseLabel}</p><div className={styles.price}><img src={ICONS.price} alt="" /><div><span>Price</span><strong>{formatGold(itemPrice)}</strong>{itemPrice < item.price ? <em>Pella trust discount from {formatGold(item.price)}</em> : null}</div></div><div className={styles.actions}><button type="button" className={styles.buyButton} onClick={() => onBuy(item.itemId)} disabled={!canAfford}>Buy</button></div></div></article>; })}</div></section></section>;
}
