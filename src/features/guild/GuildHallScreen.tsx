"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doesCreatureMatchContract,
  ensureCurrentGuildState,
  getContractTierIcon,
  getEligibleCreaturesForContract,
} from "@/data/guild";
import { getVariantDefinition } from "@/data/creatures";
import { formatGold, formatGuildPoints } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GuildContract, GuildContractFilter } from "@/types/guild";
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
    currentSave,
    donateCreatureToGuild,
    goToMainMenu,
    goToTown,
    saveCurrentGame,
    version,
  } = useGameContext();
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [filter, setFilter] = useState<GuildContractFilter>("all");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [message, setMessage] = useState("Welcome to the guild hall. Open the request board to review contracts.");

  useEffect(() => {
    if (!currentSave) return;
    const syncedSave = ensureCurrentGuildState(currentSave);
    if (syncedSave !== currentSave) saveCurrentGame(syncedSave);
  }, [currentSave, saveCurrentGame]);

  const syncedSave = useMemo(() => (currentSave ? ensureCurrentGuildState(currentSave) : null), [currentSave]);
  const guild = syncedSave?.guild;
  const contracts = guild?.contracts ?? [];

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

  useEffect(() => {
    if (!selectedContract && filteredContracts[0]) {
      setSelectedContractId(filteredContracts[0].contractId);
    }
  }, [filteredContracts, selectedContract]);

  useEffect(() => {
    if (selectedCreatureId && !eligibleCreatures.some((creature) => creature.creatureId === selectedCreatureId)) {
      setSelectedCreatureId(null);
    }
  }, [eligibleCreatures, selectedCreatureId]);

  if (!currentSave || !syncedSave || !guild) {
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

  const selectedCreature = eligibleCreatures.find((creature) => creature.creatureId === selectedCreatureId) ?? null;
  const canAccept = selectedContract?.status === "available";
  const canDonate = Boolean(selectedContract && selectedCreatureId && (selectedContract.status === "available" || selectedContract.status === "accepted"));

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <div className={styles.backgroundArt} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M7 Guild Contracts</p>
            <h1>Guild Hall</h1>
            <p>Accept contracts, donate eligible creatures, and earn Gold plus Guild Points.</p>
            <p className={styles.message}>{message}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.statBox}>
              <img src={ICONS.gold} alt="" />
              <span>Gold</span>
              <strong>{formatGold(currentSave.currencies.gold)}</strong>
            </div>
            <div className={styles.statBox}>
              <img src={ICONS.gp} alt="" />
              <span>Guild Points</span>
              <strong>{formatGuildPoints(currentSave.currencies.guildPoints)}</strong>
            </div>
            <button type="button" onClick={goToTown}>Back to Town</button>
            <button type="button" onClick={goToMainMenu}>Main Menu</button>
          </div>
        </header>

        {!isBoardOpen ? (
          <>
            <button type="button" className={styles.boardHotspot} onClick={() => setIsBoardOpen(true)}>
              <img src={ICONS.contract} alt="" />
              <strong>Open Request Board</strong>
              <span>{contracts.filter((contract) => contract.status === "available").length} available</span>
            </button>

            <section className={styles.hallIntro}>
              <p className={styles.kicker}>Request Board</p>
              <h2>Guild Services</h2>
              <p>The board handles weekly creature donation contracts. Complete requests to earn Guild Points and improve your guild standing.</p>
            </section>
          </>
        ) : (
          <section className={styles.contractOverlay} aria-label="Guild request board">
            <div className={styles.contractHeader}>
              <div>
                <p className={styles.kicker}>Request Board</p>
                <h1>Contracts</h1>
                <p className={styles.message}>Guild Rank {guild.guildRank} • {guild.completedCount} completed • {guild.donatedCreatureCount} donated</p>
              </div>
              <div className={styles.actionRow}>
                <button type="button" className={styles.secondaryButton} onClick={() => setIsBoardOpen(false)}>Back to Guild Hall</button>
                <button type="button" className={styles.primaryButton} onClick={goToTown}>Back to Town</button>
              </div>
            </div>

            <div className={styles.contractGrid}>
              <aside className={styles.panel}>
                <h2>Filters</h2>
                <div className={styles.filters}>
                  {FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.filterButton} ${filter === item.id ? styles.active : ""}`}
                      onClick={() => {
                        setFilter(item.id);
                        setSelectedContractId(null);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </aside>

              <section className={styles.panel}>
                <h2>Contract List</h2>
                <div className={styles.contractList}>
                  {filteredContracts.map((contract) => (
                    <button
                      key={contract.contractId}
                      type="button"
                      className={`${styles.contractButton} ${selectedContract?.contractId === contract.contractId ? styles.active : ""}`}
                      onClick={() => {
                        setSelectedContractId(contract.contractId);
                        setSelectedCreatureId(null);
                      }}
                    >
                      <img src={getContractTierIcon(contract.tier)} alt="" />
                      <span>
                        <span className={styles.tier}>{contract.tier} contract</span>
                        <strong>{contract.title}</strong>
                        <span className={styles.status}>{getContractStatusLabel(contract)}</span>
                      </span>
                    </button>
                  ))}
                  {filteredContracts.length === 0 ? <p>No contracts match this filter.</p> : null}
                </div>
              </section>

              <aside className={styles.panel}>
                {selectedContract ? (
                  <div className={styles.detailBody}>
                    <div>
                      <span className={styles.tier}>{selectedContract.tier} contract</span>
                      <h2 className={styles.contractTitle}>{selectedContract.title}</h2>
                      <p>{selectedContract.description}</p>
                    </div>

                    <div className={styles.requirement}>
                      <span className={styles.smallLabel}>Requirement</span>
                      <strong>{selectedContract.requirement.label}</strong>
                      <p>Eligible creatures: {eligibleCreatures.length}</p>
                    </div>

                    <div className={styles.rewardBox}>
                      <span className={styles.smallLabel}>Rewards</span>
                      <div className={styles.rewardGrid}>
                        <div className={styles.reward}>
                          <img src={ICONS.gold} alt="" />
                          <div><span>Gold</span><strong>{selectedContract.goldReward}</strong></div>
                        </div>
                        <div className={styles.reward}>
                          <img src={ICONS.gp} alt="" />
                          <div><span>GP</span><strong>{selectedContract.guildPointReward}</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.actionRow}>
                      <button type="button" className={styles.primaryButton} disabled={!canAccept} onClick={handleAccept}>Accept</button>
                      <button type="button" className={styles.secondaryButton} disabled={!canDonate} onClick={handleDonate}>
                        <img src={ICONS.donate} alt="" style={{ width: 22, height: 22, verticalAlign: "middle", marginRight: 6 }} />
                        Donate Creature
                      </button>
                    </div>

                    {selectedContract.status === "completed" ? (
                      <div className={styles.warning}>Completed with {selectedContract.donatedCreatureName ?? "a donated creature"}. This contract cannot be completed again.</div>
                    ) : null}

                    <div>
                      <h2>Eligible Creatures</h2>
                      <div className={styles.creatureList}>
                        {eligibleCreatures.map((creature) => {
                          const variant = getVariantDefinition(creature.variantId);
                          const isActive = selectedCreature?.creatureId === creature.creatureId;

                          return (
                            <button
                              key={creature.creatureId}
                              type="button"
                              className={`${styles.creatureButton} ${isActive ? styles.active : ""}`}
                              onClick={() => setSelectedCreatureId(creature.creatureId)}
                              disabled={!doesCreatureMatchContract(creature, selectedContract)}
                            >
                              <img src={getCreatureImage(creature)} alt="" />
                              <span>
                                <strong>{creature.nickname}</strong>
                                <span className={styles.metaLabel}>{variant.name} • {variant.rarity}</span>
                              </span>
                            </button>
                          );
                        })}
                        {eligibleCreatures.length === 0 ? <p>No owned creatures match this contract.</p> : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>Select a contract to view details.</p>
                )}
              </aside>
            </div>
          </section>
        )}

        <footer className={styles.versionFooter}>{version}</footer>
      </section>
    </main>
  );
}
