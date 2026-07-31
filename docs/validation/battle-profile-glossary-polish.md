# Battle Profile and Glossary Polish Validation

## Automated

- Run asset preparation and validation.
- Run the full regression suite, including battle HUD source checks.
- Run strict TypeScript checking through the Next.js production build.

## Manual browser review

At approximately 1750×895:

- confirm the battlefield extends farther downward without pushing the command footer off-screen;
- confirm all six profiles are larger, raised, and still isolated within their lanes;
- confirm selection rings, hit effects, projectiles, and nameplates remain aligned;
- open status, support, and damage moves and review Gameplay Terms;
- hover or keyboard-focus underlined terms and confirm the exact definition is available;
- hover an active status in a creature nameplate and confirm its rule is explained;
- repeat at 1366×768 and mobile width.
