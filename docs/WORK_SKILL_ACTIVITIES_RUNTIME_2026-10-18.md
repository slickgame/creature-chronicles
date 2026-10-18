# Work Skills activity shortcuts

The existing Work Skills details now connect to actual production activities. Use & training has an Open activities button for each of the six active skills. It opens the existing production window with the profile creature selected and the matching first activity:

| Skill | Production section | Initial activity |
| --- | --- | --- |
| Harvesting | Gathering | Kitchen garden |
| Material Gathering | Gathering | Woodlot |
| Husbandry | Gathering | Milk production |
| Hunting | Gathering | Hunting trail |
| Crafting | Workbench | Planks |
| Cooking | Kitchen | Rations |

Other locations and recipes remain available through the production selectors. Each action continues to preview and train its actual matching skill. Opening an activity does not start work or spend anything. Availability rules remain visible: for example, opening Husbandry for a feline keeps that feline selected and explains the female bovine requirement.

The Skill details return button and Escape return to the same detail tab. Back to Work Skills retains the selected skill, filter and page. Activity results use the existing save provider; returning from work immediately displays the saved skill progress. The activity entry retains the original creature even when that creature is not first in the roster. Players may explicitly select another worker within production.

`ProductionBook` adds optional `initialWorkerId` and `backLabel` props. Existing Resources callers retain their original defaults. A missing explicitly selected worker does not silently fall back to a different creature; the selector offers Choose a creature and action validation blocks work until a valid worker is selected.

Breeding and Cleaning retain their planned descriptions and have no activity shortcut. No new progression, costs, bonuses or visual redesign is introduced. The new action uses the approved primary button frame; all work, recipes, confirmations and receipts reuse existing production surfaces.

## Verification

- Production Next build succeeds. Focused React/TypeScript ESLint: no errors; four existing native-image warnings.
- Eight focused engine tests pass for the skill ledger and recipe workers, including matching XP, worker isolation, proficiency, exhaustion, injury, training, reserves and facilities.
- `scripts/validate-skill-activities.mjs`: 58 browser checks at 1440×900, 390×844, 360×740 and 844×390. All six routes carry the selected creature and activity; both planned skills have no shortcut; browsing/returning writes nothing; explicit return and Escape retain the detail tab and skill selection. Real Crafting/Cooking transactions with the third roster creature level their matching skills from 5 to 6, update the returned details and preserve the first creature's Energy and skill records. No browser errors.
- Existing `scripts/validate-recipe-workers.mjs`: 34 additional browser checks for the default Farm Management route, recipe reviews, cancellation, layout and save/reload progression.
- Actual production-game screenshots and browser results accompany this document under `docs/validation/skill-activities-*`. Synthetic saves are used. The sparse-checkout harness substitutes only unavailable unrelated legacy art; actual available resource art, Mira's canonical art and all UI frames are unchanged.

PR21 remains draft and unmerged. Hosted deployment status is checked against the published commit; local screenshots are not claims of browser access to the protected hosted preview.
