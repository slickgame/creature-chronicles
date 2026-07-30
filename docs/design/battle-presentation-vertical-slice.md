# Battle Presentation Vertical Slice

## Goal

Upgrade the active 3v3 Coliseum battle screens from stacked combatant cards to a readable illustrated battlefield while preserving the existing deterministic battle engine, target-first input, rewards, combat XP, save state, and Coliseum progression.

## Locked scope

- Use each creature variant's existing full `profilePath` as the battlefield cutout.
- Keep compact `portraitPath` assets in roster, queue, and menu contexts.
- Stage three ranch creatures on the left facing right and three opponents on the right facing left.
- Use species-specific scale and anchor metadata for bovine, canine, equine, feline, and lapine base silhouettes.
- Preserve target-first selection with strong red enemy rings and gold ally rings.
- Add idle movement, physical lunges, ranged projectiles, hit reactions, healing, status, shield, miss, damage-number, and knockout feedback.
- Add persistent 1x/2x speed selection and reduced-motion support.
- Drive presentation from resolved round actions and logs; presentation must never alter combat results.
- Integrate the reusable stage into authored C2 battles and C4 challenge battles.

## Presentation event flow

1. The deterministic battle engine resolves the round normally.
2. `buildBattlePresentationEvents` converts the resolved action order and logs into visual-only events.
3. The React presentation controller plays events in order.
4. The battlefield highlights the acting cutout, targets, move family, numeric result, status, and knockout state.
5. Normal battle planning remains disabled while the event queue is playing.

## Reusable effect families

- Impact
- Slash
- Charge
- Projectile
- Heal
- Shield
- Status

Move definitions select a family from category, effects, and tags. Signature-specific VFX can extend this layer later without changing the engine.

## Integration audit

- The presentation controller belongs to each active match component, not the surrounding Coliseum hub.
- C2 and C4 share the same visual stage and effect queue.
- Team selection, result recording, support items, and reward calculations remain outside the presentation layer.
- Temporary integration workflows must remove themselves before the PR is opened.

## Deferred

- Unique frame-by-frame creature animation
- Species variants and cosmetic-specific battle framing
- Audio and voice cues
- Critical-hit rules or presentation beyond existing engine data
- Unique signature-move cinematics
- Phaser migration
- Manual responsive and gameplay tuning

## Acceptance criteria

- Existing profile images appear as full cutouts in active C2 and C4 battles.
- Ranch team is presented on the left and enemy team on the right.
- Enemy cutouts are horizontally mirrored.
- Target selection, planning, item use, round confirmation, result recording, rewards, and save flow remain functional.
- Resolved attacks produce ordered readable feedback.
- 1x/2x and reduced-motion settings persist locally.
- New presentation regression tests and the existing full test suite pass.
- Optimized production build passes strict TypeScript checking.
