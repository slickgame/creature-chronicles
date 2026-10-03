"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ensureCurrentMarketState, getMarketListingPreview, getMarketListingPrice, getMarketListingProfileImage, getMarketListingImage, getMarketRerollCost } from "@/data/market";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { getNpcNextUnlock, getNpcTrustRecord, getNpcTrustSummary, getTamsinSpecialPlacementBonus, getTamsinAdoptionFeeMultiplier } from "@/data/townNpcs";
import { getTotalTownUpgradeTiers, getTownUpgradeEffects } from "@/data/upgrades";
import { SharedCreatureDetail, SHARED_STAT_LABELS } from "@/features/creatures/CreatureDetailPanels";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { GameDialog } from "@/features/ui/GameDialog";
import { IllustratedIcon, TrustLeaves } from "@/features/ui/IllustratedIcon";
import { RanchIcon } from "@/features/ui/RanchIcon";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId, HabitatId } from "@/types/ids";
import type { MarketListing } from "@/types/market";
import type { GameSave } from "@/types/save";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./Hearthside.module.css";

type Popup = "talk" | "trust" | "profile" | "adopt" | "refresh" | "result" | null;
type Quote = { listingId: string; price: number } | null;
function createMarketPreviewCreature(save: GameSave, listing: MarketListing): CreatureRecord {
  const variant = getVariantDefinition(listing.variantId);
  const preview = getMarketListingPreview(save, listing);
  return { creatureId: `preview_${listing.listingId}` as CreatureId, ownerSaveId: save.saveId, speciesId: listing.speciesId, variantId: listing.variantId, habitatId: `habitat_${listing.family}` as HabitatId, nickname: listing.displayName, level: 1, xp: 0, xpToNext: 75, stats: preview.stats, statGrades: preview.statGrades, abilities: preview.abilities, energy: preview.maxEnergy, maxEnergy: preview.maxEnergy, hearts: preview.maxHearts, maxHearts: preview.maxHearts, affection: 35, generation: 1, shiny: false, cosmeticVariant: null, origin: "market", originLabel: `Adoption Preview · Week ${listing.weekNumber}`, isLocked: false, createdAt: listing.createdAt, notes: variant.description };
}

