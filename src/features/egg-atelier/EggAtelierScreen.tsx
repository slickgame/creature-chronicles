"use client";

import { useEffect, useRef, useState } from "react";
import { SELENE_VIRELL, EGG_ATELIER_EGG_OFFERS, EGG_ATELIER_UPGRADES, applyAcceleratedIncubation, applyAbilityPolish, applyStatConditioning, buyEggFromSelene, purchaseEggAtelierUpgrade, sellEggToSelene, donateEggToResearch, getNurserySupplyKitCount, getEggAtelierServiceCost, getEggAtelierAbilityPolishChance, getEggAtelierStatConditioningChance, getEggAtelierUpgradeEffects, getEggSaleValue, canBuyEggOffer, hasEggAtelierUpgrade, hasEggAtelierServiceUsed } from "@/data/eggAtelier";
import type { EggAtelierServiceId, EggAtelierEggOfferId, EggAtelierUpgradeId } from "@/data/eggAtelier";
import { getNpcTrustRecord, getNpcTrustSummary, getNpcNextUnlock } from "@/data/townNpcs";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { getQuickhatchCatalystCount } from "@/data/tutorialQuickhatch";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { GameDialog } from "@/features/ui/GameDialog";
import { RanchIcon } from "@/features/ui/RanchIcon";
import { useGameContext } from "@/state/GameProvider";
import type { EggId } from "@/types/ids";
import type { EggRecord } from "@/types/save";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./SunlitIncubator.module.css";

type Mode = "care" | "offers" | "upgrades";
type Popup = "talk" | "trust" | "appraisal" | "more" | "review" | "result" | null;
type Action = { kind: "service"; id: EggAtelierServiceId; eggId: EggId } | { kind: "offer"; id: EggAtelierEggOfferId } | { kind: "upgrade"; id: EggAtelierUpgradeId } | { kind: "sell"; eggId: EggId } | { kind: "donate"; eggId: EggId };
const EGG_ART = "/images/ui/interiors-v1/atelier-egg.webp";
const iconPath = (name: string) => `/images/ui/atelier-v1/${name}.webp`;
function AtelierIcon({ name }: { name: string }) { return <img className={styles.icon} src={iconPath(name)} alt="" aria-hidden="true" />; }
const SERVICES: { id: EggAtelierServiceId; name: string; short: string; icon: string }[] = [
  { id: "accelerated_incubation", name: "Accelerated Incubation", short: "Reduce timer by 1 day", icon: iconPath("hourglass") },
  { id: "ability_polish", name: "Ability Polish", short: "Once per egg", icon: iconPath("polish") },
  { id: "stat_conditioning", name: "Stat Conditioning", short: "Once per egg", icon: iconPath("cradle") },
];
function serviceStatus(block: string | undefined, fallback: string) {
  if (!block) return fallback;
  if (block.startsWith("Need ")) return "Insufficient supplies";
  if (block.startsWith("Requires ")) return "Cradle required";
  if (block.startsWith("Already ready")) return "Ready to hatch";
  if (block.startsWith("Already used")) return "Already used";
  if (block.startsWith("No projected")) return "No ability to polish";
  if (block.includes("already")) return "Maximum grade";
  return block;
}
const eggName = (egg: EggRecord) => egg.suggestedName || `${getVariantDefinition(egg.variantId).name} Egg`;
const eggStatus = (egg: EggRecord) => egg.status === "ready" ? "Ready to hatch" : `${egg.daysRemaining} day${egg.daysRemaining === 1 ? "" : "s"} remaining`;

