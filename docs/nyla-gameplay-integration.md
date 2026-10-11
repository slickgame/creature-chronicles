# Nyla Base Feline — gameplay art integration

The approved Nyla art has been wired to the game's existing **Base Feline** variant. This is a presentation-only change; it does not alter saves, stats, gameplay outcomes, naming, breeding rules, or scenes.

## Visible in game

- Base Feline **card/roster image** → Nyla 02 (bust portrait).
- Base Feline **profile/full-body** → Nyla 01. Existing screens that resolve images from the variant registry pick these up automatically.
- Shared **battle stage** → Nyla 03 (idle), 04 (basic attack), 05 (special attack), 06 (guard). This stage is used by Coliseum and other combat flows; effects, move logic, and turn mechanics are unchanged.
- **Garden Tending** assignment card → Nyla 09 harvesting image; other jobs show Nyla 01.
- **Ranch House sleep confirmation** → Nyla 10 if the ranch currently owns any Base Feline. The sleep mechanic and recovery results are unchanged.
- Base Feline starter is still named **Mira** in the existing game. Nyla identifies the approved artwork, not a forced rename.

## Asset transfer status

Approved 01, 02, 03, 04, 05, 06, 09 and 10 were transferred from Google Drive into `public/images/creatures/feline/nyla/` as transparent PNGs.

Approved **07 Taking Damage** and **08 Defeated/KO** could not be transferred through the connected tools. The battle screen temporarily uses Nyla 06 (plus existing hit shake) for damage and Nyla 10 for KO. This avoids broken URLs while those two approved PNGs are pending. Their image files still need proper transfer to the repository and corresponding selector updates in `src/data/nylaGameplayArt.ts`.

## Breeding scene protection

No files in `public/images/breeding/`, `src/features/breeding/`, `src/data/breedingSceneImages.ts`, or scene-manifest generation scripts have been edited. The existing breeding-scene images and behaviors remain untouched. The shared creature portrait used by normal selection UI can display the newly approved art wherever that generic variant image is used.

## Validation

`npm run test:regression` includes `tests/nyla-gameplay-art.test.ts`, which checks asset existence, the Base Feline mapping, battle poses, ranch work, sleep and the separate breeding-scene manifest.

Check visually on desktop/mobile: Collection card + detail, Feline Habitat, Coliseum normal/special/guard/hit/KO, Garden Tending assignment and Ranch House sleep. Complete `npm test` and `npm run build` before considering the work playtested.

After placing 07/08 in the folder, replace the two documented temporary fallbacks and review all paws against the five-digits-per-paw art standard.
