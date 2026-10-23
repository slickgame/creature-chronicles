# Approved nursery finishing pass — asset kit

The runtime nursery consumes these surfaces, symbols and hatch effects through NurseryPolish, NurseryScene and NurseryScreen. catalog.html remains a standalone sample assembly. The two unchanged approved images are preserved under references/. No substitute creature portraits, egg shells or room artwork are introduced. See docs/NURSERY_POLISH_RUNTIME_2026-10-23.md for actual runtime QA and publication scope.

Surfaces extend the existing day-cycle-v1 SVG system: window, panel, portrait, field, normal/hover/primary/disabled buttons, selected card, divider and timer. Use border-image nine-slicing; never stretch ornamental corners across a panel. Panel slices are 44; button slices are 16. Text stays in HTML, not baked into images. Eight editable SVG symbols provide selection, recorded status, information, previous/next, skip, close and incubation.

The original built-in-generated RGBA hatch-halo.png is preserved under source/. effects/hatch-halo.webp is the optimized 800px derivative. Alpha edges and visible halo pixels were checked. Effects remain independent layers: halo behind the existing shell, crack overlay clipped to that shell's alpha, cradle foreground above the egg. Keep the halo subtle (about 0.28–0.45 peak opacity). Thin jagged cracks use a contrasting dark edge, gold seam and ivory center. The exact prompt is recorded in source/hatch-halo-prompt.txt. No extra image service or paid plugin is required.

nursery-polish.css demonstrates reusable states, short fades and a 1.1-second effect. prefers-reduced-motion removes halo/crack motion; Skip must reveal the already-committed receipt. Runtime integration must retain the existing exactly-once hatch action, blockers, save freshness and confirmations. Effects cannot trigger hatching or commit another transaction.

Timer wording: 1 day remaining / N days remaining / Ready to hatch. Progress derives from actual elapsed and total incubation days, clamped to 0–1; never infer it from decorative art. Browsing and Cancel remain read-only. The selected marker supplements color, and keyboard focus is explicit.

Lineage uses actual registered portraitPath assets and real parent identities. Never ship the concept's placeholder horse silhouettes. Preserve missing-parent handling and every note through focused pages. Keep existing fonts under ../../forge-slate-v2/fonts/ with OFL.txt, painted care/growth/lineage assets under ../../creature-overview-a-v2/painted-r4/, and original room/cradle/eggs one directory above this kit.

Open catalog.html to inspect actual assets with synthetic sample values. The catalog intentionally scrolls as a production inventory; this does not supersede the live game's no-scroll rule. Before integration is called complete, verify seven existing viewports, real timer fractions, selection cancellation, source returns, one hatch/birth, reduced-motion/Skip and actual parent portraits.
