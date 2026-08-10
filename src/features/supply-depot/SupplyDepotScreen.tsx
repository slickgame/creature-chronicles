"use client";

import { useMemo, useState } from "react";
import {
  PELLA_MOSSWICK,
  SUPPLY_DEPOT_ITEMS,
  getSupplyDepotPrice,
  getSupplyDepotSupplyCounts,
  getSupplyDepotUsageRows,
} from "@/data/supplyDepot";
import {
  TOWN_NPCS,
  getNextTrustThreshold,
  getNpcNextUnlock,
  getNpcTrustRecord,
  getPellaSupplyPriceMultiplier,
  getTrustTierLabel,
} from "@/data/townNpcs";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { SupplyDepotItem } from "@/data/supplyDepot";
import type { GameSave } from "@/types/save";
import styles from "./SupplyDepotScreen.module.css";
import polish from "./SupplyDepotScreen.polish.module.css";

const PELLA_TRUST = TOWN_NPCS.pella_mosswick;
const TRUST_THRESHOLDS = [0, 20, 50, 90, 140] as const;

const ICONS = {
  shop: "/images/ui/icons/icon_shop_bag.png",
  price: "/images/ui/icons/icon_price_tag.png",
  shelfProp: "/images/props/town/supply_depot_shelves.png",
  counterCabinet: "/images/props/town/supply_depot_counter_cabinet.png",
  stockLedger: "/images/props/town/supply_depot_stock_ledger.png",
  register: "/images/ui/icons/icon_ranch_upgrade.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  pella: PELLA_MOSSWICK.portraitPath,
} as const;

type DepotMode = "interior" | "shop" | "talk" | "trust";
type DepotShelf = "all" | "ranch" | "special";
type PellaTopic = "advice" | "stock" | "counter" | "trade" | "standing";

function getShelfItems(shelf: DepotShelf): SupplyDepotItem[] {
  if (shelf === "ranch") {
    return SUPPLY_DEPOT_ITEMS.filter(
      (item) =>
        item.category === "Feed" ||
        item.category === "Materials" ||
        item.category === "Energy" ||
        item.category === "Repair",
    );
  }
  if (shelf === "special") {
    return SUPPLY_DEPOT_ITEMS.filter(
      (item) =>
        item.category === "Breeding" ||
        item.category === "Nursery" ||
        item.category === "Care" ||
        item.category === "Pregnancy",
    );
  }
  return SUPPLY_DEPOT_ITEMS;
}

function getThresholdForLevel(level: number): number {
  return TRUST_THRESHOLDS[Math.max(0, Math.min(TRUST_THRESHOLDS.length - 1, level - 1))] ?? 0;
}

function getPellaGreeting(save: GameSave): string {
  const counts = getSupplyDepotSupplyCounts(save);
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  if (counts.feed <= 5) return "You're running thin on feed. I'd fix that before the ranch starts reminding you in louder ways.";
  if (counts.repairKits <= 0) return "No repair kits on hand? That's exactly when fences decide to develop opinions.";
  if (counts.materials <= 5) return "You're light on materials. If Petra has plans for you, I'd take a crate before you leave.";
  if (trust.level >= 4) return "Good timing. I've got the usual stock out front and the better conversations behind the counter.";
  if (trust.level >= 2) return "Back again? Good. Regular customers are easier to stock for than heroes who arrive after something breaks.";
  return "Come in, wipe your boots, and don't knock over the feed sacks. Practical goods up front; delicate supplies behind the counter.";
}

