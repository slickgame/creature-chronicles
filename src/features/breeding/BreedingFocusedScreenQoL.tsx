"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getBreedingParticipants,
  getBreedingPreview,
  PLAYER_PARTICIPANT_ID,
} from "@/data/breeding";
import {
  BREEDING_OUTCOME_FAILURE_FALLBACK_PATH,
  BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH,
  BREEDING_SCENE_FALLBACK_PATH,
  getBreedingSceneImagePath,
} from "@/data/breedingSceneImages";
import { CREATURE_PLACEHOLDER_IMAGE } from "@/data/creatures";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { formatEnergy } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type {
  BreedingAttemptRecord,
  BreedingParticipant,
  BreedingPreview,
} from "@/types/breeding";
import type { CreatureRecord } from "@/types/creature";
import styles from "./BreedingFocusedScreenQoL.module.css";
import scenic from "./BreedingScenic.module.css";
import ui from "@/features/ui/InteriorShell.module.css";
import { GameDialog } from "@/features/ui/GameDialog";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import { RanchIcon } from "@/features/ui/RanchIcon";

type SelectorRole = "giver" | "receiver";
type SortMode = "name" | "level" | "energy" | "affection" | "fertility";
type FilterMode =
  | "all"
  | "available"
  | "nonPregnant"
  | "creatures"
  | "player"
  | "feline"
  | "canine"
  | "bovine"
  | "lapine"
  | "equine";
type ResultPage = "process" | "outcome";
type SceneMode = "full" | "quick";

type PairMemory = {
  giverId: string | null;
  receiverId: string | null;
};

type ResourceWarning = {
  participantName: string;
  resource: "Hearts" | "Energy";
  before: number;
  cost: number;
  after: number;
  consequence: string;
};

const HANDOFF_KEY = "creature_chronicles_breeding_focus";
const SCENE_MODE_KEY = "creature_chronicles_breeding_scene_mode";

function pairMemoryKey(saveId: string): string {
  return `creature_chronicles_breeding_pair_${saveId}`;
}

function getParticipantImage(participant: BreedingParticipant | null): string {
  return participant?.profilePath || participant?.portraitPath || CREATURE_PLACEHOLDER_IMAGE;
}

function participantStatus(participant: BreedingParticipant | null): string {
  if (!participant) return "Choose participant";
  if (participant.isInjured) return participant.unavailableReason ?? "Injured";
  if (participant.isPregnant) {
    return `Pregnant${participant.pregnancyDaysRemaining ? ` · ${participant.pregnancyDaysRemaining}d` : ""}`;
  }
  if (!participant.canBreed) return participant.unavailableReason ?? "Unavailable";
  return "Ready";
}

function sortParticipants(
  participants: BreedingParticipant[],
  sortMode: SortMode,
): BreedingParticipant[] {
  return [...participants].sort((a, b) => {
    if (a.participantId === PLAYER_PARTICIPANT_ID) return -1;
    if (b.participantId === PLAYER_PARTICIPANT_ID) return 1;
    if (sortMode === "level") return (b.level ?? 0) - (a.level ?? 0) || a.displayName.localeCompare(b.displayName);
    if (sortMode === "energy") return b.energy / Math.max(1, b.maxEnergy) - a.energy / Math.max(1, a.maxEnergy) || a.displayName.localeCompare(b.displayName);
    if (sortMode === "affection") return b.affection - a.affection || a.displayName.localeCompare(b.displayName);
    if (sortMode === "fertility") return (b.stats?.FER ?? 0) - (a.stats?.FER ?? 0) || a.displayName.localeCompare(b.displayName);
    return a.displayName.localeCompare(b.displayName);
  });
}

function filterParticipants(
  participants: BreedingParticipant[],
  filterMode: FilterMode,
): BreedingParticipant[] {
  return participants.filter((participant) => {
    if (filterMode === "available") return participant.canBreed;
    if (filterMode === "nonPregnant") return !participant.isPregnant;
    if (filterMode === "player") return participant.kind === "player";
    if (filterMode === "creatures") return participant.kind !== "player";
    if (!["all", "available", "nonPregnant", "creatures", "player"].includes(filterMode)) {
      return participant.familyLabel.toLowerCase().includes(filterMode);
    }
    return true;
  });
}

