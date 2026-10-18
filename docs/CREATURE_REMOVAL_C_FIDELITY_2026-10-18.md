# Removal C concept fidelity

The user compared the deployed screenshot with selected C and requested closer visual fidelity. The original selection remains `public/images/ui/creature-removal-c/approved-concept.png`.

The runtime now uses heavier rounded gold frame ornament, richer navy panel faces, a diamond divider, larger bold serif headings, enlarged painted action/book icons, a gold-framed face crop of canonical creature art, uppercase identity badges, a matching armor silhouette, illustrated balance rows and larger decorated Donate/Release/Keep actions. Close is visually an × while preserving its accessible label, Escape behavior and focus containment. No creature artwork was regenerated.

Native nine-slice assets are reproducibly built by `scripts/build-removal-c-frames.py`. Button faces use uniform color to avoid slice seams at short heights. Phones and short landscape windows keep their existing compact/focused layout and full returning-item pages. All removal, reward, equipment, stale-review and protection behavior is unchanged.

Actual screenshots and validation results are stored separately under `docs/validation/creature-removal-c-fidelity-*`. The comparison focuses on title/portrait/action proportions, ornament, panel hierarchy and phone fit, including pending starter-goal rewards. PR21 remains draft and unmerged.

Validation: production build/TypeScript passed; 197 browser checks passed at 1440×900, 1366×768, 1280×720, 390×844, 360×740 and 844×390, including blocked states, long names, all equipment pages, Care/Habitat cancellation, confirmed removals, exact-copy conservation and reload. ESLint reported zero errors and seven native-image warnings for the edited component. Actual desktop and phone captures were compared with C after eliminating button-slice seams.
