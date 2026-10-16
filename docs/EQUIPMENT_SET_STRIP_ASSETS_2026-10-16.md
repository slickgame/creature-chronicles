# Approved A equipped-set strip and reproduction kit

October 16, 2026 · existing Creature Chronicles feature branch · draft PR #21.

## Live behavior

Access Menu → Inventory → Browse items → Equipment, then choose a creature. The approved A set strip is part of the live C2 gallery. Only that creature's actually equipped set families with count > 0 populate it. Inventory stock, another creature's gear and gallery search/filter choices do not affect the strip. Incomplete sets show progress such as 1/4, 2/4 and 3/4; complete groups show Active (or Active ×2 for repeated two-piece groups). A set disappears when its final piece is removed. No creature selected and no matching equipped gear have explicit empty states. The full Set details book remains a separate reference to all four existing set rules and their members.

The strip uses the same wearer summary as combat and comparisons; there is no second set calculator, speculative bonus or transaction. Counts update after equip/removal and recipient changes. Existing confirmation, cancellation, locks, Gold charges, rarity/power stats, ownership and saved rolls remain unchanged. Phone strips have one set per page, with visible Previous/Next controls when needed. Phones show two illustrated gear cards per page; short landscape shows four and desktop eight. This preserves readable art and reachable controls without menu scrolling.

## Production assets and provenance

Four original painterly set crests were generated separately with built-in image_gen: Vigor (emerald heart/leaf shield), Bulwark (oak shield), Striker (crossed swords) and Swift (winged boot). All originals have real RGBA transparency. Optimized 256px alpha WebPs are wired into live cards and the strip. Original PNG filenames, SHA-256 values, derivative hashes and exact prompts are in public/images/ui/equipment-c2/manifest.json, setStripUpdate. Originals are included in the Drive kit. Generation used original text briefs matching the approved reference; no Epic Seven art was copied.

Six editable, text-free vector surfaces extend the existing SVG style: strip panel, set chip, active pill, rarity pill, progress track and botanical divider. Strip panel/chip and active pill are used in the game; the remaining surfaces are available for matching windows. Existing C2 five rarity frames, slot/control symbols, upgrade badges, stat/substat rows, equipped ribbon and comparison surfaces remain reusable. Approved apothecary background, parchment, title and button/frame assets are reused. Existing canonical equipment artwork is retained. Concept-only gear names, percentage mains and sample values are not new gameplay content.

The complete downloadable reproduction kit preserves public/images paths for all C2/apothecary assets and available canonical equipment art. It includes original new PNG masters, manifests/prompts/hashes, these notes, live component/styles, QA scripts/logs and reviewed screenshots. Open public/images/ui/equipment-c2/set-strip-assets.html for the asset contact sheet and linked base kit. UI labels, counts and stats remain real editable HTML; they are never baked into an image.

## Validation

All 350 regression tests pass. Direct optimized Next production build/TypeScript and scoped lint with zero errors pass. Production browser checks cover 1440×900, 390×844, 360×740 and 844×390: gallery/strip/control fit, decoded real new icons, paged set details, equipped-only counts, excluded zero-piece sets, search/filter independence and empty recipient switching. Real equip/removal checks exercise Swift 4→3→2→1→0, introduce Striker 1/4, cancellation and unchanged Gold. Missing sparse legacy images are neutral only in the QA harness; no production substitutes were added.

Publication, Vercel status and protected hosted gameplay verification are reported separately. PR #21 stays draft and unmerged. Next: balance starter loadouts and review the comparison/upgrade windows against the approved illustrated direction.