function getTalkCopy(topic: PellaTopic, trustLevel: number): { title: string; body: string; note: string } {
  switch (topic) {
    case "stock":
      return {
        title: "Keeping a Ranch Stocked",
        body: "Feed disappears every night, materials disappear whenever somebody gets ambitious, and repair kits disappear five minutes before you remember why I sell them.",
        note: "The Ranch Shelves carry feed, materials, energy supplies, and repair basics.",
      };
    case "counter":
      return {
        title: "Behind the Counter",
        body: "The counter stock is for breeding, nursery, care, and pregnancy work. It costs more because it has to be clean, measured, labeled, and kept away from customers who think every bottle is a snack.",
        note: trustLevel >= 4
          ? "You've earned enough trust that Pella treats you like a serious regular when special requests come through."
          : "Higher Trust with Pella also opens stronger personal Guild requests.",
      };
    case "trade":
      return {
        title: "Town Trade",
        body: "Half this town runs on invoices, favors, and somebody remembering who still owes for rope. Keep coin in reserve and buy necessities before shortages turn them into emergencies.",
        note: "Pella's advice is practical, mildly judgmental, and usually correct.",
      };
    case "standing":
      return {
        title: "My Standing With You",
        body: trustLevel >= 5
          ? "You're on the short list now. I know what your ranch uses, I know you pay, and I know which jobs I can hand you without having to explain them twice."
          : trustLevel >= 3
            ? "You're becoming one of my regulars. I pay attention to what you buy, what you actually use, and whether your creatures come back from work in one piece."
            : trustLevel >= 2
              ? "You've stopped feeling like a stranger. Keep doing reliable business and I'll keep making the numbers a little kinder."
              : "We're still new to each other. Buy what you need, follow through on Guild work, and don't make me chase you for payment.",
        note: "Open the Supply Ledger for exact Trust progress and unlocked benefits.",
      };
    default:
      return {
        title: "Practical Advice",
        body: "Buy feed before you run out, buy repair kits before a wall breaks, and never trust a rancher who says they only need one crate of rope.",
        note: "Pella runs the depot like a storeroom first and a social club a distant second.",
      };
  }
}

