"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { BATTLE_OUTFITTER_ITEMS as ITEMS, DARIA_VOSS, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_LABELS, equipmentQualityLabel, normalizeBattleEquipment, getBattleLoadout, getEquipmentSlots, getBattleOutfitterStock, getBattleOutfitterMaterialStock, getBattleOutfitterCostLabel, getBattleOutfitterSummary, purchaseBattleOutfitterItem, assignBattleOutfitterEquipment, removeBattleOutfitterEquipment, useBattleOutfitterManual, type EquipmentSlot, type BattleOutfitterItemId, type BattleOutfitterCategory, type BattleOutfitterResult } from "@/data/battleOutfitter";
import { compareEquipment } from "@/data/equipmentComparison";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { GameDialog } from "@/features/ui/GameDialog";
import { useGameContext } from "@/state/GameProvider";
import { useNavigation } from "@/features/navigation/NavigationContext";
import type { CreatureId } from "@/types/ids";
import type { CreatureRecord } from "@/types/creature";
import styles from "./BattleOutfitterBench.module.css";

const ART = "/images/ui/outfitter-v1/";
const SLOT_ART: Record<EquipmentSlot, string> = { weapon: "arena_blade_wraps", armor: "champion_harness", head: "head", handsFeet: "sparring_wraps", accessory: "guard_charm" };
const CATEGORIES: BattleOutfitterCategory[] = ["Equipment", "Manual", "Consumable", "Team Prep"];
type Popup = "choose" | "profile" | "loadout" | "details" | "desk" | "stock" | "buy" | "equip" | "manual" | "remove" | "result" | null;
const nameOf = (id: string | null) => ITEMS.find(item => item.itemId === id)?.name ?? "Empty · no bonus";
function Stats({ creature }: { creature: CreatureRecord | null }) {
  return <><p className={styles.caption}>Base stats · Innate grades</p><dl className={styles.stats}>{STAT_KEYS.map(key => <div key={key}><dt>{key}</dt><dd><strong>{creature?.stats[key] ?? "—"}</strong><b aria-label={creature ? `Innate grade ${creature.statGrades[key]}` : undefined}>{creature?.statGrades[key] ?? "—"}</b></dd></div>)}</dl></>;
}

