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
import { BreedingInspectBook } from "./BreedingInspectBook";
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
import { BreedingParentPicker } from "./BreedingParentPicker";
import { BreedingPreviewBook, BREEDING_BOOK_ART } from "./BreedingPreviewBook";
import { getBreedingSelectionBlocker } from "@/data/breedingSelectionPreview";
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
    if (isAttempting || getBreedingSelectionBlocker(participants.find(p=>p.participantId===participantId),role,role==="giver"?receiverId:giverId)) return;
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
      queueMicrotask(() => { attemptLockRef.current = false; });
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
      {showOptions ? <BreedingPreviewBook title="Pair Options" marker="pair-options" onClose={()=>setShowOptions(false)} pages={[
        {key:'swap',title:'Swap roles',content:<><p>{giver?.displayName??'No giver'} → {receiver?.displayName??'No receiver'}</p><p>Exchange giver and receiver. Both participants must support their new role. Selection spends nothing.</p><button disabled={!canSwap||isAttempting} onClick={()=>{swapRoles();setShowOptions(false);}}>Swap Roles</button></>},
        {key:'random',title:'Random eligible pair',content:<><p>Choose a complete eligible creature pair from the current ranch. This changes selection only and does not run an attempt.</p><button disabled={isAttempting} onClick={()=>{randomPair();setShowOptions(false);}}>Random Pair</button></>},
        {key:'clear',title:'Clear selected pair',content:<><p>Remove both selections. Creatures and saved attempts remain unchanged.</p><button disabled={isAttempting||(!giverId&&!receiverId)} onClick={()=>{clearPair();setShowOptions(false);}}>Clear Pair</button></>},
        {key:'scenes',title:'Result presentation',content:<><label>Scene Mode<select aria-label="Scene Mode" value={sceneMode} onChange={event=>{const mode=event.target.value as SceneMode;setSceneMode(mode);window.localStorage.setItem(SCENE_MODE_KEY,mode);}}><option value="full">Full Scenes</option><option value="quick">Quick Results</option></select></label><p>Full opens the recorded Attempt view, then Outcome. Quick opens Outcome directly. Both views stay available. This preference is saved on this device.</p></>}
      ]}/> : null}
      {showChanceBreakdown ? <BreedingPreviewBook title="Chance & Readiness" marker="chance-readiness" onClose={()=>setShowChanceBreakdown(false)} art={receiver?.kind==="creature"?getParticipantImage(receiver):BREEDING_BOOK_ART} pages={[
        {key:'summary',title:'Pair readiness',content:<><h3>Pregnancy chance: {preview?`${preview.pregnancyChance}%`:'—'}</h3><p>{statusText}</p><p>{message}</p></>},
        ...chanceRows.map(([label,amount],i)=>({key:`chance-${i}`,title:label,content:<h3>{amount>0?'+':''}{amount}%</h3>})),
        ...blockedReasons.map((reason,i)=>({key:`blocked-${i}`,title:`Readiness blocker ${i+1}`,content:<p>{reason}</p>})),
        ...(preview?.readinessNotes??[]).map((note,i)=>({key:`note-${i}`,title:`Readiness note ${i+1}`,content:<p>{note}</p>})),
        ...[giver,receiver].filter((p):p is BreedingParticipant=>!!p).map((p,i)=>({key:`cost-${i}`,title:`${p.displayName} · Costs`,content:preview?<><CostRow participant={p} preview={preview}/><p>Cost each: {preview.energyCost} Energy · {preview.heartCost} Hearts. Energy discount: {preview.energyDiscount}.</p></>:<p>Choose the complete pair to see exact costs.</p>})),
        {key:'progress',title:'Progression on attempt',content:<><p>Creature XP: {preview?`+${preview.xpGain}`:'—'} · Breeder XP: {preview?`+${preview.breederXpGain}`:'—'}</p><p>Pair streak: {preview?.streakCount??'—'}</p><p>Reviewing or selecting parents spends nothing. The existing confirmation and attempt rules still apply.</p></>}
      ]}/> : null}

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
          participants={[giver,receiver].filter((p):p is BreedingParticipant=>Boolean(p))}
          preview={preview}
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

const ParticipantSelectorModal = BreedingParentPicker;

function ParticipantInfoModal(props: { participant: BreedingParticipant; creature: CreatureRecord | null; dayNumber: number; onClose: () => void }) {
  return <BreedingInspectBook {...props}/>;
}

