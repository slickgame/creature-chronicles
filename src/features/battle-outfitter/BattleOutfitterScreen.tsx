"use client";

import { useMemo, useState } from "react";
import {
  assignBattleOutfitterEquipment,
  BATTLE_OUTFITTER_ITEMS,
  DARIAN_VOSS,
  getBattleLoadout,
  getBattleOutfitterCostLabel,
  getBattleOutfitterMaterialStock,
  getBattleOutfitterStock,
  getBattleOutfitterSummary,
  getBattleReadinessLabel,
  purchaseBattleOutfitterItem,
  removeBattleOutfitterEquipment,
  useBattleOutfitterManual,
  type BattleLoadoutSlot,
  type BattleOutfitterCategory,
  type BattleOutfitterItem,
  type BattleOutfitterItemId,
  type BattleOutfitterResult,
} from "@/data/battleOutfitter";
import { getVariantDefinition } from "@/data/creatures";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import styles from "@/features/market/MarketScreen.module.css";

const CATEGORIES: Array<BattleOutfitterCategory | "All"> = ["All", "Equipment", "Manual", "Consumable", "Team Prep"];

const ICONS = {
  interior: "/images/backgrounds/guild/guild_hall_interior.png",
  darian: DARIAN_VOSS.portraitPath,
  fallback: "/images/ui/icons/icon_ability_trigger.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  materials: "/images/ui/icons/icon_ranch_upgrade.png",
  manual: "/images/ui/icons/icon_collection_book.png",
} as const;

type OutfitterMode = "interior" | "shop" | "talk" | "stock" | "loadouts";

function panelStyle() {
  return { position: "relative", zIndex: 3, padding: 18, border: "1px solid rgba(245,201,128,.55)", borderRadius: 4, background: "rgba(21, 10, 5, .74)", color: "#fff0c9", boxShadow: "0 14px 34px rgba(0,0,0,.42)" } as const;
}

function hotspotStyle() {
  return { display: "grid", gap: 4, justifyItems: "center", minWidth: 220, padding: "18px 20px", border: "2px solid rgba(245,201,128,.72)", borderRadius: 4, background: "rgba(0,0,0,.44)", color: "#fff7dd", boxShadow: "0 14px 28px rgba(0,0,0,.35)", cursor: "pointer" } as const;
}

function getCreatureImage(creature: CreatureRecord): string {
  return getVariantDefinition(creature.variantId).portraitPath || ICONS.fallback;
}

function getItemName(itemId: string | null): string {
  return BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId)?.name ?? "Empty";
}

function getItemById(itemId: string): BattleOutfitterItem | null {
  return BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId) ?? null;
}

function ReadinessBadge({ save, creatureId }: { save: GameSave; creatureId: CreatureId }) {
  const loadout = getBattleLoadout(save, creatureId);
  return <p className={styles.gradePreview}>{loadout.readinessTier} • Readiness {loadout.readinessScore}</p>;
}

