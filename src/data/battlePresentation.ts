import { getBattleMove } from "@/data/battleMoves";
import { getBattleStatusGlossary } from "@/data/battleGlossary";
import type {
  BattleCombatantId,
  BattlePlaybackFrame,
  BattleMove,
  BattleMoveCategory,
  BattleRoundResult,
  BattleState,
} from "@/types/battle";
import type { SpeciesId } from "@/types/ids";

export type BattleEffectPreset =
  | "impact"
  | "slash"
  | "charge"
  | "projectile"
  | "heal"
  | "shield"
  | "status";

export type BattlePresentationEventKind =
  | "attack"
  | "miss"
  | "damage"
  | "heal"
  | "energy"
  | "status"
  | "knockout";

export type BattlePresentationEvent = {
  state?: BattleState;
  eventId: string;
  kind: BattlePresentationEventKind;
  actorId?: BattleCombatantId;
  targetIds: BattleCombatantId[];
  moveId?: string;
  moveName?: string;
  label: string;
  amount?: number;
  statusOutcome?: BattlePlaybackFrame["statusOutcome"];
  precedingDamage?: string;
  targetOutcomes?: BattleTargetOutcome[];
  preset: BattleEffectPreset;
  durationMs: number;
};

export type BattleTargetOutcome = {
  targetId: BattleCombatantId;
  kind: "damage" | "miss" | "status";
  label: string;
  statusOutcome?: BattlePlaybackFrame["statusOutcome"];
  knockedOut?: boolean;
};

export const BATTLE_OUTCOME_FADE_MS = 1050;
export const BATTLE_OUTCOME_STAGGER_MS = 150;

export type BattlePortraitConfig = {
  scale: number;
  offsetX: number;
  offsetY: number;
  frameWidth: number;
  frameHeight: number;
};

const DEFAULT_PORTRAIT_CONFIG: BattlePortraitConfig = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  frameWidth: 220,
  frameHeight: 320,
};

const PORTRAIT_CONFIG_BY_SPECIES: Record<string, BattlePortraitConfig> = {
  species_bovine: { scale: 0.82, offsetX: 0, offsetY: 8, frameWidth: 250, frameHeight: 330 },
  species_canine: { scale: 0.96, offsetX: 0, offsetY: 4, frameWidth: 215, frameHeight: 320 },
  species_equine: { scale: 0.88, offsetX: 0, offsetY: 6, frameWidth: 220, frameHeight: 338 },
  species_feline: { scale: 0.98, offsetX: 0, offsetY: 4, frameWidth: 205, frameHeight: 320 },
  species_lapine: { scale: 0.88, offsetX: 0, offsetY: 10, frameWidth: 205, frameHeight: 340 },
};

export function getBattlePortraitConfig(speciesId: SpeciesId | string): BattlePortraitConfig {
  return PORTRAIT_CONFIG_BY_SPECIES[String(speciesId)] ?? DEFAULT_PORTRAIT_CONFIG;
}

export function getBattleMoveEffectPreset(move: BattleMove): BattleEffectPreset {
  if (move.category === "healing" || move.effects.some((effect) => effect.type === "heal")) return "heal";
  if (move.effects.some((effect) => effect.type === "guard")) return "shield";
  if (move.category === "status" || move.category === "support") return "status";
  if (move.category === "special") return "projectile";
  if (move.tags.some((tag) => ["claw", "slash", "bleed", "cutting"].includes(tag))) return "slash";
  if (move.tags.some((tag) => ["charge", "pursuit", "rush", "lunge"].includes(tag))) return "charge";
  return "impact";
}

function findCombatantIdByName(state: BattleState, name: string): BattleCombatantId | undefined {
  return Object.values(state.combatants).find((combatant) => combatant.name === name)?.battleCombatantId;
}

function eventDuration(kind: BattlePresentationEventKind): number {
  if (kind === "attack") return 520;
  if (kind === "knockout") return 680;
  if (kind === "damage") return 460;
  return 400;
}

function pushEvent(
  events: BattlePresentationEvent[],
  event: Omit<BattlePresentationEvent, "eventId" | "durationMs"> & { durationMs?: number },
) {
  events.push({
    ...event,
    eventId: `battle-presentation-${events.length}-${event.kind}-${event.actorId ?? "none"}-${event.targetIds.join("-")}`,
    durationMs: event.durationMs ?? eventDuration(event.kind),
  });
}

function categoryPreset(category: BattleMoveCategory): BattleEffectPreset {
  if (category === "healing") return "heal";
  if (category === "support") return "shield";
  if (category === "status") return "status";
  if (category === "special") return "projectile";
  return "impact";
}

