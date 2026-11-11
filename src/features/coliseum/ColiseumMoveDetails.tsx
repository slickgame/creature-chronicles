"use client";

import { useState } from "react";
import { getBattleTargetTypeLabel } from "@/data/battleUi";
import { getBattleMoveScoutingEffects, getBattleMoveScoutingMechanics } from "@/data/battleMoveScouting";
import { GameDialog } from "@/features/ui/GameDialog";
import type { BattleMove } from "@/types/battle";
import s from "./ColiseumCourtyard.module.css";

export function ColiseumMoveDetails({ owner, move, onClose }: {
  owner: string;
  move: BattleMove;
  onClose: () => void;
}) {
  const [mechanicsOpen, setMechanicsOpen] = useState(false);
  const effects = getBattleMoveScoutingEffects(move);
  const mechanics = getBattleMoveScoutingMechanics(move);
  return <>
    <GameDialog title={`${move.name} · Move details`} dialogClassName={s.scoutingMoveDialog} onClose={onClose}>
      <div className={s.scoutingMoveSummary}>
        <p className={s.scoutingMoveOwner}>{owner} · {move.category}</p>
        <p className={s.scoutingMoveDescription}>{move.description}</p>
        <dl className={s.scoutingMoveStats} aria-label="Move base values">
          <div><dt>BE cost</dt><dd>{move.battleEnergyCost}</dd></div>
          <div><dt>Base cooldown</dt><dd>{move.cooldown} {move.cooldown === 1 ? "round" : "rounds"}</dd></div>
          <div><dt>Targets</dt><dd>{getBattleTargetTypeLabel(move.targetType)}</dd></div>
          <div><dt>Power</dt><dd>{move.power}</dd></div>
          <div><dt>Base accuracy</dt><dd>{move.accuracy}%</dd></div>
          <div><dt>Priority</dt><dd>{move.priority}</dd></div>
        </dl>
        <p className={s.scoutingMoveNote}>Base values. Actual damage, healing and chances depend on combat stats and conditions.</p>
      </div>
      <div className={s.scoutingMoveEffects}>
        <h3>Effects</h3>
        <ul role="list">{effects.map((effect, index) => <li key={index}>
          <strong>{effect.label}</strong>
          <p>{effect.details}</p>
          {effect.note && <p>{effect.note}</p>}
        </li>)}</ul>
        <button type="button" aria-haspopup="dialog" onClick={event => {
          event.currentTarget.focus({ preventScroll: true });
          setMechanicsOpen(true);
        }}>Mechanics & status descriptions</button>
      </div>
    </GameDialog>
    {mechanicsOpen && <GameDialog title={`${move.name} · Mechanics`} dialogClassName={s.scoutingMechanicsDialog} onClose={() => setMechanicsOpen(false)}>
      <div className={s.scoutingMechanics}>{mechanics.map(entry => <section key={entry.label}>
        <h3>{entry.label}</h3><p>{entry.mechanics}</p>
      </section>)}</div>
    </GameDialog>}
  </>;
}
