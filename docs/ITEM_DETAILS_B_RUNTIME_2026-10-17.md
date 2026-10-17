# Shared Item Details B — October 17, 2026

The user approved compact inspector B (`be492ca5-df1a-4412-b75a-1db502221ed8.png`). EquipmentGuide now renders that slate/gold design instead of the oversized parchment illustration and eight-page selector.

Desktop presents compact rarity-framed item art and its actual description, set bonus and passive together beside the main stat and all four recorded substat slots. Phones use focused Stats / Set & passive tabs. Short landscape keeps a compact two-column layout. All views retain Back to equipment and Rules & roll ranges. The original frame, category badges, actual sculpted set marker and approved stat atlas are reused; no new art family or changes to equipment rules.

Long descriptions and unusually long passive text have explicit full-detail pages, preserving every word. Fixed legacy bonuses beyond the normal stat rows remain available. Owned pieces use their supplied copy metadata. Missing copies and generated `new_` profiles are labeled “Blueprint preview · not an owned copy.” Inspection never purchases, equips or improves gear.

Rules open in a matching focused window with topic selection and previous/next navigation: full description, rarity starting counts, power/legacy preservation, legal main/substat pools, hidden milestone outcomes, actual per-grade HP/Speed/other roll ranges, set calculation and full passive. Evasion stays outside gear pools. Close/Escape returns to the same item inspector; Back to equipment returns through the original caller.

Existing EquipmentGuide callers now share this inspector: owned equipment gallery, creature Equipment tab, Improve workbench, Forge recipe/output guidance and EquipmentStats links in the Outfitter. The Outfitter’s outer comparison and main shop screen retain their existing design for a later review.

## Verification

- Final production Next build and TypeScript passed. Modified TSX lint: zero errors, one image performance advisory for the existing image rendering approach.
- Actual production browser checks passed 105 layout states, including all guide topics and Stats / Set & passive states at 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740 and 844×390. No internal panel overflow or controls outside the frame.
- Cases included a Legendary four-substat piece, Champion Harness’s full Guarded/non-stacking passive, and Common gear with no set and empty substat slots. No inspection save writes or browser runtime errors.
- Creature Details returned to the same selected Hands slot, Improve returned to its workbench, Forge blueprint guidance returned to its recipe output preview, and Outfitter guidance returned to Full Comparison. Each route preserved the save throughout inspection. Travel/NPC navigation was excluded from the no-write baseline because it can separately award ranch goals.
- The final preview-label refinement was verified in the final build’s entry-route checks; owned-case layouts remain unchanged.

Actual local-production screenshots, using disposable synthetic saves:

- `validation/item-details-b-desktop.webp`
- `validation/item-details-b-phone.webp`
- `validation/item-details-b-landscape.webp`
- `validation/item-details-b-passive-phone.webp`
- Results: `validation/item-details-b-results.json`

Visual inspection confirmed the approved compact composition, readable four-substat rows, slate/gold frames, bounded art and phone return controls. Sparse-checkout unrelated legacy images used a workshop fallback in local QA; every equipment/stat/category/set asset shown here is present in the production kit. Hosted gameplay remains authentication-protected and was not exercised. Publish to the existing feature branch; keep PR #21 draft and unmerged.
