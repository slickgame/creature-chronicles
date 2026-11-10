import { useEffect, useEffectEvent, useRef, useState } from "react";
import { buildBattleAiPlan } from "@/data/battleAi";
import { hasBattleStatus, resolveBattleTurn } from "@/data/battleEngine";
import {
  getBattleOrderPreview,
  getBattleRoundOrderShift,
  recordBattleOrderShift,
  recordBattleRoundStart,
  updateBattleCooldownNotices,
  type BattleRoundOrderShift,
} from "@/data/battleInterface";
import { buildBattlePlaybackEvents } from "@/data/battlePresentation";
import type { useBattlePresentationController } from "@/features/battle/useBattlePresentationController";
import type { BattleAction, BattleCombatantId, BattleMoveId, BattleRoundResult, BattleState } from "@/types/battle";
import type { BattleAiDifficulty } from "@/types/battleAi";

export function useColiseumIndividualTurns({ state, enabled, aiDifficulty, presentation, onResolved }: {
  state: BattleState | null;
  enabled: boolean;
  aiDifficulty: BattleAiDifficulty;
  presentation: ReturnType<typeof useBattlePresentationController>;
  onResolved: (state: BattleState, result: BattleRoundResult) => void;
}) {
  const [order, setOrder] = useState<BattleCombatantId[]>([]);
  const [roundOrderShift, setRoundOrderShift] = useState<BattleRoundOrderShift>();
  const [cooldownNotices, setCooldownNotices] = useState<ReadonlyMap<BattleCombatantId, readonly BattleMoveId[]>>(() => new Map());
  const roundOpening = useRef<{ order: readonly BattleCombatantId[]; state: BattleState }>(undefined);
  const actorId = order[0];
  const actor = state?.combatants[actorId];
  const activeActorId = actor?.sideId === "player" && !hasBattleStatus(actor, "stun") ? actorId : null;

  function openRound(nextState: BattleState, logIndex?: number, beforeRecovery?: BattleState) {
    const nextOrder = getBattleOrderPreview(nextState, new Map()).map(entry => entry.actorId);
    const previous = roundOpening.current;
    const shift = beforeRecovery ? getBattleRoundOrderShift(previous?.order ?? [], nextOrder, nextState.roundNumber) : undefined;
    setOrder(nextOrder);
    setRoundOrderShift(shift);
    roundOpening.current = { order: nextOrder, state: nextState };
    const context = previous && beforeRecovery ? { previous: previous.state, beforeRecovery } : undefined;
    return recordBattleOrderShift(recordBattleRoundStart(nextState, logIndex), shift, context);
  }

  function takeTurn(action?: BattleAction) {
    if (!enabled || !state || presentation.isPlaying) return;
    const resolved = resolveBattleTurn(state, order, action);
    if (!resolved) return;

    presentation.play(buildBattlePlaybackEvents(resolved.frames, { staggerMultiTarget: true }), [actorId]);
    setCooldownNotices(current => updateBattleCooldownNotices(current, state, resolved.state, activeActorId));
    let nextState = resolved.state;
    if (nextState.outcome !== "ongoing") {
      setOrder([]);
      setRoundOrderShift(undefined);
    } else if (resolved.remaining.length) {
      setOrder(resolved.remaining);
    } else {
      nextState = openRound(nextState, undefined, resolved.beforeRecovery);
    }
    onResolved(nextState, resolved.result);
  }

  const takeAutomaticTurn = useEffectEvent(() => {
    if (!state || !actor || activeActorId) return;
    const action = actor.sideId === "enemy"
      ? buildBattleAiPlan(state, "enemy", aiDifficulty).actions.find(entry => entry.actorId === actorId)
      : undefined;
    takeTurn(action);
  });

  const automatic = enabled && !!actor && !activeActorId && !presentation.isPlaying;
  useEffect(() => {
    if (!automatic) return;
    const timer = window.setTimeout(takeAutomaticTurn, 240);
    return () => window.clearTimeout(timer);
  }, [automatic, state, actorId]);

  return { order, roundOrderShift, activeActorId, completedCooldowns: activeActorId ? cooldownNotices.get(activeActorId) : undefined, openRound, takeTurn };
}
