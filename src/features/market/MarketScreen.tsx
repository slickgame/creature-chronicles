"use client";
import { gameplayArt } from "@/data/creatureGameplayArt";

import { useEffect, useMemo, useRef, useState } from "react";
import { ensureCurrentMarketState, getMarketListingPreview, getMarketListingPrice, getMarketRerollCost } from "@/data/market";
import { getVariantDefinition } from "@/data/creatures";
import { getNpcNextUnlock, getNpcTrustRecord, getNpcTrustSummary, getTamsinSpecialPlacementBonus, getTamsinAdoptionFeeMultiplier } from "@/data/townNpcs";
import { getTotalTownUpgradeTiers, getTownUpgradeEffects } from "@/data/upgrades";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { GameDialog } from "@/features/ui/GameDialog";
import { TrustLeaves } from "@/features/ui/IllustratedIcon";
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

function ArrivalArt({listing, portrait=false}:{listing:MarketListing;portrait?:boolean}){
  const variant = getVariantDefinition(listing.variantId);
  const sources = Array.from(new Set([
    gameplayArt(listing, portrait),
    gameplayArt(listing, !portrait),
    variant.portraitPath,
    variant.profilePath,
  ].filter(Boolean)));
  return <img key={listing.variantId} src={sources[0]} alt="" onError={event => {
    const image = event.currentTarget;
    const next = sources[sources.indexOf(image.getAttribute("src") ?? "") + 1];
    if (next) image.src = next;
    else image.hidden = true;
  }}/>;
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
      const size = Math.max(1, Math.min(3, Math.floor((entry.contentRect.width + 8) / 165)));
      if (size !== sizeRef.current) { sizeRef.current = size; setPageSize(size); setPage(0); }
    });
    observer.observe(dock);
    return () => observer.disconnect();
  }, [hasSave]);

  if (!save || !save.market) return <main className={ui.interior}><h1>No active save</h1></main>;
  const market = save.market;
  const selected = market.listings.find(item => item.listingId === selectedId) ?? market.listings.find(item => item.status === "available") ?? market.listings[0];
  const price = selected ? getMarketListingPrice(save, selected) : 0;
  const habitat = selected ? save.habitats?.find(item => item.family === selected.family) : null;
  const full = Boolean(habitat && habitat.creatureIds.length >= habitat.capacity);
  const sold = selected?.status === "sold";
  const shortage = Math.max(0, price - save.currencies.gold);
  const canAdopt = Boolean(selected && !sold && habitat?.unlocked && !full && !shortage);
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
  const status = sold ? "Already adopted" : !habitat?.unlocked ? "Unlock this habitat with Petra" : full ? "Habitat full" : "Space available";
  const arrivals = market.listings.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  function changePage(next: number) {
    setPage(next);
    setSelectedId(market.listings[next * pageSize]?.listingId ?? null);
  }

  return <main className={styles.gallery} data-hearthside>
    <header className={styles.galleryHeader}><h1>Vale’s Adoption Hearth</h1><ScreenNavigation onBack={goToTown} backLabel="Town" /></header>
    <div className={styles.galleryTop}>
      <aside className={styles.gallerySteward} aria-label="Adoption steward">
        <img src="/images/ui/adoption-gallery/tamsin.webp" alt="" />
        <div><strong>Tamsin Vale</strong><small>Adoption Steward · Trust {trust.level}</small></div>
        <button onClick={() => setPopup("talk")} aria-label="Talk to Tamsin">Talk</button>
        <button className={styles.trustButton} onClick={() => setPopup("trust")}>Trust Ledger</button>
      </aside>
      <div className={styles.balance}><strong>{save.currencies.gold.toLocaleString()} Gold</strong></div>
    </div>
    <div className={styles.galleryBody}>
      <section className={styles.galleryRoster} aria-label="Arrival choices">
        <header><div><h2>Available Arrivals</h2><small>{available} available · Week {market.weekNumber}</small></div><button onClick={reviewRefresh}><span>Refresh Arrivals</span> · {rerollCost} Gold</button></header>
        <div className={styles.galleryCarousel}>
          <button aria-label="Previous arrivals" disabled={currentPage === 0} onClick={() => changePage(currentPage - 1)}>‹</button>
          <div ref={dockRef} className={styles.galleryCards}>
            {arrivals.map(item => <article className={styles.galleryCard} data-selected={item.listingId === selected?.listingId} key={item.listingId}>
              <button className={styles.gallerySelect} aria-pressed={item.listingId === selected?.listingId} onClick={() => setSelectedId(item.listingId)}>
                <ArrivalArt listing={item} />
                <span><strong>{item.displayName}</strong><small>{item.family} · {item.status === "sold" ? "Adopted" : item.rarity}</small></span>
              </button>
              <button className={styles.cardProfile} aria-label={`View Profile for ${item.displayName}`} onClick={() => {setSelectedId(item.listingId);setPopup("profile");}}>View Profile</button>
            </article>)}
          </div>
          <button aria-label="Next arrivals" disabled={currentPage === pages - 1} onClick={() => changePage(currentPage + 1)}>›</button>
        </div>
        <p className={styles.galleryPage} aria-live="polite">Page {currentPage + 1} of {pages}</p>
      </section>
      <section className={styles.galleryDetails} aria-label="Adoption details">
        {selected ? <>
          <div className={styles.galleryHero}><ArrivalArt listing={selected} portrait /><div><h2>{selected.displayName}</h2><small>{selected.rarity} · {selected.family}</small></div></div>
          <dl className={styles.requirements}>
            <div><dt>Required habitat</dt><dd>{habitat?.name ?? "No matching habitat"}</dd></div>
            <div><dt>Habitat capacity</dt><dd>{habitat && `${habitat.creatureIds.length} / ${habitat.capacity} occupied · `}{status}</dd></div>
            <div><dt>Adoption fee</dt><dd>{price.toLocaleString()} Gold</dd></div>
          </dl>
          {shortage > 0 && !sold && <p className={styles.warning}>Need {shortage.toLocaleString()} more Gold</p>}
          {price < selected.price && !sold && <small>Trust discount from {selected.price.toLocaleString()} Gold</small>}
          {!habitat?.unlocked && !sold && <button onClick={()=>{window.localStorage.setItem("creature-chronicles-builder-family-v1",selected.family);window.localStorage.setItem("creature-chronicles-open-builder-yard","1");goToTown();}}>Visit Petra · Habitat needed</button>}
          <button className={styles.galleryPrimary} disabled={!canAdopt} onClick={reviewAdoption}>{sold ? "Adopted" : "Review Adoption"}</button>
        </> : <><h2>No arrivals yet</h2><p>Refresh arrivals or return next week.</p></>}
      </section>
    </div>
    <footer><button onClick={goToTown}>← Back to Town</button></footer>
    {popup === "adopt" && selected ? <GameDialog title="Confirm Adoption" onClose={() => setPopup(null)}><h3>{selected.displayName}</h3><p>Adoption fee: <strong><RanchIcon name="gold" />{price.toLocaleString()} Gold</strong></p><p>{habitat?.name}: {habitat?.creatureIds.length} → {(habitat?.creatureIds.length ?? 0) + 1} / {habitat?.capacity}</p><p>Balance after fee: {(save.currencies.gold - price).toLocaleString()} Gold.</p>{!quoteValid ? <p>The listing or fee changed. Close this window and review it again.</p> : !canAdopt ? <p>{shortage ? `Need ${shortage} more Gold. ` : ""}{status}</p> : null}<div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={!canAdopt || !quoteValid} onClick={adopt}>Confirm Adoption</button></div></GameDialog> : null}
    {popup === "refresh" ? <GameDialog title="Refresh Arrivals" onClose={() => setPopup(null)}><p>Replace the current placement board with new arrivals for <strong>{rerollCost} Gold</strong>. The current listings will be replaced; creatures already adopted stay on your ranch.</p><p>Arrivals also restock automatically each week.</p><p>{save.currencies.gold < rerollCost ? `Need ${rerollCost - save.currencies.gold} more Gold.` : `Balance after fee: ${(save.currencies.gold - rerollCost).toLocaleString()} Gold.`}</p>{!refreshValid ? <p>The board or cost changed. Close this window and review the refresh again.</p> : null}<div className={ui.actionRow}><button type="button" data-initial-focus onClick={() => setPopup(null)}>Cancel</button><button type="button" className={ui.primary} disabled={!refreshValid || save.currencies.gold < rerollCost} onClick={refresh}>Confirm Refresh</button></div></GameDialog> : null}
    {popup === "result" ? <GameDialog title="Hearth Update" onClose={() => setPopup(null)}><p role="status">{message}</p><p>Current Gold: <strong>{save.currencies.gold.toLocaleString()}</strong></p><button type="button" onClick={() => setPopup(null)}>Continue</button></GameDialog> : null}
    {popup === "profile" && selected ? <GameDialog title={`${selected.displayName} · Full Profile`} wide onClose={() => setPopup(null)}><div className={styles.profile}><SharedCreatureDetail useGameplayArt creature={createMarketPreviewCreature(save, selected)} mode="full" showActions={false} dossier /></div></GameDialog> : null}
    {popup === "talk" ? <GameDialog title="Talk to Tamsin" onClose={() => setPopup(null)}><img className={styles.talkPortrait} src="/images/ui/adoption-gallery/tamsin.webp" alt="Tamsin Vale" /><h3>Placement Philosophy</h3><p>{trust.level >= 4 ? "I have a few contacts who only call when a placement is delicate. Keep showing me you can handle that responsibility, and I will let those cases reach your ranch first." : trust.level >= 2 ? "You are building a reputation here. The creatures you adopt are settling well enough that I can argue for better fees on your behalf." : "Start with steady care. I watch what happens after the adoption, not just whether you can pay the fee."}</p><p>Each listing represents a creature whose needs were screened, documented, and matched to a ranch that can support its family and temperament.</p><button type="button" onClick={() => setPopup("trust")}>Open Trust Ledger</button></GameDialog> : null}
    {popup === "trust" ? <GameDialog title="Trust & Welfare Ledger" onClose={() => setPopup(null)}><TrustLeaves level={trust.level} /><h3>{getNpcTrustSummary(save, "tamsin_vale")}</h3><p>Next: {getNpcNextUnlock(save, "tamsin_vale")}</p><dl className={styles.report}><div><dt>Hearth level</dt><dd>{getTotalTownUpgradeTiers(save, "market") + 1}</dd></div><div><dt>Board slots</dt><dd>{effects.marketListingCount}</dd></div><div><dt>Adoption discount</dt><dd>{Math.round((1 - getTamsinAdoptionFeeMultiplier(save)) * 100)}%</dd></div><div><dt>Special placement chance</dt><dd>{((effects.marketVariantChance + getTamsinSpecialPlacementBonus(save)) * 100).toFixed(2)}%</dd></div><div><dt>Refresh cost</dt><dd>{rerollCost} Gold</dd></div></dl><p>Successful adoptions grant 5 Trust; refreshing arrivals grants 1. Trust and town upgrades can improve fees, refresh costs and special placement chances.</p><p>Stat numbers and their letter grades are shown together. Full Profile contains the expanded stats, abilities and care details.</p></GameDialog> : null}
  </main>;
}
