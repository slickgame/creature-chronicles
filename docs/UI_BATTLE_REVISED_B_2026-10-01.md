# Revised B battle interface and sequential playback

Approved after the user's clutter review and request for projected damage/effects and readable action-by-action combat.

## Visual correction

- Keep allies together on the left and enemies on the right, separated by open ground. Phone portrait uses labelled enemy/ally rows. Preserve original uncropped full-body profiles.
- Replace stretched wood/parchment rectangles with a small title, compact floating olive order strip and one shallow cream command dock. Team-colored portrait rings distinguish initiative entries.
- Move categories and all equipped moves into a native modal. Three rows per page, explicit target chips, projected effects and Queue Move; Confirm Round remains separate. Compact layouts scroll only inside dialogs.
- Reuse existing arena, category and item art; soften the backdrop. CSS renders the restrained borders instead of stretching decorative image frames. No creature assets change.

Approved concept references were generated in this conversation: `exec-ed05da9b-de48-4640-95de-8008d463b0b8.png` (arena) and `exec-f6051dfd-3e32-4aa4-a8c2-4fc445dd26ad.png` (move popup). Their clothed creatures are layout stand-ins; in-game canonical artwork is retained. No new production bitmap was needed for this correction.

## Combat feedback

The previous UI displayed the final round state while animating text-derived events. Circuit and C4 now consume an ID-addressed engine trace containing immutable state snapshots after resource spending, every target/effect, misses, skipped actions, bleed, status expiration and energy regeneration. Duplicate names cannot misdirect feedback. The trace is transient and is not saved.

Each announcement highlights the actor and recipients, then impact feedback and the relevant HP/BE/status values appear together. HP/BE bars interpolate to each individual value. KO appears at its actual impact. The initiative strip advances to the current actor and remaining actors, then identifies round recovery. Full future-round logs are hidden until playback completes. Result recording remains disabled during playback.

Pause/Resume, Next Beat and 1×/2× controls are available during resolution. Reduced motion disables visual motion and keeps brief readable event intervals. No combat formulas, initiative rules, AI choices, loadout caps or save schemas change.

## Projection semantics

The selected move previews target-specific damage conditional on hitting, actual hit chance, effect chance, remaining HP, capped healing, energy restoration after paying the move cost, and effect strength/duration. The helper reuses the engine's targeting, effective stats, species/status modifiers, healing and effect resolution on immutable projected state. It assumes successful effects in sequence, never checks hidden rolls or enemy planned actions, and labels the estimate accordingly. Taunt normalization and area targets follow the same rules as resolution. Earlier actions, misses and resisted effects can change the outcome.

## Validation

- Production Next.js build/TypeScript pass. Sparse checkout asset preparation remains unchanged; no local generated-manifest stub or QA save is committed.
- Regression: 149/151 pass. Only the two previously documented retired-Town source checks fail. All 17 focused battle tests pass, including new independent assertions for three separate hits on one target, duplicate names, input immutability, final-state convergence, guard-adjusted previews, healing caps, post-cost energy refunds, stun skips, bleed, recovery and KO.
- Targeted ESLint: zero errors, 14 warnings (image elements, existing initial preference effect and roster dependencies).
- Production Chromium at 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390: no main scrolling, blocked/offscreen controls, broken visible images or page errors. Main/detailed/nested popup navigation and Escape work. Desktop arena and popup visually inspected against the revised concept.
- Browser flow: queue three attacks through the modal target picker; verify damage previews; confirm/pause on the first action with original HP intact; step through a real round and observe six distinct HP changes; return to planning. C4 layout, item access, exact kit consumption, cancel/confirm forfeit and one recorded loss pass. A completed Circuit victory also passes the revised playback, desktop/phone result review and one recorded win with Combat XP.

PR21 remains draft and unmerged; publish only the existing branch preview.


## Approved expandable dock — 2026-10-02

Moves now expands the bottom parchment dock inline and shifts the battlefield upward. The ally planning rail stays above categorized moves and target projections. Battlefield targets remain clickable. Queue Move and Confirm Round collapse the dock; Collapse leaves plans unchanged. Phones use Choose move / Preview & queue tabs. Move lists and multi-effect projections paginate; Full details remains a scrolling native dialog with every effect. Existing canonical art and battle rules are unchanged.

Removed the arena background desaturation and locally overrode the global disabled-button grayscale/opacity for battlefield creatures and playback ally tabs. Disabled semantics remain intact during resolution. Fainted creatures retain their separate KO treatment.

Validation: production Next build/TypeScript passed; scoped ESLint zero errors (9 image warnings); 10 focused interface/HUD tests passed. Production Chromium checked collapsed and expanded states, move pagination, selected-target previews and nested details at 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390. No main scrolling, missing visible art, out-of-viewport controls or blocked controls. Queue/target/pause/step checks passed, including six separate HP changes and computed no-grayscale/full-opacity battlefield buttons during playback. Full regression suite was not rerun for this presentation-only change; prior two unrelated retired-Town source failures remain documented above.