function getBlockedReasons(
  giver: BreedingParticipant | null,
  receiver: BreedingParticipant | null,
  preview: BreedingPreview | null,
): string[] {
  const reasons: string[] = [];
  if (!giver) reasons.push("Choose a giver.");
  if (!receiver) reasons.push("Choose a receiver.");
  if (!giver || !receiver) return reasons;
  if (giver.participantId === receiver.participantId) reasons.push("The giver and receiver must be different participants.");
  if (!giver.roleTags.includes("giver")) reasons.push(`${giver.displayName} cannot use the giver role.`);
  if (!receiver.roleTags.includes("receiver")) reasons.push(`${receiver.displayName} cannot use the receiver role.`);
  if (giver.unavailableReason) reasons.push(`Giver — ${giver.displayName}: ${giver.unavailableReason}.`);
  if (receiver.unavailableReason) reasons.push(`Receiver — ${receiver.displayName}: ${receiver.unavailableReason}.`);
  if (preview) {
    if (giver.energy < preview.energyCost) reasons.push(`Giver — ${giver.displayName}: needs ${preview.energyCost} Energy; currently has ${giver.energy}.`);
    if (receiver.energy < preview.energyCost) reasons.push(`Receiver — ${receiver.displayName}: needs ${preview.energyCost} Energy; currently has ${receiver.energy}.`);
    if (giver.hearts < preview.heartCost) reasons.push(`Giver — ${giver.displayName}: needs ${preview.heartCost} Heart${preview.heartCost === 1 ? "" : "s"}; currently has ${giver.hearts}.`);
    if (receiver.hearts < preview.heartCost) reasons.push(`Receiver — ${receiver.displayName}: needs ${preview.heartCost} Heart${preview.heartCost === 1 ? "" : "s"}; currently has ${receiver.hearts}.`);
    if (preview.blockedReason && !reasons.some((reason) => reason.includes(preview.blockedReason ?? ""))) {
      reasons.push(preview.blockedReason);
    }
  }
  return Array.from(new Set(reasons));
}

function getWarnings(
  giver: BreedingParticipant,
  receiver: BreedingParticipant,
  preview: BreedingPreview,
): ResourceWarning[] {
  const warnings: ResourceWarning[] = [];
  for (const participant of [giver, receiver]) {
    const heartsAfter = Math.max(0, participant.hearts - preview.heartCost);
    if (heartsAfter === 0) {
      warnings.push({
        participantName: participant.displayName,
        resource: "Hearts",
        before: participant.hearts,
        cost: preview.heartCost,
        after: heartsAfter,
        consequence: `${participant.displayName} will be unable to breed again until Hearts are restored.`,
      });
    }
    const energyAfter = Math.max(0, participant.energy - preview.energyCost);
    const lowAfter = energyAfter / Math.max(1, participant.maxEnergy) <= 0.25;
    const spendsMost = preview.energyCost >= Math.ceil(participant.energy / 2);
    if (lowAfter || spendsMost) {
      warnings.push({
        participantName: participant.displayName,
        resource: "Energy",
        before: participant.energy,
        cost: preview.energyCost,
        after: energyAfter,
        consequence: lowAfter
          ? `${participant.displayName} will be Exhausted or nearly exhausted after this attempt.`
          : `This attempt will spend at least half of ${participant.displayName}'s current Energy.`,
      });
    }
  }
  return warnings;
}

function getChanceRows(
  giver: BreedingParticipant | null,
  receiver: BreedingParticipant | null,
  preview: BreedingPreview | null,
) {
  if (!giver || !receiver || !preview) return [];
  const fertilityBonus = Math.floor(((giver.stats?.FER ?? 5) + (receiver.stats?.FER ?? 5)) / 3);
  const charmBonus = Math.floor(((giver.stats?.CHA ?? 5) + (receiver.stats?.CHA ?? 5)) / 6);
  const raw = preview.baseChance + preview.streakBonus + preview.affectionBonus + fertilityBonus + charmBonus + preview.abilityBonus;
  const capped = Math.min(90, raw);
  return [
    ["Base chance", preview.baseChance],
    ["Pair familiarity", preview.streakBonus],
    ["Affection", preview.affectionBonus],
    ["Combined Fertility", fertilityBonus],
    ["Combined Charm", charmBonus],
    ["Talents, facility & daily effects", preview.abilityBonus],
    ...(raw > capped ? [["90% chance cap", capped - raw] as [string, number]] : []),
  ] as Array<[string, number]>;
}

function preload(path: string) {
  if (!path || typeof window === "undefined") return;
  const image = new Image();
  image.src = path;
}

