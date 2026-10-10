# Battle results — approved Coliseum Ledger B

User selected B, with large canonical full-body team art on the left and a single parchment reward/progress ledger on the right. The screen opens after the final playback beat, with a fixed action footer. Phones stack the team above a compact ledger; no main-screen scrolling. Existing battle background, Gold icon and Marks Exchange artwork are reused. No creature art is regenerated or altered.

The concept's illustrative reward amounts and “Rewards recorded” label are not used as gameplay facts. Existing Circuit and challenge transactions require confirmation, so the screen explicitly says “Preview · not yet recorded.” Record & Return / Record Challenge Result use the unchanged, idempotent result callbacks. Back to Battlefield permits inspection or eligible Revival Salve use before recording; Review Result reopens the ledger.

Circuit and C4 compute a read-only receipt through their existing pure result functions. The preview therefore includes the actual deterministic repeat purse, eligible Marks/materials/items, participation XP, projected levels and numeric growth. Each progress row shows XP toward the next level and the first numeric gain. Select a row for every stat change and unchanged innate grades. No new move awards are invented. Battle Recap exposes actual accumulated performance and the complete round log. Gauntlet continuation explains existing 30% HP / 25% BE recovery and retains the locked roster flow.

Validation:
- Production Next build and TypeScript pass.
- Scoped ESLint: zero errors, 15 image/existing memo warnings.
- C2 result tests: 10 checks passed; separate C4 suite: 11/11 passed.
- Production Chromium victory and level-up ledger checks at 1920×1080, 1440×900, 1280×720, 768×900, 390×844, 360×740 and 844×390: no main scrolling, missing visible art, offscreen or blocked controls. Recap and growth popups fit horizontally.
- Defeat checked at 1440×900 and 360×740. Gauntlet checked at 1440×900, 360×740 and 844×390, including one recorded stage and saved next-stage index.
- Save snapshots remain identical while previewing and opening popups; confirmation creates one history entry. Back/review navigation works.
- Visual review corrected inherited pale text/shadows on parchment; final desktop, phone and landscape checks repeated.

Draft PR remains unmerged. Combat balance, save schema and reward transactions are unchanged. Full regression suite not rerun; prior unrelated retired-Town source-test failures remain documented in earlier UI notes.
