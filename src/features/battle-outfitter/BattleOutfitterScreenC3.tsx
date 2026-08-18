"use client";

import { useMemo, useState } from "react";
import {
  assignBattleOutfitterEquipment,
  BATTLE_OUTFITTER_ITEMS,
  DARIA_VOSS,
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
  type BattleOutfitterItem,
  type BattleOutfitterItemId,
  type BattleOutfitterResult,
} from "@/data/battleOutfitter";
import { getVariantDefinition } from "@/data/creatures";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import styles from "@/features/market/MarketScreen.module.css";

const ICONS = {
  interior: "/images/backgrounds/guild/guild_hall_interior.png",
  daria: DARIA_VOSS.portraitPath,
  fallback: "/images/ui/icons/icon_ability_trigger.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
  materials: "/images/ui/icons/icon_ranch_upgrade.png",
  marks: "/images/ui/icons/icon_guild_points.png",
} as const;

type Mode = "overview" | "shop" | "loadouts" | "stock";

function cardStyle() {
  return { padding: 16, border: "1px solid rgba(245,201,128,.55)", borderRadius: 8, background: "rgba(18,9,5,.82)", color: "#fff0c9", boxShadow: "0 12px 30px rgba(0,0,0,.38)" } as const;
}

function getCreatureImage(creature: CreatureRecord): string {
  return creature.portraitPath || getVariantDefinition(creature.variantId).portraitPath || ICONS.fallback;
}

function itemName(itemId: BattleOutfitterItemId | null): string {
  return BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === itemId)?.name ?? "Empty";
}

