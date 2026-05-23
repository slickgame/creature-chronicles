"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doesCreatureMatchContract,
  ensureCurrentGuildState,
  getContractTierIcon,
  getEligibleCreaturesForContract,
} from "@/data/guild";
import { getVariantDefinition } from "@/data/creatures";
import {
  getNextUpgradeTier,
  getTotalTownUpgradeTiers,
  getTownUpgradeEffects,
  getTownUpgrades,
  getUpgradeCategoryIcon,
  getUpgradeCategoryLabel,
  TOWN_UPGRADE_DEFINITIONS,
  UPGRADE_ASSETS,
} from "@/data/upgrades";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GuildContract, GuildContractFilter } from "@/types/guild";
import type { TownUpgradeCategory, TownUpgradeId, TownUpgradePurchaseSummary } from "@/types/upgrades";
import styles from "./GuildHallScreen.module.css";

const ICONS = {
  contract: "/images/ui/icons/icon_contract_scroll.png",
  donate: "/images/ui/icons/icon_donate_creature.png",
  gp: "/images/ui/icons/icon_guild_points.png",
  gold: "/images/ui/currency/icon_currency_gold.png",
} as const;

const FILTERS: Array<{ id: GuildContractFilter; label: string }> = [
  { id: "all", label: "All Contracts" },
  { id: "bronze", label: "Bronze" },
  { id: "silver", label: "Silver" },
  { id: "gold", label: "Gold" },
  { id: "accepted", label: "Accepted" },
  { id: "completed", label: "Completed" },
];

const SERVICE_CATEGORIES: Array<{ id: TownUpgradeCategory; label: string }> = [
  { id: "market", label: "Market Stall" },
  { id: "guild", label: "Request Board" },
];

function getContractStatusLabel(contract: GuildContract): string {
  if (contract.status === "available") return "Available";
  if (contract.status === "accepted") return "Accepted";
  if (contract.status === "completed") return "Completed";
  return "Expired";
}

function contractMatchesFilter(contract: GuildContract, filter: GuildContractFilter): boolean {
  if (filter === "all") return contract.status !== "expired";
  if (filter === "accepted") return contract.status === "accepted";
  if (filter === "completed") return contract.status === "completed";
  return contract.tier === filter && contract.status !== "expired";
}

function getCreatureImage(creature: CreatureRecord): string {
  return getVariantDefinition(creature.variantId).portraitPath;
}