function WarningModal({ warnings, participants, preview, onCancel, onConfirm }: { warnings: ResourceWarning[]; participants: BreedingParticipant[]; preview: BreedingPreview | null; onCancel: () => void; onConfirm: () => void }) {
  return <BreedingPreviewBook title="Resource Warning" marker="attempt-warning" onClose={onCancel} pages={[
    {key:"review",title:"Continue with this attempt?",content:<><p>Review {warnings.length} low-resource {warnings.length===1?"warning":"warnings"} before confirming.</p><p>Confirmation spends the displayed attempt costs. Cancel returns to the pen without spending anything.</p></>},
    ...(preview?participants.map((participant,index)=>({key:`cost-${index}`,title:`${participant.displayName} · Exact costs`,content:<CostRow participant={participant} preview={preview}/>})):[]),
    ...warnings.map((warning,index)=>({key:`warning-${index}`,title:`${warning.participantName} · ${warning.resource}`,content:<><h3>{warning.resource}: {warning.before} → {warning.after}</h3><p>Cost: {warning.cost}</p><p>{warning.consequence}</p></>}))
  ]} footer={<><button onClick={onCancel}>Cancel</button><button className={styles.dangerButton} onClick={onConfirm}>Continue Anyway</button></>}/>;
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
  const success = result.outcome === "pregnancy";
  const blocked = Boolean(result.pregnancyBlockedReason);
  const imagePath = page === "process" ? result.pairingImagePath : result.outcomeImagePath;
  const fallback = page === "process" ? BREEDING_SCENE_FALLBACK_PATH : success ? BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH : BREEDING_OUTCOME_FAILURE_FALLBACK_PATH;
  const outcomeTitle = success ? "Pregnancy Signs" : blocked ? "Pregnancy Blocked" : "No Pregnancy";
  return <BreedingPreviewBook key={result.attemptId+page} title={page==="process"?"Attempt Recorded":outcomeTitle} marker="attempt-result" onClose={onClose} art={imagePath} fallbackArt={fallback}
    controls={<nav aria-label="Attempt views"><button aria-pressed={page==="process"} onClick={()=>setPage("process")}>Attempt</button><button aria-pressed={page==="outcome"} onClick={()=>setPage("outcome")}>Outcome</button></nav>}
    pages={page==="process"?[
      {key:"record",title:`${result.giverName} × ${result.receiverName}`,content:<><p>Day {result.dayNumber} · Recorded attempt</p><p>{result.processText}</p></>},
      {key:"cost",title:"Costs already paid",content:<><h3>{result.energyCost} Energy + {result.heartCost} Hearts per parent</h3><p>These costs belong to the recorded attempt. Reviewing it spends nothing.</p><p>Chance used: {result.pregnancyChance}%</p></>},
      {key:"giver-energy",title:`${result.giverName} · Energy`,content:<><h3>{result.giverEnergyBefore} → {result.giverEnergyAfter}</h3><p>Recorded before and after the attempt.</p></>},
      {key:"receiver-energy",title:`${result.receiverName} · Energy`,content:<><h3>{result.receiverEnergyBefore} → {result.receiverEnergyAfter}</h3><p>Recorded before and after the attempt.</p></>},
      {key:"growth",title:"Recorded progression",content:<><p>Creature XP: +{result.xpGain}</p><p>Breeder XP: +{result.breederXpGain}</p><p>Pair streak: {result.streakBefore} → {result.streakAfter}</p></>},
      ...result.progressionEvents.flatMap((event,index)=>[
        {key:`progress-${index}`,title:`${event.displayName} · Progression`,content:<><p>Level: {event.levelBefore} → {event.levelAfter} ({event.levelUps} gained)</p><p>XP: {event.xpBefore}/{event.xpToNextBefore} → {event.xpAfter}/{event.xpToNextAfter}</p></>},
        ...Object.entries(event.statGrowth).map(([stat,growth])=>({key:`growth-${index}-${stat}`,title:`${event.displayName} · ${stat}`,content:<><p>Stat growth: +{growth}</p><p>Grade change: {event.gradeChanges?.[stat as keyof typeof event.statGrowth]??"Unchanged"}</p></>})),
        ...event.abilityTriggers.map((note,noteIndex)=>({key:`trigger-${index}-${noteIndex}`,title:`${event.displayName} · Talent note ${noteIndex+1}`,content:<p>{note}</p>}))
      ])
    ]:[
      {key:"outcome",title:outcomeTitle,content:<><p>{result.resultText}</p><p>Receiver: {success?"Pregnant":"Not pregnant"}</p></>},
      {key:"notes",title:"Outcome notes",content:<><p>{result.outcomeFlavorText}</p>{result.pregnancyBlockedReason&&<p>{result.pregnancyBlockedReason}</p>}</>},
      ...(success?[
        {key:"pregnancy",title:"Care for this pregnancy",content:<><p>Open Nursery to review the pregnancy and its care.</p><button onClick={onViewPregnancy}>View Pregnancy</button></>},
        {key:"new-receiver",title:"Choose another receiver",content:<><p>Keep the selected giver and review another receiver before a new attempt.</p><button onClick={onKeepGiverChooseReceiver}>Keep Giver, Choose New Receiver</button></>}
      ]:[{key:"again",title:"Another attempt",content:<><p>{canBreedAgain?"Review the current pair and costs before a new attempt.":`Breed again unavailable: ${breedAgainReason??"Review readiness in the pen."}`}</p><button disabled={!canBreedAgain} onClick={onBreedAgain}>Breed Again</button></>}]),
      {key:"change",title:"Change the pair",content:<><p>Return to parent selection. This recorded attempt stays in the ledger.</p><button onClick={onChangePair}>Change Pair</button></>}
    ]}
    footer={page==="process"?<button onClick={()=>setPage("outcome")}>Next: Outcome</button>:<button onClick={onClose}>Close</button>}/>;
}
