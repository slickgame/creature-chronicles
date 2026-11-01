# Breeding Pen finishing pass — November 1, 2026

The approved eight-window directions remain intact: Inspect/Change Parent/Support Items A and Inheritance/Pair Options/Chance Details/Review Attempt/Breeding Ledger B. The finishing pass reuses registered character profiles, bundled fonts, existing gold frames and Ledger B fidelity-v5 rounded cream controls. No new character or painted scene assets were needed.

## Changes

- Rounded cream role chips, secondary actions and paper journal controls now share the existing v5 family. Navy/gold frames and emerald primary actions retain their approved materials.
- Shared form, summary, warning and comparison cards use a consistent 6px corner. Pair Options and Chance/Review illustration frames have physical 10px insets so live imagery sits within the engraved rim.
- Change Parent's short-phone details are more compact without removing readiness/costs. Short landscape arranges live vitals and the pair preview side by side, with actions and the selection-only caption underneath. The complete-candidate record uses a compact circular information button.
- Review Attempt's title fits 360px phones alongside its Back button and arrow.
- Support record Close has an explicit navy/gold face and readable ivory text. Support, candidate/Inspect and Inheritance record Close buttons cannot shrink when their title wraps.
- Ledger B retains its existing curved controls, inset history table and aligned dividers.

## Verification

`scripts/validate-breeding-polish.mjs` runs the actual production build in an isolated browser with detached test saves. It checks all eight windows and their meaningful tabs/focus views at 1440×900, 390×844, 360×740, 1920×720, 390×500 and 844×390. It also checks nested candidate records/Inspect, item details/review cancellation, full inheritance records, readiness/rewards and Before confirming on desktop and phone. Checks cover viewport/parent-control bounds, actual text ranges and overflow. Genuine long read-only record bodies may scroll; their horizontal width and surrounding controls remain checked.

The complete flow uses UI selection of a player giver and Marlow receiver in a detached local save, verifies selection writes no gameplay data, double-clicks confirmation, and verifies exactly one saved attempt and one Energy/Hearts charge. The actual saved pair is then opened in the Ledger. No real user save or hosted attempt is used for this transaction test.

Screenshots under `docs/validation/breeding-polish` are actual running-game captures, using isolated QA values; comparison sheets only arrange those captures. They are not generated concept art.

PR #21 remains draft and unmerged. Publication is to its existing branch preview only.