export function MarketScreen() {
  const { currentSave, saveCurrentGame, buyMarketCreature, rerollMarket, goToTown } = useGameContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [quote, setQuote] = useState<Quote>(null);
  const [refreshQuote, setRefreshQuote] = useState({ cost: 0, week: 0, count: 0 });
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1);
  const dockRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(1);
  const actionLock = useRef(false);
  const save = useMemo(() => currentSave ? ensureCurrentMarketState(currentSave) : null, [currentSave]);

  const hasSave = Boolean(save);

  useEffect(() => { if (save && save !== currentSave) saveCurrentGame(save); }, [save, currentSave, saveCurrentGame]);
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const observer = new ResizeObserver(([entry]) => {
      const size = Math.max(1, Math.min(4, Math.floor((entry.contentRect.width + 8) / 220)));
      if (size !== sizeRef.current) { sizeRef.current = size; setPageSize(size); setPage(0); }
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, [hasSave]);

  if (!save || !save.market) return <main className={ui.interior}><h1>No active save</h1></main>;
  const market = save.market;
  const selected = market.listings.find(item => item.listingId === selectedId) ?? market.listings.find(item => item.status === "available") ?? market.listings[0];
  const preview = selected ? getMarketListingPreview(save, selected) : null;
  const price = selected ? getMarketListingPrice(save, selected) : 0;
  const habitat = selected ? save.habitats?.find(item => item.family === selected.family) : null;
  const full = Boolean(habitat && habitat.creatureIds.length >= habitat.capacity);
  const sold = selected?.status === "sold";
  const shortage = Math.max(0, price - save.currencies.gold);
  const canAdopt = Boolean(selected && !sold && habitat && !full && !shortage);
  const available = market.listings.filter(item => item.status === "available").length;
  const pages = Math.max(1, Math.ceil(market.listings.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const trust = getNpcTrustRecord(save, "tamsin_vale");
  const effects = getTownUpgradeEffects(save);
  const rerollCost = getMarketRerollCost(save);
  const quoteValid = Boolean(selected && quote?.listingId === selected.listingId && quote.price === price);
  const refreshValid = refreshQuote.cost === rerollCost && refreshQuote.week === market.weekNumber && refreshQuote.count === market.rerollCount;

  function reviewAdoption() {
    if (!selected || !canAdopt) return;
    actionLock.current = false; setQuote({ listingId: selected.listingId, price }); setPopup("adopt");
  }
  function reviewRefresh() {
    actionLock.current = false;
    setRefreshQuote({ cost: rerollCost, week: market.weekNumber, count: market.rerollCount }); setPopup("refresh");
  }
  function adopt() {
    if (actionLock.current || !selected || !canAdopt || !quoteValid) return;
    actionLock.current = true; setSelectedId(selected.listingId); setMessage(buyMarketCreature(selected.listingId)); setPopup("result");
  }
  function refresh() {
    if (actionLock.current || !refreshValid || !save || save.currencies.gold < rerollCost) return;
    actionLock.current = true; setMessage(rerollMarket()); setSelectedId(null); setPage(0); setPopup("result");
  }
  const status = sold ? "Already adopted" : !habitat ? "No matching habitat" : full ? "Habitat full" : "Space available";
  const stats = preview ? <dl className={styles.stats} aria-label="Stats and grades">{STAT_KEYS.map(key => <div key={key} aria-label={`${SHARED_STAT_LABELS[key]} ${preview.stats[key]}, grade ${preview.statGrades[key]}`}><dt title={SHARED_STAT_LABELS[key]}>{key}</dt><dd><strong>{preview.stats[key]}</strong><span aria-label={`Grade ${preview.statGrades[key]}`}>{preview.statGrades[key]}</span></dd></div>)}</dl> : null;

  return <main className={`${ui.interior} ${styles.hearth}`} data-hearthside>
    <section className={`${ui.page} ${styles.layout}`}>
      <header className={ui.heading}><h1>Vale&apos;s Adoption Hearth</h1><ScreenNavigation onBack={goToTown} backLabel="Town" /></header>
      <section className={`${ui.summary} ${styles.resources}`} aria-label="Hearth resources">
        <div><RanchIcon name="gold" /><span>Gold</span><strong>{save.currencies.gold.toLocaleString()}</strong></div>
        <div><RanchIcon name="sun" /><span>Week</span><strong>{market.weekNumber}</strong></div>
        <div><RanchIcon name="paw" /><strong>{available}</strong><span>available</span></div>
        <button type="button" onClick={reviewRefresh}><span className={styles.refreshLong}>Refresh Arrivals</span><span className={styles.refreshShort}>Refresh</span> · {rerollCost} Gold</button>
      </section>
      <div className={styles.workspace}>
        <aside className={`${ui.paper} ${styles.steward}`} aria-label="Adoption steward">
          <img className={styles.keeperPortrait} src="/images/npcs/town/tamsin_vale_portrait.png" alt="Tamsin Vale" /><h2>Tamsin Vale</h2><p className={styles.stewardTitle}>Adoption Steward</p><strong>Trust Level {trust.level}</strong><TrustLeaves level={trust.level} />
          <div className={styles.stewardActions}><button type="button" onClick={() => setPopup("talk")}><IllustratedIcon name="talk" />Talk</button><button type="button" onClick={() => setPopup("trust")}><IllustratedIcon name="ledger" />Trust Ledger</button></div>
          <p className={styles.motto}>A safe home for every arrival.</p>
        </aside>
        <section className={styles.preview} aria-label="Selected creature artwork">
          {selected ? <><h2>{selected.displayName}</h2><img data-market-fullbody src={getMarketListingProfileImage(selected)} alt={`${selected.displayName} full-body`} /></> : <h2>No arrivals</h2>}
        </section>
        <section className={`${ui.paper} ${styles.details}`} aria-label="Adoption details">
          {selected && preview ? <>
            <div className={styles.identity}><h2>{selected.displayName}</h2><p>{selected.rarity} · {selected.family}</p></div>
            {stats}
            <button type="button" onClick={() => setPopup("profile")}><IllustratedIcon name="ledger" />Full Profile</button>
            <div className={styles.placement}><strong>{habitat ? `${habitat.name}: ${habitat.creatureIds.length} / ${habitat.capacity}` : "No matching habitat"}</strong><p className={full || !habitat ? styles.warning : styles.ready}>{status}</p></div>
            <div className={styles.fee}><span>Adoption fee</span><strong><RanchIcon name="gold" />{price.toLocaleString()} Gold</strong>{price < selected.price ? <small>Trust discount from {selected.price.toLocaleString()} Gold</small> : null}<p className={shortage ? styles.warning : ""}>{shortage ? `Need ${shortage.toLocaleString()} more Gold` : `Balance after fee: ${(save.currencies.gold - price).toLocaleString()} Gold`}</p></div>
            <button type="button" className={ui.primary} disabled={!canAdopt} onClick={reviewAdoption}>{sold ? "Adopted" : "Review Adoption"}</button>
          </> : <><h2>No arrivals yet</h2><p>Refresh arrivals or return next week.</p><button type="button" onClick={reviewRefresh}>Review Refresh</button></>}
        </section>
      </div>
      <section className={`${ui.paper} ${styles.dock}`} aria-label="Arrival choices">
        <button type="button" aria-label="Previous arrivals" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>‹</button>
        <div ref={dockRef} className={styles.arrivals}>{market.listings.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(item => <button key={item.listingId} type="button" aria-pressed={item.listingId === selected?.listingId} onClick={() => setSelectedId(item.listingId)}><img src={getMarketListingImage(item)} alt="" /><span><strong>{item.displayName}</strong><small>{item.status === "sold" ? "Adopted" : `${getMarketListingPrice(save, item).toLocaleString()} Gold`}</small></span></button>)}</div>
        <span className={styles.pageNumber} aria-live="polite">{currentPage + 1} / {pages}</span><button type="button" aria-label="Next arrivals" disabled={currentPage === pages - 1} onClick={() => setPage(currentPage + 1)}>›</button>
      </section>
    </section>
    {popup === "adopt" && selected ? <GameDialog title="Confirm Adoption" onClose={() => setPopup(null)}><h3>{selected.displayName}</h3><p>Adoption fee: <strong><RanchIcon name="gold" />{price.toLocaleString()} Gold</strong></p><p>{habitat?.name}: {habitat?.creatureIds.length} → {(habitat?.creatureIds.length ?? 0) + 1} / {habitat?.capacity}</p><p>Balance after fee: {(save.currencies.gold - price).toLocaleString()} Gold.</p>{!quoteValid ? <p>The listing or fee changed. Close this window and review it again.</p> : !canAdopt ? <p>{shortage ? `Need ${shortage} more Gold. ` : ""}{status}</p> : null}<div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={!canAdopt || !quoteValid} onClick={adopt}>Confirm Adoption</button></div></GameDialog> : null}
    {popup === "refresh" ? <GameDialog title="Refresh Arrivals" onClose={() => setPopup(null)}><p>Replace the current placement board with new arrivals for <strong>{rerollCost} Gold</strong>. The current listings will be replaced; creatures already adopted stay on your ranch.</p><p>Arrivals also restock automatically each week.</p><p>{save.currencies.gold < rerollCost ? `Need ${rerollCost - save.currencies.gold} more Gold.` : `Balance after fee: ${(save.currencies.gold - rerollCost).toLocaleString()} Gold.`}</p>{!refreshValid ? <p>The board or cost changed. Close this window and review the refresh again.</p> : null}<div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={!refreshValid || save.currencies.gold < rerollCost} onClick={refresh}>Confirm Refresh</button></div></GameDialog> : null}
    {popup === "result" ? <GameDialog title="Hearth Update" onClose={() => setPopup(null)}><p role="status">{message}</p><p>Current Gold: <strong>{save.currencies.gold.toLocaleString()}</strong></p><button type="button" onClick={() => setPopup(null)}>Continue</button></GameDialog> : null}
    {popup === "profile" && selected ? <GameDialog title={`${selected.displayName} · Full Profile`} wide onClose={() => setPopup(null)}><div className={styles.profile}><SharedCreatureDetail creature={createMarketPreviewCreature(save, selected)} mode="full" showActions={false} dossier /></div></GameDialog> : null}
    {popup === "talk" ? <GameDialog title="Talk to Tamsin" onClose={() => setPopup(null)}><img className={styles.talkPortrait} src="/images/npcs/town/tamsin_vale_portrait.png" alt="Tamsin Vale" /><h3>Placement Philosophy</h3><p>{trust.level >= 4 ? "I have a few contacts who only call when a placement is delicate. Keep showing me you can handle that responsibility, and I will let those cases reach your ranch first." : trust.level >= 2 ? "You are building a reputation here. The creatures you adopt are settling well enough that I can argue for better fees on your behalf." : "Start with steady care. I watch what happens after the adoption, not just whether you can pay the fee."}</p><p>Each listing represents a creature whose needs were screened, documented, and matched to a ranch that can support its family and temperament.</p><button type="button" onClick={() => setPopup("trust")}>Open Trust Ledger</button></GameDialog> : null}
    {popup === "trust" ? <GameDialog title="Trust & Welfare Ledger" onClose={() => setPopup(null)}><TrustLeaves level={trust.level} /><h3>{getNpcTrustSummary(save, "tamsin_vale")}</h3><p>Next: {getNpcNextUnlock(save, "tamsin_vale")}</p><dl className={styles.report}><div><dt>Hearth level</dt><dd>{getTotalTownUpgradeTiers(save, "market") + 1}</dd></div><div><dt>Board slots</dt><dd>{effects.marketListingCount}</dd></div><div><dt>Adoption discount</dt><dd>{Math.round((1 - getTamsinAdoptionFeeMultiplier(save)) * 100)}%</dd></div><div><dt>Special placement chance</dt><dd>{((effects.marketVariantChance + getTamsinSpecialPlacementBonus(save)) * 100).toFixed(2)}%</dd></div><div><dt>Refresh cost</dt><dd>{rerollCost} Gold</dd></div></dl><p>Successful adoptions grant 5 Trust; refreshing arrivals grants 1. Trust and town upgrades can improve fees, refresh costs and special placement chances.</p><p>Stat numbers and their letter grades are shown together. Full Profile contains the expanded stats, abilities and care details.</p></GameDialog> : null}
  </main>;
}