export function BattleOutfitterScreenC3() {
  const { currentSave, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<Mode>("overview");
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [message, setMessage] = useState("Daria now supports offense, defense, and utility equipment. Coliseum gear must be earned from the Marks Exchange.");

  const normalShopItems = useMemo(() => BATTLE_OUTFITTER_ITEMS.filter((item) => !item.coliseumExclusive), []);
  const equipmentItems = useMemo(() => BATTLE_OUTFITTER_ITEMS.filter((item) => item.category === "Equipment"), []);

  if (!currentSave) {
    return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;
  }

  const save = currentSave;
  const creatures = save.creatures ?? [];
  const selectedCreature = creatures.find((entry) => entry.creatureId === selectedCreatureId)
    ?? creatures.find((entry) => !getTrainingUnavailableReason(save, entry.creatureId))
    ?? creatures[0]
    ?? null;
  const summary = getBattleOutfitterSummary(save);
  const materials = getBattleOutfitterMaterialStock(save);

  function apply(result: BattleOutfitterResult, nextMode: Mode) {
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setMode(nextMode);
  }

  function assign(creatureId: CreatureId, itemId: BattleOutfitterItemId) {
    apply(assignBattleOutfitterEquipment(save, creatureId, itemId), "loadouts");
  }

  function remove(creatureId: CreatureId, slot: BattleLoadoutSlot) {
    apply(removeBattleOutfitterEquipment(save, creatureId, slot), "loadouts");
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" style={{ backgroundImage: `url(${ICONS.interior})` }} />
        <div className={styles.shade} aria-hidden="true" />
        <header className={styles.header}>
          <div><p className={styles.kicker}>Battle M6 + Coliseum C3</p><h1>Battle Outfitter</h1><p>Three-slot combat loadouts, move training, consumables, and Coliseum reward gear.</p><p className={styles.message}>{message}</p></div>
          <div className={styles.headerActions}>
            <div className={styles.statBox}><span>Gold</span><strong>{formatGold(save.currencies.gold)}</strong></div>
            <div className={styles.statBox}><span>Materials</span><strong>{materials}</strong></div>
            <div className={styles.statBox}><span>Stock</span><strong>{summary.totalStock}</strong></div>
            <div className={styles.statBox}><span>Elite Ready</span><strong>{summary.eliteCreatures}/{creatures.length}</strong></div>
            <button type="button" className={styles.backButton} onClick={goToTown}>Town</button>
            <button type="button" className={styles.backButton} onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        <nav style={{ position: "relative", zIndex: 4, display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 18px 0" }}>
          {(["overview", "shop", "loadouts", "stock"] as Mode[]).map((entry) => <button key={entry} type="button" className={entry === mode ? styles.buyButton : styles.backButton} onClick={() => setMode(entry)}>{entry === "overview" ? "Outfitter" : entry === "shop" ? "Gold Shelves" : entry === "loadouts" ? "Loadout Bench" : "Stock Ledger"}</button>)}
        </nav>

        {mode === "overview" ? (
          <section style={{ position: "relative", zIndex: 3, display: "grid", gridTemplateColumns: "minmax(260px,360px) minmax(0,1fr)", gap: 20, padding: 18 }}>
            <aside style={cardStyle()}><img src={ICONS.daria} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 8 }} /><p className={styles.kicker}>Outfitter</p><h2>Daria Voss</h2><p>“Gold buys reliable basics. Coliseum Marks buy tournament gear. Either way, put the right piece in the right slot.”</p></aside>
            <section style={{ ...cardStyle(), display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12, alignContent: "start" }}>
              <button type="button" className={styles.infoCard} onClick={() => setMode("shop")}><span>Gold + Materials</span><strong>Open Standard Shelves</strong></button>
              <button type="button" className={styles.infoCard} onClick={() => setMode("loadouts")}><span>Offense · Defense · Utility</span><strong>Manage Creature Loadouts</strong></button>
              <button type="button" className={styles.infoCard} onClick={() => setMode("stock")}><span>{summary.totalStock} pieces</span><strong>Review All Stock</strong></button>
              <div className={styles.infoCard}><span>Average Readiness</span><strong>{summary.averageReadiness}</strong></div>
              <div className={styles.infoCard}><span>Assigned Equipment</span><strong>{summary.assignedEquipment}</strong></div>
              <div className={styles.infoCard}><span>Focus Training Ranks</span><strong>{summary.manualRanks}</strong></div>
            </section>
          </section>
        ) : null}

        {mode === "shop" ? (
          <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: 18 }}>
            <aside className={styles.panel}><h2>Standard Shelves</h2><p>These items use Gold and Materials. Marks-exclusive gear appears in the Coliseum Exchange and cannot be bought here.</p><div className={styles.infoCard}><span>Gold</span><strong>{formatGold(save.currencies.gold)}</strong></div><div className={styles.infoCard}><span>Materials</span><strong>{materials}</strong></div></aside>
            <section className={styles.panel}><div className={styles.listings}>{normalShopItems.map((item) => { const stock = getBattleOutfitterStock(save, item); const full = Boolean(item.maxStock && stock >= item.maxStock); const affordable = save.currencies.gold >= item.costGold && materials >= item.materialCost; return <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{item.category}</span><h3 className={styles.listingName}>{item.name}</h3><p className={styles.listingDesc}>{item.description}</p><p className={styles.gradePreview}>{item.effectLabel}</p><p>Owned: {stock}{item.maxStock ? `/${item.maxStock}` : ""}</p><button type="button" className={styles.buyButton} disabled={full || !affordable} onClick={() => apply(purchaseBattleOutfitterItem(save, item.itemId), "shop")}>{full ? "Full" : `Buy · ${getBattleOutfitterCostLabel(item)}`}</button></div></article>; })}</div></section>
          </section>
        ) : null}

        {mode === "stock" ? (
          <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: 18 }}>
            <aside className={styles.panel}><h2>Stock Ledger</h2><p>Standard and Coliseum items share the same persistent inventory.</p><div className={styles.infoCard}><span>Equipment</span><strong>{summary.equipmentStock}</strong></div><div className={styles.infoCard}><span>Consumables</span><strong>{summary.consumableStock}</strong></div><div className={styles.infoCard}><span>Team Prep</span><strong>{summary.teamPrepStock}</strong></div></aside>
            <section className={styles.panel}><div className={styles.listings}>{BATTLE_OUTFITTER_ITEMS.map((item) => <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{item.coliseumExclusive ? "Marks Exclusive" : item.category}</span><h3 className={styles.listingName}>{item.name}</h3><p className={styles.listingDesc}>{item.effectLabel}</p><strong>Owned: {getBattleOutfitterStock(save, item)}{item.maxStock ? `/${item.maxStock}` : ""}</strong></div></article>)}</div></section>
          </section>
        ) : null}

        {mode === "loadouts" ? <LoadoutPanel save={save} creatures={creatures} selectedCreature={selectedCreature} equipmentItems={equipmentItems} onSelect={setSelectedCreatureId} onAssign={assign} onRemove={remove} onManual={(creatureId) => apply(useBattleOutfitterManual(save, creatureId), "loadouts")} /> : null}
      </section>
    </main>
  );
}