export function EggAtelierScreen() {
  const { currentSave: save, saveCurrentGame, goToTown, goToNursery } = useGameContext();
  const [mode, setMode] = useState<Mode>("care");
  const [eggId, setEggId] = useState<EggId | null>(null);
  const [offerId, setOfferId] = useState<EggAtelierEggOfferId>("common_mystery_egg");
  const [upgradeId, setUpgradeId] = useState<EggAtelierUpgradeId>("soft_bedding");
  const [popup, setPopup] = useState<Popup>(null);
  const [pending, setPending] = useState<{ action: Action; signature: string } | null>(null);
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
      const size = Math.max(1, Math.min(4, Math.floor((entry.contentRect.width + 8) / 210)));
      if (size !== sizeRef.current) { sizeRef.current = size; setPageSize(size); setPage(0); }
    });
    observer.observe(dockRef.current);
    return () => observer.disconnect();
  }, [hasSave]);
  if (!save) return <main className={ui.interior}><h1>No active save</h1></main>;
  const activeSave = save;
  const eggs = (save.eggs ?? []).filter(egg => egg.status !== "hatched").sort((a, b) => Number(b.status === "ready") - Number(a.status === "ready") || a.daysRemaining - b.daysRemaining);
  const egg = eggs.find(item => item.eggId === eggId) ?? eggs[0];
  const offer = EGG_ATELIER_EGG_OFFERS.find(item => item.offerId === offerId)!;
  const upgrade = EGG_ATELIER_UPGRADES.find(item => item.upgradeId === upgradeId)!;
  const kits = getNurserySupplyKitCount(save);
  const effects = getEggAtelierUpgradeEffects(save);
  const trust = getNpcTrustRecord(save, "selene_virell");
  const ready = eggs.filter(item => item.status === "ready").length;
  const choices = mode === "care" ? eggs.map(item => ({ id: item.eggId, name: eggName(item), detail: eggStatus(item), icon: iconPath("egg") })) : mode === "offers" ? EGG_ATELIER_EGG_OFFERS.map(item => ({ id: item.offerId, name: item.name, detail: `${item.price} Gold · Trust ${item.trustRequired}`, icon: item.iconPath })) : EGG_ATELIER_UPGRADES.map(item => ({ id: item.upgradeId, name: item.name, detail: hasEggAtelierUpgrade(save, item.upgradeId) ? "Installed" : `${item.costGold} Gold · ${item.costNurseryKits} Kits`, icon: item.iconPath }));
  const selectedId = mode === "care" ? egg?.eggId : mode === "offers" ? offerId : upgradeId;
  const pages = Math.max(1, Math.ceil(choices.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const title = mode === "care" ? egg ? eggName(egg) : "Your next arrival" : mode === "offers" ? offer.name : upgrade.name;
  const art = mode === "care" ? egg ? EGG_ART : null : mode === "offers" ? offer.iconPath : upgrade.iconPath;
  const subtitle = mode === "care" ? egg ? eggStatus(egg) : "No active eggs" : mode === "offers" ? `${offer.price} Gold` : hasEggAtelierUpgrade(save, upgradeId) ? "Installed" : `${upgrade.costGold} Gold · ${upgrade.costNurseryKits} Kits`;

  function reviewInfo(action: Action) {
    let title = "", description = "", gold = 0, nurseryKits = 0, chance: number | null = null, block = "", target: EggRecord | undefined;
    if ("eggId" in action) target = activeSave.eggs?.find(item => item.eggId === action.eggId && item.status !== "hatched");
    if (action.kind === "service") {
      title = SERVICES.find(item => item.id === action.id)!.name;
      ({ gold, nurseryKits } = getEggAtelierServiceCost(action.id, activeSave));
      if (!target) block = "Select an active egg.";
      if (action.id === "accelerated_incubation") {
        description = "Reduces this egg’s remaining incubation by exactly 1 day. Hatch ready eggs in the Nursery.";
        if (target && (target.status === "ready" || target.daysRemaining <= 0)) block = "Already ready to hatch.";
      } else if (action.id === "ability_polish") {
        chance = getEggAtelierAbilityPolishChance(activeSave);
        description = "Attempts to raise the first projected inherited ability by one grade. Payment and the once-per-egg use are consumed even if no improvement occurs.";
        if (target && !target.projectedAbilities.length) block = "No projected ability to polish.";
        else if (target?.projectedAbilities[0]?.grade === "S") block = "The first projected ability is already grade S.";
        if (target && hasEggAtelierServiceUsed(activeSave, target.eggId, action.id)) block = "Already used on this egg.";
      } else {
        chance = getEggAtelierStatConditioningChance(activeSave);
        description = "Attempts to raise the lowest projected stat grade by one rank and add 1 to that stat. Payment and the once-per-egg use are consumed even if no improvement occurs.";
        if (!effects.statConditioningUnlocked) block = "Requires Incubator Cradle.";
        else if (target && Object.values(target.projectedStatGrades).every(grade => grade === "S")) block = "All projected stat grades are already S.";
        if (target && hasEggAtelierServiceUsed(activeSave, target.eggId, action.id)) block = "Already used on this egg.";
      }
    } else if (action.kind === "offer") {
      const item = EGG_ATELIER_EGG_OFFERS.find(item => item.offerId === action.id)!;
      title = item.name; description = `${item.description} The egg is placed in your Nursery.`; gold = item.price;
      block = canBuyEggOffer(activeSave, item) ?? "";
    } else if (action.kind === "upgrade") {
      const item = EGG_ATELIER_UPGRADES.find(item => item.upgradeId === action.id)!;
      title = item.name; description = `${item.description} ${item.effectLabel}`; gold = item.costGold; nurseryKits = item.costNurseryKits;
      if (hasEggAtelierUpgrade(activeSave, item.upgradeId)) block = "Already installed.";
    } else {
      title = action.kind === "sell" ? "Sell Egg" : "Donate to Research";
      description = action.kind === "sell" ? "Permanently remove this egg in exchange for Gold and 2 Selene Trust." : "Permanently remove this egg for a smaller Gold payment and 6 Selene Trust.";
      if (!target) block = "This egg is no longer available.";
      else gold = -(action.kind === "sell" ? getEggSaleValue(target) : Math.max(25, Math.round(getEggSaleValue(target) * 0.35 / 5) * 5));
    }
    const shortages = [activeSave.currencies.gold < gold ? `${gold - activeSave.currencies.gold} more Gold` : "", kits < nurseryKits ? `${nurseryKits - kits} more Nursery Kit${nurseryKits - kits === 1 ? "" : "s"}` : ""].filter(Boolean);
    if (!block && shortages.length) block = `Need ${shortages.join(" and ")}.`;
    return { title, description, gold, nurseryKits, chance, block, target, signature: JSON.stringify({ action, gold, nurseryKits, chance, target, block }) };
  }
  function review(action: Action) { lock.current = false; setPending({ action, signature: reviewInfo(action).signature }); setPopup("review"); }
  const reviewed = pending ? reviewInfo(pending.action) : null;
  const quoteValid = pending?.signature === reviewed?.signature;
  function confirm() {
    if (!pending || !reviewed || reviewed.block || !quoteValid || lock.current) return;
    lock.current = true;
    const action = pending.action;
    const result = action.kind === "offer" ? buyEggFromSelene(activeSave, action.id) : action.kind === "upgrade" ? purchaseEggAtelierUpgrade(activeSave, action.id) : action.kind === "sell" ? sellEggToSelene(activeSave, action.eggId) : action.kind === "donate" ? donateEggToResearch(activeSave, action.eggId) : action.id === "accelerated_incubation" ? applyAcceleratedIncubation(activeSave, action.eggId) : action.id === "ability_polish" ? applyAbilityPolish(activeSave, action.eggId) : applyStatConditioning(activeSave, action.eggId);
    if (result.ok) {
      saveCurrentGame(result.save);
      if (action.kind === "sell" || action.kind === "donate") setEggId(null);
      if (action.kind === "offer") { const bought = result.save.eggs?.find(item => !activeSave.eggIds.includes(item.eggId)); if (bought) setEggId(bought.eggId); }
    }
    setMessage(result.message); setPopup("result");
  }
  function changeMode(next: Mode) { setMode(next); setPage(0); }
  return <main className={`${ui.interior} ${styles.atelier}`} data-sunlit-incubator>
    <section className={ui.page}>
      <header className={ui.heading}><h1>The Egg Atelier</h1><ScreenNavigation onBack={goToTown} backLabel="Town" /></header>
      <section className={`${ui.summary} ${styles.resources}`} aria-label="Atelier resources"><div><RanchIcon name="gold" /><span>Gold</span><strong>{save.currencies.gold.toLocaleString()}</strong></div><div><img className={styles.icon} src="/images/items/supply_depot/nursery_supply_kit.png" alt="" aria-hidden="true" /><span>Nursery Kits</span><strong>{kits}</strong></div><div><AtelierIcon name="egg" /><span>Ready</span><strong>{ready}</strong></div><button type="button" onClick={goToNursery}><AtelierIcon name="leaf" />Visit Nursery</button></section>
      <nav className={`${ui.paper} ${styles.tabs}`} aria-label="Atelier sections">{([['care', 'Egg Care'], ['offers', 'Egg Offers'], ['upgrades', 'Upgrades']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => changeMode(id)}>{id === "upgrades" ? <RanchIcon name="gear" /> : <AtelierIcon name={id === "care" ? "egg" : "ledger"} />}{label}</button>)}<div className={styles.compactSteward}><button type="button" onClick={() => setPopup("talk")}><AtelierIcon name="talk" />Talk</button><button type="button" onClick={() => setPopup("trust")}><AtelierIcon name="ledger" />Trust</button></div></nav>
      <div className={styles.workspace}>
        <aside className={`${ui.paper} ${styles.steward}`}><img src={SELENE_VIRELL.portraitPath} alt="Dr. Selene Virell" /><h2>Dr. Selene Virell</h2><p>Egg Care Specialist</p><strong>Trust Level {trust.level}</strong><div className={styles.trustLeaves} aria-label={`Trust level ${trust.level} of 5`}>{Array.from({ length: 5 }, (_, i) => <span key={i} data-earned={i < trust.level}><AtelierIcon name="leaf" /></span>)}</div><button type="button" onClick={() => setPopup("talk")}><AtelierIcon name="talk" />Talk</button><button type="button" onClick={() => setPopup("trust")}><AtelierIcon name="ledger" />Trust Ledger</button></aside>
        <section className={styles.preview} aria-label="Selected atelier artwork"><h2>{title}{mode === "care" && egg ? <small>{egg.rarity} · {egg.status === "ready" ? "Ready" : "Incubating"}</small> : null}</h2><div className={styles.stage}>{art ? <img data-atelier-art src={art} alt={title} /> : <div className={`${ui.paper} ${styles.empty}`}><p>No eggs yet. Browse Selene’s offers to find your next arrival.</p><button type="button" onClick={() => changeMode("offers")}>Browse Eggs</button></div>}</div><p className={`${styles.status} ${egg?.status === "ready" && mode === "care" ? styles.ready : ""}`}><AtelierIcon name={egg?.status === "ready" && mode === "care" ? "leaf" : "hourglass"} />{subtitle}</p></section>
        <section className={`${ui.paper} ${styles.details} ${mode !== "care" ? styles.catalog : ""}`} aria-label="Atelier actions">
          {mode === "care" ? <><h2 className={styles.careHeading}><AtelierIcon name="leaf" />Care Services<AtelierIcon name="leaf" /></h2><div className={styles.services}>{SERVICES.map(service => { const info = egg ? reviewInfo({ kind: "service", id: service.id, eggId: egg.eggId }) : null; return <article key={service.id}><span className={styles.serviceArt}><img src={service.icon} alt="" />{service.id === "stat_conditioning" && !effects.statConditioningUnlocked ? <img className={styles.lockIcon} src="/images/ui/icons/icon_lock_favorite.png" alt="Cradle required" /> : null}</span><div><h3>{service.name}</h3><p>{serviceStatus(info?.block, service.short)}</p><button type="button" className={info && !info.block ? ui.primary : ""} disabled={!egg} onClick={() => egg && review({ kind: "service", id: service.id, eggId: egg.eggId })} aria-label={`Review ${service.name}`}>Review Service</button></div></article>; })}</div><div className={styles.detailActions}><button type="button" disabled={!egg} onClick={() => setPopup("appraisal")}><span className={styles.magnifier} aria-hidden="true" />Full Appraisal</button><button type="button" disabled={!egg} onClick={() => setPopup("more")}><span aria-hidden="true">•••</span> More Actions <span aria-hidden="true">⌄</span></button></div></> : mode === "offers" ? <><h2>{offer.name}</h2><p className={styles.emphasis}>{offer.label}</p><p>Requires Trust Level {offer.trustRequired}</p><strong>{offer.price} Gold</strong><p>{canBuyEggOffer(save, offer) || `Balance after: ${(save.currencies.gold - offer.price).toLocaleString()} Gold`}</p><button type="button" className={ui.primary} onClick={() => review({ kind: "offer", id: offerId })}>Review Egg Purchase</button></> : <><h2>{upgrade.name}</h2><p>{upgrade.effectLabel}</p><strong>{upgrade.costGold} Gold + {upgrade.costNurseryKits} Kits</strong><p>{reviewInfo({ kind: "upgrade", id: upgradeId }).block || "Available to install"}</p><button type="button" className={ui.primary} disabled={hasEggAtelierUpgrade(save, upgradeId)} onClick={() => review({ kind: "upgrade", id: upgradeId })}>{hasEggAtelierUpgrade(save, upgradeId) ? "Installed" : "Review Upgrade"}</button></>}
        </section>
      </div>
      <section className={`${ui.paper} ${styles.dock}`} aria-label="Atelier choices"><button type="button" aria-label="Previous choices" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button><div ref={dockRef} className={styles.choices}>{choices.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => <button type="button" key={item.id} aria-pressed={item.id === selectedId} onClick={() => mode === "care" ? setEggId(item.id as EggId) : mode === "offers" ? setOfferId(item.id as EggAtelierEggOfferId) : setUpgradeId(item.id as EggAtelierUpgradeId)}><img src={item.icon} alt="" /><span><strong>{item.name}</strong><small>{mode === "care" ? <AtelierIcon name={item.detail === "Ready to hatch" ? "leaf" : "hourglass"} /> : null}{item.detail}</small></span></button>)}{!choices.length ? <span>No active eggs · choose Egg Offers to browse</span> : null}</div><span className={styles.pageNumber} aria-live="polite">{currentPage + 1} / {pages}</span><button type="button" aria-label="Next choices" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button></section>
    </section>
    {popup === "review" && reviewed ? <GameDialog title={`Review · ${reviewed.title}`} onClose={() => setPopup(null)}>{reviewed.target ? <h3>{eggName(reviewed.target)}</h3> : null}<p>{reviewed.description}</p>{reviewed.chance !== null ? <p>Success chance: <strong>{reviewed.chance}%</strong>. Improvement is not guaranteed.</p> : null}<p>{reviewed.gold < 0 ? "Receive" : "Cost"}: <strong>{Math.abs(reviewed.gold)} Gold{reviewed.nurseryKits ? ` + ${reviewed.nurseryKits} Nursery Kit` : ""}</strong></p><p>{reviewed.block ? `Available: ${save.currencies.gold.toLocaleString()} Gold · ${kits} Kits` : `After: ${(save.currencies.gold - reviewed.gold).toLocaleString()} Gold · ${kits - reviewed.nurseryKits} Kits`}</p>{pending?.action.kind === "service" && pending.action.id === "accelerated_incubation" && reviewed.target ? <p>Timer: {reviewed.target.daysRemaining} → {Math.max(0, reviewed.target.daysRemaining - 1)} days</p> : null}{reviewed.block ? <p role="status">{reviewed.block}</p> : null}{!quoteValid ? <p>The egg or terms changed. Close this window and review again.</p> : null}<div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={Boolean(reviewed.block) || !quoteValid} onClick={confirm}>Confirm {pending?.action.kind === "sell" ? "Sale" : pending?.action.kind === "donate" ? "Donation" : pending?.action.kind === "offer" ? "Purchase" : pending?.action.kind === "upgrade" ? "Upgrade" : "Service"}</button></div></GameDialog> : null}
    {popup === "result" ? <GameDialog title="Atelier Receipt" onClose={() => setPopup(null)}><p role="status">{message}</p><p>Current balance: {save.currencies.gold.toLocaleString()} Gold · {kits} Nursery Kits</p><div className={ui.actionRow}><button type="button" onClick={() => setPopup(null)}>Back to Atelier</button><button type="button" onClick={goToNursery}>Visit Nursery</button></div></GameDialog> : null}
    {popup === "more" && egg ? <GameDialog title="Egg Actions" onClose={() => setPopup(null)}><h3>{eggName(egg)}</h3><p>Selling or donating permanently removes this egg. Review the payment before confirming.</p><div className={ui.actionRow}><button type="button" onClick={() => review({ kind: "sell", eggId: egg.eggId })}>Review Sale · {getEggSaleValue(egg)} Gold</button><button type="button" onClick={() => review({ kind: "donate", eggId: egg.eggId })}>Review Research Donation</button></div></GameDialog> : null}
    {popup === "appraisal" && egg ? <GameDialog title="Egg Appraisal" onClose={() => setPopup(null)} wide><h3>{eggName(egg)}</h3><p>{egg.rarity} · {eggStatus(egg)} · Sell value {getEggSaleValue(egg)} Gold</p><p>{getVariantDefinition(egg.variantId).name} · {egg.lineageRiskLabel || "No known lineage risk"}</p>{effects.appraisalLevel >= 2 ? <><h3>Projected stats & grades</h3><dl className={styles.stats}>{STAT_KEYS.map(key => <div key={key}><dt>{key}</dt><dd>{egg.projectedStats[key]} · {egg.projectedStatGrades[key]}</dd></div>)}</dl><h3>Projected abilities</h3>{egg.projectedAbilities.length ? egg.projectedAbilities.map((ability, index) => <p key={index}><strong>{ability.name} · {ability.grade}</strong> — {ability.description}</p>) : <p>No projected inherited abilities.</p>}<h3>Lineage & care notes</h3><p>{egg.parents.giver.displayName} × {egg.parents.receiver.displayName}</p>{[...(egg.statRollNotes ?? []), ...(egg.abilityRollNotes ?? []), ...(egg.lineageNotes ?? [])].map((note, index) => <p key={index}>{note}</p>)}</> : <p>Install the Lineage Ledger Desk for expanded projected stats, ability details and lineage notes.</p>}</GameDialog> : null}
    {popup === "talk" ? <GameDialog title="Dr. Selene Virell" onClose={() => setPopup(null)}><div className={styles.conversation}><img src={SELENE_VIRELL.portraitPath} alt="Dr. Selene Virell portrait" /><div><p>{trust.level >= 3 ? "Your records are becoming consistent enough that I can attempt more delicate conditioning without guessing." : "Egg care is not luck. It is observation, restraint, and clean notes."}</p><p>{getNpcTrustSummary(save, "selene_virell")}</p></div></div></GameDialog> : null}
    {popup === "trust" ? <GameDialog title="Atelier Trust Ledger" onClose={() => setPopup(null)}><p>{getNpcTrustSummary(save, "selene_virell")}</p><p>Next reward: {getNpcNextUnlock(save, "selene_virell")}</p><p>Ability Polish: {getEggAtelierAbilityPolishChance(save)}% · Stat Conditioning: {getEggAtelierStatConditioningChance(save)}%</p><p>Appraisal: {effects.appraisalLevel >= 2 ? "Expanded" : "Basic"} · Quickhatch Catalysts: {getQuickhatchCatalystCount(save)}</p>{EGG_ATELIER_UPGRADES.map(item => <p key={item.upgradeId}><strong>{item.name}: {hasEggAtelierUpgrade(save, item.upgradeId) ? "Installed" : "Not installed"}</strong><br />{item.effectLabel}</p>)}</GameDialog> : null}
  </main>;
}
