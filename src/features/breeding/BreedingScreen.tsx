"use client";

import { useMemo, useState } from "react";
import {
  getBreedingParticipants,
  getBreedingPreview,
  PLAYER_PARTICIPANT_ID,
} from "@/data/breeding";
import { CREATURE_PLACEHOLDER_IMAGE } from "@/data/creatures";
import { formatEnergy } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { BreedingAttemptRecord, BreedingParticipant } from "@/types/breeding";
import styles from "./BreedingScreen.module.css";

const STAT_LABELS = {
  STR: "Strength",
  DEX: "Dexterity",
  STA: "Stamina",
  CHA: "Charm",
  WIL: "Willpower",
  FER: "Fertility",
} as const;

function getParticipantPortrait(participant: BreedingParticipant): string {
  return participant.portraitPath || CREATURE_PLACEHOLDER_IMAGE;
}

function getParticipantProfile(participant: BreedingParticipant): string {
  return participant.profilePath || participant.portraitPath || CREATURE_PLACEHOLDER_IMAGE;
}

export function BreedingScreen() {
  const { attemptBreeding, currentSave, goToRanch } = useGameContext();
  const [giverId, setGiverId] = useState<string | null>(PLAYER_PARTICIPANT_ID);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [result, setResult] = useState<BreedingAttemptRecord | null>(null);
  const [message, setMessage] = useState("Choose a giver and receiver to preview the breeding attempt.");
  const [activeInfoParticipant, setActiveInfoParticipant] = useState<BreedingParticipant | null>(null);

  const participants = useMemo(() => {
    if (!currentSave) {
      return [];
    }

    return getBreedingParticipants(currentSave);
  }, [currentSave]);

  const preview = useMemo(() => {
    if (!currentSave) {
      return null;
    }

    return getBreedingPreview(currentSave, giverId, receiverId);
  }, [currentSave, giverId, receiverId]);

  const giver = participants.find((item) => item.participantId === giverId) ?? null;
  const receiver = participants.find((item) => item.participantId === receiverId) ?? null;

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before using the Breeding Pen.</p>
          <button type="button" onClick={goToRanch}>
            Back to Ranch
          </button>
        </section>
      </main>
    );
  }

  function selectParticipant(role: "giver" | "receiver", participantId: string) {
    setResult(null);

    if (role === "giver") {
      setGiverId(participantId);
      if (participantId === receiverId) {
        setReceiverId(null);
      }
      setMessage("Giver selected. Choose a receiver to preview the pairing.");
      return;
    }

    setReceiverId(participantId);
    if (participantId === giverId) {
      setGiverId(null);
    }
    setMessage("Receiver selected. Review the pair preview before attempting breeding.");
  }

  function handleAttempt() {
    if (!giverId || !receiverId || !preview?.canAttempt) {
      setMessage(preview?.blockedReason ?? "Select a valid giver and receiver first.");
      return;
    }

    const attempt = attemptBreeding(giverId, receiverId);

    if (!attempt) {
      setMessage("Breeding attempt could not be completed.");
      return;
    }

    setResult(attempt);
    setMessage(attempt.resultText);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>M4 Breeding Core</p>
            <h1>Breeding Pen</h1>
            <p>
              Pick a giver and receiver, preview costs and odds, then run a placeholder attempt.
              Each participant has separate Hearts. Pregnancy and eggs are created in M5.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button type="button" onClick={goToRanch}>
              Back to Ranch
            </button>
          </div>
        </header>

        <section className={styles.contentGrid}>
          <ParticipantColumn
            title="Giver"
            role="giver"
            selectedId={giverId}
            participants={participants}
            disabledId={receiverId}
            onSelect={selectParticipant}
            onInfo={setActiveInfoParticipant}
          />

          <section className={styles.previewPanel} aria-label="Breeding pair preview">
            <h2>Pair Preview</h2>
            <p className={styles.helpText}>{message}</p>

            <div className={styles.pairCards}>
              <MiniParticipantCard title="Giver" participant={giver} onInfo={setActiveInfoParticipant} />
              <MiniParticipantCard title="Receiver" participant={receiver} onInfo={setActiveInfoParticipant} />
            </div>

            <div className={styles.formulaGrid}>
              <div>
                <span>Pregnancy Chance</span>
                <strong>{preview ? `${preview.pregnancyChance}%` : "—"}</strong>
                <em>
                  Base {preview?.baseChance ?? "—"}% + Streak {preview?.streakBonus ?? "—"}%
                </em>
              </div>
              <div>
                <span>Pair Streak</span>
                <strong>{preview?.streakCount ?? "—"}</strong>
                <em>Same pair increases odds.</em>
              </div>
              <div>
                <span>Energy Cost</span>
                <strong>{preview?.energyCost ?? "—"}</strong>
                <em>Paid by both participants.</em>
              </div>
              <div>
                <span>Heart Cost</span>
                <strong>{preview?.heartCost ?? "—"}</strong>
                <em>Paid by each participant.</em>
              </div>
              <div>
                <span>XP Gain</span>
                <strong>{preview?.xpGain ?? "—"}</strong>
                <em>Creatures gain XP on attempt.</em>
              </div>
              <div>
                <span>Status</span>
                <strong>{preview?.canAttempt ? "Ready" : "Blocked"}</strong>
                <em>{preview?.blockedReason ?? "Valid pair selected."}</em>
              </div>
            </div>

            <button
              type="button"
              className={styles.primaryAction}
              disabled={!preview?.canAttempt}
              onClick={handleAttempt}
            >
              Attempt Breeding
            </button>

            {result ? (
              <section className={styles.resultPanel}>
                <p className={styles.kicker}>Result Scene Placeholder</p>
                <h3>{result.outcome === "pregnancy" ? "Pregnancy Signs" : "No Pregnancy"}</h3>
                <p>{result.resultText}</p>
                <dl>
                  <div>
                    <dt>Chance</dt>
                    <dd>{result.pregnancyChance}%</dd>
                  </div>
                  <div>
                    <dt>Streak</dt>
                    <dd>
                      {result.streakBefore} → {result.streakAfter}
                    </dd>
                  </div>
                  <div>
                    <dt>XP</dt>
                    <dd>+{result.xpGain}</dd>
                  </div>
                </dl>
              </section>
            ) : null}
          </section>

          <ParticipantColumn
            title="Receiver"
            role="receiver"
            selectedId={receiverId}
            participants={participants}
            disabledId={giverId}
            onSelect={selectParticipant}
            onInfo={setActiveInfoParticipant}
          />
        </section>
      </section>

      {activeInfoParticipant ? (
        <ParticipantInfoModal
          participant={activeInfoParticipant}
          onClose={() => setActiveInfoParticipant(null)}
        />
      ) : null}
    </main>
  );
}

