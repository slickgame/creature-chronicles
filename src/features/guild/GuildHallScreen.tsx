"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateContractQualityBonus, ensureCurrentGuildState, getEligibleCreaturesForContract, donateCreatureToGuildContract } from "@/data/guild";
import { applyStarterGoalRewards } from "@/data/starterGoals";
import { ensureMonthlyTaxPosted } from "@/data/taxes";
import { getVariantDefinition } from "@/data/creatures";
import { getNextUpgradeTier, getTotalTownUpgradeTiers, getTownUpgradeEffects, getTownUpgrades, grantGuildIntroBonus, TOWN_UPGRADE_DEFINITIONS, UPGRADE_ASSETS } from "@/data/upgrades";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { GameDialog } from "@/features/ui/GameDialog";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GuildContract, GuildContractFilter } from "@/types/guild";
import type { TownUpgradeId, TownUpgradePurchaseSummary } from "@/types/upgrades";
import styles from "./GuildHallScreen.module.css";

const ART = "/images/ui/guild-v1/";
const GOLD = ART + "gold.webp";
const GP = ART + "gp.webp";
const FILTERS: { id: GuildContractFilter; label: string }[] = [
  { id: "all", label: "All Requests" }, { id: "accepted", label: "Accepted" }, { id: "completed", label: "Completed" },
  { id: "donation", label: "Donations" }, { id: "service", label: "Service" }, { id: "restoration", label: "Restoration" },
  { id: "registry", label: "Registry" }, { id: "lineage", label: "Lineage" }, { id: "security", label: "Security" },
  { id: "bronze", label: "Bronze" }, { id: "silver", label: "Silver" }, { id: "gold", label: "Gold" },
];
const STATS: Record<CreatureStatKey, string> = { STR: "Strength", DEX: "Dexterity", STA: "Stamina", CHA: "Charm", WIL: "Willpower", FER: "Fertility" };
function matches(contract: GuildContract, filter: GuildContractFilter) {
  if (filter === "accepted" || filter === "completed") return contract.status === filter;
  if (contract.status === "expired") return false;
  if (filter === "all") return true;
  if (filter === "donation") return contract.type === "donate_creature";
  if (filter === "service") return contract.type === "service_creature" || contract.category === "service";
  return contract.tier === filter || contract.category === filter;
}
function requirementLabel(contract: GuildContract) {
  const requirement = contract.requirement;
  if (requirement.kind === "stat_minimum" && requirement.stat) return `${STATS[requirement.stat]} ${requirement.minimum}+`;
  if (requirement.kind === "any_creature") return "Any creature";
  if (requirement.variantId) return getVariantDefinition(requirement.variantId).name;
  if (requirement.family) return `${requirement.family} family`;
  if (requirement.rarity) return `${requirement.rarity} or rarer`;
  return requirement.label;
}
function requestArt(contract: GuildContract) {
  if (contract.requirement.variantId) return getVariantDefinition(contract.requirement.variantId).profilePath;
  if (/nursery|comfort/i.test(contract.title)) return ART + "nursery.webp";
  if (contract.category === "security") return "/images/ui/town-v1/coliseum.webp";
  if (/charm|noble/i.test(contract.title)) return "/images/ui/town-v1/rose.webp";
  if (contract.category === "lineage" || contract.category === "registry") return "/images/ui/town-v2/icon-eggs.webp";
  if (contract.type === "service_creature") return "/images/ui/town-v2/icon-training.webp";
  return "/images/ui/town-v2/icon-adoption.webp";
}
function Rewards({ gold, gp }: { gold: number; gp: number }) {
  return <span className={styles.rewards}><span><img src={GOLD} alt="" />{gold} Gold</span><span><img src={GP} alt="" />{gp} GP</span></span>;
}
function CreatureProfile({ creature }: { creature: CreatureRecord }) {
  const variant = getVariantDefinition(creature.variantId);
  return <div className={styles.creatureProfile}><img className={styles.fullBody} src={variant.profilePath || variant.portraitPath} alt={`${creature.nickname}, full body`} /><div><h3>{creature.nickname}</h3><p>{variant.name} · {variant.rarity} · Level {creature.level}</p><p>Energy {creature.energy}/{creature.maxEnergy} · Affection {creature.affection}</p><dl className={styles.stats}>{(Object.keys(STATS) as CreatureStatKey[]).map(key => <div key={key}><dt>{STATS[key]}</dt><dd>{creature.stats[key]} <b>Grade {creature.statGrades?.[key] ?? "—"}</b></dd></div>)}</dl>{creature.abilities?.map(ability => <p key={ability.id}>{ability.name} · Grade {ability.grade}</p>)}</div></div>;
}

