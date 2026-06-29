"use client";

import { useMemo, useState } from "react";
import { SELENE_VIRELL, applyAbilityPolish, applyAcceleratedIncubation, getEggAtelierAbilityPolishChance, getEggAtelierEggLabel, getEggAtelierServiceCost, getNurserySupplyKitCount } from "@/data/eggAtelier";
import { NURSERY_ASSETS, getLineageRiskLabel } from "@/data/nursery";
import { getNpcNextUnlock, getNpcTrustSummary } from "@/data/townNpcs";
import { getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { EggId } from "@/types/ids";
import type { EggRecord, GameSave } from "@/types/save";
import styles from "@/features/market/MarketScreen.module.css";

const ICONS = { clinic: "/images/buildings/town/egg_atelier.png", egg: NURSERY_ASSETS.egg, hatch: NURSERY_ASSETS.hatch, price: "/images/ui/icons/icon_price_tag.png", kit: "/images/ui/icons/icon_nursery_supply_kit.png", selene: SELENE_VIRELL.portraitPath } as const;

function getEggSubtitle(egg: EggRecord): string {
  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  return `${variant.name} ${species.name} • ${egg.lineageRiskLabel ?? getLineageRiskLabel(egg.lineageRisk)}`;
}

function getBestStatLabel(egg: EggRecord): string {
  const entries = Object.entries(egg.projectedStatGrades);
  const order = ["F", "D", "C", "B", "A", "S"];
  const best = entries.sort((a, b) => order.indexOf(b[1]) - order.indexOf(a[1]))[0];
  return best ? `${best[0]} Grade ${best[1]}` : "No projected grade";
}

export function EggAtelierScreen() {
  const { currentSave, goToTown, goToRanch, goToMainMenu, saveCurrentGame } = useGameContext();
  const [selectedEggId, setSelectedEggId] = useState<EggId | null>(null);
  const [message, setMessage] = useState("Selene can appraise eggs, accelerate incubation, or attempt a careful ability polish.");

  const activeEggs = useMemo(() => (currentSave?.eggs ?? []).filter((egg) => egg.status !== "hatched"), [currentSave]);
  const selectedEgg = useMemo(() => activeEggs.find((egg) => egg.eggId === selectedEggId) ?? activeEggs[0] ?? null, [activeEggs, selectedEggId]);

  if (!currentSave) return <main className={styles.emptyScreen}><section className={styles.emptyPanel}><h1>No active save</h1><p>Load or create a save before visiting the Egg Atelier.</p><button type="button" onClick={goToMainMenu}>Return to Main Menu</button></section></main>;

  function runService(service: "accelerated" | "polish") {
    if (!currentSave || !selectedEgg) return;
    const result = service === "accelerated" ? applyAcceleratedIncubation(currentSave, selectedEgg.eggId) : applyAbilityPolish(currentSave, selectedEgg.eggId);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  const accelerateCost = getEggAtelierServiceCost("accelerated_incubation", currentSave);
  const polishCost = getEggAtelierServiceCost("ability_polish", currentSave);
  const kitCount = getNurserySupplyKitCount(currentSave);
  const polishChance = getEggAtelierAbilityPolishChance(currentSave);

  return <main className={styles.screen}><section className={styles.frame}><div className={styles.backgroundArt} aria-hidden="true" /><div className={styles.shade} aria-hidden="true" /><header className={styles.header}><div><p className={styles.kicker}>M38 Egg Atelier</p><h1>The Egg Atelier</h1><p>{SELENE_VIRELL.name}, {SELENE_VIRELL.title}, offers specialist egg-care services without replacing the ranch nursery.</p><p className={styles.message}>{message}</p></div><div className={styles.headerActions}><div className={styles.statBox}><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div><div className={styles.statBox}><span>Nursery Kits</span><strong>{kitCount}</strong></div><button type="button" className={styles.backButton} onClick={goToTown}>Back to Town</button><button type="button" className={styles.backButton} onClick={goToRanch}>Ranch Nursery</button></div></header><section className={styles.grid}><aside className={styles.panel}><h2>Dr. Selene Virell</h2><div className={styles.sideList}><div className={styles.infoCard}><img src={ICONS.selene} alt="" onError={(event) => { event.currentTarget.src = ICONS.clinic; }} /><span>Specialist</span><strong>{SELENE_VIRELL.name}</strong></div><div className={styles.infoCard}><span>Trust</span><strong>{getNpcTrustSummary(currentSave, "selene_virell")}</strong></div><div className={styles.infoCard}><span>Next Unlock</span><strong>{getNpcNextUnlock(currentSave, "selene_virell")}</strong></div><div className={styles.infoCard}><span>Ability Polish Chance</span><strong>{polishChance}%</strong></div><div className={styles.infoCard}><span>Note</span><strong>{SELENE_VIRELL.intro}</strong></div></div></aside><section className={styles.panel} aria-label="Egg Atelier services"><h2>Egg Care Services</h2>{selectedEgg ? <SelectedEgg save={currentSave} egg={selectedEgg} accelerateCost={accelerateCost.label} polishCost={polishCost.label} polishChance={polishChance} onAccelerate={() => runService("accelerated")} onPolish={() => runService("polish")} /> : <div className={styles.emptyScreen}><p>No active eggs. Breed a successful pair and deliver an egg before visiting Selene.</p></div>}<h2>Available Eggs</h2><div className={styles.listings}>{activeEggs.map((egg) => <button key={egg.eggId} type="button" className={`${styles.listing} ${selectedEgg?.eggId === egg.eggId ? styles.sold : ""}`} onClick={() => setSelectedEggId(egg.eggId)}><div className={styles.listingArt}><img src={egg.status === "ready" ? ICONS.hatch : ICONS.egg} alt="" /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{getEggAtelierEggLabel(egg)}</span><h3 className={styles.listingName}>{egg.suggestedName || "Unnamed Egg"}</h3><p className={styles.listingDesc}>{getEggSubtitle(egg)}</p><p className={styles.gradePreview}>{getBestStatLabel(egg)} • {egg.projectedAbilities.length ? `${egg.projectedAbilities.length} projected ability` : "No projected ability"}</p></div></button>)}</div></section></section></section></main>;
}

function SelectedEgg({ save, egg, accelerateCost, polishCost, polishChance, onAccelerate, onPolish }: { save: GameSave; egg: EggRecord; accelerateCost: string; polishCost: string; polishChance: number; onAccelerate: () => void; onPolish: () => void }) {
  const canAccelerate = egg.status !== "ready" && getNurserySupplyKitCount(save) > 0 && save.currencies.gold >= getEggAtelierServiceCost("accelerated_incubation", save).gold;
  const canPolish = egg.projectedAbilities.length > 0 && getNurserySupplyKitCount(save) > 0 && save.currencies.gold >= getEggAtelierServiceCost("ability_polish", save).gold;
  return <article className={styles.listing}><div className={styles.listingArt}><img src={egg.status === "ready" ? ICONS.hatch : ICONS.egg} alt="" /></div><div className={styles.listingBody}><span className={styles.listingMeta}>{egg.rarity} • {egg.status === "ready" ? "Ready" : `${egg.daysRemaining} day(s) left`}</span><h3 className={styles.listingName}>{egg.suggestedName || "Selected Egg"}</h3><p className={styles.listingDesc}>{getEggSubtitle(egg)}</p><p className={styles.gradePreview}>Best grade: {getBestStatLabel(egg)} • Ability polish chance: {polishChance}%</p><section className={styles.price}><img src={ICONS.price} alt="" /><div><span>Accelerated Incubation</span><strong>{accelerateCost}</strong><em>Reduces this egg timer by 1 day. No effect if already ready.</em></div></section><section className={styles.price}><img src={ICONS.kit} alt="" onError={(event) => { event.currentTarget.src = ICONS.price; }} /><div><span>Ability Polish</span><strong>{polishCost}</strong><em>Attempts to improve one projected inherited ability by one grade. Not guaranteed.</em></div></section><div className={styles.actions}><button type="button" className={styles.buyButton} onClick={onAccelerate} disabled={!canAccelerate}>Accelerate</button><button type="button" className={styles.buyButton} onClick={onPolish} disabled={!canPolish}>Ability Polish</button></div></div></article>;
}
