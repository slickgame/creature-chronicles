"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { getVariantDefinition } from "@/data/creatures";
import { doesCreatureMatchContract, getEligibleCreaturesForContract } from "@/data/guild";
import { getGuildCreatureRecommendations } from "@/data/guildAmbitionRecommendations";
import {
  GUILD_REQUEST_BOARD_ASSETS,
  GUILD_REQUEST_BOARD_PAGE_SIZE,
  GUILD_REQUEST_BOARD_SLOTS,
  getGuildBoardPage,
  getGuildBoardPageCount,
  getGuildFlyerBadgeAsset,
  getGuildFlyerBadgeKind,
  getGuildFlyerBaseAsset,
  getGuildFlyerRotation,
} from "@/data/guildRequestBoardPresentation";
import {
  getGuildRequesterDefinition,
  getGuildRequesterTrustReward,
  getGuildRequesterTrustSummary,
  normalizeGuildContractRequester,
} from "@/data/guildRequesters";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GuildContract, GuildContractFilter } from "@/types/guild";
import type { GameSave } from "@/types/save";
import styles from "./GuildRequestBoard.module.css";

const FILTERS: Array<{ id: GuildContractFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "donation", label: "Donations" },
  { id: "service", label: "Service" },
  { id: "registry", label: "Registry" },
  { id: "lineage", label: "Lineage" },
  { id: "restoration", label: "Restoration" },
  { id: "security", label: "Security" },
  { id: "bronze", label: "Bronze" },
  { id: "silver", label: "Silver" },
  { id: "gold", label: "Gold" },
  { id: "accepted", label: "Accepted" },
  { id: "completed", label: "Completed" },
];

function contractMatchesFilter(contract: GuildContract, filter: GuildContractFilter): boolean {
  if (filter === "all") return contract.status !== "expired";
  if (filter === "accepted") return contract.status === "accepted";
  if (filter === "completed") return contract.status === "completed";
  if (filter === "donation") return contract.type === "donate_creature" && contract.status !== "expired";
  if (filter === "service") return (contract.type === "service_creature" || contract.category === "service") && contract.status !== "expired";
  if (filter === "bronze" || filter === "silver" || filter === "gold") return contract.tier === filter && contract.status !== "expired";
  return contract.category === filter && contract.status !== "expired";
}

function getStatusLabel(contract: GuildContract): string {
  if (contract.status === "accepted") return "Accepted";
  if (contract.status === "completed") return "Completed";
  if (contract.status === "expired") return "Expired";
  return "Available";
}

function getTypeLabel(contract: GuildContract): string {
  return contract.type === "service_creature" ? "Service" : "Donation";
}

function getCategoryLabel(contract: GuildContract): string {
  const labels = {
    general: "Guild",
    service: "Service",
    registry: "Registry",
    lineage: "Lineage",
    restoration: "Restoration",
    security: "Security",
  } as const;
  return labels[contract.category] ?? "Guild";
}

function getCreatureImage(creature: CreatureRecord): string {
  return getVariantDefinition(creature.variantId).portraitPath;
}

function getServiceTiming(contract: GuildContract): string | null {
  if (contract.type !== "service_creature") return null;
  const duration = contract.serviceDurationDays ?? (contract.tier === "gold" ? 3 : contract.tier === "silver" ? 2 : 1);
  if (contract.serviceReturnDayNumber) return `${duration} day${duration === 1 ? "" : "s"} · returns Ranch Day ${contract.serviceReturnDayNumber}`;
  return `${duration} Ranch Day${duration === 1 ? "" : "s"} away`;
}