export function GuildHallScreen() {
  const { open } = useNavigation();
  const { acceptGuildRequest, addDevGuildPoints, buyTownUpgrade, claimGuildIntroBonus, currentSave, donateCreatureToGuild, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [filter, setFilter] = useState<GuildContractFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(3);
  const [compact, setCompact] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatureId, setCreatureId] = useState<CreatureId | null>(null);
  const [popup, setPopup] = useState<"filters" | "details" | "creatures" | "review" | "desk" | "info" | "receipt" | null>(null);
  const [message, setMessage] = useState("");
  const [upgradeId, setUpgradeId] = useState<TownUpgradeId>("market_listing_capacity");
  const [pendingUpgradeId, setPendingUpgradeId] = useState<TownUpgradeId | null>(null);
  const [upgradeSummary, setUpgradeSummary] = useState<TownUpgradePurchaseSummary | null>(null);
  const [showDev, setShowDev] = useState(false);
  const submitting = useRef(false);
  const save = useMemo(() => {
    if (!currentSave) return null;
    const synced = ensureCurrentGuildState(currentSave);
    // The normalizer returns fresh objects even when the board is unchanged.
    // Only persist a real refresh/migration, never a render-driven save loop.
    return JSON.stringify(synced.guild) === JSON.stringify(currentSave.guild)
      && JSON.stringify(synced.flags) === JSON.stringify(currentSave.flags) ? currentSave : synced;
  }, [currentSave]);
  useEffect(() => { if (currentSave && save !== currentSave && save) saveCurrentGame(save); }, [currentSave, save, saveCurrentGame]);
  useEffect(() => {
    const phone = window.matchMedia("(max-width: 600px)");
    const small = window.matchMedia("(max-width: 1050px), (max-height: 620px)");
    const update = () => { setPageSize(phone.matches ? 1 : 3); setCompact(small.matches); setPage(0); };
    update(); phone.addEventListener("change", update); small.addEventListener("change", update);
    return () => { phone.removeEventListener("change", update); small.removeEventListener("change", update); };
  }, []);
  const contracts = useMemo(() => save?.guild?.contracts.filter(contract => matches(contract, filter)) ?? [], [save, filter]);
  const pages = Math.max(1, Math.ceil(contracts.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = contracts.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const selected = visible.find(contract => contract.contractId === selectedId) ?? visible[0] ?? null;
  const eligible = useMemo(() => save && selected ? getEligibleCreaturesForContract(save, selected.contractId) : [], [save, selected]);
  const creature = eligible.find(item => item.creatureId === creatureId) ?? null;
  const upgrades = save ? getTownUpgrades(save) : null;
  const upgrade = TOWN_UPGRADE_DEFINITIONS.find(item => item.upgradeId === upgradeId)!;
  const upgradeTier = upgrades?.[upgradeId] ?? 0;
  const nextTier = getNextUpgradeTier(upgrade, upgradeTier);
  const pendingUpgrade = TOWN_UPGRADE_DEFINITIONS.find(item => item.upgradeId === pendingUpgradeId);
  const pendingTier = pendingUpgrade ? getNextUpgradeTier(pendingUpgrade, upgrades?.[pendingUpgrade.upgradeId] ?? 0) : null;
  if (!save || !save.guild || !upgrades) return <main><h1>No active save</h1><button onClick={goToMainMenu}>Return to Main Menu</button></main>;
  const guild = save.guild;
  const effects = getTownUpgradeEffects(save);
  const grant = grantGuildIntroBonus(save);
  const grantAmount = grant.save.currencies.guildPoints - save.currencies.guildPoints;
  const isService = selected?.type === "service_creature";
  const actionable = selected?.status === "available" || selected?.status === "accepted";
  const preview = selected && creature ? donateCreatureToGuildContract(save, selected.contractId, creature.creatureId) : null;
  const rewardSave = preview?.ok ? applyStarterGoalRewards(ensureMonthlyTaxPosted(preview.save)) : preview?.save;
  const goalGold = rewardSave && preview ? rewardSave.currencies.gold - preview.save.currencies.gold : 0;
  const goalGp = rewardSave && preview ? rewardSave.currencies.guildPoints - preview.save.currencies.guildPoints : 0;
  const bonus = selected && creature ? calculateContractQualityBonus(creature, selected) : null;
  function changeFilter(next: GuildContractFilter) { setFilter(next); setPage(0); setSelectedId(null); setCreatureId(null); setPopup(null); }
  function changePage(next: number) { setPage(next); setSelectedId(null); setCreatureId(null); }
  function select(contract: GuildContract) { setSelectedId(contract.contractId); setCreatureId(null); if (compact) setPopup("details"); }
  function accept() { if (!selected) return; setMessage(acceptGuildRequest(selected.contractId)); }
  function submit() {
    if (!selected || !creature || !preview?.ok || submitting.current) return;
    submitting.current = true;
    setMessage(donateCreatureToGuild(selected.contractId, creature.creatureId) + (goalGold || goalGp ? ` Starter goal rewards: +${goalGold} Gold, +${goalGp} GP.` : ""));
    setCreatureId(null); setPopup("receipt");
    queueMicrotask(() => { submitting.current = false; });
  }
  const details = selected ? <div className={styles.detailContent}>
    <div className={styles.detailHeading}><h2>{selected.title}</h2><p className={styles.meta}>{selected.tier} · {isService ? "Service" : "Donation"} · {selected.status}</p></div>
    <div className={styles.requester}><img src={requestArt(selected)} alt="" /><div><strong>Requester: {selected.requesterName || "Guild"}</strong><p>{selected.description}</p></div></div>
    <div className={styles.requirement}><span><small>Requirement</small><strong>{requirementLabel(selected)}</strong></span><span><small>{isService ? "Cost" : "Placement"}</small><strong>{isService ? `${selected.serviceEnergyCost ?? 14} Energy` : "Permanent"}</strong></span></div>
    <div className={styles.rewardBlock}><small>Base rewards</small><Rewards gold={selected.goldReward} gp={selected.guildPointReward} />{isService && <p>★ {selected.serviceXpReward ?? 12} XP · ♥ {selected.serviceAffectionReward ?? 3} Affection</p>}</div>
    <p className={`${styles.ribbon} ${!isService ? styles.donation : ""}`}>{isService ? "Creature returns after service" : "Creature permanently leaves your ranch"}</p>
    <p className={styles.quality}>{selected.status === "completed" ? `Completed with ${selected.submittedCreatureName ?? selected.donatedCreatureName ?? "a creature"}.` : "Final reward shown after creature selection"}</p>
    <div className={styles.actions}><button className={styles.primary} disabled={!actionable} onClick={() => setPopup("creatures")}>{selected.status === "completed" ? "Completed" : "Choose Creature"}</button><button disabled={selected.status !== "available"} onClick={accept}>{selected.status === "accepted" ? "Accepted" : "Accept Contract"}</button></div>
  </div> : null;
  return <main className={styles.guild}>
    <header className={styles.header}><h1>Guild Hall</h1><div className={styles.resources}><span><img src={GOLD} alt="" />{formatGold(save.currencies.gold)}</span><span><img src={GP} alt="" />{formatGuildPoints(save.currencies.guildPoints)}</span><span>Guild Rank <b>{guild.guildRank}</b></span></div><nav aria-label="Guild navigation"><button onClick={goToTown}>← Town</button><button data-navigation-launcher onClick={() => open("menu")}>☰ Menu</button></nav></header>
    <section className={styles.board} aria-label="Guild request board" data-contract-board="bulletin" data-tutorial-id="tutorial-guild-request">
      <div className={styles.boardLeft}><nav className={styles.tabs} aria-label="Request filters">{FILTERS.slice(0, 3).map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => changeFilter(item.id)}>{item.label}</button>)}<button aria-pressed={!FILTERS.slice(0, 3).some(item => item.id === filter)} onClick={() => setPopup("filters")}>{FILTERS.slice(3).find(item => item.id === filter)?.label ?? "Filters"} ▾</button></nav>
      <div className={styles.notices}>{visible.map(contract => <button key={contract.contractId} className={`${styles.notice} ${selected?.contractId === contract.contractId ? styles.selected : ""}`} aria-label={`View ${contract.title}`} aria-pressed={selected?.contractId === contract.contractId} onClick={() => select(contract)}>
        {selected?.contractId === contract.contractId && <img className={styles.seal} src={ART + "seal.webp"} alt="Selected" />}<img className={styles.vignette} src={requestArt(contract)} alt="" /><strong>{contract.title}</strong><span className={styles.meta}>{contract.tier} · {contract.type === "service_creature" ? "Service" : "Donation"}</span><span className={styles.noticeRequirement}>{requirementLabel(contract)}</span><Rewards gold={contract.goldReward} gp={contract.guildPointReward} /><span className={styles.noticeStatus}>{contract.status === "available" ? (compact ? "View request →" : "Available") : contract.status}</span>
      </button>)}{!visible.length && <div className={styles.noRequests}><h2>No {filter === "all" ? "current" : FILTERS.find(item => item.id === filter)?.label.toLowerCase()} requests</h2><p>Try another filter. New requests arrive each week.</p><button onClick={() => changeFilter("all")}>All Requests</button></div>}</div></div>
      {!compact && <article className={styles.selectedNotice} aria-label="Selected request">{details ?? <div className={styles.noRequests}><h2>The request board</h2><p>Choose a request to see its requirements and rewards.</p></div>}</article>}
      <footer className={styles.rail}><div className={styles.pager}><button aria-label="Previous requests" disabled={!safePage} onClick={() => changePage(safePage - 1)}>❮</button><span aria-live="polite">{safePage + 1} / {pages}</span><button aria-label="Next requests" disabled={safePage >= pages - 1} onClick={() => changePage(safePage + 1)}>❯</button></div><button className={styles.deskButton} onClick={() => {setMessage(""); setPopup("desk");}}><img src={ART + "quill.webp"} alt="" /><span>Mara’s Desk<small>Upgrades & Grants</small></span></button><button onClick={() => setPopup("info")}>Board Details</button></footer>
    </section>
    {message && !popup && <button className={styles.notification} role="status" onClick={() => setPopup("receipt")}>{message}<span>View details</span></button>}
    {popup === "details" && selected && <GameDialog title="Request Details" onClose={() => setPopup(null)}>{details}</GameDialog>}
    {popup === "filters" && <GameDialog title="Filter Requests" onClose={() => setPopup(null)}><div className={styles.filterChoices}>{FILTERS.map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => changeFilter(item.id)}>{item.label} ({guild.contracts.filter(contract => matches(contract, item.id)).length})</button>)}</div></GameDialog>}
    {popup === "creatures" && selected && <GameDialog title="Choose a Creature" onClose={() => setPopup(null)} wide><h3>{selected.title}</h3><p>{selected.requirement.label}{isService ? ` · ${selected.serviceEnergyCost ?? 14} energy required` : " · Permanent placement"}</p><div className={styles.creatureChoices}>{eligible.map(item => <button key={item.creatureId} onClick={() => { setCreatureId(item.creatureId); setPopup("review"); }}><img src={getVariantDefinition(item.variantId).portraitPath} alt="" /><span><strong>{item.nickname}</strong><small>{getVariantDefinition(item.variantId).name} · Lv. {item.level}</small><small>Energy {item.energy}/{item.maxEnergy}</small></span><b>Review →</b></button>)}</div>{!eligible.length && <p>No eligible creatures. Check the request’s requirements{isService ? " and current energy" : "; locked creatures cannot be donated"}.</p>}</GameDialog>}
    {popup === "review" && selected && creature && preview && <GameDialog title={isService ? "Review Service" : "Review Permanent Placement"} onClose={() => setPopup("creatures")} wide><CreatureProfile creature={creature} /><h3>{selected.title}</h3><p className={styles.reviewWarning}>{isService ? `${creature.nickname} returns immediately after service, spends ${selected.serviceEnergyCost ?? 14} energy, and gains ${selected.serviceXpReward ?? 12} XP and up to ${selected.serviceAffectionReward ?? 3} affection.` : `${creature.nickname} will permanently leave your ranch and be placed with ${selected.requesterName}. This cannot be undone.`}</p><Rewards gold={(rewardSave ?? preview.save).currencies.gold - save.currencies.gold} gp={(rewardSave ?? preview.save).currencies.guildPoints - save.currencies.guildPoints} /><p>Includes quality bonus: +{bonus?.gold ?? 0} Gold · +{bonus?.gp ?? 0} GP.{guild.completedCount === 0 ? " Includes the first-contract GP bonus." : ""}</p>{(goalGold > 0 || goalGp > 0) && <p>Also includes starter goal rewards: +{goalGold} Gold · +{goalGp} GP.</p>}{!!bonus?.reasons.length && <p>{bonus.reasons.join(" · ")}</p>}<div className={styles.actions}><button onClick={() => setPopup("creatures")}>Choose Another</button><button className={styles.primary} disabled={!preview.ok} onClick={submit}>{isService ? "Confirm Service" : "Confirm Permanent Placement"}</button></div></GameDialog>}
    {popup === "info" && <GameDialog title="Board Details" onClose={() => setPopup(null)}><dl className={styles.stats}><div><dt>Guild Rank</dt><dd>{guild.guildRank}</dd></div><div><dt>Week</dt><dd>{guild.weekNumber}</dd></div><div><dt>Completed</dt><dd>{guild.completedCount}</dd></div><div><dt>Board Level</dt><dd>{getTotalTownUpgradeTiers(save, "guild") + 1}</dd></div></dl><h3>Service & placement</h3><p>Service requests spend energy and return your creature immediately with XP and affection. Donation requests permanently place a creature with the requester.</p><p>Accepting a request marks it for later; you can also complete an available request directly. Review the creature and final reward before confirming.</p><p>Higher stats, level, rarity, affection and abilities can add quality bonuses. Board upgrades add weekly requests and improve rewards.</p></GameDialog>}
    {popup === "desk" && <GameDialog title="Mara’s Desk · Upgrades & Grants" onClose={() => setPopup(null)} wide><div className={styles.mara}><img src={UPGRADE_ASSETS.quartermasterPortrait} alt="Mara Vell" /><div><h3>Mara Vell · Quartermaster</h3><p>{formatGuildPoints(save.currencies.guildPoints)} · {getTotalTownUpgradeTiers(save)} upgrade tiers purchased</p><button disabled={!grant.ok} onClick={() => setMessage(claimGuildIntroBonus().message)}>{!grant.ok ? "Welcome Grant Claimed" : `Claim Mara’s +${grantAmount} GP Grant`}</button></div></div>{message && <p role="status">{message}</p>}<div className={styles.deskGrid}><div className={styles.upgradeList}>{TOWN_UPGRADE_DEFINITIONS.map(item => <button key={item.upgradeId} aria-pressed={upgradeId === item.upgradeId} onClick={() => setUpgradeId(item.upgradeId)}><img src={item.iconPath} alt="" /><span><strong>{item.name}</strong><small>Tier {upgrades[item.upgradeId] ?? 0} / {item.maxTier}</small></span></button>)}</div><div><h3>{upgrade.name}</h3><p>{upgrade.description}</p><dl className={styles.upgradeCompare}><div><dt>Current · Tier {upgradeTier}</dt><dd>{upgrade.tiers.find(tier => tier.tier === upgradeTier)?.effectLabel ?? "Base service"}</dd></div><div><dt>{nextTier ? `Next · Tier ${nextTier.tier}` : "Fully upgraded"}</dt><dd>{nextTier?.effectLabel ?? "Maximum tier reached"}</dd></div></dl><button className={styles.primary} disabled={!nextTier || save.currencies.guildPoints < nextTier.costGp} onClick={() => setPendingUpgradeId(upgradeId)}>{nextTier ? `Upgrade · ${nextTier.costGp} GP` : "Max Tier"}</button>{nextTier && save.currencies.guildPoints < nextTier.costGp && <p>Need {nextTier.costGp - save.currencies.guildPoints} more GP.</p>}<h3>Current town bonuses</h3><p>Adoption listings: {effects.marketListingCount} · Special placements: {(effects.marketVariantChance * 100).toFixed(2)}% · Quality tier: {effects.marketQualityTier} · Refresh discount: {Math.round(effects.marketRerollDiscount * 100)}%</p><p>Weekly requests: {effects.guildContractCount} · Request quality: {effects.guildContractQualityTier} · Gold rewards: {Math.round(effects.guildGoldRewardMultiplier * 100)}% · Bonus GP: +{effects.guildBonusGp}</p></div></div>{save.settings.devMode && <div><button onClick={() => setShowDev(!showDev)}>Dev Tools</button>{showDev && <button onClick={() => setMessage(addDevGuildPoints().message)}>Add +25 GP</button>}</div>}</GameDialog>}
    {pendingUpgrade && pendingTier && <GameDialog title="Confirm Upgrade" onClose={() => setPendingUpgradeId(null)}><h3>{pendingUpgrade.name}</h3><p>Tier {upgrades[pendingUpgrade.upgradeId] ?? 0} → {pendingTier.tier} · {pendingTier.costGp} GP</p><p>{pendingTier.effectLabel}</p><p>{pendingUpgrade.category === "guild" ? "The request board refreshes immediately." : "Adoption listings refresh immediately."}</p><div className={styles.actions}><button onClick={() => setPendingUpgradeId(null)}>Cancel</button><button className={styles.primary} onClick={() => { const result = buyTownUpgrade(pendingUpgrade.upgradeId); setMessage(result.message); setUpgradeSummary(result.summary ?? null); setPendingUpgradeId(null); }}>Confirm Upgrade</button></div></GameDialog>}
    {upgradeSummary && <GameDialog title="Upgrade Complete" onClose={() => setUpgradeSummary(null)}><h3>{upgradeSummary.upgradeName}</h3><p>Tier {upgradeSummary.oldTier} → {upgradeSummary.newTier}</p><p>{upgradeSummary.effectLabel}</p><p>Spent {upgradeSummary.costGp} GP · Remaining {upgradeSummary.remainingGp} GP</p><button onClick={() => setUpgradeSummary(null)}>Continue</button></GameDialog>}
    {popup === "receipt" && <GameDialog title="Guild Notice" onClose={() => {setPopup(null); setMessage("");}}><p role="status">{message}</p><button onClick={() => {setPopup(null); setMessage("");}}>Continue</button></GameDialog>}
  </main>;
}