export function BattleOutfitterBench({ onMoveTraining }: { onMoveTraining: () => void }) {
  const { currentSave, saveCurrentGame, goToTown, goToMainMenu } = useGameContext();
  const { open } = useNavigation();
  const save = useMemo(() => currentSave ? normalizeBattleEquipment(currentSave) : null, [currentSave]);
  useEffect(() => { if (save && save !== currentSave) saveCurrentGame(save); }, [save, currentSave, saveCurrentGame]);
  const busy = useRef(false);
  const [creatureId, setCreatureId] = useState<CreatureId | null>(null);
  const [category, setCategory] = useState<BattleOutfitterCategory>("Equipment");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [slot, setSlot] = useState<EquipmentSlot | null>(null);
  const [itemId, setItemId] = useState<BattleOutfitterItemId>("sparring_wraps");
  const [page, setPage] = useState(0);
  const [creaturePage, setCreaturePage] = useState(0);
  const [popup, setPopup] = useState<Popup>(null);
  const [message, setMessage] = useState("");
  const [removeSlot, setRemoveSlot] = useState<EquipmentSlot>("weapon");
  if (!save) return <main><h1>No active save</h1><button onClick={goToMainMenu}>Main Menu</button></main>;
  const creatures = save.creatures ?? [];
  const creature = creatures.find(entry => entry.creatureId === creatureId) ?? creatures[0] ?? null;
  const variant = creature ? getVariantDefinition(creature.variantId) : null;
  const loadout = creature ? getBattleLoadout(save, creature.creatureId) : null;
  const equipment = creature ? getEquipmentSlots(save, creature.creatureId) : null;
  const items = ITEMS.filter(item => item.category === category && (!slot || item.equipmentSlot === slot) && (!ownedOnly || getBattleOutfitterStock(save,item)>0 || Object.values(equipment??{}).includes(item.itemId)));
  const item = items.find(entry => entry.itemId === itemId) ?? items[0] ?? null;
  const pages = Math.max(1, Math.ceil(items.length / 3));
  const currentPage = Math.min(page, pages - 1);
  const shown = items.slice(currentPage * 3, currentPage * 3 + 3);
  const comparison = creature && item?.equipmentSlot ? compareEquipment(save, creature, item) : null;
  const changes = comparison?.rows.filter(row => row.delta !== 0) ?? [];
  const stock = item ? getBattleOutfitterStock(save, item) : 0;
  const purchase = item ? purchaseBattleOutfitterItem(save, item.itemId) : null;
  const equipCheck = creature && item?.equipmentSlot ? assignBattleOutfitterEquipment(save, creature.creatureId, item.itemId) : null;
  const manualCheck = creature && item?.itemId === "focus_manual" ? useBattleOutfitterManual(save, creature.creatureId) : null;
  function selectCategory(next: BattleOutfitterCategory) { setCategory(next); setSlot(null); setPage(0); }
  function selectSlot(next: EquipmentSlot) { setCategory("Equipment"); setSlot(next); setPage(0); }
  function apply(result: BattleOutfitterResult) {
    let report = result.message;
    if (result.ok) {
      const persisted = saveCurrentGame(result.save);
      const gold = persisted.currencies.gold - result.save.currencies.gold;
      const gp = persisted.currencies.guildPoints - result.save.currencies.guildPoints;
      if (gold || gp) report += ` Goal rewards: +${gold} Gold, +${gp} GP.`;
    }
    setMessage(report); setPopup("result");
  }
  function commit() {
    if (!save || busy.current) return;
    busy.current = true;
    queueMicrotask(() => { busy.current = false; });
    if (popup === "buy" && item) apply(purchaseBattleOutfitterItem(save, item.itemId));
    if (popup === "equip" && item && creature) apply(assignBattleOutfitterEquipment(save, creature.creatureId, item.itemId));
    if (popup === "manual" && creature) apply(useBattleOutfitterManual(save, creature.creatureId));
    if (popup === "remove" && creature) apply(removeBattleOutfitterEquipment(save, creature.creatureId, removeSlot));
  }
  const slots = <div className={styles.slots}>{EQUIPMENT_SLOTS.map(key => <button key={key} aria-label={`Filter ${EQUIPMENT_SLOT_LABELS[key]}`} aria-pressed={slot === key} onClick={() => {selectSlot(key); if (popup === "loadout") setPopup(null);}}><img src={ART + SLOT_ART[key] + ".webp"} alt="" /><span><strong>{EQUIPMENT_SLOT_LABELS[key]}</strong><small>{nameOf(equipment?.[key] ?? null)}</small></span></button>)}</div>;
  const table = (full: boolean) => comparison ? <table className={styles.comparison}><caption>{full ? "Battle stats after replacement" : "Net change after replacement"}</caption><thead><tr><th>Stat</th><th>Current</th><th>After</th><th>Change</th></tr></thead><tbody>{(full ? comparison.rows : changes.slice(0,3)).map(row => <tr key={row.key}><th>{row.label}</th><td>{row.current}</td><td>{row.after}</td><td className={row.delta > 0 ? styles.gain : row.delta < 0 ? styles.loss : ""}>{row.delta > 0 ? "+" : ""}{row.delta}</td></tr>)}</tbody></table> : null;
  const actions = <div className={styles.actions}>{item && <><button className={styles.primary} disabled={!purchase?.ok} onClick={() => setPopup("buy")}>{item.coliseumExclusive ? "Marks Exchange only" : "Buy"}</button>{item.equipmentSlot && <button disabled={!equipCheck?.ok} onClick={() => setPopup("equip")}>{comparison?.previous?.itemId === item.itemId ? "Equipped" : "Equip"}</button>}{item.itemId === "focus_manual" && <button disabled={!manualCheck?.ok} onClick={() => setPopup("manual")}>Study Manual</button>}</>}</div>;
  const details = <>{item ? <><div className={styles.itemHero}><img src={item.iconPath} alt="" /><div><h2>{item.name}</h2>{item.equipmentSlot && <small className={styles.quality} data-grade={item.equipmentGrade}>{equipmentQualityLabel(item)}</small>}<p>{item.equipmentSlot ? EQUIPMENT_SLOT_LABELS[item.equipmentSlot] : item.category}</p><p>Available to equip: {stock}</p></div></div><p>{getBattleOutfitterCostLabel(item)}</p><p>{item.description}</p>{item.equipmentSlot ? <><p>Replaces: <strong>{comparison?.previous?.name ?? "Empty slot"}</strong></p>{creature ? table(true) : <p>Choose a creature to preview exact battle numbers.</p>}<p className={styles.gain}>{comparison?.previous?.itemId === item.itemId ? "Equipped bonuses: " : "+ Gain: "}{item.effectLabel}</p>{comparison?.previous && comparison.previous.itemId !== item.itemId && <p className={styles.loss}>− Remove: {comparison.previous.effectLabel}</p>}<p>Bonuses apply to battle numbers. Base stats and innate letter grades stay unchanged. These items have no additional triggered effects.</p><p>{equipmentQualityLabel(item)}. Gear grade describes item quality, not the creature. Fits all owned creatures. One piece per equipment slot.</p></> : <p>{item.effectLabel}</p>}{!purchase?.ok && <p>{purchase?.message}</p>}{item.equipmentSlot && (!creature || !equipCheck?.ok) && <p>{creature ? equipCheck?.message : "Choose a creature before equipping."}</p>}{item.itemId === "focus_manual" && <><p>Focus Training rank: {loadout?.manualRank ?? 0}/3. Studying consumes one manual and does not change innate grades.</p><button onClick={() => {setPopup(null);onMoveTraining();}}>Use for Move Training instead</button></>}{actions}</> : <p>No {ownedOnly ? "owned " : ""}{slot ? EQUIPMENT_SLOT_LABELS[slot].toLowerCase() : category.toLowerCase()} items here. Switch to Shop to browse.</p>}</>;
  return <main className={styles.bench}>
    <header className={styles.header}><button onClick={goToTown}>← Town</button><h1>Battle Outfitter</h1><button data-navigation-launcher onClick={() => open("menu")}>☰ Menu</button></header>
    <div className={styles.resources}><span><img src="/images/ui/guild-v1/gold.webp" alt="" />{save.currencies.gold.toLocaleString()} Gold</span><span>{getBattleOutfitterMaterialStock(save)} Materials</span><button onClick={() => setPopup("stock")}>Stock Ledger</button></div>
    <section className={styles.workspace}>
      <aside className={styles.loadout}><h2>Equipment</h2>{slots}<Stats creature={creature} /><p className={styles.caption}>Choose slot → compare → buy → equip.</p><button onClick={() => setPopup("loadout")}>Manage Equipment</button></aside>
      <section className={styles.preview} aria-label="Full-body creature preview"><h2 className={styles.sign}>{creature ? `${creature.nickname} · Level ${creature.level}` : "Choose your creature"}</h2><div className={styles.body}>{creature && variant ? <img src={variant.profilePath || variant.portraitPath} alt={`${creature.nickname}, full body`} /> : <div className={styles.empty}><img src="/images/ui/guild-v1/gp.webp" alt="" /><span>No creature selected</span></div>}</div>{loadout && <p className={styles.readiness}>{loadout.readinessTier} · Readiness {loadout.readinessScore}</p>}<div className={styles.actions}><button className={styles.primary} onClick={() => {setCreaturePage(0);setPopup("choose");}}>{creature ? "Change Creature" : "Choose a Creature"}</button>{creature && <button onClick={() => setPopup("profile")}>Full Profile</button>}</div><div className={styles.compactActions}><button onClick={() => setPopup("loadout")}>Equipment</button><button onClick={() => setPopup("details")}>Item Details</button><button onClick={() => setPopup("desk")}>Daria’s Desk</button></div></section>
      <aside className={styles.itemPanel}>{item ? <><div className={styles.itemHero}><img src={item.iconPath} alt="" /><div><h2>{item.name}</h2>{item.equipmentSlot && <small className={styles.quality} data-grade={item.equipmentGrade}>{equipmentQualityLabel(item)}</small>}<p>{item.equipmentSlot ? EQUIPMENT_SLOT_LABELS[item.equipmentSlot] : item.category} · Available {stock}</p></div></div><p className={styles.cost}>{getBattleOutfitterCostLabel(item)}</p>{comparison ? <><p className={styles.replaces}>Replaces: {comparison.previous?.name ?? "Empty slot"}</p>{table(false)}{!changes.length && <p className={styles.caption}>No numeric change.</p>}{changes.length > 3 && <p className={styles.caption}>+ {changes.length - 3} more changes in Full Comparison</p>}</> : <p className={styles.effect}>{item.equipmentSlot ? "Choose a creature to preview exact stat changes." : item.effectLabel}</p>}<button onClick={() => setPopup("details")}>{item.equipmentSlot ? "Full Comparison" : "Item Details"}</button>{actions}<p className={styles.reason}>{!purchase?.ok ? purchase?.message : item.equipmentSlot && !equipCheck?.ok ? creature ? equipCheck?.message : "Choose a creature to equip." : "Buying adds to inventory. Equip applies the bonus."}</p></> : <><h2>{slot ? EQUIPMENT_SLOT_LABELS[slot] : category}</h2><p>No owned items in this category. Switch to Shop to browse.</p><button onClick={() => selectCategory("Equipment")}>All Equipment</button></>}<button className={styles.deskButton} onClick={() => setPopup("desk")}>Daria’s Desk</button></aside>
    </section>
    <footer className={styles.dock}><nav aria-label="Shop categories"><button aria-pressed={ownedOnly} onClick={()=>{setOwnedOnly(!ownedOnly);setPage(0);}}>{ownedOnly ? "Owned" : "Shop"}</button>{CATEGORIES.map(cat => <button key={cat} aria-pressed={category === cat && !slot} onClick={() => selectCategory(cat)}>{cat === "Manual" ? "Manuals" : cat === "Consumable" ? "Consumables" : cat}</button>)}</nav><div className={styles.shelf}><button aria-label="Previous items" disabled={currentPage === 0} onClick={() => setPage(currentPage-1)}>❮</button><div className={styles.cards}>{shown.map(entry => <button key={entry.itemId} aria-label={`Select ${entry.name}`} aria-pressed={item?.itemId === entry.itemId} onClick={() => setItemId(entry.itemId)}><img src={entry.iconPath} alt="" /><span><strong>{entry.name}</strong>{entry.equipmentSlot && <small className={styles.quality} data-grade={entry.equipmentGrade}>{entry.quality} · Gear {entry.equipmentGrade}</small>}<small>{entry.coliseumExclusive ? "Marks exclusive" : `${entry.costGold} Gold · ${entry.materialCost} Materials`}</small></span></button>)}{!shown.length && <p>No owned items. Switch to Shop.</p>}</div><div className={styles.paging}><button aria-label="Next items" disabled={currentPage >= pages - 1} onClick={() => setPage(currentPage+1)}>❯</button><small>{currentPage+1} / {pages}</small></div></div></footer>
    {popup === "choose" && <GameDialog title="Choose a Creature" onClose={() => setPopup(null)} wide><div className={styles.choices}>{creatures.slice(creaturePage*6,creaturePage*6+6).map(entry => <button key={entry.creatureId} onClick={() => {setCreatureId(entry.creatureId);setPopup(null);}}><img src={getVariantDefinition(entry.variantId).portraitPath} alt="" /><span>{entry.nickname}<small>Level {entry.level}</small></span></button>)}</div>{!creatures.length && <p>Adopt or hatch a creature first.</p>}<div className={styles.actions}><button disabled={creaturePage===0} onClick={() => setCreaturePage(creaturePage-1)}>Previous creatures</button><span>{creaturePage+1} / {Math.max(1,Math.ceil(creatures.length/6))}</span><button disabled={(creaturePage+1)*6>=creatures.length} onClick={() => setCreaturePage(creaturePage+1)}>Next creatures</button></div></GameDialog>}
    {popup === "profile" && creature && variant && <GameDialog title={`${creature.nickname} · Full Profile`} onClose={() => setPopup(null)} wide><div className={styles.profile}><img src={variant.profilePath || variant.portraitPath} alt={`${creature.nickname}, full body`} /><div><h3>{variant.name} · Level {creature.level}</h3><Stats creature={creature} /><p>Only certain training can change innate grades. Equipment never changes them.</p><p>{loadout?.labels.join(" · ") || "No equipment"}</p><button onClick={() => setPopup("loadout")}>Manage Equipment</button></div></div></GameDialog>}
    {popup === "loadout" && <GameDialog title="Manage Equipment" onClose={() => setPopup(null)}>{slots}<Stats creature={creature} />{creature ? <>{EQUIPMENT_SLOTS.filter(key => equipment?.[key]).map(key => <p key={key}>{EQUIPMENT_SLOT_LABELS[key]}: {nameOf(equipment?.[key] ?? null)} <button onClick={() => {setRemoveSlot(key);setPopup("remove");}}>Remove {EQUIPMENT_SLOT_LABELS[key]}</button></p>)}<p>One piece per slot. Select a slot to browse matching gear. Buying adds a copy to inventory; Equip applies its bonuses. Replaced items return to inventory.</p></> : <button onClick={() => setPopup("choose")}>Choose a Creature</button>}<button onClick={() => {setCategory("Equipment");setSlot(null);setPage(0);setPopup(null);}}>Browse All Equipment</button></GameDialog>}
    {popup === "details" && <GameDialog title={item?.equipmentSlot ? "Full Comparison" : "Item Details"} onClose={() => setPopup(null)} wide>{details}</GameDialog>}
    {popup === "desk" && <GameDialog title="Daria’s Desk" onClose={() => setPopup(null)}><div className={styles.conversation}><img src={DARIA_VOSS.portraitPath} alt="Daria Voss" /><p>“Check what you gain and what you give up. Equipment changes battle numbers, never your creature’s innate grades.”</p></div><p>All five slots have shop gear. Common / D is affordable starter equipment; Fine / C and Superior / B offer stronger or specialized bonuses. Masterwork / A and Relic / S equipment comes from the Coliseum. Gear grades describe items, never innate creature grades. Higher grade does not mean best for every build.</p><div className={styles.actions}><button onClick={() => setPopup("stock")}>Stock Ledger</button><button onClick={() => {setPopup(null);onMoveTraining();}}>Move Training</button></div></GameDialog>}
    {popup === "stock" && <GameDialog title="Stock Ledger" onClose={() => setPopup(null)} wide><p>{getBattleOutfitterSummary(save).assignedEquipment} pieces equipped. Listed stock is available to equip or use.</p><div className={styles.stock}>{ITEMS.map(entry => <button key={entry.itemId} onClick={() => {setOwnedOnly(false);setCategory(entry.category);setSlot(null);setItemId(entry.itemId);setPage(0);setPopup("details");}}><img src={entry.iconPath} alt="" /><span>{entry.name}<small>{getBattleOutfitterStock(save,entry)} in stock{entry.coliseumExclusive ? " · Marks exclusive" : ""}</small></span></button>)}</div></GameDialog>}
    {(["buy","equip","manual","remove"] as Popup[]).includes(popup) && <GameDialog title={popup === "buy" ? "Confirm Purchase" : popup === "equip" ? "Confirm Equipment" : popup === "manual" ? "Confirm Study" : "Confirm Removal"} onClose={() => setPopup(null)}>{popup === "remove" ? <p>Return {nameOf(equipment?.[removeSlot] ?? null)} to stock? Its numeric battle bonuses will be removed. Innate grades remain unchanged.</p> : <><h3>{item?.name}</h3>{popup === "buy" ? <><p>{item && getBattleOutfitterCostLabel(item)} · Adds one to stock. Buying does not equip it.</p>{comparison && table(true)}<p>{item?.effectLabel}</p><p>Innate grades remain unchanged.</p></> : popup === "manual" ? <p>Consume one Focus Manual for +1 Focus Training rank: +2 Accuracy, +2 Status Power and +2 Max Battle Energy. Innate grades remain unchanged.</p> : <><p>Equip on {creature?.nickname}. {comparison?.previous ? `${comparison.previous.name} returns to stock.` : "Uses one item from stock."}</p>{table(true)}<p>Base stats and innate grades remain unchanged.</p></>}</>}<div className={styles.actions}><button onClick={() => setPopup(null)}>Cancel</button><button className={styles.primary} onClick={commit}>Confirm {popup === "buy" ? "Purchase" : popup === "equip" ? "Equipment" : popup === "manual" ? "Study" : "Removal"}</button></div></GameDialog>}
    {popup === "result" && <GameDialog title="Daria’s Report" onClose={() => setPopup(null)}><p role="status">{message}</p><button onClick={() => setPopup(null)}>Continue</button></GameDialog>}
  </main>;
}
