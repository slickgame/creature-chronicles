import { gameplayArt } from "@/data/creatureGameplayArt";
import type { BattleState } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import s from "./BattleLogEntries.module.css";

export function BattleLogEntries({ state, sourceById }: {
  state: BattleState;
  sourceById: ReadonlyMap<string, CreatureRecord>;
}) {
  const shifts = new Map(state.orderShiftLog?.map(entry => [entry.logIndex, entry]));
  return state.log.map((line, index) => {
    const shift = shifts.get(index);
    if (!shift || !shift.moves.length || shift.moves.some(({ actorId }) => !state.combatants[actorId])) {
      return <p key={index}>{line}</p>;
    }
    const title = `Round ${shift.roundNumber} · Order Shift`;
    return <section key={index} className={s.shiftCard} aria-label={title} data-order-shift-card={shift.roundNumber}>
      <h3 className={s.shiftTitle}>{title}</h3>
      <ul>
        {shift.moves.map(({ actorId, from, to }) => {
          const creature = state.combatants[actorId];
          const source = sourceById.get(String(creature.sourceCreatureId));
          return <li key={actorId} className={s.shiftRow} data-order-shift-row={from > to ? "up" : "down"}>
            <span className={s.portrait} aria-hidden="true">
              {source ? <img src={gameplayArt(source, true)} alt=""/> : creature.name.slice(0, 1)}
            </span>
            <strong>{creature.name}</strong>
            <span className={s.slots}>
              <span data-order-shift-slots aria-hidden="true">{from} → {to}</span>
              <span className={s.slotDescription}>Slot {from} to slot {to}</span>
            </span>
          </li>;
        })}
      </ul>
    </section>;
  });
}
