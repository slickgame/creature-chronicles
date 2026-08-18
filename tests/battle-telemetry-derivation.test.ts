import assert from "node:assert/strict";
import test from "node:test";
import { getBattleCareerParticipants } from "@/data/battleTelemetry";
import {
  createTelemetryForPlayerTeam,
  deriveRoundBattleTelemetry,
} from "@/data/battleTelemetryDerivation";
import type {
  BattleCombatant,
  BattleCombatantId,
  BattleResolvedAction,
  BattleState,
  BattleStats,
} from "@/types/battle";
import type { CreatureId, SpeciesId } from "@/types/ids";

const stats: BattleStats = {
  maxHp: 100,
  physicalPower: 20,
  specialPower: 20,
  defense: 15,
  resistance: 15,
  speed: 20,
  accuracy: 95,
  evasion: 0,
  statusPower: 15,
  statusResist: 15,
  battleEnergy: 60,
};

function combatant(
  id: string,
  sideId: "player" | "enemy",
  hp: number,
  fainted = false,
): BattleCombatant {
  return {
    battleCombatantId: id as BattleCombatantId,
    sourceCreatureId: `${id}_creature` as CreatureId,
    sideId,
    slotIndex: Number(id.at(-1) ?? 0) || 0,
    name: id,
    speciesId: "species_feline" as SpeciesId,
    level: 1,
    battleStats: stats,
    loadout: { learnedMoveIds: ["strike", "first_aid", "defend"], equippedMoveIds: ["strike", "first_aid", "defend"] },
    currentHp: hp,
    maxHp: 100,
    currentBattleEnergy: 60,
    maxBattleEnergy: 60,
    cooldowns: {},
    statuses: [],
    isFainted: fainted,
  };
}

function state(values: { p1: number; p2: number; p3: number; e1: number; p2Fainted?: boolean; e1Fainted?: boolean }): BattleState {
  const combatants = {
    p1: combatant("p1", "player", values.p1),
    p2: combatant("p2", "player", values.p2, values.p2Fainted),
    p3: combatant("p3", "player", values.p3),
    e1: combatant("e1", "enemy", values.e1, values.e1Fainted),
  };
  return {
    battleId: "telemetry_round",
    roundNumber: 1,
    outcome: "ongoing",
    teams: {
      player: { sideId: "player", name: "Player", combatantIds: ["p1", "p2", "p3"] as BattleCombatantId[] },
      enemy: { sideId: "enemy", name: "Enemy", combatantIds: ["e1"] as BattleCombatantId[] },
    },
    combatants,
    log: [],
  } as BattleState;
}

function resolvedAction(actorId: string, moveId: string, targetId: string): BattleResolvedAction {
  return {
    actorId: actorId as BattleCombatantId,
    actorName: actorId,
    moveId,
    moveName: moveId,
    targetIds: [targetId as BattleCombatantId],
    targetNames: [targetId],
    turnScore: 0,
    success: true,
    log: [],
    hitTargetIds: [targetId as BattleCombatantId],
    missedTargetIds: [],
  };
}

test("round derivation assigns net damage, healing, protection, knockouts, and faints", () => {
  const before = state({ p1: 100, p2: 50, p3: 10, e1: 25 });
  const after = state({ p1: 100, p2: 0, p3: 30, e1: 0, p2Fainted: true, e1Fainted: true });
  const actions = [
    resolvedAction("p1", "strike", "e1"),
    resolvedAction("p2", "first_aid", "p3"),
    resolvedAction("p3", "defend", "p3"),
  ];
  const telemetry = deriveRoundBattleTelemetry(
    createTelemetryForPlayerTeam(before),
    before,
    after,
    actions,
  );
  const participants = getBattleCareerParticipants(telemetry);
  const p1 = participants.find((entry) => entry.creatureId === ("p1_creature" as CreatureId));
  const p2 = participants.find((entry) => entry.creatureId === ("p2_creature" as CreatureId));
  const p3 = participants.find((entry) => entry.creatureId === ("p3_creature" as CreatureId));

  assert.equal(p1?.damageDealt, 25);
  assert.equal(p1?.knockouts, 1);
  assert.equal(p2?.healingDone, 20);
  assert.equal(p2?.fainted, true);
  assert.equal(p3?.alliesProtected, 1);
});

test("round derivation does not double-count net target HP changes", () => {
  const before = state({ p1: 100, p2: 100, p3: 100, e1: 50 });
  const after = state({ p1: 100, p2: 100, p3: 100, e1: 20 });
  const actions = [
    resolvedAction("p1", "strike", "e1"),
    resolvedAction("p2", "strike", "e1"),
  ];
  const participants = getBattleCareerParticipants(
    deriveRoundBattleTelemetry(createTelemetryForPlayerTeam(before), before, after, actions),
  );
  const totalDamage = participants.reduce((sum, entry) => sum + (entry.damageDealt ?? 0), 0);
  assert.equal(totalDamage, 30);
  assert.equal(participants.find((entry) => entry.creatureId === ("p2_creature" as CreatureId))?.damageDealt, 30);
});