export function buildBattlePresentationEvents(
  beforeState: BattleState,
  afterState: BattleState,
  round: BattleRoundResult,
): BattlePresentationEvent[] {
  const events: BattlePresentationEvent[] = [];
  const knockoutTargets = new Set<BattleCombatantId>();

  round.actions.forEach((action) => {
    const move = getBattleMove(action.moveId);
    const preset = getBattleMoveEffectPreset(move);

    if (action.success) {
      pushEvent(events, {
        kind: "attack",
        actorId: action.actorId,
        targetIds: action.targetIds,
        moveId: action.moveId,
        moveName: action.moveName,
        label: action.moveName,
        preset,
      });
    } else {
      pushEvent(events, {
        kind: "status",
        actorId: action.actorId,
        targetIds: [action.actorId],
        moveId: action.moveId,
        moveName: action.moveName,
        label: action.log.at(-1) ?? `${action.actorName} cannot act.`,
        preset: "status",
      });
    }

    (action.missedTargetIds ?? []).forEach((targetId) => {
      pushEvent(events, {
        kind: "miss",
        actorId: action.actorId,
        targetIds: [targetId],
        moveId: action.moveId,
        moveName: action.moveName,
        label: "Miss",
        preset,
      });
    });

    action.log.forEach((line) => {
      const damageMatch = line.match(/^(.+?) hits (.+?) for (\d+) damage\.$/);
      if (damageMatch) {
        const targetId = findCombatantIdByName(afterState, damageMatch[2]);
        if (targetId) {
          pushEvent(events, {
            kind: "damage",
            actorId: action.actorId,
            targetIds: [targetId],
            moveId: action.moveId,
            moveName: action.moveName,
            label: `-${damageMatch[3]}`,
            amount: Number(damageMatch[3]),
            preset,
          });
        }
        return;
      }

      const healMatch = line.match(/^(.+?) recovers (\d+) HP\.$/);
      if (healMatch) {
        const targetId = findCombatantIdByName(afterState, healMatch[1]);
        if (targetId) {
          pushEvent(events, {
            kind: "heal",
            actorId: action.actorId,
            targetIds: [targetId],
            moveId: action.moveId,
            moveName: action.moveName,
            label: `+${healMatch[2]} HP`,
            amount: Number(healMatch[2]),
            preset: "heal",
          });
        }
        return;
      }

      const energyMatch = line.match(/^(.+?) restores (\d+) Battle Energy\.$/);
      if (energyMatch) {
        const targetId = findCombatantIdByName(afterState, energyMatch[1]);
        if (targetId) {
          pushEvent(events, {
            kind: "energy",
            actorId: action.actorId,
            targetIds: [targetId],
            moveId: action.moveId,
            moveName: action.moveName,
            label: `+${energyMatch[2]} BE`,
            amount: Number(energyMatch[2]),
            preset: "status",
          });
        }
        return;
      }

      const statusMatch = line.match(/^(.+?) is ([a-z_]+)(?: \((\d+) stacks\))?;/);
      if (statusMatch) {
        const targetId = findCombatantIdByName(afterState, statusMatch[1]);
        if (targetId) {
          pushEvent(events, {
            kind: "status",
            actorId: action.actorId,
            targetIds: [targetId],
            moveId: action.moveId,
            moveName: action.moveName,
            label: statusMatch[3] ? `${statusMatch[2]} ×${statusMatch[3]}` : statusMatch[2],
            preset: statusMatch[2] === "guarded" ? "shield" : "status",
          });
        }
        return;
      }

      const statMatch = line.match(/^(.+?) (gains|loses) (\d+) (.+?) \((?:applied|stacked|refreshed)\)\.$/);
      if (statMatch) {
        const targetId = findCombatantIdByName(afterState, statMatch[1]);
        if (targetId) {
          pushEvent(events, {
            kind: "status",
            actorId: action.actorId,
            targetIds: [targetId],
            moveId: action.moveId,
            moveName: action.moveName,
            label: `${statMatch[2] === "gains" ? "+" : "−"}${statMatch[3]} ${statMatch[4]}`,
            preset: categoryPreset(move.category),
          });
        }
        return;
      }

      const faintMatch = line.match(/^(.+?) fainted\.$/);
      if (faintMatch) {
        const targetId = findCombatantIdByName(afterState, faintMatch[1]);
        if (targetId && !knockoutTargets.has(targetId)) {
          knockoutTargets.add(targetId);
          pushEvent(events, {
            kind: "knockout",
            actorId: action.actorId,
            targetIds: [targetId],
            moveId: action.moveId,
            moveName: action.moveName,
            label: "KO",
            preset: "impact",
          });
        }
      }
    });
  });

  round.log.forEach((line) => {
    const bleedMatch = line.match(/^(.+?) takes (\d+) bleed damage/);
    if (!bleedMatch) return;
    const targetId = findCombatantIdByName(afterState, bleedMatch[1]);
    if (!targetId) return;
    pushEvent(events, {
      kind: "damage",
      targetIds: [targetId],
      label: `-${bleedMatch[2]} Bleed`,
      amount: Number(bleedMatch[2]),
      preset: "status",
    });
    if (afterState.combatants[targetId]?.isFainted && !beforeState.combatants[targetId]?.isFainted && !knockoutTargets.has(targetId)) {
      knockoutTargets.add(targetId);
      pushEvent(events, {
        kind: "knockout",
        targetIds: [targetId],
        label: "KO",
        preset: "status",
      });
    }
  });

  return events;
}

