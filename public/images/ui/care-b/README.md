# Care B references

`approved-concept.png` is the user's selected B (Care & management split), copied unchanged from the generated preview. It is an acceptance reference, not a runtime background or game screenshot.

`refined-concept.png` shows the requested Tired badge, open-lock action and 16-heart resource layout. `status-protection-study.png` records the distinct condition icons, badge treatments and matching padlocks. Both are design references only. They are not runtime sprite sheets; generate individual transparent assets before integration. The study's Ready badge illustrates an otherwise available healthy creature, not a rule that every uninjured creature is ready.

Care B is integrated in the ranch Care tab. See `docs/CARE_B_RUNTIME_2026-10-18.md` for current verification and `docs/CARE_UI_OPTIONS_2026-10-18.md` for the design review. Runtime icons are individual true-alpha WebP assets in `icons/`; unchanged PNG originals are in `source/`. The source/output mapping and exact prompts are in `manifest.json`. Shared approved frames and existing Energy/Affection icons remain reused. The icon shows the current protection state while its button label names the next action.

No bitmap badge permutations are necessary: a reusable scalable framed badge uses live text and state-specific colors. Names, numbers, statuses and action labels are not baked into runtime artwork. Sick and service artwork are reserved for future gameplay and must not activate new availability or sickness mechanics.

PR21 remains draft/unmerged.

`service-mission.png` is an individual transparent painted compass/commission icon. `service-status-concept.png` shows the proposed blue On service mission badge and Temporarily unavailable copy. These additions are not wired to live availability; guild services currently complete immediately. Do not infer a temporary absence from an accepted/completed contract.