export function GuildAmbitionAdvisor({ save }: { save: GameSave }) {
  const { acceptGuildRequest, currentSave, donateCreatureToGuild } = useGameContext();
  const sourceSave = currentSave ?? save;
  const [boardHost, setBoardHost] = useState<HTMLElement | null>(null);
  const [filter, setFilter] = useState<GuildContractFilter>("all");
  const [page, setPage] = useState(0);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const findBoard = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setBoardHost(document.querySelector<HTMLElement>('[data-contract-board="list"]'));
      });
    };
    findBoard();
    const observer = new MutationObserver(findBoard);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!boardHost) return;
    boardHost.dataset.requestBoardEnhanced = "true";
    return () => {
      delete boardHost.dataset.requestBoardEnhanced;
    };
  }, [boardHost]);

  const contracts = useMemo(
    () => (sourceSave.guild?.contracts ?? []).map(normalizeGuildContractRequester),
    [sourceSave],
  );
  const filteredContracts = useMemo(
    () => contracts.filter((contract) => contractMatchesFilter(contract, filter)),
    [contracts, filter],
  );
  const pageCount = getGuildBoardPageCount(filteredContracts.length);
  const pageContracts = useMemo(() => getGuildBoardPage(filteredContracts, page), [filteredContracts, page]);
  const selectedContract = useMemo(
    () => selectedContractId ? contracts.find((contract) => String(contract.contractId) === selectedContractId) ?? null : null,
    [contracts, selectedContractId],
  );
  const eligibleCreatures = useMemo(
    () => selectedContract ? getEligibleCreaturesForContract(sourceSave, selectedContract.contractId) : [],
    [sourceSave, selectedContract],
  );
  const recommendation = useMemo(
    () => selectedContract ? getGuildCreatureRecommendations(sourceSave, selectedContract, 1)[0] ?? null : null,
    [sourceSave, selectedContract],
  );

  useEffect(() => {
    if (page >= pageCount) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  useEffect(() => {
    if (selectedCreatureId && !eligibleCreatures.some((creature) => creature.creatureId === selectedCreatureId)) {
      setSelectedCreatureId(null);
    }
  }, [eligibleCreatures, selectedCreatureId]);

  if (!boardHost) return null;

  const selectedCreature = eligibleCreatures.find((creature) => creature.creatureId === selectedCreatureId) ?? null;
  const requesterDefinition = selectedContract ? getGuildRequesterDefinition(selectedContract) : null;
  const trustSummary = selectedContract ? getGuildRequesterTrustSummary(sourceSave, selectedContract) : null;
  const trustReward = selectedContract ? getGuildRequesterTrustReward(selectedContract) : 0;
  const serviceTiming = selectedContract ? getServiceTiming(selectedContract) : null;
  const canAccept = selectedContract?.status === "available";
  const canSubmit = Boolean(selectedContract?.status === "accepted" && selectedCreatureId);

  function openContract(contract: GuildContract) {
    setSelectedContractId(String(contract.contractId));
    setSelectedCreatureId(null);
    setMessage(null);
  }

  function closeContract() {
    setSelectedContractId(null);
    setSelectedCreatureId(null);
    setMessage(null);
  }

  function handleAccept() {
    if (!selectedContract) return;
    setMessage(acceptGuildRequest(selectedContract.contractId));
  }

  function handleSubmit() {
    if (!selectedContract || !selectedCreatureId) return;
    setMessage(donateCreatureToGuild(selectedContract.contractId, selectedCreatureId));
  }

  return createPortal(
    <section
      className={styles.boardShell}
      aria-label="Guild Request Board; Recommended Assignments appear inside each request detail sheet"
      data-guild-ambition-advisor="true"
      data-guild-request-board="flyers"
    >
      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Request Board filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.filterButton} ${filter === item.id ? styles.filterButtonActive : ""}`}
              aria-pressed={filter === item.id}
              onClick={() => {
                setFilter(item.id);
                setPage(0);
                closeContract();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={styles.boardMeta}>
          <span>{filteredContracts.length} posted</span>
          {pageCount > 1 ? (
            <>
              <button type="button" className={styles.pageButton} disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>‹</button>
              <span>{page + 1} / {pageCount}</span>
              <button type="button" className={styles.pageButton} disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>›</button>
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.boardViewport}>
        <div className={styles.boardArt} data-request-board-art="true">
          <img className={styles.boardBackground} src={GUILD_REQUEST_BOARD_ASSETS.board} alt="Empty Guild request board" />
          {pageContracts.map((contract, slotIndex) => {
            const slot = GUILD_REQUEST_BOARD_SLOTS[slotIndex];
            const rotation = getGuildFlyerRotation(String(contract.contractId), slotIndex);
            const flyerStyle = {
              "--flyer-left": `${slot.leftPercent}%`,
              "--flyer-top": `${slot.topPercent}%`,
              "--flyer-width": `${slot.widthPercent}%`,
              "--flyer-rotation": `${rotation}deg`,
            } as CSSProperties;
            const statusClass = contract.status === "accepted" ? styles.statusAccepted : styles.statusCompleted;
            return (
              <button
                key={String(contract.contractId)}
                type="button"
                className={styles.flyer}
                style={flyerStyle}
                onClick={() => openContract(contract)}
                aria-label={`Open ${contract.title}, ${contract.tier} ${getCategoryLabel(contract)} request from ${contract.requesterName}`}
                data-request-flyer="true"
                data-request-tier={contract.tier}
                data-request-badge={getGuildFlyerBadgeKind(contract)}
                data-request-status={contract.status}
              >
                <img className={styles.flyerBase} src={getGuildFlyerBaseAsset(contract.tier)} alt="" />
                <span className={styles.flyerPin} aria-hidden="true" />
                <img className={styles.badge} src={getGuildFlyerBadgeAsset(contract)} alt="" />
                <span className={styles.flyerCopy}>
                  <span className={styles.flyerTier}>{contract.tier} · {getCategoryLabel(contract)}</span>
                  <strong className={styles.flyerTitle}>{contract.title}</strong>
                  <span className={styles.flyerRequester}>{contract.requesterName}</span>
                  <span className={styles.flyerReward}>
                    <span>{contract.goldReward} Gold</span>
                    <span>{contract.guildPointReward} GP</span>
                    {contract.type === "service_creature" ? <span>{contract.serviceDurationDays ?? 1}d away</span> : null}
                  </span>
                </span>
                {contract.status === "accepted" || contract.status === "completed" ? (
                  <span className={`${styles.statusStamp} ${statusClass}`}>{getStatusLabel(contract)}</span>
                ) : null}
              </button>
            );
          })}
          {pageContracts.length === 0 ? <div className={styles.emptyBoard}>No posted requests match this filter.</div> : null}
        </div>
      </div>

      {selectedContract ? (
        <div className={styles.modalBackdrop} data-contract-detail-popup="flyer" onClick={closeContract}>
          <section
            className={styles.detailSheet}
            data-contract-detail-modal="flyer"
            data-detail-tier={selectedContract.tier}
            data-detail-status={selectedContract.status}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className={styles.closeButton} onClick={closeContract} aria-label="Close request details">×</button>
            {selectedContract.status === "accepted" || selectedContract.status === "completed" ? (
              <span className={`${styles.detailStatusStamp} ${selectedContract.status === "accepted" ? styles.statusAccepted : styles.statusCompleted}`} aria-hidden="true">
                {getStatusLabel(selectedContract)}
              </span>
            ) : null}
            <div className={styles.detailMain}>
              <header className={styles.detailHeader}>
                <div className={styles.detailEmblem}>
                  <img className={styles.detailBadge} src={getGuildFlyerBadgeAsset(selectedContract)} alt="" />
                  <span className={styles.tierSeal}>{selectedContract.tier}</span>
                </div>
                <div>
                  <p className={styles.detailKicker}>{selectedContract.tier} · {getCategoryLabel(selectedContract)} · {getTypeLabel(selectedContract)}</p>
                  <h2 className={styles.detailTitle}>{selectedContract.title}</h2>
                </div>
              </header>
              <p className={styles.description}>{selectedContract.description}</p>
              {requesterDefinition ? (
                <div
                  className={styles.requesterCard}
                  data-requester-trust-card="true"
                  data-guild-requester-trust="true"
                >
                  <img className={styles.requesterPortrait} src={requesterDefinition.portraitPath} alt={`${requesterDefinition.name} portrait`} />
                  <div className={styles.requesterIdentity}>
                    <small>Posted by</small>
                    <strong>{requesterDefinition.name}</strong>
                    <span className={styles.requesterRole}>{requesterDefinition.title}</span>
                    <small>{trustSummary} · Completion +{trustReward} Trust</small>
                  </div>
                </div>
              ) : null}
              <div className={styles.infoGrid}>
                <div><span>Status</span><strong>{getStatusLabel(selectedContract)}</strong></div>
                <div><span>Requirement</span><strong>{selectedContract.requirement.label}</strong></div>
                <div><span>Rewards</span><strong>{selectedContract.goldReward} Gold · {selectedContract.guildPointReward} GP</strong></div>
                <div><span>{selectedContract.type === "service_creature" ? "Service" : "Placement"}</span><strong>{serviceTiming ?? "Permanent donation"}</strong></div>
                {selectedContract.type === "service_creature" ? <div><span>Energy / XP</span><strong>{selectedContract.serviceEnergyCost ?? 0} Energy · +{selectedContract.serviceXpReward ?? 0} XP</strong></div> : null}
                <div><span>Eligible</span><strong>{eligibleCreatures.length} creature{eligibleCreatures.length === 1 ? "" : "s"}</strong></div>
              </div>
              {requesterDefinition ? (
                <div className={styles.signatureBlock} data-request-signature="true">
                  <span>Posted under Guild seal</span>
                  <strong>— {requesterDefinition.name}</strong>
                </div>
              ) : null}
              {selectedContract.type === "donate_creature" ? <p className={styles.warning}>Donation permanently places the selected creature with {selectedContract.requesterName}. The creature leaves your ranch.</p> : null}
              {selectedContract.status === "completed" ? <div className={styles.messageCard}>Completed with {selectedContract.submittedCreatureName ?? selectedContract.donatedCreatureName ?? "a submitted creature"}. This request cannot be completed again.</div> : null}
              {message ? <div className={styles.messageCard}>{message}</div> : null}
            </div>

            <aside className={styles.detailSide}>
              <div className={styles.recommendationCard} data-guild-recommendations="true">
                <small>Recommended Creature</small>
                {recommendation ? (
                  <button type="button" className={styles.recommendationButton} onClick={() => setSelectedCreatureId(recommendation.creature.creatureId)}>
                    <img src={getCreatureImage(recommendation.creature)} alt="" />
                    <span>
                      <strong>{recommendation.creature.nickname}</strong>
                      <small>{recommendation.ambitionName} · {recommendation.ambitionPercent}% complete</small>
                      <small>{recommendation.reasons.slice(0, 2).join(" • ")}</small>
                    </span>
                    <strong>{recommendation.score}</strong>
                  </button>
                ) : <p>No current ranch creature satisfies this request.</p>}
              </div>

              <div className={styles.creatureSection}>
                <h3>{selectedContract.status === "available" ? "Eligible after accepting" : "Eligible Creatures"}</h3>
                <div className={styles.creatureGrid}>
                  {eligibleCreatures.map((creature) => {
                    const variant = getVariantDefinition(creature.variantId);
                    const selected = selectedCreature?.creatureId === creature.creatureId;
                    return (
                      <button
                        key={creature.creatureId}
                        type="button"
                        className={`${styles.creatureButton} ${selected ? styles.creatureButtonSelected : ""}`}
                        onClick={() => setSelectedCreatureId(creature.creatureId)}
                        disabled={!doesCreatureMatchContract(creature, selectedContract)}
                      >
                        <img src={getCreatureImage(creature)} alt="" />
                        <span>
                          <strong>{creature.nickname}</strong>
                          <small>Lv {creature.level} · {variant.name} · {variant.rarity}</small>
                        </span>
                      </button>
                    );
                  })}
                  {eligibleCreatures.length === 0 ? <p>No owned creature currently qualifies.</p> : null}
                </div>
              </div>

              <div className={styles.actionStack}>
                <button type="button" className={styles.detailButton} disabled={!canAccept} onClick={handleAccept}>
                  {selectedContract.status === "available" ? "Accept Request" : selectedContract.status === "accepted" ? "Request Accepted" : "Request Completed"}
                </button>
                {selectedContract.status === "accepted" ? (
                  <button type="button" className={styles.detailButton} disabled={!canSubmit} onClick={handleSubmit}>
                    {selectedContract.type === "service_creature" ? "Send Selected Creature" : "Donate Selected Creature"}
                  </button>
                ) : null}
                <button type="button" className={styles.secondaryButton} onClick={closeContract}>Close</button>
              </div>
            </aside>
          </section>
        </div>
      ) : null}
    </section>,
    boardHost,
  );
}

// Kept as an explicit export for source-level QA and future board capacity upgrades.
export const REQUEST_BOARD_VISIBLE_FLYERS = GUILD_REQUEST_BOARD_PAGE_SIZE;