export function GuildHallScreen() {
  const {
    acceptGuildRequest,
    addDevGuildPoints,
    buyTownUpgrade,
    claimGuildIntroBonus,
    currentSave,
    donateCreatureToGuild,
    goToMainMenu,
    goToTown,
    saveCurrentGame,
    version,
  } = useGameContext();
  const [hallMode, setHallMode] = useState<"hall" | "board" | "services">("hall");
  const [filter, setFilter] = useState<GuildContractFilter>("all");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [serviceCategory, setServiceCategory] = useState<TownUpgradeCategory>("market");
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<TownUpgradeId>("market_listing_capacity");
  const [pendingUpgradeId, setPendingUpgradeId] = useState<TownUpgradeId | null>(null);
  const [upgradeSummary, setUpgradeSummary] = useState<TownUpgradePurchaseSummary | null>(null);
  const [message, setMessage] = useState("Welcome to the guild hall. Open the request board or speak with Mara Vell about town service upgrades.");

  useEffect(() => {
    if (!currentSave) return;
    const syncedSave = ensureCurrentGuildState(currentSave);
    if (syncedSave !== currentSave) saveCurrentGame(syncedSave);
  }, [currentSave, saveCurrentGame]);

  const syncedSave = useMemo(() => (currentSave ? ensureCurrentGuildState(currentSave) : null), [currentSave]);
  const guild = syncedSave?.guild;
  const contracts = guild?.contracts ?? [];
  const upgrades = syncedSave ? getTownUpgrades(syncedSave) : null;
  const effects = syncedSave ? getTownUpgradeEffects(syncedSave) : null;
  const totalUpgradeTiers = syncedSave ? getTotalTownUpgradeTiers(syncedSave) : 0;
  const marketUpgradeLevel = syncedSave ? getTotalTownUpgradeTiers(syncedSave, "market") + 1 : 1;
  const boardUpgradeLevel = syncedSave ? getTotalTownUpgradeTiers(syncedSave, "guild") + 1 : 1;

  const filteredContracts = useMemo(
    () => contracts.filter((contract) => contractMatchesFilter(contract, filter)),
    [contracts, filter],
  );

  const selectedContract = useMemo(() => {
    if (!contracts.length) return null;
    const selected = selectedContractId ? contracts.find((contract) => contract.contractId === selectedContractId) : null;
    return selected ?? filteredContracts[0] ?? contracts[0];
  }, [contracts, filteredContracts, selectedContractId]);

  const eligibleCreatures = useMemo(() => {
    if (!syncedSave || !selectedContract) return [];
    return getEligibleCreaturesForContract(syncedSave, selectedContract.contractId);
  }, [syncedSave, selectedContract]);

  const categoryUpgrades = useMemo(
    () => TOWN_UPGRADE_DEFINITIONS.filter((definition) => definition.category === serviceCategory),
    [serviceCategory],
  );

  const selectedUpgrade = useMemo(() => {
    const selected = categoryUpgrades.find((definition) => definition.upgradeId === selectedUpgradeId);
    return selected ?? categoryUpgrades[0] ?? TOWN_UPGRADE_DEFINITIONS[0];
  }, [categoryUpgrades, selectedUpgradeId]);

  const pendingUpgrade = useMemo(
    () => (pendingUpgradeId ? TOWN_UPGRADE_DEFINITIONS.find((definition) => definition.upgradeId === pendingUpgradeId) ?? null : null),
    [pendingUpgradeId],
  );

  useEffect(() => {
    if (!selectedContract && filteredContracts[0]) setSelectedContractId(filteredContracts[0].contractId);
  }, [filteredContracts, selectedContract]);

  useEffect(() => {
    if (selectedCreatureId && !eligibleCreatures.some((creature) => creature.creatureId === selectedCreatureId)) setSelectedCreatureId(null);
  }, [eligibleCreatures, selectedCreatureId]);

  useEffect(() => {
    if (!categoryUpgrades.some((definition) => definition.upgradeId === selectedUpgradeId)) {
      setSelectedUpgradeId(categoryUpgrades[0]?.upgradeId ?? "market_listing_capacity");
    }
  }, [categoryUpgrades, selectedUpgradeId]);

  if (!currentSave || !syncedSave || !guild || !upgrades || !effects) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before entering the guild hall.</p>
          <button type="button" onClick={goToMainMenu}>Return to Main Menu</button>
        </section>
      </main>
    );
  }

  function handleAccept() {
    if (!selectedContract) return;
    const resultMessage = acceptGuildRequest(selectedContract.contractId);
    setMessage(resultMessage);
  }

  function handleDonate() {
    if (!selectedContract || !selectedCreatureId) return;
    const resultMessage = donateCreatureToGuild(selectedContract.contractId, selectedCreatureId);
    setMessage(resultMessage);
    setSelectedCreatureId(null);
  }

  function handleUpgradePurchase(upgradeId: TownUpgradeId) {
    setPendingUpgradeId(upgradeId);
  }

  function confirmUpgradePurchase() {
    if (!pendingUpgradeId) return;
    const result = buyTownUpgrade(pendingUpgradeId);
    setMessage(result.message);
    setPendingUpgradeId(null);
    setUpgradeSummary(result.summary ?? null);
  }

  function handleIntroBonus() {
    const result = claimGuildIntroBonus();
    setMessage(result.message);
  }

  function handleDevGp() {
    const result = addDevGuildPoints();
    setMessage(result.message);
  }

  const selectedCreature = eligibleCreatures.find((creature) => creature.creatureId === selectedCreatureId) ?? null;
  const canAccept = selectedContract?.status === "available";
  const canDonate = Boolean(selectedContract && selectedCreatureId && (selectedContract.status === "available" || selectedContract.status === "accepted"));
  const selectedUpgradeTier = upgrades[selectedUpgrade.upgradeId] ?? 0;
  const nextUpgradeTier = getNextUpgradeTier(selectedUpgrade, selectedUpgradeTier);
  const pendingUpgradeTier = pendingUpgrade ? upgrades[pendingUpgrade.upgradeId] ?? 0 : 0;
  const pendingNextTier = pendingUpgrade ? getNextUpgradeTier(pendingUpgrade, pendingUpgradeTier) : null;

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M10.5 Guild Economy Polish</p>
            <h1>Guild Hall</h1>
            <p>Complete contracts for GP, then spend GP with Mara Vell to upgrade town services.</p>
            <p className={styles.message}>{message}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statBox}><img src={ICONS.gold} alt="" /><span>Gold</span><strong>{formatGold(currentSave.currencies.gold)}</strong></div>
            <div className={styles.statBox}><img src={ICONS.gp} alt="" /><span>Guild Points</span><strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong></div>
            <button type="button" onClick={goToTown}>Back to Town</button>
            <button type="button" onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        {hallMode === "hall" ? (
          <>
            <button type="button" className={styles.boardHotspot} onClick={() => setHallMode("board")}>
              <img src={ICONS.contract} alt="" />
              <strong>Open Request Board</strong>
              <span>Board Lv. {boardUpgradeLevel} • {contracts.filter((contract) => contract.status === "available").length} available</span>
            </button>
            <button type="button" className={styles.quartermasterHotspot} onClick={() => setHallMode("services")}>
              <img src={UPGRADE_ASSETS.quartermasterPortrait} alt="" />
              <strong>Mara Vell</strong>
              <span>{totalUpgradeTiers} upgrade tiers purchased</span>
            </button>
            <section className={styles.hallIntro}>
              <p className={styles.kicker}>Guild Services</p>
              <h2>Mara Vell, Quartermaster</h2>
              <p>“Guild Points are trust. Spend them wisely, and the town will open better doors for your ranch.”</p>
            </section>
          </>
        ) : null}

        {hallMode === "services" ? (
          <section className={styles.contractOverlay} aria-label="Guild quartermaster services">
            <div className={styles.contractHeader}>
              <div className={styles.quartermasterTitleRow}>
                <img src={UPGRADE_ASSETS.quartermasterPortrait} alt="" />
                <div>
                  <p className={styles.kicker}>Quartermaster Desk</p>
                  <h1>Mara Vell</h1>
                  <p className={styles.message}>Town upgrades purchased: {totalUpgradeTiers}. Market Stall Lv. {marketUpgradeLevel}. Request Board Lv. {boardUpgradeLevel}.</p>
                </div>
              </div>
              <div className={styles.actionRow}>
                <button type="button" className={styles.secondaryButton} onClick={() => setHallMode("hall")}>Back to Guild Hall</button>
                <button type="button" className={styles.primaryButton} onClick={() => setHallMode("board")}>Request Board</button>
              </div>
            </div>

            <div className={styles.servicesGrid}>
              <aside className={styles.panel}>
                <h2>Services</h2>
                <div className={styles.filters}>
                  {SERVICE_CATEGORIES.map((category) => (
                    <button key={category.id} type="button" className={`${styles.filterButton} ${serviceCategory === category.id ? styles.active : ""}`} onClick={() => setServiceCategory(category.id)}>
                      <img src={getUpgradeCategoryIcon(category.id)} alt="" className={styles.filterIcon} />{category.label}
                    </button>
                  ))}
                </div>
                <div className={styles.bonusPanel}>
                  <h2>Current Bonuses</h2>
                  <div className={styles.bonusList}>
                    {serviceCategory === "market" ? (
                      <><span>Market listings: <strong>{effects.marketListingCount}</strong></span><span>Variant chance: <strong>{(effects.marketVariantChance * 100).toFixed(2)}%</strong></span><span>Quality tier: <strong>{effects.marketQualityTier}</strong></span><span>Reroll discount: <strong>{Math.round(effects.marketRerollDiscount * 100)}%</strong></span></>
                    ) : (
                      <><span>Weekly contracts: <strong>{effects.guildContractCount}</strong></span><span>Quality tier: <strong>{effects.guildContractQualityTier}</strong></span><span>Gold rewards: <strong>{Math.round(effects.guildGoldRewardMultiplier * 100)}%</strong></span><span>Bonus GP: <strong>+{effects.guildBonusGp}</strong></span></>
                    )}
                  </div>
                </div>
                <div className={styles.grantPanel}>
                  <h2>Testing Grants</h2>
                  <button type="button" className={styles.primaryButton} disabled={Boolean(currentSave.flags.m105GuildIntroBonusClaimed)} onClick={handleIntroBonus}>Claim Mara's +15 GP Intro Grant</button>
                  {currentSave.settings.devMode ? <button type="button" className={styles.secondaryButton} onClick={handleDevGp}>Dev: Add +25 GP</button> : null}
                  <p>First completed guild contract also grants a one-time +10 GP welcome bonus.</p>
                </div>
              </aside>

              <section className={styles.panel}>
                <h2>{getUpgradeCategoryLabel(serviceCategory)} Upgrades</h2>
                <div className={styles.upgradeList}>
                  {categoryUpgrades.map((definition) => {
                    const currentTier = upgrades[definition.upgradeId] ?? 0;
                    const nextTier = getNextUpgradeTier(definition, currentTier);
                    return (
                      <button key={definition.upgradeId} type="button" className={`${styles.upgradeButton} ${selectedUpgrade.upgradeId === definition.upgradeId ? styles.active : ""}`} onClick={() => setSelectedUpgradeId(definition.upgradeId)}>
                        <img src={definition.iconPath} alt="" />
                        <span><strong>{definition.name}</strong><span>Tier {currentTier} / {definition.maxTier}</span><em>{nextTier ? nextTier.effectLabel : "Max tier reached"}</em></span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <aside className={styles.panel}>
                <div className={styles.detailBody}>
                  <div><span className={styles.tier}>{selectedUpgrade.category} upgrade</span><h2 className={styles.contractTitle}>{selectedUpgrade.name}</h2><p>{selectedUpgrade.description}</p></div>
                  <div className={styles.upgradeDetailIconWrap}><img src={selectedUpgrade.iconPath} alt="" /><img src={UPGRADE_ASSETS.upgradeArrow} alt="" /></div>
                  <div className={styles.requirement}><span className={styles.smallLabel}>Current Tier</span><strong>Tier {selectedUpgradeTier} / {selectedUpgrade.maxTier}</strong><p>{nextUpgradeTier ? `Next: ${nextUpgradeTier.effectLabel}` : "This upgrade is fully improved."}</p></div>
                  <div className={styles.rewardBox}><span className={styles.smallLabel}>Tier Path</span><div className={styles.tierPath}>{selectedUpgrade.tiers.map((tier) => <div key={tier.tier} className={tier.tier <= selectedUpgradeTier ? styles.unlockedTier : ""}><strong>Tier {tier.tier}</strong><span>{tier.effectLabel}</span><em>{tier.costGp} GP</em></div>)}</div></div>
                  <button type="button" className={styles.primaryButton} disabled={!nextUpgradeTier || currentSave.currencies.guildPoints < (nextUpgradeTier?.costGp ?? 0)} onClick={() => handleUpgradePurchase(selectedUpgrade.upgradeId)}>{nextUpgradeTier ? `Purchase Tier ${nextUpgradeTier.tier} · ${nextUpgradeTier.costGp} GP` : "Max Tier Reached"}</button>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {hallMode === "board" ? (
          <section className={styles.contractOverlay} aria-label="Guild request board">
            <div className={styles.contractHeader}>
              <div><p className={styles.kicker}>Request Board Lv. {boardUpgradeLevel}</p><h1>Contracts</h1><p className={styles.message}>Guild Rank {guild.guildRank} • {guild.completedCount} completed • {guild.donatedCreatureCount} donated</p></div>
              <div className={styles.actionRow}><button type="button" className={styles.secondaryButton} onClick={() => setHallMode("hall")}>Back to Guild Hall</button><button type="button" className={styles.primaryButton} onClick={() => setHallMode("services")}>Quartermaster</button></div>
            </div>
            <div className={styles.contractGrid}>
              <aside className={styles.panel}><h2>Filters</h2><div className={styles.filters}>{FILTERS.map((item) => <button key={item.id} type="button" className={`${styles.filterButton} ${filter === item.id ? styles.active : ""}`} onClick={() => { setFilter(item.id); setSelectedContractId(null); }}>{item.label}</button>)}</div></aside>
              <section className={styles.panel}><h2>Contract List</h2><div className={styles.contractList}>{filteredContracts.map((contract) => <button key={contract.contractId} type="button" className={`${styles.contractButton} ${selectedContract?.contractId === contract.contractId ? styles.active : ""}`} onClick={() => { setSelectedContractId(contract.contractId); setSelectedCreatureId(null); }}><img src={getContractTierIcon(contract.tier)} alt="" /><span><span className={styles.tier}>{contract.tier} contract</span><strong>{contract.title}</strong><span className={styles.status}>{getContractStatusLabel(contract)}</span></span></button>)}{filteredContracts.length === 0 ? <p>No contracts match this filter.</p> : null}</div></section>
              <aside className={styles.panel}>{selectedContract ? <div className={styles.detailBody}><div><span className={styles.tier}>{selectedContract.tier} contract</span><h2 className={styles.contractTitle}>{selectedContract.title}</h2><p>{selectedContract.description}</p></div><div className={styles.requirement}><span className={styles.smallLabel}>Requirement</span><strong>{selectedContract.requirement.label}</strong><p>Eligible creatures: {eligibleCreatures.length}</p></div><div className={styles.rewardBox}><span className={styles.smallLabel}>Rewards</span><div className={styles.rewardGrid}><div className={styles.reward}><img src={ICONS.gold} alt="" /><div><span>Gold</span><strong>{selectedContract.goldReward}</strong></div></div><div className={styles.reward}><img src={ICONS.gp} alt="" /><div><span>GP</span><strong>{selectedContract.guildPointReward}</strong></div></div></div></div><div className={styles.actionRow}><button type="button" className={styles.primaryButton} disabled={!canAccept} onClick={handleAccept}>Accept</button><button type="button" className={styles.secondaryButton} disabled={!canDonate} onClick={handleDonate}><img src={ICONS.donate} alt="" style={{ width: 22, height: 22, verticalAlign: "middle", marginRight: 6 }} />Donate Creature</button></div>{selectedContract.status === "completed" ? <div className={styles.warning}>Completed with {selectedContract.donatedCreatureName ?? "a donated creature"}. This contract cannot be completed again.</div> : null}<div><h2>Eligible Creatures</h2><div className={styles.creatureList}>{eligibleCreatures.map((creature) => { const variant = getVariantDefinition(creature.variantId); const isActive = selectedCreature?.creatureId === creature.creatureId; return <button key={creature.creatureId} type="button" className={`${styles.creatureButton} ${isActive ? styles.active : ""}`} onClick={() => setSelectedCreatureId(creature.creatureId)} disabled={!doesCreatureMatchContract(creature, selectedContract)}><img src={getCreatureImage(creature)} alt="" /><span><strong>{creature.nickname}</strong><span className={styles.metaLabel}>{variant.name} • {variant.rarity}</span></span></button>; })}{eligibleCreatures.length === 0 ? <p>No owned creatures match this contract.</p> : null}</div></div></div> : <p>Select a contract to view details.</p>}</aside>
            </div>
          </section>
        ) : null}

        {pendingUpgrade && pendingNextTier ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setPendingUpgradeId(null)}>
            <section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <img src={pendingUpgrade.iconPath} alt="" />
              <p className={styles.kicker}>Confirm Upgrade</p>
              <h2>{pendingUpgrade.name}</h2>
              <p>Upgrade from Tier {pendingUpgradeTier} to Tier {pendingNextTier.tier} for {pendingNextTier.costGp} GP?</p>
              <div className={styles.requirement}><span className={styles.smallLabel}>New Effect</span><strong>{pendingNextTier.effectLabel}</strong><p>{pendingUpgrade.category === "market" ? "Market listings refresh immediately after purchase." : "Request board refreshes immediately after purchase."}</p></div>
              <div className={styles.actionRow}><button type="button" className={styles.secondaryButton} onClick={() => setPendingUpgradeId(null)}>Cancel</button><button type="button" className={styles.primaryButton} onClick={confirmUpgradePurchase}>Confirm Upgrade</button></div>
            </section>
          </div>
        ) : null}

        {upgradeSummary ? (
          <div className={styles.modalBackdrop} role="presentation" onClick={() => setUpgradeSummary(null)}>
            <section className={styles.resultModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <img src={UPGRADE_ASSETS.servicePermit} alt="" />
              <p className={styles.kicker}>Upgrade Complete</p>
              <h2>{upgradeSummary.upgradeName}</h2>
              <div className={styles.resultGrid}><span>Tier</span><strong>{upgradeSummary.oldTier} → {upgradeSummary.newTier}</strong><span>Effect</span><strong>{upgradeSummary.effectLabel}</strong><span>Spent</span><strong>{upgradeSummary.costGp} GP</strong><span>Remaining</span><strong>{upgradeSummary.remainingGp} GP</strong></div>
              <p className={styles.message}>{upgradeSummary.immediateRefreshLabel}</p>
              <button type="button" className={styles.primaryButton} onClick={() => setUpgradeSummary(null)}>Continue</button>
            </section>
          </div>
        ) : null}

        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
