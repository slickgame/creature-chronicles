# Deferred Validation — Battle M4 Enemy AI

## Status

- Battle M3 — Player-Facing Target-First 3v3 UI: **implemented but not yet tested by the project owner**.
- Battle M4 — Deterministic Enemy AI: **implemented but not yet tested by the project owner**.
- Sections 6–11B and Battle M1–M2 also remain part of the deferred combined validation pass.

Do not mark Battle M3 or M4 verified until the project owner has pulled the current branch, run the automated suite, built the application, and completed the manual gameplay checks below.

## Automated checks

1. Run `npm run test:regression` twice.
2. Confirm `tests/battle-ai.test.ts` runs both times.
3. Confirm Basic, Tactical, and Champion plans are identical across repeated runs with the same battle ID and state.
4. Confirm every living enemy receives exactly one action.
5. Confirm every selected AI action passes the production action validator.
6. Confirm a complete player-plus-AI round resolves six unique actors when all six creatures are alive.
7. Confirm the existing battle UI, move, round, save, Ranch Day, Talent, chore, breeding, and inventory tests remain unchanged and passing.

## Manual Coliseum checks

1. Open Town → Coliseum Exhibition.
2. Confirm the team-selection screen still defaults to three available creatures.
3. Confirm the opponent selector offers Basic, Tactical, and Champion.
4. Confirm the description below the selector changes with the selected difficulty.
5. Start the same team against each difficulty.
6. Confirm the enemy team name and battle header display the selected AI tier.
7. Queue one player action for each living creature and confirm enemy actions remain hidden before Confirm Round.
8. Confirm the round log records AI planning lines only after the round is confirmed.
9. Confirm AI planning lines name the acting enemy, move, and target.
10. Confirm every enemy action resolves through the same Speed, priority, accuracy, cooldown, status, damage, healing, and Battle Energy rules as player actions.
11. Confirm enemy actions never bypass Taunt, cooldowns, insufficient Energy, target legality, or fainting.
12. Confirm changing difficulty and restarting the same team creates the expected deterministic battle seed for that tier.

## Basic AI checks

1. Confirm Basic AI always chooses a legal action.
2. Confirm it frequently favors damaging moves.
3. Injure an ally and confirm Basic can choose healing when healing is equipped.
4. Confirm Basic does not appear to coordinate planned damage, healing, or status coverage between teammates.

## Tactical AI checks

1. Reduce one enemy ally below 35% HP and give another enemy an equipped heal; confirm the healer strongly favors the critical ally.
2. Reduce one player creature to finishing range; confirm damaging enemies prefer the available knockout.
3. Give an enemy ally low Battle Energy; confirm Energy restoration becomes more attractive.
4. Apply a removable harmful status and confirm Cleanse becomes more attractive.
5. Confirm full-HP healing, full-Energy restoration, and redundant status application are deprioritized.
6. Confirm Tactical AI does not react to the player's still-unresolved queued actions.

## Champion AI checks

1. Give multiple enemies Rally and confirm they do not all repeat the same team-wide buff in one round.
2. Give multiple enemies healing and create one moderately injured ally; confirm projected healing reduces avoidable overhealing.
3. Put one player creature near defeat and confirm focus fire continues until the projected knockout is covered.
4. Confirm later Champion actors avoid wasting actions on a target already covered by planned lethal damage.
5. Confirm multiple Champion actors avoid duplicating the same status on the same target when stronger alternatives exist.
6. Confirm Champion receives no hidden stat, accuracy, damage, Energy, or cooldown bonus.

## Regression boundaries

Confirm Battle M4 does not yet add:

- Coliseum divisions or progression.
- Gold, item, resource, equipment, creature, or Coliseum Mark rewards.
- Persistent battle records, injuries, or fatigue.
- Equipment effects.
- Consumable use inside battle.
- Breeding move inheritance.
- Move-manual consumption.
- PvP.
- Reserve swapping or benches.

## Deferred combined commands

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```