export function BreedingFocusedScreen() {
  const {
    attemptBreeding,
    currentSave,
    goToNursery,
    goToRanch,
  } = useGameContext();
  const [giverId, setGiverId] = useState<string | null>(PLAYER_PARTICIPANT_ID);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [selectorRole, setSelectorRole] = useState<SelectorRole | null>(null);
  const [infoParticipant, setInfoParticipant] = useState<BreedingParticipant | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [result, setResult] = useState<BreedingAttemptRecord | null>(null);
  const [message, setMessage] = useState("Choose a giver and receiver, then review the chance and resource costs.");
  const [isAttempting, setIsAttempting] = useState(false);
  const [warningItems, setWarningItems] = useState<ResourceWarning[]>([]);
  const [showChanceBreakdown, setShowChanceBreakdown] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [sceneMode, setSceneMode] = useState<SceneMode>("full");
  const restoredSaveRef = useRef<string | null>(null);
  const attemptLockRef = useRef(false);

  const participants = useMemo(
    () => (currentSave ? getBreedingParticipants(currentSave) : []),
    [currentSave],
  );
  const preview = useMemo(
    () => (currentSave ? getBreedingPreview(currentSave, giverId, receiverId) : null),
    [currentSave, giverId, receiverId],
  );
  const giver = participants.find((item) => item.participantId === giverId) ?? null;
  const receiver = participants.find((item) => item.participantId === receiverId) ?? null;
  const filtered = useMemo(
    () => filterParticipants(sortParticipants(participants, sortMode), filterMode),
    [participants, sortMode, filterMode],
  );
  const infoCreature = infoParticipant?.creatureId
    ? (currentSave?.creatures ?? []).find((creature) => creature.creatureId === infoParticipant.creatureId) ?? null
    : null;
  const blockedReasons = useMemo(
    () => getBlockedReasons(giver, receiver, preview),
    [giver, receiver, preview],
  );
  const chanceRows = useMemo(
    () => getChanceRows(giver, receiver, preview),
    [giver, receiver, preview],
  );

  useEffect(() => {
    const savedMode = window.localStorage.getItem(SCENE_MODE_KEY);
    if (savedMode === "full" || savedMode === "quick") {
      setSceneMode(savedMode);
    } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSceneMode("quick");
    }
  }, []);

  useEffect(() => {
    if (!currentSave) return;
    const saveId = String(currentSave.saveId);
    if (restoredSaveRef.current === saveId) return;
    restoredSaveRef.current = saveId;

    const participantIds = new Set(participants.map((participant) => participant.participantId));
    let next: PairMemory = { giverId: PLAYER_PARTICIPANT_ID, receiverId: null };

    const handoff = window.sessionStorage.getItem(HANDOFF_KEY);
    if (handoff) {
      try {
        const parsed = JSON.parse(handoff) as {
          creatureId?: string;
          preferredRole?: SelectorRole;
          giverId?: string;
          receiverId?: string;
        };
        if (parsed.giverId || parsed.receiverId) {
          next = {
            giverId: parsed.giverId && participantIds.has(parsed.giverId) ? parsed.giverId : PLAYER_PARTICIPANT_ID,
            receiverId: parsed.receiverId && participantIds.has(parsed.receiverId) ? parsed.receiverId : null,
          };
        } else if (parsed.creatureId && participantIds.has(parsed.creatureId)) {
          if (parsed.preferredRole === "giver") next = { giverId: parsed.creatureId, receiverId: null };
          else next = { giverId: PLAYER_PARTICIPANT_ID, receiverId: parsed.creatureId };
        }
      } catch {
        // Invalid handoff data is ignored.
      }
      window.sessionStorage.removeItem(HANDOFF_KEY);
    } else {
      const remembered = window.localStorage.getItem(pairMemoryKey(saveId));
      if (remembered) {
        try {
          const parsed = JSON.parse(remembered) as PairMemory;
          next = {
            giverId: parsed.giverId && participantIds.has(parsed.giverId) ? parsed.giverId : PLAYER_PARTICIPANT_ID,
            receiverId: parsed.receiverId && participantIds.has(parsed.receiverId) ? parsed.receiverId : null,
          };
        } catch {
          // Invalid remembered data is ignored.
        }
      }
    }

    if (next.giverId === next.receiverId) next.receiverId = null;
    setGiverId(next.giverId);
    setReceiverId(next.receiverId);
  }, [currentSave, participants]);

  useEffect(() => {
    if (!currentSave || restoredSaveRef.current !== String(currentSave.saveId)) return;
    window.localStorage.setItem(
      pairMemoryKey(String(currentSave.saveId)),
      JSON.stringify({ giverId, receiverId } satisfies PairMemory),
    );
  }, [currentSave, giverId, receiverId]);

  useEffect(() => {
    if (!giver || !receiver || !preview) return;
    const seed = `${preview.pairKey}_${currentSave?.dayState.dayNumber ?? 0}`;
    preload(getBreedingSceneImagePath(giver.sceneFamily, receiver.sceneFamily, "pairing", undefined, `${seed}_pair`));
    preload(getBreedingSceneImagePath(giver.sceneFamily, receiver.sceneFamily, "outcome", "pregnancy", `${seed}_pregnancy`));
    preload(getBreedingSceneImagePath(giver.sceneFamily, receiver.sceneFamily, "outcome", "failed", `${seed}_failed`));
    preload(getBreedingSceneImagePath(giver.sceneFamily, receiver.sceneFamily, "outcome", "blocked", `${seed}_blocked`));
  }, [currentSave?.dayState.dayNumber, giver, preview, receiver]);

  if (!currentSave) {
    return (
      <main className={styles.screen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before using the Breeding Pen.</p>
          <button type="button" onClick={goToRanch}>Back to Ranch</button>
        </section>
      </main>
    );
  }

  function choose(role: SelectorRole, participantId: string) {
    if (isAttempting) return;
    if (role === "giver") {
      setGiverId(participantId);
      if (participantId === receiverId) setReceiverId(null);
      setMessage("Giver selected. Review or choose the receiver.");
    } else {
      setReceiverId(participantId);
      if (participantId === giverId) setGiverId(null);
      setMessage("Receiver selected. Review the chance, costs, and warnings.");
    }
    setSelectorRole(null);
    setResult(null);
  }

  function swapRoles() {
    if (!giver || !receiver || isAttempting) return;
    if (!giver.roleTags.includes("receiver") || !receiver.roleTags.includes("giver")) {
      setMessage("This pair cannot swap roles.");
      return;
    }
    setGiverId(receiver.participantId);
    setReceiverId(giver.participantId);
    setWarningItems([]);
    setResult(null);
    setMessage("Giver and receiver roles swapped.");
  }

  function clearPair() {
    if (isAttempting) return;
    setGiverId(null);
    setReceiverId(null);
    setResult(null);
    setWarningItems([]);
    setMessage("Pair cleared. Choose a new giver and receiver.");
  }

  function randomPair() {
    if (isAttempting) return;
    const creatures = participants.filter((participant) => participant.kind === "creature");
    const candidates: Array<[BreedingParticipant, BreedingParticipant]> = [];
    for (const possibleGiver of creatures) {
      for (const possibleReceiver of creatures) {
        if (possibleGiver.participantId === possibleReceiver.participantId) continue;
        if (!possibleGiver.canBreed || !possibleReceiver.canBreed || possibleReceiver.isPregnant) continue;
        const candidatePreview = getBreedingPreview(currentSave, possibleGiver.participantId, possibleReceiver.participantId);
        if (candidatePreview?.canAttempt) candidates.push([possibleGiver, possibleReceiver]);
      }
    }
    const alternatives = candidates.filter(([a, b]) => a.participantId !== giverId || b.participantId !== receiverId);
    const pool = alternatives.length ? alternatives : candidates;
    if (!pool.length) {
      setMessage("No complete eligible creature pair is currently available.");
      return;
    }
    const [nextGiver, nextReceiver] = pool[Math.floor(Math.random() * pool.length)];
    setGiverId(nextGiver.participantId);
    setReceiverId(nextReceiver.participantId);
    setResult(null);
    setMessage(`Random eligible pair selected: ${nextGiver.displayName} and ${nextReceiver.displayName}.`);
  }

  function executeAttempt() {
    if (attemptLockRef.current || !giverId || !receiverId || !preview?.canAttempt) return;
    attemptLockRef.current = true;
    setIsAttempting(true);
    setWarningItems([]);
    try {
      const attempt = attemptBreeding(giverId, receiverId);
      if (!attempt) {
        setMessage("Breeding attempt could not be completed. Review the pair status and resources.");
        return;
      }
      setResult(attempt);
      setMessage(attempt.resultText);
    } finally {
      attemptLockRef.current = false;
      setIsAttempting(false);
    }
  }

  function requestAttempt() {
    if (attemptLockRef.current || isAttempting) return;
    if (!giver || !receiver || !preview?.canAttempt) {
      setMessage(blockedReasons[0] ?? "Select a valid giver and receiver first.");
      return;
    }
    const warnings = getWarnings(giver, receiver, preview);
    if (warnings.length) {
      setWarningItems(warnings);
      return;
    }
    executeAttempt();
  }

  function keepGiverChooseReceiver() {
    setResult(null);
    setReceiverId(null);
    setSelectorRole("receiver");
    setMessage("Giver kept. Choose a new receiver.");
  }

  const statusText = preview?.pregnancyBlockedReason ?? preview?.blockedReason ?? (preview ? "Pair is ready." : "Select both participants.");
  const canSwap = Boolean(giver && receiver && giver.roleTags.includes("receiver") && receiver.roleTags.includes("giver"));

  return (
    <main className={`${ui.interior} ${scenic.interior}`}>
      <div className={`${ui.page} ${scenic.page}`}>
        <header className={ui.heading}><h1>Breeding Pen</h1><ScreenNavigation><button type="button" onClick={() => window.dispatchEvent(new Event("creature-chronicles:open-breeding-ledger"))}>Breeding Ledger</button><button type="button" onClick={goToNursery}>Nursery</button></ScreenNavigation></header>
        <section data-scenic className={scenic.workspace} aria-label="Focused breeding pair preview">
          <div className={scenic.pairGrid}>
            <FocusedPairCard role="Giver" participant={giver} disabled={isAttempting} onChoose={() => setSelectorRole("giver")} onInfo={setInfoParticipant} />
            <FocusedPairCard role="Receiver" participant={receiver} disabled={isAttempting} onChoose={() => setSelectorRole("receiver")} onInfo={setInfoParticipant} />
          </div>
          <aside className={scenic.secondary} aria-label="Breeding preview details">
            <button type="button" onClick={() => setShowOptions(true)}><RanchIcon name="gear" />Pair Options</button>
          </aside>
          <section className={`${ui.paper} ${scenic.ledger}`} aria-label="Attempt review">
            <div className={scenic.chance}><strong>{preview ? `${preview.pregnancyChance}%` : "—"}</strong><span>Pregnancy chance</span><button type="button" onClick={() => setShowChanceBreakdown(true)}>Details</button></div>
            <div className={scenic.costs}><h2>After attempt</h2><table><thead><tr><th scope="col">Participant</th><th scope="col">Energy</th><th scope="col">Hearts</th></tr></thead><tbody>{[giver,receiver].filter((p): p is BreedingParticipant => Boolean(p)).map(p => <tr key={p.participantId}><th scope="row">{p.displayName}</th><td>{p.energy} → {preview ? Math.max(0,p.energy-preview.energyCost) : "—"}</td><td>{p.hearts} → {preview ? Math.max(0,p.hearts-preview.heartCost) : "—"}</td></tr>)}</tbody></table><p>{preview ? `Cost each: ${preview.energyCost} Energy · ${preview.heartCost} Heart${preview.heartCost === 1 ? "" : "s"}` : "Select a complete pair."}</p></div>
            <div className={scenic.attempt}><button type="button" className={scenic.readiness} onClick={() => setShowChanceBreakdown(true)}>{blockedReasons.length || preview?.pregnancyBlockedReason ? "Review readiness" : preview ? "✓ Pair is ready" : "Choose a pair"}</button><button type="button" className={ui.primary} disabled={!preview?.canAttempt || isAttempting} onClick={requestAttempt}>{isAttempting ? "Processing..." : blockedReasons.length ? "Attempt Blocked" : "Attempt Breeding"}</button></div>
          </section>
        </section>
      </div>
      {showOptions ? <GameDialog title="Pair Options" onClose={() => setShowOptions(false)}><div className={scenic.options}><button type="button" disabled={!canSwap || isAttempting} onClick={() => {swapRoles();setShowOptions(false);}}>Swap Roles</button><button type="button" disabled={isAttempting} onClick={() => {randomPair();setShowOptions(false);}}>Random Pair</button><button type="button" disabled={isAttempting || (!giverId && !receiverId)} onClick={() => {clearPair();setShowOptions(false);}}>Clear Pair</button><label>Scene Mode<select value={sceneMode} onChange={event => {const mode=event.target.value as SceneMode;setSceneMode(mode);window.localStorage.setItem(SCENE_MODE_KEY,mode);}}><option value="full">Full Scenes</option><option value="quick">Quick Results</option></select></label></div></GameDialog> : null}
      {showChanceBreakdown ? <GameDialog title="Chance & Readiness" onClose={() => setShowChanceBreakdown(false)}><div className={scenic.modal}><h3>Pregnancy chance: {preview ? `${preview.pregnancyChance}%` : "—"}</h3>{chanceRows.map(([label,amount]) => <div className={scenic.breakdownRow} key={label}><span>{label}</span><strong>{amount > 0 ? "+" : ""}{amount}%</strong></div>)}<p>{statusText}</p>{blockedReasons.length ? <ul>{blockedReasons.map(reason => <li key={reason}>{reason}</li>)}</ul> : null}<p>{message}</p>{preview?.readinessNotes?.length ? <><h3>Readiness and genetics notes</h3><ul>{preview.readinessNotes.map(note => <li key={note}>{note}</li>)}</ul></> : null}<h3>Resource cost</h3>{giver && preview ? <CostRow participant={giver} preview={preview} /> : null}{receiver && preview ? <CostRow participant={receiver} preview={preview} /> : null}<p>Energy discount: {preview?.energyDiscount ?? "—"}. Heart cost: {preview?.heartCost ?? "—"} each.</p><div className={scenic.progress}><MiniStat label="Creature XP" value={preview ? `+${preview.xpGain}` : "—"} /><MiniStat label="Breeder XP" value={preview ? `+${preview.breederXpGain}` : "—"} /><MiniStat label="Pair Streak" value={String(preview?.streakCount ?? "—")} /></div></div></GameDialog> : null}

      {selectorRole ? (
        <ParticipantSelectorModal
          role={selectorRole}
          participants={filtered}
          oppositeId={selectorRole === "giver" ? receiverId : giverId}
          selectedId={selectorRole === "giver" ? giverId : receiverId}
          sortMode={sortMode}
          filterMode={filterMode}
          onSortChange={setSortMode}
          onFilterChange={setFilterMode}
          onChoose={choose}
          onInfo={setInfoParticipant}
          onClose={() => setSelectorRole(null)}
        />
      ) : null}

      {infoParticipant ? (
        <ParticipantInfoModal
          participant={infoParticipant}
          creature={infoCreature}
          dayNumber={currentSave.dayState.dayNumber}
          onClose={() => setInfoParticipant(null)}
        />
      ) : null}

      {warningItems.length ? (
        <WarningModal
          warnings={warningItems}
          onCancel={() => setWarningItems([])}
          onConfirm={executeAttempt}
        />
      ) : null}

      {result ? (
        <BreedingResultModal
          result={result}
          sceneMode={sceneMode}
          canBreedAgain={Boolean(preview?.canAttempt)}
          breedAgainReason={blockedReasons[0] ?? null}
          onBreedAgain={requestAttempt}
          onKeepGiverChooseReceiver={keepGiverChooseReceiver}
          onChangePair={() => {
            setResult(null);
            setSelectorRole("receiver");
          }}
          onViewPregnancy={goToNursery}
          onClose={() => setResult(null)}
        />
      ) : null}
    </main>
  );
}

