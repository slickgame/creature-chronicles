# Approved A — Ranch Dossier asset kit

User selected A on October 12, 2026 (America/New_York). The approved design is integrated into the existing roster and shared profile tabs.

Location: `public/images/ui/ranch-dossier-v1/`. Open `preview.html` to review the actual reusable assets. `dossier.css` provides opt-in parchment panels, scalable brass edges, walnut headers, selected/default/disabled tabs, keyboard focus, and tintable SVG masks. `manifest.json` inventories the kit. 24 individual SVG icons cover six stats, six tabs, energy, navigation and management actions. Use adjacent visible labels and aria-hidden icons. The runtime tabs support Arrow Left/Right, Home/End, roving focus and associated panels; the asset preview is static.

Keep existing approved creature portraits and full-body art. Reuse `ranch-v2/wood.webp`; do not regenerate characters. Decorative botanical art must have empty alt and pointer-events:none. Do not bake text, meters, buttons or stats into raster artwork. Generated paper is a cover texture, not guaranteed seamless. Preserve aspect ratio for botanical ornaments.

## Art provenance

Parchment and botanical corner generated using built-in image generation; original PNGs preserved locally and generated masters retained by the image service. Runtime uses 768px WebPs (about 150 KB combined), preserving botanical alpha. SVG icons authored as project-native vector geometry, not generated raster icons. CSS brass frames scale without stretching corner art.

### Parchment prompt

Use case: stylized-concept. Production UI texture for approved Creature Chronicles Ranch Dossier concept. Generate a square flat warm ivory parchment surface, subtle fine paper fibers and delicate warm honey mottling. Very low contrast throughout to support dark readable text. Edge-to-edge paper, uniform lighting, no border, no shadows, no folds, no burns, no writing, no objects, no symbols. Elegant sharp painterly game material, clean well-kept ranch ledger paper. Not a mockup. Only the texture.

### Botanical prompt

Use case: stylized-concept. Asset: transparent decorative botanical corner for Creature Chronicles warm parchment Ranch Dossier interface. Single elegant L-shaped sprig composition arranged along bottom and left edge of a square, generous transparent empty upper-right 80 percent. Small olive and muted antique gold leaves on thin branching stems, restrained hand-painted sharp anime-painterly details, warm earthy palette, flat front view. Delicate rather than lush, about 12 leaves. No panel, no paper, no frame, no words, no symbols, no shadow, no background. Transparent alpha. This is reusable game UI ornament, not a finished screen.

## Implementation and validation

The roster now embeds all six tabs beside approved creature artwork. Narrow screens stack the profile; the detail panel scrolls while the main screen remains bounded. Expanded Profile & Care retains the same approved portrait. Roster portraits are larger, favorite/lock controls use vector assets, and all existing rename, protection, release/donation confirmation, comparison and navigation handlers remain intact. No save schema or game balance changes. Other non-dossier uses of shared detail retain their existing artwork rules.

- Optimized Next production build and TypeScript pass via `npx next build`.
- Configured regression suite: 194 passed, 0 failed.
- Scoped ESLint: 0 errors, 6 existing image/effect warnings.
- Production Chromium: all six tabs at 1440×900, 390×844 and 844×390; no page or tab-panel horizontal overflow. Arrow navigation and Home/End semantics, persisted protection, rename, cancellation and expanded profile checked.
- Sparse checkout omits legacy breeding images, so `npm run build` prebuild asset validation cannot complete locally. The direct production build succeeds; no manifest stubs are committed. An unrelated legacy Bunny portrait is missing in the QA fixture; Mira uses real approved art.

PR #21 remains draft/unmerged. Publish only to `feature/ui-ranch-ledger-2026-09-29` and report Vercel status separately.