export function getBattleOutcomeStatusText(outcome: NonNullable<BattleTargetOutcome["statusOutcome"]>) {
  const status = getBattleStatusGlossary(outcome.status).label;
  return `${status} ${outcome.result === "failed" ? "didn’t apply" : outcome.result}`;
}

function groupTargetOutcomes(attack: BattlePresentationEvent, results: BattlePresentationEvent[]): BattlePresentationEvent | null {
  const latest = results.at(-1);
  if (!latest?.state) return null;
  const outcomes = new Map<BattleCombatantId, BattleTargetOutcome>();
  for (const result of results) {
    const [targetId] = result.targetIds;
    if (result.targetIds.length !== 1 || !attack.targetIds.includes(targetId)) return null;
    const outcome = outcomes.get(targetId);
    if (!outcome && (result.kind === "damage" || result.kind === "miss")) {
      outcomes.set(targetId, { targetId, kind: result.kind, label: result.label });
    } else if (result.kind === "status" && result.statusOutcome && (!outcome || (outcome.kind === "damage" && !outcome.statusOutcome))) {
      outcomes.set(targetId, {
        ...(outcome ?? { targetId, kind: "status", label: result.label }),
        statusOutcome: result.statusOutcome,
      });
    } else if (result.kind === "knockout" && outcome?.kind === "damage") {
      outcome.knockedOut = true;
    } else {
      // Keep the original beats if the move has other effects or repeated hits.
      return null;
    }
  }
  const targetOutcomes = attack.targetIds.flatMap(id => {
    const outcome = outcomes.get(id);
    return outcome ? [outcome] : [];
  });
  if (targetOutcomes.length < 2) return null;

  return {
    ...latest,
    kind: "status",
    targetIds: targetOutcomes.map(outcome => outcome.targetId),
    targetOutcomes,
    label: targetOutcomes.map(outcome => {
      const status = outcome.statusOutcome ? getBattleOutcomeStatusText(outcome.statusOutcome) : "";
      const result = outcome.kind === "status" ? status : [outcome.label, status].filter(Boolean).join(" · ");
      return `${latest.state?.combatants[outcome.targetId]?.name}: ${result}${outcome.knockedOut ? " · K.O." : ""}`;
    }).join(" | "),
    durationMs: BATTLE_OUTCOME_FADE_MS + (targetOutcomes.length - 1) * BATTLE_OUTCOME_STAGGER_MS,
  };
}

export function buildBattlePlaybackEvents(
  frames: BattlePlaybackFrame[],
  { staggerMultiTarget = false }: { staggerMultiTarget?: boolean } = {},
): BattlePresentationEvent[] {
  const damageByTarget = new Map<BattleCombatantId, string>();
  const events = frames.map((frame, index) => {
    if (frame.kind === "attack" || !frame.moveId) damageByTarget.clear();
    const [targetId] = frame.targetIds;
    if (frame.kind === "damage" && frame.moveId && targetId) {
      damageByTarget.set(targetId, frame.label);
    }
    return {
      ...frame,
      eventId: `frame-${index}`,
      moveName: frame.moveId ? getBattleMove(frame.moveId).name : undefined,
      preset: frame.moveId ? getBattleMoveEffectPreset(getBattleMove(frame.moveId)) : "status",
      durationMs: frame.kind === "attack" ? 600 : frame.kind === "status" ? 650 : 800,
      precedingDamage: frame.statusOutcome && targetId ? damageByTarget.get(targetId) : undefined,
    };
  });
  if (!staggerMultiTarget) return events;

  const playback: BattlePresentationEvent[] = [];
  for (let index = 0; index < events.length; index += 1) {
    const attack = events[index];
    playback.push(attack);
    if (attack.kind !== "attack" || attack.targetIds.length < 2 || !attack.moveId) continue;
    let end = index + 1;
    while (end < events.length) {
      const next = events[end];
      if (next.kind === "attack" || next.actorId !== attack.actorId || next.moveId !== attack.moveId) break;
      end += 1;
    }
    const results = events.slice(index + 1, end);
    const grouped = groupTargetOutcomes(attack, results);
    playback.push(...(grouped ? [grouped] : results));
    index = end - 1;
  }
  return playback;
}
