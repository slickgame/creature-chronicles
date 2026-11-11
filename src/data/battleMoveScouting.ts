import {
  getBattleEffectGlossary,
  getBattleStatGlossary,
  getBattleStatusGlossary,
  getBattleTagGlossary,
  type BattleGlossaryEntry,
} from "@/data/battleGlossary";
import { getBattleTargetTypeLabel } from "@/data/battleUi";
import type { BattleMove, BattleMoveEffect, BattleStatusId } from "@/types/battle";

export type BattleMoveScoutingEffect = {
  label: string;
  details: string;
  note?: string;
};

export type BattleMoveScoutingMechanic = {
  label: string;
  mechanics: string;
};

function rounds(value: number): string {
  return `${value} ${value === 1 ? "round" : "rounds"}`;
}

function effectStatus(effect: BattleMoveEffect): BattleStatusId | undefined {
  if (effect.status) return effect.status;
  if (effect.type === "guard") return "guarded";
  if (effect.type === "mark") return "marked";
  if (effect.type === "taunt") return "taunted";
  if (effect.type === "buff_stat") return "inspired";
  if (effect.type === "debuff_stat") return "weakened";
  return undefined;
}

function recipient(effect: BattleMoveEffect, move: BattleMove): string {
  if (effect.target === "self") return "Self";
  if (effect.target === "allies") return "All living allies";
  if (effect.target === "enemies") return "All living enemies";
  if (effect.target === "field") return "Field";
  return getBattleTargetTypeLabel(move.targetType);
}

/** Scouting shows authored move values; no combatant or chosen-target forecast is implied. */
export function getBattleMoveScoutingHint(move: BattleMove): string {
  return `${move.name}\n${move.battleEnergyCost} BE · Base cooldown ${rounds(move.cooldown)} · ${getBattleTargetTypeLabel(move.targetType)}\n${move.description}`;
}

export function getBattleMoveScoutingEffects(move: BattleMove): BattleMoveScoutingEffect[] {
  return move.effects.map(effect => {
    const status = effectStatus(effect);
    const statusLabel = status ? getBattleStatusGlossary(status).label : undefined;
    const statLabel = effect.stat ? getBattleStatGlossary(effect.stat).label : undefined;
    const label = effect.type === "cleanse_status" && statusLabel
      ? `Clear ${statusLabel}`
      : [statusLabel ?? getBattleEffectGlossary(effect.type).label, statLabel].filter(Boolean).join(" · ");
    const details = [recipient(effect, move)];
    if (effect.type === "damage") details.push(`Uses power ${move.power}`);
    if (effect.type === "heal") details.push(`Base healing ${effect.amount ?? move.power}`);
    else if (effect.type === "restore_battle_energy") details.push(`${effect.amount ?? 1} BE`);
    else if (effect.amount !== undefined) details.push(`Amount ${effect.amount}`);
    if (effect.chance !== undefined) details.push(`Base chance ${effect.chance}%`);
    if (effect.duration !== undefined) details.push(rounds(effect.duration));
    if (effect.maxStacks !== undefined) details.push(`Max ${effect.maxStacks} ${effect.maxStacks === 1 ? "stack" : "stacks"}`);
    return { label, details: details.join(" · "), ...(effect.note ? { note: effect.note } : {}) };
  });
}

/** A single grouped reference keeps complete definitions and tag-only interactions available. */
export function getBattleMoveScoutingMechanics(move: BattleMove): BattleMoveScoutingMechanic[] {
  const entries = new Map<string, BattleGlossaryEntry>();
  function add(kind: string, entry: BattleGlossaryEntry | null) {
    if (entry) entries.set(`${kind}:${entry.key}`, entry);
  }
  for (const effect of move.effects) {
    add("effect", getBattleEffectGlossary(effect.type));
    const status = effectStatus(effect);
    if (status) add("status", getBattleStatusGlossary(status));
    if (effect.stat) add("stat", getBattleStatGlossary(effect.stat));
  }
  if (move.scalingStat && move.scalingStat !== "none") add("stat", getBattleStatGlossary(move.scalingStat));
  if (move.resistedBy && move.resistedBy !== "none") add("stat", getBattleStatGlossary(move.resistedBy));
  for (const tag of move.tags) add("tag", getBattleTagGlossary(tag));
  return [{
    label: "Scouting values",
    mechanics: "Power and accuracy are base move values. Actual damage, healing, hit chance, and secondary-effect chance depend on combat stats, targets, and active effects.",
  }, ...Array.from(entries.values(), ({ label, mechanics }) => ({ label, mechanics }))];
}