export function BattleOutfitterScreen() {
  const { currentSave, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<OutfitterMode>("interior");
  const [category, setCategory] = useState<BattleOutfitterCategory | "All">("All");
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [message, setMessage] = useState("Darian keeps the combat shelves ready: equipment stock, move manuals, battle consumables, and team-prep kits.");

  const visibleItems = useMemo(() => BATTLE_OUTFITTER_ITEMS.filter((item) => category === "All" || item.category === category), [category]);
  const equipmentItems = useMemo(() => BATTLE_OUTFITTER_ITEMS.filter((item) => item.category === "Equipment"), []);

  if (!currentSave) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before visiting the Battle Outfitter.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  const activeSave = currentSave;
  const creatures = activeSave.creatures ?? [];
  const selectedCreature = creatures.find((creature) => creature.creatureId === selectedCreatureId) ?? creatures[0] ?? null;
  const summary = getBattleOutfitterSummary(activeSave);
  const materials = getBattleOutfitterMaterialStock(activeSave);

  function applyResult(result: BattleOutfitterResult, nextMode: OutfitterMode) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setMode(nextMode);
  }

  function buyItem(itemId: string) {
    applyResult(purchaseBattleOutfitterItem(activeSave, itemId), "shop");
  }

  function assignItem(creatureId: CreatureId, itemId: BattleOutfitterItemId) {
    applyResult(assignBattleOutfitterEquipment(activeSave, creatureId, itemId), "loadouts");
  }

  function removeItem(creatureId: CreatureId, slot: BattleLoadoutSlot) {
    applyResult(removeBattleOutfitterEquipment(activeSave, creatureId, slot), "loadouts");
  }

  function useManual(creatureId: CreatureId) {
    applyResult(useBattleOutfitterManual(activeSave, creatureId), "loadouts");
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />
        <header className={styles.header}>
          <div><p className={styles.kicker}>M54 Battle Outfitter Economy</p><h1>Battle Outfitter</h1><p>{DARIAN_VOSS.name}, {DARIAN_VOSS.title}, prepares future combat gear, manuals, consumables, and team tools.</p><p className={styles.message}>{message}</p></div>
          <div className={styles.headerActions}>
            <div className={styles.statBox}><span>Gold</span><strong>{formatGold(activeSave.currencies.gold)}</strong></div>
            <div className={styles.statBox}><span>Materials</span><strong>{materials}</strong></div>
            <div className={styles.statBox}><span>Stock</span><strong>{summary.totalStock}</strong></div>
            <div className={styles.statBox}><span>Battle Ready</span><strong>{summary.readyCreatures}/{creatures.length}</strong></div>
            <button type="button" className={styles.backButton} onClick={goToTown}>Back to Town</button>
            <button type="button" className={styles.backButton} onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        {mode === "interior" ? <InteriorPanel summary={summary} materials={materials} setMode={setMode} /> : null}
        {mode === "talk" ? <TalkPanel onBack={() => setMode("interior")} onLoadouts={() => setMode("loadouts")} /> : null}
        {mode === "stock" ? <StockPanel save={activeSave} summary={summary} onBack={() => setMode("interior")} /> : null}
        {mode === "shop" ? <ShopPanel save={activeSave} category={category} setCategory={setCategory} visibleItems={visibleItems} onBuy={buyItem} onBack={() => setMode("interior")} /> : null}
        {mode === "loadouts" ? <LoadoutPanel save={activeSave} creatures={creatures} selectedCreature={selectedCreature} setSelectedCreatureId={setSelectedCreatureId} equipmentItems={equipmentItems} onAssign={assignItem} onRemove={removeItem} onUseManual={useManual} onBack={() => setMode("interior")} /> : null}
      </section>
    </main>
  );
}

