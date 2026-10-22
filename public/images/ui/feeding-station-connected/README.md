# Connected Feeding Station B / A / C

Approved as three connected views, rather than competing alternatives:

- B: scenic pantry hub.
- A: resident meal ledger and selected creature.
- C: ingredient gallery, reserves and automatic feeding permissions.

`approved-connected-concept.png` is the unchanged approved generated board. Its animal symbols are illustrative; runtime uses canonical creature artwork and actual saved identities.

## Runtime asset map

| Asset | Source / purpose |
| --- | --- |
| pantry.webp | New generated clean painterly pantry background; used in desktop scenery and phone vignette. |
| polish-v2/*.svg | Refined editable nine-slice windows, panels, portrait frames, action/button states, quantity cards, state badges and divider; built by `scripts/build-feeding-polish-assets.py`. |
| polish-v2/{meals,supplies,cooking}.webp | Three newly generated individual painted true-alpha action icons; navy ceramic, antique gold and warm farm materials. |
| chevron.svg | Existing native navigation symbol from `daily-ledger-a`. |
| back.svg, menu.svg | Existing `creature-overview-a-v2/icons` native navigation symbols. |
| permissions.svg | New native gold gear extending the existing SVG control family. |
| Tinos Regular/Bold | Existing `forge-slate-v2/fonts/Tinos-Regular.woff` and `Tinos-Bold.woff`; explicitly declared 400/700. |
| Resident images | Existing canonical variant bust portraits through `portraitPath`; never full-body profiles or regenerated characters. |
| Resource images | Existing resources-v2 / resources-v3 / resources-v4 painted stock illustrations. |
| Shared count paw | Existing creature-overview-a-v2/painted-r4/creatures.webp. |

Pantry art was generated with the built-in image generation tool. Original: `exec-537c1624-157e-46bd-a2fd-f16ec2e668fa.png`. The production WebP is a quality-94 format conversion, with no compositing or creative image edits.

Prompt: Clean widescreen fantasy farming RPG pantry environment, no interface/text/borders/characters; warm timber and plaster, open casement window at left overlooking fields and hills, sunlit stone floor, herbs, vegetable baskets, grain sacks, storage jars, barrels and oak shelves; quiet darker right third for the management panel, standing eye-level camera, rich painterly anime-fantasy materials and golden light.

Actual integration and verification: `docs/FEEDING_CONNECTED_RUNTIME_2026-10-21.md`. The board is a concept reference; actual game screenshots are separately labeled under `docs/validation/feeding-connected-*`.

## Visual refinement V2

The user requested a professional asset pass within the approved B/A/C layout. V2 adds 14 SVG surfaces and three painted icons, explicit hover/selected/disabled treatments, darker navy panels, ivory/gold text hierarchy, improved spacing, framed canonical busts and clearer stock/feeding states. Native form fields retain their semantics and gain inset shading. `field.svg` is an optional surface in the kit; runtime fields use CSS. No labels or values are baked into raster images.

Generated icons were mechanically resized to a maximum 512px and converted to quality-94 RGBA WebP. Transparency is retained. Untouched originals and prompt provenance are listed in `polish-v2/provenance.json`; runtime assets are independently deployable. The generator rebuilds native SVGs and manifest without modifying painted icons. Original V1 frames remain for provenance.

Refinement screenshots are actual game output under `docs/validation/feeding-polish-*`; see `docs/FEEDING_MENU_POLISH_2026-10-21.md`.
