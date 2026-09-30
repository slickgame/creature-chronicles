"use client";

import { useEffect, useRef, useState } from "react";
import { SUPPLY_DEPOT_ITEMS, getSupplyDepotPrice, getSupplyDepotUsageRows, getSupplyDepotCount, getSupplyDepotSupplyCounts } from "@/data/supplyDepot";
import { getNpcNextUnlock, getNpcTrustRecord, getNpcTrustSummary } from "@/data/townNpcs";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { GameDialog } from "@/features/ui/GameDialog";
import { RanchIcon } from "@/features/ui/RanchIcon";
import { useGameContext } from "@/state/GameProvider";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./PellasCounter.module.css";

type Shelf = "all" | "ranch" | "special";
type Popup = "talk" | "ledger" | "usage" | "purchase" | "result" | null;

export function SupplyDepotScreen() {
  const { currentSave: save, buySupplyDepotItem, goToTown } = useGameContext();
  const [shelf, setShelf] = useState<Shelf>("all");
  const [selectedId, setSelectedId] = useState("feed_bundle");
  const [popup, setPopup] = useState<Popup>(null);
  const [quote, setQuote] = useState({ id: "", price: 0 });
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1);
  const dockRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(1);
  const lock = useRef(false);
  const hasSave = Boolean(save);
  useEffect(() => {
    if (!dockRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const size = Math.max(1, Math.min(4, Math.floor((entry.contentRect.width + 8) / 220)));
      if (size !== sizeRef.current) { sizeRef.current = size; setPageSize(size); setPage(0); }
    });
    observer.observe(dockRef.current);
    return () => observer.disconnect();
  }, [hasSave]);
  if (!save) return <main className={ui.interior}><h1>No active save</h1></main>;
  const items = SUPPLY_DEPOT_ITEMS.filter(item => shelf === "all" || (shelf === "ranch" ? ["Feed", "Materials", "Energy", "Repair"].includes(item.category) : ["Breeding", "Nursery"].includes(item.category)));
  const selected = SUPPLY_DEPOT_ITEMS.find(item => item.itemId === selectedId) ?? items[0];
  const price = getSupplyDepotPrice(save, selected);
  const owned = getSupplyDepotCount(save, selected.stockFlag);
  const amount = ["feed_bundle", "material_crate"].includes(selected.itemId) ? 5 : 1;
  const shortage = Math.max(0, price - save.currencies.gold);
  const counts = getSupplyDepotSupplyCounts(save);
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const quoteValid = quote.id === selected.itemId && quote.price === price;
  function chooseShelf(next: Shelf) {
    setShelf(next); setPage(0);
    const first = SUPPLY_DEPOT_ITEMS.find(item => next === "all" || (next === "ranch" ? ["Feed", "Materials", "Energy", "Repair"].includes(item.category) : ["Breeding", "Nursery"].includes(item.category)));
    if (first) setSelectedId(first.itemId);
  }
  function purchase() {
    if (lock.current || shortage || !quoteValid) return;
    lock.current = true; setMessage(buySupplyDepotItem(selected.itemId)); setPopup("result");
  }
  return <main className={`${ui.interior} ${styles.depot}`} data-pellas-counter>
    <section className={ui.page}>
      <header className={ui.heading}><h1>The Supply Depot</h1><ScreenNavigation onBack={goToTown} backLabel="Town" /></header>
      <section className={`${ui.summary} ${styles.resources}`} aria-label="Ranch supplies">
        <div><RanchIcon name="gold" /><span>Gold</span><strong>{save.currencies.gold.toLocaleString()}</strong></div>
        <div><RanchIcon name="feed" /><span>Feed</span><strong>{counts.feed}</strong></div>
        <div><RanchIcon name="tools" /><span>Materials</span><strong>{counts.materials}</strong></div>
        <div><RanchIcon name="gear" /><span>Repair kits</span><strong>{counts.repairKits}</strong></div>
      </section>
      <div className={styles.workspace}>
        <aside className={`${ui.paper} ${styles.shelves}`} aria-label="Shop shelves">
          <h2>Shelves</h2><nav aria-label="Supply categories">{([['all', 'All Stock'], ['ranch', 'Ranch'], ['special', 'Special']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={shelf === id} onClick={() => chooseShelf(id)}>{label}</button>)}</nav>
          <div className={styles.keeper}><RanchIcon name="bag" /><h2>Pella Mosswick</h2><p>Supply Depot Keeper</p><strong>Trust Level {trust.level}</strong></div>
          <div className={styles.keeperActions}><button type="button" onClick={() => setPopup("talk")}>Talk</button><button type="button" onClick={() => setPopup("ledger")}>Supply Ledger</button></div>
        </aside>
        <section className={styles.preview} aria-label="Selected supply artwork"><h2>{selected.name}</h2><div className={styles.itemStage}><img data-supply-art src={selected.iconPath} alt={selected.name} /></div></section>
        <section className={`${ui.paper} ${styles.details}`} aria-label="Purchase details">
          <div><h2>{selected.name}</h2><p>{selected.rarity} · {selected.category}</p></div>
          <div className={styles.quantity}><strong>{amount === 5 ? selected.purchaseLabel : selected.itemId.endsWith("kit") ? "+1 Kit" : "+1 Item"}</strong><span>{selected.storageLabel}</span><p>Owned <b>{owned}</b> → <b>{owned + amount}</b></p></div>
          <button type="button" onClick={() => setPopup("usage")}>Usage Details</button>
          <div className={styles.price}><strong>{price.toLocaleString()} Gold</strong>{price < selected.price ? <small>Trust price · normally {selected.price} Gold</small> : null}<p className={shortage ? styles.warning : ""}>{shortage ? `Need ${shortage.toLocaleString()} more Gold` : `Balance after: ${(save.currencies.gold - price).toLocaleString()} Gold`}</p></div>
          <button type="button" className={ui.primary} disabled={shortage > 0} onClick={() => { lock.current = false; setQuote({ id: selected.itemId, price }); setPopup("purchase"); }}>Review Purchase</button>
        </section>
      </div>
      <section className={`${ui.paper} ${styles.dock}`} aria-label="Supply choices">
        <button type="button" aria-label="Previous supplies" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
        <div ref={dockRef} className={styles.items}>{items.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => <button type="button" key={item.itemId} aria-pressed={selected.itemId === item.itemId} onClick={() => setSelectedId(item.itemId)}><img src={item.iconPath} alt="" /><span><strong>{item.name}</strong><small>{getSupplyDepotPrice(save, item)} Gold · Owned {getSupplyDepotCount(save, item.stockFlag)}</small></span></button>)}</div>
        <span className={styles.pageNumber} aria-live="polite">{currentPage + 1} / {pages}</span><button type="button" aria-label="Next supplies" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </section>
    </section>
    {popup === "usage" ? <GameDialog title={`${selected.name} · Usage`} onClose={() => setPopup(null)}><p>{selected.description}</p><h3>Effect</h3><p>{selected.exactEffect}</p><h3>Storage & use</h3><p>{selected.storageLabel}. {selected.usageLabel}</p><p>Buying adds stock. It does not use or arm a support item.</p></GameDialog> : null}
    {popup === "purchase" ? <GameDialog title="Confirm Purchase" onClose={() => setPopup(null)}><h3>{selected.name}</h3><p>{selected.purchaseLabel} for <strong>{price} Gold</strong>.</p><p>{selected.storageLabel}: {owned} → {owned + amount}</p><p>Balance after: {(save.currencies.gold - price).toLocaleString()} Gold.</p><p>Buying adds stock; support items are used separately.</p>{!quoteValid ? <p>The price changed. Close this window and review again.</p> : shortage ? <p>Need {shortage} more Gold.</p> : null}<div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={shortage > 0 || !quoteValid} onClick={purchase}>Confirm Purchase</button></div></GameDialog> : null}
    {popup === "result" ? <GameDialog title="Supply Receipt" onClose={() => setPopup(null)}><p role="status">{message}</p><p>Current balance: {save.currencies.gold.toLocaleString()} Gold.</p><div className={ui.actionRow}><button type="button" onClick={() => setPopup(null)}>Back to Counter</button></div></GameDialog> : null}
    {popup === "talk" ? <GameDialog title="Pella Mosswick" onClose={() => setPopup(null)}><p>{trust.level >= 4 ? "You have earned a place on my better customer list. I warn you before shortages and keep the stranger supplies off the open shelf until you ask." : trust.level >= 2 ? "You buy regularly and you do not haggle like a raccoon in a grain bin. I can shave a little off the price and still sleep at night." : "Buy feed before you run out, buy repair kits before a wall breaks, and never trust a rancher who says they only need one crate of rope."}</p><p>{getNpcTrustSummary(save, "pella_mosswick")}</p></GameDialog> : null}
    {popup === "ledger" ? <GameDialog title="Supply Ledger" onClose={() => setPopup(null)} wide><p>{getNpcTrustSummary(save, "pella_mosswick")}</p><p>Next reward: {getNpcNextUnlock(save, "pella_mosswick")}</p><p>Every purchase earns Trust: 3 for Breeding, Pregnancy or Nursery supplies; 2 for other supplies. Prices already include your Trust discount.</p><div className={styles.ledger}>{getSupplyDepotUsageRows(save).map(row => <section key={row.item.itemId}><h3>{row.item.name} · {row.countLabel}{row.activeLabel ? ` · ${row.activeLabel}` : ""}</h3><p>{row.storageLabel}</p><p>{row.usageLabel}</p></section>)}</div></GameDialog> : null}
  </main>;
}
