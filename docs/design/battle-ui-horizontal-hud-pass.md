# Horizontal Battle HUD Pass

## Goal

Use the browser screenshot from July 30, 2026 as the acceptance target for a second battle-presentation cleanup.

## Problems addressed

- Staggered battlers still overlapped while leaving unused central space.
- The live battle header consumed too much vertical room.
- The move grid extended below the viewport.
- Move cards exposed too much secondary information at once.
- The permanent round queue and battle log competed with move selection.
- The guided first-battle coach depended on selectors from the former card battlefield.

## Implemented layout

- Three ranch battlers form one straight horizontal line on the left.
- Three enemy battlers form one straight horizontal line on the right.
- Each portrait is clipped to its own grid lane so adjacent artwork cannot overlap.
- The battle header becomes a single compact line with division, round, message, and exit actions.
- A projected turn-order strip appears above the battlefield using portrait tokens.
- Ranch tokens glow green and can be clicked to plan or edit actions.
- Enemy tokens glow red and keep their actions hidden.
- The default move card shows only name, category, core numbers, and availability.
- A separate information button opens full move details and effect explanations.
- Planning progress, support items, Battle Log, and Confirm Round share one compact footer.
- Battle Log opens in a modal instead of occupying permanent screen space.

## Preserved behavior

This pass does not change battle resolution, AI, move legality, target rules, Speed order, cooldowns, Battle Energy, support-item rules, Combat XP, rewards, result recording, Coliseum progression, or save data.

## Manual validation

- Confirm six battlers remain separated at 1750×895 and 1366×768.
- Confirm the complete move grid and action footer remain visible at 1750×895.
- Confirm player order portraits plan or edit the correct creature.
- Confirm enemy order portraits remain informational only.
- Confirm move information and Battle Log dialogs open and close correctly.
- Confirm support items retain their target and once-per-match rules.
- Confirm the guided Chapter 1 battle coach highlights an enemy, a move, and Confirm Round.
- Confirm 1×, 2×, and Reduced Motion still work.