function FocusedPairCard({
  role,
  participant,
  disabled,
  onChoose,
  onInfo,
}: {
  role: SelectorRole extends never ? never : "Giver" | "Receiver";
  participant: BreedingParticipant | null;
  disabled: boolean;
  onChoose: () => void;
  onInfo: (participant: BreedingParticipant) => void;
}) {
  const [showArtwork,setShowArtwork] = useState(false);
  return <article className={scenic.pairCard}>
    {participant ? <button type="button" className={scenic.art} onClick={() => setShowArtwork(true)} aria-label={`View full image of ${participant.displayName}`}><img src={getParticipantImage(participant)} alt={`${participant.displayName} full body`} onError={event => {event.currentTarget.onerror=null;event.currentTarget.src=CREATURE_PLACEHOLDER_IMAGE;}} /></button> : <div className={scenic.emptyArt}>Choose {role}</div>}
    <div className={`${ui.paper} ${scenic.pairInfo}`}><h2>{participant?.displayName ?? `Choose ${role}`}</h2><span className={scenic.role}>{role}</span><div className={scenic.readouts}><MiniStat label="Energy" value={participant ? formatEnergy(participant.energy,participant.maxEnergy) : "—"}/><MiniStat label="Hearts" value={participant ? `${participant.hearts}/${participant.maxHearts}` : "—"}/><MiniStat label="Status" value={participantStatus(participant)}/></div><div className={scenic.pairActions}><button type="button" disabled={disabled} onClick={onChoose} aria-label={`Choose ${role}`}>Change</button><button type="button" disabled={disabled || !participant} onClick={() => participant && onInfo(participant)} aria-label={participant ? `Inspect ${participant.displayName}` : `Inspect ${role}`}>Inspect</button></div></div>
    {showArtwork && participant ? <GameDialog title={participant.displayName} onClose={() => setShowArtwork(false)}><img className={scenic.fullArt} src={getParticipantImage(participant)} alt={`${participant.displayName} full body`} /></GameDialog> : null}
  </article>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className={styles.miniStat}><span>{label}</span><strong>{value}</strong></div>;
}

