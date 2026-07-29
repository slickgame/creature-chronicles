# Deferred Validation — Battle M3 Player-Facing 3v3 UI

## Status

Battle M3 is implemented but has not been locally built, visually reviewed, or gameplay-tested by the project owner. It remains part of the deferred combined validation pass with Sections 6–11B and Battle M1–M2.

## Team selection

1. Enter Town and confirm the former Battle Debug location is labeled **Coliseum Exhibition**.
2. Open the Coliseum and confirm the screen begins with a creature roster rather than the developer auto-round lab.
3. Confirm exactly three available creatures are preselected when possible.
4. Remove and add creatures and confirm the selection never exceeds three.
5. Confirm creatures away at the Training Grounds or actively injured are disabled with a readable reason.
6. Confirm Battle Outfitter and Town navigation work without changing the save.
7. Confirm a match cannot start with fewer or more than three selected creatures.
8. Confirm entering an exhibition does not spend Gold, Ranch Energy, items, or daily actions.

## Battlefield and targeting

1. Confirm three player and three enemy combatant cards appear.
2. Confirm portraits, names, levels, HP, Battle Energy, Speed, status text, and queued-action text fit without clipping.
3. Confirm the first living player creature is marked as the active actor.
4. Select an enemy and confirm only enemy-compatible equipped moves appear.
5. Select the active creature and confirm self-target moves appear.
6. Select an ally and confirm ally or team support moves appear.
7. Select the battlefield and confirm only field-target moves appear when any are equipped.
8. Confirm enemy targets receive the red target highlight while allied targets use the allied highlight.
9. Confirm fainted creatures cannot be selected as targets or actors.

## Move presentation and queue

1. Confirm every compatible move shows category, Power, Accuracy, Battle Energy cost, current/declared cooldown, target type, and compact effect summary.
2. Confirm Physical, Special, Support, Status, and Healing moves have distinct readable category accents.
3. Confirm unaffordable or cooling-down compatible moves remain visible but disabled with an exact reason.
4. Queue one action for each player creature and confirm the active actor advances automatically.
5. Edit a queued action and confirm the replacement does not create a duplicate action.
6. Confirm area actions list all affected targets in the queue.
7. Confirm Confirm Round remains disabled until every living player creature has one action.
8. Confirm the Inventory floating menu is hidden during battle.

## Round resolution

1. Confirm enemy creatures receive automatic fallback actions while tactical AI remains deferred to Battle M4.
2. Confirm action order, hit and miss results, damage, healing, statuses, cooldowns, and Energy regeneration match the M2 engine.
3. Confirm the queue clears after each round and moves to the first living unqueued player actor.
4. Confirm a creature fainted before its turn does not act.
5. Confirm the battle log updates and remains internally scrollable.
6. Confirm victory, defeat, and draw states show the correct result panel.
7. Confirm starting another exhibition resets HP, Battle Energy, cooldowns, statuses, queue, targets, and logs.
8. Confirm leaving the arena during or after a match does not persist battle damage or mutate the save.

## Responsive and accessibility review

1. Review at desktop, narrow laptop, and mobile-width layouts.
2. Confirm no global horizontal scrolling is introduced.
3. Confirm team cards and command panels wrap into one column at narrow widths.
4. Confirm buttons have visible disabled states and readable labels.
5. Confirm portrait failures use the paw-crest fallback.
6. Confirm all battle panels use localized internal scrolling rather than clipping content.

## Automated coverage

Run:

```powershell
npm run test:regression
```

Confirm `tests/battle-ui.test.ts` passes for:

- enemy, ally, and self target compatibility
- area target expansion
- cooldown and Battle Energy availability reasons
- sequential actor planning

Then run:

```powershell
npm test
npm run build
npm run dev
```

## Deliberately deferred

Battle M3 does not yet add tactical enemy AI, Coliseum progression, persistent battle records, rewards, battle consumable use, equipment effects, move-learning UI, move manuals, or breeding move inheritance.
