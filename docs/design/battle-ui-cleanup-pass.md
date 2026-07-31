# Battle UI Cleanup Pass

## Goal

Make the portrait-based 3v3 battle screen easier to read and operate without changing battle calculations, AI, rewards, or save behavior.

## Problems observed in the first browser screenshot

- Full profile images were too large and overlapped within each formation.
- The 570px arena pushed commands below the fold on a 1750×895 desktop viewport.
- Per-creature Plan buttons competed with target selection and the command HUD.
- The three-column command deck made moves, queue entries, and battle logs too narrow.
- Support items occupied permanent space despite being optional.
- A 24-entry battle log added unnecessary density.

## Patch scope

- Reduce and separate portrait cutouts into clear front, upper-back, and lower-back lanes.
- Reduce the arena height while retaining attack, hit, status, healing, and knockout effects.
- Keep only the current-actor prompt and queued-action editing on field nameplates.
- Dim non-selected enemies after a target is chosen.
- Expand the desktop frame and use a wide action panel with a stacked queue/log sidebar.
- Increase move-button and command text size.
- Collapse support items into an optional details drawer.
- Limit the live battle log to the six most recent entries.
- Preserve responsive one-column behavior on narrow screens.

## Manual validation focus

- No same-team portrait overlap at 1750×895 and 1366×768.
- Current actor, selected target, and available moves are immediately understandable.
- All four moves remain readable without horizontal overflow.
- Confirm Round remains visible in the queue panel.
- Support-item targeting and restrictions remain unchanged.
- 1×, 2×, and Reduced Motion remain functional.
