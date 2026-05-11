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

function getParticipantImage(participant: BreedingParticipant): string {
  return participant.portraitPath || CREATURE_PLACEHOLDER_IMAGE;
}

export function BreedingScreen() {
  const { attemptBreeding, currentSave, goToRanch } = useGameContext();
  const [giverId, setGiverId] = useState<string | null>(PLAYER_PARTICIPANT_ID);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [result, setResult] = useState<BreedingAttemptRecord | null>(null);
  const [message, setMessage] = useState("Choose a giver and receiver to preview the breeding attempt.");

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
              Pregnancy and eggs are created in M5.
            </p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.resourceCard}>
              <span>Hearts</span>
              <strong>
                {currentSave.breeding?.hearts ?? 0} / {currentSave.breeding?.maxHearts ?? 0}
              </strong>
            </div>
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
          />

          <section className={styles.previewPanel} aria-label="Breeding pair preview">
            <h2>Pair Preview</h2>
            <p className={styles.helpText}>{message}</p>

            <div className={styles.pairCards}>
              <MiniParticipantCard title="Giver" participant={giver} />
              <MiniParticipantCard title="Receiver" participant={receiver} />
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
                <em>Restored by sleeping.</em>
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
          />
        </section>
      </section>
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
}: {
  title: string;
  role: "giver" | "receiver";
  selectedId: string | null;
  disabledId: string | null;
  participants: BreedingParticipant[];
  onSelect: (role: "giver" | "receiver", participantId: string) => void;
}) {
  return (
    <aside className={styles.participantColumn}>
      <h2>{title}</h2>
      <div className={styles.participantList}>
        {participants.map((participant) => {
          const isSelected = selectedId === participant.participantId;
          const isDisabled = disabledId === participant.participantId;

          return (
            <button
              key={`${role}-${participant.participantId}`}
              type="button"
              className={`${styles.participantCard} ${isSelected ? styles.selectedCard : ""}`}
              disabled={isDisabled}
              onClick={() => onSelect(role, participant.participantId)}
            >
              <img
                src={getParticipantImage(participant)}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                }}
              />
              <div>
                <strong>{participant.displayName}</strong>
                <span>{participant.familyLabel}</span>
                <em>
                  Energy {formatEnergy(participant.energy, participant.maxEnergy)} • Affection {participant.affection}
                </em>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function MiniParticipantCard({ title, participant }: { title: string; participant: BreedingParticipant | null }) {
  return (
    <article className={styles.miniCard}>
      <span>{title}</span>
      {participant ? (
        <>
          <img
            src={getParticipantImage(participant)}
            alt=""
            onError={(event) => {
              event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
            }}
          />
          <strong>{participant.displayName}</strong>
          <em>{participant.familyLabel}</em>
        </>
      ) : (
        <p>Not selected</p>
      )}
    </article>
  );
}