export function SupplyDepotScreen() {
  const { buySupplyDepotItem, currentSave, goToMainMenu, goToTown } = useGameContext();
  const [message, setMessage] = useState("");
  const [depotMode, setDepotMode] = useState<DepotMode>("interior");
  const [activeShelf, setActiveShelf] = useState<DepotShelf>("ranch");
  const shownItems = useMemo(() => getShelfItems(activeShelf), [activeShelf]);

  if (!currentSave) {
    return (
      <main className={styles.screen}>
        <section className={styles.hubPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before entering the Supply Depot.</p>
          <button type="button" className={styles.secondaryButton} onClick={goToMainMenu}>Return to Main Menu</button>
        </section>
      </main>
    );
  }

  const save = currentSave;
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  const trustTier = getTrustTierLabel(trust.level);

  function openShop(shelf: DepotShelf) {
    setActiveShelf(shelf);
    setMessage("");
    setDepotMode("shop");
  }

  function handleBuy(itemId: string) {
    setMessage(buySupplyDepotItem(itemId));
  }

  const modeLabel = depotMode === "interior"
    ? "Main Floor"
    : depotMode === "shop"
      ? activeShelf === "special" ? "Counter Cabinet" : activeShelf === "ranch" ? "Ranch Shelves" : "All Stock"
      : depotMode === "talk"
        ? "Conversation"
        : "Supply Ledger";

  return (
    <main className={styles.screen} data-supply-depot-mode={depotMode}>
      <div className={styles.scene} aria-hidden="true" />
      <div className={styles.sceneShade} aria-hidden="true" />

      <header className={styles.topBar}>
        <div className={styles.identity}>
          <span>The Supply Depot · {modeLabel}</span>
          <strong>{PELLA_MOSSWICK.name}</strong>
          <small>{PELLA_MOSSWICK.title}</small>
        </div>
        <div className={styles.topActions}>
          <div className={styles.currencyPill}>
            <img src={ICONS.gold} alt="" />
            <span><small>Gold</small><strong>{formatGold(save.currencies.gold)}</strong></span>
          </div>
          {depotMode !== "interior" ? <button type="button" onClick={() => setDepotMode("interior")}>Back to Depot</button> : null}
          <button type="button" onClick={goToTown}>Back to Town</button>
        </div>
      </header>

      {depotMode === "interior" ? (
        <DepotInterior
          save={save}
          trustTier={trustTier}
          trustPoints={trust.points}
          onTalk={() => setDepotMode("talk")}
          onShop={openShop}
          onTrust={() => setDepotMode("trust")}
          onLeave={goToTown}
        />
      ) : null}

      {depotMode === "shop" ? (
        <DepotShopPanel
          save={save}
          shownItems={shownItems}
          activeShelf={activeShelf}
          message={message}
          onShelf={setActiveShelf}
          onBuy={handleBuy}
        />
      ) : null}

      {depotMode === "talk" ? <PellaConversation save={save} onShop={openShop} onTrust={() => setDepotMode("trust")} /> : null}
      {depotMode === "trust" ? <PellaSupplyLedger save={save} onShop={openShop} /> : null}
    </main>
  );
}

function DepotInterior({ save, trustTier, trustPoints, onTalk, onShop, onTrust, onLeave }: {
  save: GameSave;
  trustTier: string;
  trustPoints: number;
  onTalk: () => void;
  onShop: (shelf: DepotShelf) => void;
  onTrust: () => void;
  onLeave: () => void;
}) {
  const counts = getSupplyDepotSupplyCounts(save);
  return (
    <section className={styles.interior} aria-label="Supply Depot interior">
      <aside className={styles.hubPanel}>
        <div className={styles.speakerRow}>
          <img src={ICONS.pella} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} />
          <div><span>Supply Depot Keeper</span><h1>{PELLA_MOSSWICK.name}</h1></div>
          <b className={styles.trustPill}>{trustTier} · {trustPoints} Trust</b>
        </div>
        <div className={styles.dialogue}>“{getPellaGreeting(save)}”</div>
        <p className={styles.sectionLabel}>What do you need?</p>
        <div className={styles.actionList}>
          <button type="button" className={styles.actionButton} onClick={() => onShop("ranch")}>
            <img src={ICONS.shelfProp} alt="" />
            <span><strong>Ranch Supplies</strong><small>Feed, materials, energy, and repairs</small></span>
            <b className={styles.actionValue}>{counts.feed} Feed · {counts.materials} Materials</b>
          </button>
          <button type="button" className={styles.actionButton} onClick={() => onShop("special")}>
            <img src={ICONS.counterCabinet} alt="" />
            <span><strong>Special Supplies</strong><small>Breeding, nursery, care, and pregnancy stock</small></span>
            <b className={styles.actionValue}>Counter Cabinet</b>
          </button>
          <button type="button" className={styles.actionButton} onClick={onTalk}>
            <img src={ICONS.pella} alt="" />
            <span><strong>Talk to Pella</strong><small>Supplies, trade, and unsolicited advice</small></span>
            <b className={styles.actionValue}>Talk</b>
          </button>
          <button type="button" className={styles.actionButton} onClick={onTrust}>
            <img src={ICONS.stockLedger} alt="" />
            <span><strong>Supply Ledger</strong><small>Trust, discounts, and current ranch stock</small></span>
            <b className={styles.actionValue}>{trustTier}</b>
          </button>
        </div>
        <button type="button" className={styles.leaveButton} onClick={onLeave}>Leave Supply Depot</button>
      </aside>

      <figure className={styles.pellaFigure} aria-label="Pella Mosswick">
        <img src={ICONS.pella} alt="Pella Mosswick" onError={(event) => { event.currentTarget.src = ICONS.shop; }} />
      </figure>

      <button type="button" className={`${styles.hotspot} ${styles.ranchHotspot}`} onClick={() => onShop("ranch")}>
        <img src={ICONS.shelfProp} alt="" /><span><strong>Ranch Shelves</strong><small>Feed · Materials · Repairs</small></span>
      </button>
      <button type="button" className={`${styles.hotspot} ${styles.counterHotspot}`} onClick={() => onShop("special")}>
        <img src={ICONS.counterCabinet} alt="" /><span><strong>Counter Cabinet</strong><small>Breeding · Nursery · Care</small></span>
      </button>
    </section>
  );
}

