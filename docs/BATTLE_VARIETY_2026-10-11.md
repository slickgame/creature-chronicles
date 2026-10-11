# Battle variety: tactical exhibitions

Adds three optional permanent encounters after the Novice, Bronze and Silver finales. The original twelve circuit encounters, champion gates and rotating challenge definitions remain unchanged. Exhibitions occupy the final circuit page and explicitly identify themselves as optional.

- Redfang Exhibition (level 5): pursuit, Marked and Bleed pressure with a field medic.
- Bastion Exhibition (level 8): a guarded spellcaster with a guardian and medic.
- Relay Exhibition (level 11): Energy support, special attacks and tempo control.

First clears grant primarily Gold/GP plus one Focus Manual. Repeat rewards use the existing reduced purse pool and existing Marks/loot transaction. Result IDs retain duplicate protection. Existing saves can access exhibitions immediately when their prerequisite finale is complete.

Four inheritable Focus Manual techniques are available to all five families: Covering Guard (one-ally protection), Clear Head (Bleed/Marked cleanse and Energy), Piercing Echo (special guard breaker), and Checking Blow (physical Slow attempt). They use supported engine effects and existing move training; no saved moves are auto-learned or auto-equipped. Normal eight-learned/four-equipped limits apply.

Rules & Rewards now includes each opponent's role and moves. Exhibitions add counterplay notes, training directions and optional status. A solid parchment panel preserves text contrast. Existing creature artwork and move-category icons are reused; no new image assets are needed.

Validation: optimized Next build and TypeScript pass. 55 focused cases pass across battle variety, move training, round resolution, AI, C2, C3, C4 and C4 sequencing. Scoped ESLint has zero errors and four existing-style warnings. Production Chromium checks cover all three exhibition/scouting dialogs at 1440x900, 390x844 and 844x390, team staging and entry into the new Relay battle. Screenshot review confirms readable scouting and contained layouts. Local image requests use temporary placeholders because the sparse checkout omits production art; placeholders and QA fixtures are not committed.

Next: Builder's Yard gameplay and UI, then Rose Lantern gameplay and UI. PR remains draft and unmerged.