function InteriorPanel({ summary, materials, setMode }: { summary: ReturnType<typeof getBattleOutfitterSummary>; materials: number; setMode: (mode: OutfitterMode) => void }) {
  return (
    <section aria-label="Battle Outfitter interior" style={{ position: "relative", zIndex: 2, minHeight: "calc(100vh - 230px)", padding: "28px 34px 34px", overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.62)), url(${ICONS.interior}) center/cover`, opacity: 0.44 }} />
      <div style={{ position: "relative", zIndex: 3, display: "grid", gridTemplateColumns: "minmax(260px, 360px) minmax(0, 1fr)", gap: 26, alignItems: "end", minHeight: "58vh" }}>
        <aside style={panelStyle()}>
          <div style={{ display: "grid", gridTemplateColumns: "76px minmax(0,1fr)", gap: 12, alignItems: "center" }}>
            <img src={ICONS.darian} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 999, border: "1px solid rgba(245,201,128,.55)" }} />
            <div><p className={styles.kicker}>Outfitter</p><h2 style={{ margin: 0 }}>Darian Voss</h2><p style={{ margin: "6px 0 0" }}>{summary.totalStock} stocked • {summary.assignedEquipment} assigned • {materials} materials</p></div>
          </div>
          <p style={{ marginTop: 16, lineHeight: 1.55 }}>&quot;Training makes a creature better. Loadouts make a team ready. Good gear takes Gold and Materials, so plan your ranch economy before outfitting everyone.&quot;</p>
          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" className={styles.buyButton} onClick={() => setMode("shop")}>Open Shelves</button>
            <button type="button" className={styles.buyButton} onClick={() => setMode("loadouts")}>Creature Loadouts</button>
            <button type="button" className={styles.buyButton} onClick={() => setMode("stock")}>Stock Ledger</button>
            <button type="button" className={styles.buyButton} onClick={() => setMode("talk")}>Talk to Darian</button>
          </div>
        </aside>
        <div style={{ position: "relative", minHeight: 430 }}>
          <button type="button" style={{ ...hotspotStyle(), position: "absolute", left: "10%", top: "38%" }} onClick={() => setMode("shop")}><img src={ICONS.fallback} alt="" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 999 }} /><strong>Combat Shelves</strong><span style={{ color: "#7fdbff", fontWeight: 900 }}>Gold + Materials</span></button>
          <button type="button" style={{ ...hotspotStyle(), position: "absolute", right: "8%", top: "30%" }} onClick={() => setMode("talk")}><img src={ICONS.darian} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} style={{ width: 66, height: 66, objectFit: "cover", borderRadius: 999 }} /><strong>Darian Voss</strong><span style={{ color: "#7fdbff", fontWeight: 900 }}>Combat prep advice</span></button>
          <button type="button" style={{ ...hotspotStyle(), position: "absolute", left: "39%", bottom: "8%" }} onClick={() => setMode("loadouts")}><img src={ICONS.manual} alt="" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 999 }} /><strong>Loadout Bench</strong><span style={{ color: "#7fdbff", fontWeight: 900 }}>Assign equipment</span></button>
        </div>
      </div>
    </section>
  );
}

function TalkPanel({ onBack, onLoadouts }: { onBack: () => void; onLoadouts: () => void }) {
  return (
    <section style={{ position: "relative", zIndex: 3, padding: 24, display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 18 }}>
      <aside style={panelStyle()}><img src={ICONS.darian} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(245,201,128,.45)" }} /><h2>Darian Voss</h2><p>{DARIAN_VOSS.title}</p></aside>
      <section style={panelStyle()}><p className={styles.kicker}>Combat Prep</p><h2>Loadouts Before Battles</h2><p style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>&quot;The Coliseum can wait. Prepared teams should not. Wraps and charms are simple equipment hooks. Manuals are a quiet way to mark who is ready for move training later.&quot;</p><p style={{ lineHeight: 1.6 }}>Equipment assigned here leaves stock and goes onto a creature. Removing it returns the item to stock. New purchases now cost both Gold and Materials, matching the Training Grounds upgrade economy.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}><button type="button" className={styles.buyButton} onClick={onLoadouts}>Open Loadouts</button><button type="button" className={styles.backButton} onClick={onBack}>Back to Outfitter</button></div></section>
    </section>
  );
}

function StockPanel({ save, summary, onBack }: { save: GameSave; summary: ReturnType<typeof getBattleOutfitterSummary>; onBack: () => void }) {
  return (
    <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: "14px 18px 24px" }}>
      <aside className={styles.panel}><h2>Stock Ledger</h2><p>These are future combat resources already stored on the save.</p><div className={styles.sideList}><div className={styles.infoCard}><span>Total Stock</span><strong>{summary.totalStock}</strong></div><div className={styles.infoCard}><span>Assigned Gear</span><strong>{summary.assignedEquipment}</strong></div><div className={styles.infoCard}><span>Manual Ranks</span><strong>{summary.manualRanks}</strong></div><div className={styles.infoCard}><span>Materials</span><strong>{summary.materialStock}</strong></div><button type="button" className={styles.backButton} onClick={onBack}>Back to Outfitter</button></div></aside>
      <section className={styles.panel}><h2>Owned Stock</h2><div className={styles.listings}>{BATTLE_OUTFITTER_ITEMS.map((item) => <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{item.category}</span><h3 className={styles.listingName}>{item.name}</h3><p className={styles.listingDesc}>{item.effectLabel}</p><p className={styles.gradePreview}>Owned: {getBattleOutfitterStock(save, item)}{item.maxStock ? `/${item.maxStock}` : ""}</p></div></article>)}</div></section>
    </section>
  );
}

function ShopPanel({ save, category, setCategory, visibleItems, onBuy, onBack }: { save: GameSave; category: BattleOutfitterCategory | "All"; setCategory: (category: BattleOutfitterCategory | "All") => void; visibleItems: BattleOutfitterItem[]; onBuy: (itemId: string) => void; onBack: () => void }) {
  const materials = getBattleOutfitterMaterialStock(save);
  return (
    <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: "14px 18px 24px" }}>
      <aside className={styles.panel}><h2>Combat Shelves</h2><p>Buy future battle-prep stock with Gold and Materials.</p><div className={styles.sideList}><div className={styles.infoCard}><span>Materials Available</span><strong>{materials}</strong></div>{CATEGORIES.map((item) => <button key={item} type="button" className={styles.infoCard} onClick={() => setCategory(item)}><span>Category</span><strong>{item === category ? `› ${item}` : item}</strong></button>)}<button type="button" className={styles.backButton} onClick={onBack}>Back to Outfitter</button></div></aside>
      <section className={styles.panel}><h2>{category} Items</h2><div className={styles.listings}>{visibleItems.map((item) => { const stock = getBattleOutfitterStock(save, item); const full = Boolean(item.maxStock && stock >= item.maxStock); const hasGold = save.currencies.gold >= item.costGold; const hasMaterials = materials >= item.materialCost; const canAfford = hasGold && hasMaterials; return <article key={item.itemId} className={`${styles.listing} ${full ? styles.sold : ""}`}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{item.category}</span><h3 className={styles.listingName}>{item.name}</h3><p className={styles.listingDesc}>{item.description}</p><p className={styles.gradePreview}>{item.effectLabel}</p><div className={styles.price}><img src={ICONS.gold} alt="" /><div><span>Cost</span><strong>{getBattleOutfitterCostLabel(item)}</strong><em>Owned: {stock}{item.maxStock ? `/${item.maxStock}` : ""}</em>{full ? <em>Stock full.</em> : null}{!hasGold ? <em>Need more Gold.</em> : null}{!hasMaterials ? <em>Need more Materials.</em> : null}</div></div><div className={styles.actions}><button type="button" className={styles.buyButton} disabled={full || !canAfford} onClick={() => onBuy(item.itemId)}>{full ? "Full" : "Buy"}</button></div></div></article>; })}</div></section>
    </section>
  );
}

function LoadoutPanel({ save, creatures, selectedCreature, setSelectedCreatureId, equipmentItems, onAssign, onRemove, onUseManual, onBack }: { save: GameSave; creatures: CreatureRecord[]; selectedCreature: CreatureRecord | null; setSelectedCreatureId: (id: CreatureId) => void; equipmentItems: BattleOutfitterItem[]; onAssign: (creatureId: CreatureId, itemId: BattleOutfitterItemId) => void; onRemove: (creatureId: CreatureId, slot: BattleLoadoutSlot) => void; onUseManual: (creatureId: CreatureId) => void; onBack: () => void }) {
  const loadout = selectedCreature ? getBattleLoadout(save, selectedCreature.creatureId) : null;
  const focusManual = getItemById("focus_manual");
  const manualStock = focusManual ? getBattleOutfitterStock(save, focusManual) : 0;
  return (
    <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: "14px 18px 24px" }}>
      <aside className={styles.panel}><h2>Creature Loadouts</h2><p>Pick a creature, assign equipment, and use Focus Manuals to raise readiness.</p><div className={styles.sideList}>{creatures.map((creature) => <button key={creature.creatureId} type="button" className={styles.infoCard} onClick={() => setSelectedCreatureId(creature.creatureId)}><img src={getCreatureImage(creature)} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /><span>{creature.speciesId}</span><strong>{creature.nickname}</strong><ReadinessBadge save={save} creatureId={creature.creatureId} /></button>)}<button type="button" className={styles.backButton} onClick={onBack}>Back to Outfitter</button></div></aside>
      <section className={styles.panel}>{selectedCreature && loadout ? <><h2>{selectedCreature.nickname}</h2><p className={styles.gradePreview}>{getBattleReadinessLabel(save, selectedCreature.creatureId)}</p><div className={styles.sideList} style={{ marginBottom: 14 }}><div className={styles.infoCard}><span>Offense Slot</span><strong>{getItemName(loadout.offenseItemId)}</strong></div><div className={styles.infoCard}><span>Defense Slot</span><strong>{getItemName(loadout.defenseItemId)}</strong></div><div className={styles.infoCard}><span>Manual Rank</span><strong>{loadout.manualRank}/3</strong></div></div><div className={styles.actions} style={{ marginBottom: 14, flexWrap: "wrap" }}><button type="button" className={styles.buyButton} disabled={!loadout.offenseItemId} onClick={() => onRemove(selectedCreature.creatureId, "offense")}>Remove Offense</button><button type="button" className={styles.buyButton} disabled={!loadout.defenseItemId} onClick={() => onRemove(selectedCreature.creatureId, "defense")}>Remove Defense</button><button type="button" className={styles.buyButton} disabled={manualStock <= 0 || loadout.manualRank >= 3} onClick={() => onUseManual(selectedCreature.creatureId)}>Use Focus Manual ({manualStock})</button></div><h2>Assign Equipment</h2><div className={styles.listings}>{equipmentItems.map((item) => { const stock = getBattleOutfitterStock(save, item); const slot = item.loadoutSlot; const currentSlotItem = slot === "offense" ? loadout.offenseItemId : loadout.defenseItemId; const alreadyAssigned = currentSlotItem === item.itemId; return <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{item.loadoutSlot ?? "Equipment"}</span><h3 className={styles.listingName}>{item.name}</h3><p className={styles.listingDesc}>{item.effectLabel}</p><p className={styles.gradePreview}>Stock: {stock}</p><div className={styles.actions}><button type="button" className={styles.buyButton} disabled={!slot || stock <= 0 || alreadyAssigned} onClick={() => onAssign(selectedCreature.creatureId, item.itemId)}>{alreadyAssigned ? "Equipped" : "Assign"}</button></div></div></article>; })}</div></> : <div className={styles.infoCard}><span>No Creature</span><strong>Buy or hatch a creature before assigning combat loadouts.</strong></div>}</section>
    </section>
  );
}