function DepotShopPanel({ save, shownItems, activeShelf, message, onShelf, onBuy }: {
  save: GameSave;
  shownItems: SupplyDepotItem[];
  activeShelf: DepotShelf;
  message: string;
  onShelf: (shelf: DepotShelf) => void;
  onBuy: (itemId: string) => void;
}) {
  const counts = getSupplyDepotSupplyCounts(save);
  const usageRows = getSupplyDepotUsageRows(save);
  const ownedById = new Map(usageRows.map((row) => [row.item.itemId, row.countLabel]));
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  const discount = Math.round((1 - getPellaSupplyPriceMultiplier(save)) * 100);
  const title = activeShelf === "special" ? "Counter Cabinet" : activeShelf === "ranch" ? "Ranch Shelves" : "All Depot Stock";
  const subtitle = activeShelf === "special"
    ? "Breeding, nursery, creature-care, and pregnancy supplies Pella keeps behind the counter."
    : activeShelf === "ranch"
      ? "The practical goods that keep a ranch fed, repaired, and moving."
      : "Everything Pella currently sells in one ledger.";

  return (
    <section className={styles.subpage} aria-label="Supply Depot storefront">
      <div className={styles.subpageHeader}>
        <div><span className={styles.kicker}>Depot Stock</span><h1>{title}</h1><p>{subtitle}</p></div>
        <b className={styles.trustPill}>{getTrustTierLabel(trust.level)} · {discount}% price discount</b>
      </div>

      <div className={`${styles.shopLayout} ${polish.shopLayout}`}>
        <aside className={`${styles.shopSidebar} ${polish.shopSidebar}`}>
          <div className={styles.shopKeeper}>
            <img src={ICONS.pella} alt="Pella Mosswick" onError={(event) => { event.currentTarget.src = ICONS.shop; }} />
            <div><span className={styles.kicker}>Keeper</span><h2>Pella Mosswick</h2><small>{trust.points} Trust</small></div>
          </div>
          <p className={styles.shopSidebarQuote}>“Take what you need. Take two if it's the sort of thing you'll regret only buying one of.”</p>
          <div className={styles.stockMiniGrid}>
            <div className={styles.statChip}><span>Feed</span><strong>{counts.feed}</strong></div>
            <div className={styles.statChip}><span>Materials</span><strong>{counts.materials}</strong></div>
            <div className={styles.statChip}><span>Repair Kits</span><strong>{counts.repairKits}</strong></div>
            <div className={styles.statChip}><span>Nursery Kits</span><strong>{counts.nurserySupplyKits}</strong></div>
          </div>
        </aside>

        <section className={`${styles.shopMain} ${polish.shopMain}`}>
          <div className={styles.shopToolbar}>
            <div><span className={styles.kicker}>Browse Stock</span></div>
            <div className={styles.filters}>
              {(["ranch", "special", "all"] as DepotShelf[]).map((shelf) => (
                <button key={shelf} type="button" className={`${styles.filterButton} ${activeShelf === shelf ? styles.filterActive : ""}`} onClick={() => onShelf(shelf)}>
                  {shelf === "ranch" ? "Ranch Shelves" : shelf === "special" ? "Counter Cabinet" : "All Stock"}
                </button>
              ))}
            </div>
          </div>
          {message ? <div className={styles.purchaseMessage}>{message}</div> : null}
          <div className={styles.productGrid}>
            {shownItems.map((item) => {
              const price = getSupplyDepotPrice(save, item);
              const canAfford = save.currencies.gold >= price;
              return (
                <article key={item.itemId} className={styles.productCard}>
                  <div className={styles.productArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} /></div>
                  <div className={styles.productInfo}>
                    <span className={styles.cardEyebrow}>{item.rarity} · {item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <p className={styles.purchaseEffect}>{item.purchaseLabel} · {item.storageLabel}</p>
                    <p>{item.usageLabel}</p>
                  </div>
                  <div className={styles.productFooter}>
                    <span className={styles.ownedLabel}>You own: {ownedById.get(item.itemId) ?? "0"}</span>
                    <span className={styles.priceLabel}><img src={ICONS.price} alt="" />{formatGold(price)}</span>
                    <button type="button" className={styles.buyButton} disabled={!canAfford} onClick={() => onBuy(item.itemId)}>{canAfford ? "Buy" : "Need Gold"}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}

function PellaConversation({ save, onShop, onTrust }: {
  save: GameSave;
  onShop: (shelf: DepotShelf) => void;
  onTrust: () => void;
}) {
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  const [topic, setTopic] = useState<PellaTopic>("advice");
  const copy = getTalkCopy(topic, trust.level);
  const topics: Array<{ id: PellaTopic; title: string; subtitle: string }> = [
    { id: "advice", title: "Practical Advice", subtitle: "Pella's rules for avoiding preventable disasters" },
    { id: "stock", title: "Keeping a Ranch Stocked", subtitle: "Feed, materials, energy, and repairs" },
    { id: "counter", title: "Special Supplies", subtitle: "Breeding, nursery, care, and pregnancy stock" },
    { id: "trade", title: "Town Trade", subtitle: "Coin, shortages, favors, and local business" },
    { id: "standing", title: "My Standing With You", subtitle: "How Pella views your ranch" },
  ];

  return (
    <section className={styles.conversationLayout} aria-label="Conversation with Pella Mosswick">
      <div className={styles.conversationPanel}>
        <div className={styles.speakerRow}>
          <img src={ICONS.pella} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} />
          <div><span>Supply Depot Keeper</span><h2>Pella Mosswick</h2></div>
          <b className={styles.trustPill}>{getTrustTierLabel(trust.level)} · {trust.points} Trust</b>
        </div>
        <div className={styles.dialogue}>
          <span className={styles.kicker}>{copy.title}</span>
          <div>“{copy.body}”</div>
          <small>{copy.note}</small>
        </div>
        <p className={styles.sectionLabel}>What do you want to ask?</p>
        <div className={styles.topicList}>
          {topics.map((item) => (
            <button key={item.id} type="button" className={`${styles.topicButton} ${topic === item.id ? styles.topicButtonActive : ""}`} onClick={() => setTopic(item.id)}>
              <span><strong>{item.title}</strong><small>{item.subtitle}</small></span><b>›</b>
            </button>
          ))}
        </div>
        <div className={styles.conversationLinks}>
          <button type="button" className={styles.secondaryButton} onClick={() => onShop("ranch")}>Open Ranch Shelves</button>
          <button type="button" className={styles.secondaryButton} onClick={() => onShop("special")}>Counter Cabinet</button>
          <button type="button" className={styles.secondaryButton} onClick={onTrust}>Open Supply Ledger</button>
        </div>
      </div>
      <figure className={styles.conversationFigure}><img src={ICONS.pella} alt="Pella Mosswick" onError={(event) => { event.currentTarget.src = ICONS.shop; }} /></figure>
    </section>
  );
}

function PellaSupplyLedger({ save, onShop }: { save: GameSave; onShop: (shelf: DepotShelf) => void }) {
  const trust = getNpcTrustRecord(save, "pella_mosswick");
  const nextThreshold = getNextTrustThreshold(trust.points);
  const currentThreshold = getThresholdForLevel(trust.level);
  const span = nextThreshold ? Math.max(1, nextThreshold - currentThreshold) : 1;
  const progress = nextThreshold ? Math.max(0, Math.min(100, ((trust.points - currentThreshold) / span) * 100)) : 100;
  const counts = getSupplyDepotSupplyCounts(save);
  const discount = Math.round((1 - getPellaSupplyPriceMultiplier(save)) * 100);
  const benefits = [
    { level: 1, icon: ICONS.shelfProp, title: "Depot Stock Access", detail: "Standard Supply Depot inventory and everyday ranch goods." },
    { level: 2, icon: ICONS.price, title: "Regular Customer Pricing", detail: "5% cheaper Supply Depot prices and Pella personal Guild requests." },
    { level: 3, icon: ICONS.stockLedger, title: "Priority Supply Requests", detail: "Priority Pella personal requests with enhanced rewards." },
    { level: 4, icon: ICONS.counterCabinet, title: "Gold Personal Requests", detail: "Gold-tier Pella personal Guild requests become available." },
    { level: 5, icon: ICONS.shop, title: "Confidant Pricing", detail: "12% cheaper Supply Depot prices and Confidant request rewards." },
  ];

  return (
    <section className={styles.subpage} aria-label="Pella Supply Ledger">
      <div className={`${styles.ledgerLayout} ${polish.ledgerLayout}`}>
        <aside className={styles.ledgerAside}>
          <img src={ICONS.stockLedger} alt="Supply ledger" onError={(event) => { event.currentTarget.src = ICONS.register; }} />
          <span className={styles.kicker}>Supply Depot Keeper</span>
          <h2>Pella Mosswick</h2>
          <p>“A good ledger tells you what you have. A great ledger tells you what you're about to regret not buying.”</p>
          <div className={styles.statChip}><span>Current Discount</span><strong>{discount}%</strong></div>
          <div className={styles.statChip}><span>Current Trust</span><strong>{trust.points}</strong></div>
        </aside>

        <main className={styles.ledgerMain}>
          <section className={styles.standingCard}>
            <div className={styles.standingHeader}>
              <div><span className={styles.kicker}>Your Standing</span><h1>{getTrustTierLabel(trust.level)}</h1></div>
              <strong>{nextThreshold ? `${trust.points} / ${nextThreshold} Trust` : `${trust.points} Trust · Max`}</strong>
            </div>
            <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
            <div className={styles.nextUnlock}><span>Next relationship unlock</span><strong>{trust.level >= 5 ? "Maximum Trust reached" : getNpcNextUnlock(save, "pella_mosswick")}</strong></div>
          </section>

          <section className={styles.pathSection}>
            <div className={styles.sectionHeading}><span className={styles.kicker}>Relationship Path</span><small>Trust with Pella affects prices and personal Guild work.</small></div>
            <div className={styles.trustPath}>
              {TRUST_THRESHOLDS.map((threshold, index) => {
                const level = index + 1;
                const reached = trust.points >= threshold;
                const current = trust.level === level;
                return (
                  <div key={threshold} className={`${styles.pathStep} ${reached ? styles.pathReached : ""} ${current ? styles.pathCurrent : ""}`}>
                    <div className={styles.pathMarker}>{reached ? "✓" : level}</div>
                    <strong>{getTrustTierLabel(level)}</strong>
                    <small>{threshold} Trust</small>
                    <span>{PELLA_TRUST.trustUnlocks[level as 1 | 2 | 3 | 4 | 5]}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.benefitsSection}>
            <div className={styles.sectionHeading}><span className={styles.kicker}>Depot Benefits</span><small>Unlocked benefits apply immediately.</small></div>
            <div className={styles.benefitGrid}>
              {benefits.map((benefit) => {
                const active = trust.level >= benefit.level;
                const next = !active && benefit.level === trust.level + 1;
                return (
                  <article key={benefit.level} className={`${styles.benefitCard} ${active ? styles.benefitActive : ""} ${next ? styles.benefitNext : ""}`}>
                    <img src={benefit.icon} alt="" onError={(event) => { event.currentTarget.src = ICONS.shop; }} />
                    <div><span className={styles.perkState}>{active ? "Active" : next ? "Next" : "Locked"}</span><h3>{benefit.title}</h3><p>{benefit.detail}</p></div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.stockRecord}>
            <div className={styles.sectionHeading}><span className={styles.kicker}>Current Ranch Stock</span><small>Live counts from Pella's supply ledger.</small></div>
            <div className={styles.stockRecordGrid}>
              <div className={styles.recordCard}><span>Feed</span><strong>{counts.feed}</strong></div>
              <div className={styles.recordCard}><span>Materials</span><strong>{counts.materials}</strong></div>
              <div className={styles.recordCard}><span>Repair Kits</span><strong>{counts.repairKits}</strong></div>
              <div className={styles.recordCard}><span>Nursery Kits</span><strong>{counts.nurserySupplyKits}</strong></div>
            </div>
          </section>

          <div className={`${styles.ledgerActions} ${polish.ledgerActions}`}>
            <button type="button" className={styles.secondaryButton} onClick={() => onShop("ranch")}>Open Ranch Shelves</button>
            <button type="button" className={styles.secondaryButton} onClick={() => onShop("special")}>Open Counter Cabinet</button>
          </div>
        </main>
      </div>
    </section>
  );
}