function LoadoutPanel({ save, creatures, selectedCreature, equipmentItems, onSelect, onAssign, onRemove, onManual }: { save: NonNullable<ReturnType<typeof useGameContext>["currentSave"]>; creatures: CreatureRecord[]; selectedCreature: CreatureRecord | null; equipmentItems: BattleOutfitterItem[]; onSelect: (id: CreatureId) => void; onAssign: (creatureId: CreatureId, itemId: BattleOutfitterItemId) => void; onRemove: (creatureId: CreatureId, slot: BattleLoadoutSlot) => void; onManual: (creatureId: CreatureId) => void }) {
  const loadout = selectedCreature ? getBattleLoadout(save, selectedCreature.creatureId) : null;
  const selectedUnavailableReason = selectedCreature ? getTrainingUnavailableReason(save, selectedCreature.creatureId) : null;
  const focusManual = BATTLE_OUTFITTER_ITEMS.find((item) => item.itemId === "focus_manual");
  const manualStock = focusManual ? getBattleOutfitterStock(save, focusManual) : 0;
  const slotCurrent = (slot: BattleLoadoutSlot) => slot === "offense" ? loadout?.offenseItemId : slot === "defense" ? loadout?.defenseItemId : loadout?.utilityItemId;
  return (
    <section className={styles.grid} style={{ position: "relative", zIndex: 3, padding: 18 }}>
      <aside className={styles.panel}>
        <h2>Creature Loadouts</h2>
        <p>Creatures away on Guild service or at the Training Grounds remain visible for inspection, but their loadouts cannot be changed until they return.</p>
        <div className={styles.sideList}>{creatures.map((creature) => {
          const unavailableReason = getTrainingUnavailableReason(save, creature.creatureId);
          return <button
            key={creature.creatureId}
            type="button"
            className={styles.infoCard}
            data-creature-outfitter-availability={unavailableReason ? "unavailable" : "available"}
            onClick={() => onSelect(creature.creatureId)}
            style={{ opacity: unavailableReason ? 0.52 : 1, filter: unavailableReason ? "grayscale(.7)" : "none" }}
          >
            <img src={getCreatureImage(creature)} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} />
            <span>Lv. {creature.level}</span>
            <strong>{creature.nickname}</strong>
            <small>{unavailableReason ?? getBattleReadinessLabel(save, creature.creatureId)}</small>
          </button>;
        })}</div>
      </aside>
      <section className={styles.panel}>{selectedCreature && loadout ? <>
        <h2>{selectedCreature.nickname}</h2>
        <p className={styles.gradePreview}>{getBattleReadinessLabel(save, selectedCreature.creatureId)}</p>
        {selectedUnavailableReason ? (
          <div
            data-selected-outfitter-unavailable="true"
            style={{ marginBottom: 12, padding: 11, border: "1px solid rgba(255,174,133,.55)", borderRadius: 8, background: "rgba(110,42,27,.42)", color: "#ffd6c5", fontWeight: 800 }}
          >
            Unavailable — {selectedUnavailableReason}. Loadout and Focus Manual controls are locked until this creature returns.
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginBottom: 12 }}>{(["offense", "defense", "utility"] as BattleLoadoutSlot[]).map((slot) => <div key={slot} className={styles.infoCard}><span>{slot[0].toUpperCase() + slot.slice(1)} Slot</span><strong>{itemName(slotCurrent(slot) ?? null)}</strong><button type="button" className={styles.backButton} disabled={Boolean(selectedUnavailableReason) || !slotCurrent(slot)} onClick={() => onRemove(selectedCreature.creatureId, slot)}>Remove</button></div>)}</div>
        <button type="button" className={styles.buyButton} disabled={Boolean(selectedUnavailableReason) || manualStock <= 0 || loadout.manualRank >= 3} onClick={() => onManual(selectedCreature.creatureId)}>Use Focus Manual ({manualStock})</button>
        <h2 style={{ marginTop: 18 }}>Assign Equipment</h2>
        <div className={styles.listings}>{equipmentItems.map((item) => { const stock = getBattleOutfitterStock(save, item); const already = item.loadoutSlot ? slotCurrent(item.loadoutSlot) === item.itemId : false; return <article key={item.itemId} className={styles.listing}><div className={styles.listingArt}><img src={item.iconPath} alt="" onError={(event) => { event.currentTarget.src = ICONS.fallback; }} /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{item.coliseumExclusive ? `Marks · ${item.loadoutSlot}` : item.loadoutSlot}</span><h3 className={styles.listingName}>{item.name}</h3><p className={styles.listingDesc}>{item.effectLabel}</p><p>Stock: {stock}</p><button type="button" className={styles.buyButton} disabled={Boolean(selectedUnavailableReason) || !item.loadoutSlot || stock <= 0 || already} onClick={() => onAssign(selectedCreature.creatureId, item.itemId)}>{already ? "Equipped" : "Assign"}</button></div></article>; })}</div>
      </> : <p>No creatures available.</p>}</section>
    </section>
  );
}
