# Inspect A — Illustrated Dossier

The user selected A from the attached three-direction comparison. Only A is approved. This kit is integrated into the five compact Breeding Inspect tabs; other seven-window density work remains separate.

## Asset map

- `gold-botanical-corner.webp`: optimized true-alpha painted ornament, used sparingly on panels/full-record windows.
- `masters/gold-botanical-corner.png`: untouched generated RGBA master. Exact built-in generation prompt is adjacent. No creature, UI text or data is baked into it.
- `icons/*.svg`: 18 native editable ivory/gold symbols for tabs, roles, conditions, identity and lineage. These extend the existing gold interface family, with a distinct pink Affection heart. Rebuild with `node scripts/build-inspect-dossier-a.mjs`.
- `vital.svg`: editable navy plaque with subdued gold rim, independent of text, numbers and progress.
- `references/approved-a.jpg`: unchanged user-supplied comparison board; approved direction is the left-hand A column. Its text/numbers and bar fills are illustrative, never production game logic.
- `manifest.json`: hashes/dimensions for new files and reused production assets. Refresh with `python scripts/package-inspect-dossier-a.py`.

Reused: fidelity-v2 pavilion, wood header, substantial frames, cream/enamel/emerald buttons, canonical full-body profiles, existing Tinos 400/700 WOFFs (no extra font service), painted Energy/Heart/XP emblems, six stat illustrations, Work Skills A's 4×2 atlas and the existing talent illustration family. Original art/provenance/licenses remain with those source kits.

## Runtime design

A's five icon-led enamel tabs stay visible above the creature/dossier stage. Content-sized navy/gold panels avoid the old large blank area. Overview uses exact live values with Energy/Affection/XP meters and Heart pips; role chips have individual symbols and complete hover/focus/tap explanations. Stats uses one six-row table, real innate grades and actual growth progress. Work uses painted skill art, live level/XP and explicit Active/Planned labels. Talents have actual effect text, grade seals and canonical talent art. Lineage has risk, recorded parents and markers with full records available. Help windows and tooltips share the wood/navy/gold style.

Only presentation changes: no costs, probabilities, stats, balance, save schema, RNG or transaction code is changed. Artwork always uses the existing registered complete figure; missing/player art remains an honest named fallback. Phone focus, collection paging, full notes and reduced-motion behavior remain supported.

See docs/INSPECT_DOSSIER_A_RUNTIME.md for current validation and actual-game captures. Keep PR #21 draft/unmerged.