function ParticipantColumn({
  title,
  role,
  selectedId,
  participants,
  disabledId,
  onSelect,
  onInfo,
}: {
  title: string;
  role: "giver" | "receiver";
  selectedId: string | null;
  disabledId: string | null;
  participants: BreedingParticipant[];
  onSelect: (role: "giver" | "receiver", participantId: string) => void;
  onInfo: (participant: BreedingParticipant) => void;
}) {
  return (
    <aside className={styles.participantColumn}>
      <h2>{title}</h2>
      <div className={styles.participantList}>
        {participants.map((participant) => {
          const isSelected = selectedId === participant.participantId;
          const isDisabled = disabledId === participant.participantId;

          return (
            <article
              key={`${role}-${participant.participantId}`}
              className={`${styles.participantCard} ${isSelected ? styles.selectedCard : ""} ${isDisabled ? styles.disabledCard : ""}`}
            >
              <button
                type="button"
                className={styles.participantSelectButton}
                disabled={isDisabled}
                onClick={() => onSelect(role, participant.participantId)}
              >
                <img
                  src={getParticipantPortrait(participant)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                  }}
                />
                <div>
                  <strong>{participant.displayName}</strong>
                  <span>{participant.familyLabel}</span>
                  <em>
                    Energy {formatEnergy(participant.energy, participant.maxEnergy)} • Hearts {participant.hearts}/{participant.maxHearts}
                  </em>
                </div>
              </button>
              <button
                type="button"
                className={styles.infoButton}
                onClick={() => onInfo(participant)}
                aria-label={`View ${participant.displayName} details`}
              >
                i
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

function MiniParticipantCard({
  title,
  participant,
  onInfo,
}: {
  title: string;
  participant: BreedingParticipant | null;
  onInfo: (participant: BreedingParticipant) => void;
}) {
  return (
    <article className={styles.miniCard}>
      <span>{title}</span>
      {participant ? (
        <>
          <button
            type="button"
            className={styles.previewInfoButton}
            onClick={() => onInfo(participant)}
            aria-label={`View ${participant.displayName} details`}
          >
            i
          </button>
          <img
            src={getParticipantProfile(participant)}
            alt=""
            className={styles.previewProfileArt}
            onError={(event) => {
              event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
            }}
          />
          <strong>{participant.displayName}</strong>
          <em>
            {participant.familyLabel} • Hearts {participant.hearts}/{participant.maxHearts}
          </em>
        </>
      ) : (
        <p>Not selected</p>
      )}
    </article>
  );
}

function ParticipantInfoModal({
  participant,
  onClose,
}: {
  participant: BreedingParticipant;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.infoModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="participant-info-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeModalButton}
          onClick={onClose}
          aria-label="Close participant details"
        >
          ×
        </button>

        <div className={styles.infoModalGrid}>
          <div className={styles.infoModalArtWrap}>
            <img
              src={getParticipantProfile(participant)}
              alt=""
              onError={(event) => {
                event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
              }}
            />
          </div>

          <div className={styles.infoModalDetails}>
            <p className={styles.kicker}>{participant.kind === "player" ? "Player" : "Creature"}</p>
            <h2 id="participant-info-title">{participant.displayName}</h2>
            <p className={styles.modalSubtitle}>{participant.familyLabel}</p>
            <p>{participant.description ?? "No profile description available yet."}</p>

            <div className={styles.modalResourceGrid}>
              <div>
                <span>Energy</span>
                <strong>{formatEnergy(participant.energy, participant.maxEnergy)}</strong>
              </div>
              <div>
                <span>Hearts</span>
                <strong>{participant.hearts} / {participant.maxHearts}</strong>
              </div>
              <div>
                <span>Affection</span>
                <strong>{participant.affection}</strong>
              </div>
              <div>
                <span>Level</span>
                <strong>{participant.level ?? "—"}</strong>
              </div>
              <div>
                <span>XP</span>
                <strong>{participant.xp ?? "—"}</strong>
              </div>
            </div>

            {participant.stats ? (
              <div className={styles.modalStatGrid}>
                {Object.entries(participant.stats).map(([statKey, value]) => (
                  <div key={statKey}>
                    <span>{STAT_LABELS[statKey as keyof typeof STAT_LABELS]}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {participant.abilities?.length ? (
              <section className={styles.modalAbilityPanel}>
                <h3>Abilities</h3>
                {participant.abilities.map((ability) => (
                  <article key={ability.id}>
                    <strong>{ability.name}</strong>
                    <span>Grade {ability.grade} • {ability.source}</span>
                    <p>{ability.description}</p>
                  </article>
                ))}
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
