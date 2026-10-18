# Growth factors A — concept fidelity refinement

The user compared the live game with the selected A board and requested closer fidelity in boxes, colors, fonts, spacing and icon sizes. The acceptance reference remains `public/images/ui/stats-growth-b/factors-a/approved-concept.webp`; the original game evidence is retained as `docs/validation/factors-a-*`.

## Visual changes

The window now uses warm ivory typography with a larger headline and stat icon, larger section controls, readable factor labels/descriptions, larger painted factor artwork and prominent values. The contribution panel uses a dark forest-green face and ivory result rather than bright teal with mint numerals. Summary boxes have balanced widths, larger values and more breathing room. The note strip and primary return button follow the concept's hierarchy.

Five scoped nine-slice SVG frames extend the existing gold/ivory frame family: window, ornate factor card, dark-green result, note and summary. `scripts/build-growth-factor-frames.py` deterministically reproduces them. Navy faces avoid the previous grey gloss; corner flourishes stay fixed-size through nine-slice rendering. Raster icons are unchanged direct RGBA assets.

The wide desktop composition is bounded and centered. Medium/short desktops use a reduced density; phones retain stacked cards and explicit sections. The narrowest phone still keeps all three factors, contribution, caveat, summary and Back control accessible. Landscape retains its compact horizontal formula. Styles are scoped to the growth window; other game dialogs do not receive the treatment.

## Validation

The production Next build passed. All 140 actual-game browser checks passed, with zero runtime errors and unchanged persisted saves. The walkthrough covers desktop, phone, short desktop, wide desktop and phone landscape. Evidence is retained separately as `docs/validation/factors-fidelity-*`, preserving the pre-refinement screenshots. Checks cover all six attributes, all detail sections, cap wording, loaded production assets, containment, sibling overlap, Escape/Back, selected-attribute retention and unchanged persisted synthetic saves. Rendered font metrics verify a 34px desktop title, 17px descriptions/note text, 50px result and 27px formula; scoped rules prevent the older dossier paragraph rule from forcing text back to 14.08px. No growth calculation, save schema or transaction behavior changed. Hosted deployment readiness is checked against the exact commit; the hosted project is protected.

PR21 remains draft and unmerged.