function CostRow({ participant, preview }: { participant: BreedingParticipant; preview: BreedingPreview }) {
  return (
    <div className={styles.costRow}>
      <strong>{participant.displayName}</strong>
      <span>Energy {participant.energy} → {Math.max(0, participant.energy - preview.energyCost)}</span>
      <span>Hearts {participant.hearts} → {Math.max(0, participant.hearts - preview.heartCost)}</span>
    </div>
  );
}

function ParticipantSelectorModal({
  role,
  participants,
  oppositeId,
  selectedId,
  sortMode,
  filterMode,
  onSortChange,
  onFilterChange,
  onChoose,
  onInfo,
  onClose,
}: {
  role: SelectorRole;
  participants: BreedingParticipant[];
  oppositeId: string | null;
  selectedId: string | null;
  sortMode: SortMode;
  filterMode: FilterMode;
  onSortChange: (value: SortMode) => void;
  onFilterChange: (value: FilterMode) => void;
  onChoose: (role: SelectorRole, participantId: string) => void;
  onInfo: (participant: BreedingParticipant) => void;
  onClose: () => void;
}) {
  return (
    <GameDialog title={role === "giver" ? "Choose Giver" : "Choose Receiver"} onClose={onClose} wide><div className={scenic.modal}>

        <div className={styles.selectorToolbar}>
          <label>Sort<select value={sortMode} onChange={(event) => onSortChange(event.target.value as SortMode)}><option value="name">Name</option><option value="level">Level</option><option value="energy">Energy</option><option value="affection">Affection</option><option value="fertility">Fertility</option></select></label>
          <label>Filter<select value={filterMode} onChange={(event) => onFilterChange(event.target.value as FilterMode)}><option value="all">All Participants</option><option value="available">Only Available</option><option value="nonPregnant">Non-Pregnant</option><option value="creatures">Creatures Only</option><option value="player">Player</option><option value="feline">Feline</option><option value="canine">Canine</option><option value="bovine">Bovine</option><option value="lapine">Lapine</option><option value="equine">Equine</option></select></label>
        </div>
        <div className={styles.selectorGrid}>
          {participants.map((participant) => {
            const disabled = participant.participantId === oppositeId || !participant.canBreed || !participant.roleTags.includes(role);
            const selected = participant.participantId === selectedId;
            return (
              <article key={`${role}-${participant.participantId}`} className={`${styles.selectorCard} ${selected ? styles.selectedCard : ""} ${disabled ? styles.disabledCard : ""}`}>
                <button type="button" className={styles.selectOverlay} disabled={disabled} onClick={() => onChoose(role, participant.participantId)} aria-label={`Select ${participant.displayName}`} />
                <button type="button" className={styles.selectorInfo} onClick={() => onInfo(participant)} aria-label={`Inspect ${participant.displayName}`}>i</button>
                <img src={participant.portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt="" onError={(event) => { event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE; }} />
                <div><strong>{participant.displayName}</strong><span>{participant.familyLabel}</span><small>Energy {formatEnergy(participant.energy, participant.maxEnergy)} · Hearts {participant.hearts}/{participant.maxHearts}</small><em>{participantStatus(participant)}</em></div>
              </article>
            );
          })}
        </div>
      </div>
    </GameDialog>
  );
}

function ParticipantInfoModal({ participant, creature, dayNumber, onClose }: { participant: BreedingParticipant; creature: CreatureRecord | null; dayNumber: number; onClose: () => void }) {
  return (
    <GameDialog title={participant.displayName} onClose={onClose} wide><div className={scenic.modal}>

        {creature ? <SharedCreatureDetail dossier creature={creature} dayNumber={dayNumber} showActions={false} /> : <div className={styles.playerInfo}><img src={getParticipantImage(participant)} alt="" /><p>{participant.description}</p><div className={styles.progressCard}><MiniStat label="Energy" value={formatEnergy(participant.energy, participant.maxEnergy)} /><MiniStat label="Hearts" value={`${participant.hearts}/${participant.maxHearts}`} /><MiniStat label="Affection" value={String(participant.affection)} /></div></div>}
      </div>
    </GameDialog>
  );
}

function WarningModal({ warnings, onCancel, onConfirm }: { warnings: ResourceWarning[]; onCancel: () => void; onConfirm: () => void }) {
  return (
    <GameDialog title={"Continue with this attempt?"} onClose={onCancel} wide><div className={scenic.modal}>
        <p className={styles.kicker}>Resource Warning</p>
        <h2>Continue with this attempt?</h2>
        <div className={styles.warningList}>{warnings.map((warning, index) => <article key={`${warning.participantName}-${warning.resource}-${index}`} data-ui-text-box="auto"><strong>{warning.participantName} — {warning.resource}</strong><span>{warning.before} → {warning.after} (cost {warning.cost})</span><p>{warning.consequence}</p></article>)}</div>
        <div className={styles.modalActions}><button type="button" onClick={onCancel}>Cancel</button><button type="button" className={styles.dangerButton} onClick={onConfirm}>Continue Anyway</button></div>
      </div>
    </GameDialog>
  );
}

function BreedingResultModal({
  result,
  sceneMode,
  canBreedAgain,
  breedAgainReason,
  onBreedAgain,
  onKeepGiverChooseReceiver,
  onChangePair,
  onViewPregnancy,
  onClose,
}: {
  result: BreedingAttemptRecord;
  sceneMode: SceneMode;
  canBreedAgain: boolean;
  breedAgainReason: string | null;
  onBreedAgain: () => void;
  onKeepGiverChooseReceiver: () => void;
  onChangePair: () => void;
  onViewPregnancy: () => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState<ResultPage>(sceneMode === "quick" ? "outcome" : "process");
  const [imageLoaded, setImageLoaded] = useState(false);
  const success = result.outcome === "pregnancy";
  const blocked = Boolean(result.pregnancyBlockedReason);
  const imagePath = page === "process" ? result.pairingImagePath : result.outcomeImagePath;
  const fallback = page === "process" ? BREEDING_SCENE_FALLBACK_PATH : success ? BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH : BREEDING_OUTCOME_FAILURE_FALLBACK_PATH;

  useEffect(() => setImageLoaded(false), [imagePath]);

  return (
    <GameDialog title={page === "process" ? `${result.giverName} × ${result.receiverName}` : success ? "Pregnancy Signs" : blocked ? "Pregnancy Blocked" : "No Pregnancy"} onClose={onClose} wide><div className={scenic.modal}>

        <div className={styles.resultImageWrap}>{!imageLoaded ? <span>Preparing scene...</span> : null}<img src={imagePath} alt="" className={imageLoaded ? styles.loadedImage : ""} onLoad={() => setImageLoaded(true)} onError={(event) => { if (event.currentTarget.src.endsWith(fallback)) { setImageLoaded(true); return; } event.currentTarget.src = fallback; }} /></div>
        {page === "process" ? (
          <><p>{result.processText}</p><div className={styles.resultStats}><MiniStat label="Chance" value={`${result.pregnancyChance}%`} /><MiniStat label="Energy Cost" value={String(result.energyCost)} /><MiniStat label="Heart Cost" value={String(result.heartCost)} /><MiniStat label="Creature XP" value={`+${result.xpGain}`} /><MiniStat label="Breeder XP" value={`+${result.breederXpGain}`} /></div><div className={styles.modalActions}><button type="button" className={styles.primaryButton} onClick={() => setPage("outcome")}>Next: Outcome</button></div></>
        ) : (
          <><p>{result.resultText}</p><p>{result.outcomeFlavorText}</p><div className={styles.resultStats}><MiniStat label="Receiver" value={success ? "Pregnant" : "Not pregnant"} /><MiniStat label="Chance Used" value={`${result.pregnancyChance}%`} /><MiniStat label="Pair Streak" value={String(result.streakAfter)} /><MiniStat label="Outcome" value={blocked ? "Blocked" : result.outcome} /></div>{!canBreedAgain && breedAgainReason ? <p className={styles.blockReason}>Breed again unavailable: {breedAgainReason}</p> : null}<div className={styles.modalActions}>{success ? <><button type="button" onClick={onKeepGiverChooseReceiver}>Keep Giver, Choose New Receiver</button><button type="button" onClick={onViewPregnancy}>View Pregnancy</button></> : <button type="button" disabled={!canBreedAgain} onClick={onBreedAgain}>Breed Again</button>}<button type="button" onClick={onChangePair}>Change Pair</button><button type="button" className={styles.primaryButton} onClick={onClose}>Close</button></div></>
        )}
      </div>
    </GameDialog>
  );
}
