import assert from "node:assert/strict";
import test from "node:test";
import {
  createBattleTelemetryState,
  getBattleCareerParticipants,
  recordBattleTelemetryEvent,
} from "@/data/battleTelemetry";
import type { BattleCombatantId } from "@/types/battle";
import type { CreatureId } from "@/types/ids";

test("battle telemetry aggregates combat contributions per creature", () => {
  const combatantId = "player_0" as BattleCombatantId;
  const creatureId = "creature_alpha" as CreatureId;
  let state = createBattleTelemetryState([{ combatantId, creatureId }]);
  state = recordBattleTelemetryEvent(state, { type: "damage", actorId: combatantId, amount: 42 });
  state = recordBattleTelemetryEvent(state, { type: "damage", actorId: combatantId, amount: 18, targetFainted: true });
  state = recordBattleTelemetryEvent(state, { type: "healing", actorId: combatantId, amount: 25 });
  state = recordBattleTelemetryEvent(state, { type: "protection", actorId: combatantId, alliesProtected: 2 });
  state = recordBattleTelemetryEvent(state, { type: "fainted", combatantId });

  assert.deepEqual(getBattleCareerParticipants(state), [{
    creatureId,
    damageDealt: 60,
    healingDone: 25,
    alliesProtected: 2,
    knockouts: 1,
    fainted: true,
  }]);
});

test("battle telemetry ignores unknown combatants and clamps invalid amounts", () => {
  const combatantId = "player_0" as BattleCombatantId;
  const creatureId = "creature_alpha" as CreatureId;
  let state = createBattleTelemetryState([{ combatantId, creatureId }]);
  const unchanged = recordBattleTelemetryEvent(state, { type: "damage", actorId: "unknown" as BattleCombatantId, amount: 99 });
  assert.equal(unchanged, state);
  state = recordBattleTelemetryEvent(state, { type: "healing", actorId: combatantId, amount: -20 });
  assert.equal(getBattleCareerParticipants(state)[0]?.healingDone, 0);
});
