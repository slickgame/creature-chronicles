# Horizontal Battle HUD Validation

## Automated gate

- Generate and validate breeding scene assets.
- Run the complete regression suite, including the horizontal battle HUD source checks.
- Run strict TypeScript checking through the production build.
- Produce the optimized Next.js build.

## Manual browser check

Use Opening Scrimmage at approximately 1750×895 first.

- The ranch team appears as one horizontal line of three on the left.
- The enemy team appears as one horizontal line of three on the right.
- Portrait art remains clipped within its own lane without same-team overlap.
- The compact battle header remains one line on desktop.
- The projected order strip shows six portrait tokens with green ranch and red enemy glows.
- Clicking a ranch order token selects that creature for planning or editing.
- Move cards fit above the fold and expose detailed information through the `i` button.
- Support Items opens as a compact popup.
- Battle Log opens as a modal and retains the full turn-by-turn record.
- Confirm Round becomes available after every living ranch creature has an action.
- The guided first-battle coach can highlight an enemy, a move, and Confirm Round.
- Repeat at 1366×768 and a narrow mobile viewport.
