# Nyla Base Feline — gameplay art integration

Nyla is the **art identity** of the Base Feline, not a replacement for player-assigned creature names. The starter creature remains Mira. The patch is presentation-only: no saves, battle formulas, economy, mechanics or breeding scenes were changed.

## Approved gameplay art now used

- Collection roster/cards: **02 Bust Portrait**; selected creature details and comparisons: **01 Full Body**.
- Feline Habitat creature cards: **02 Bust Portrait**; selected profile: **01 Full Body**.
- Shared creature-detail component: **01 Full Body only where a non-breeding caller opts into useGameplayArt**.
- Battle portrait stage: **03 Combat Idle**, **04 Basic Attack**, **05 Special Attack** for the Feline signature Pounce or special-category moves, **06 Guard**, and **08 Defeated / KO**. Image 07 remains unavailable; damage temporarily uses 06 with the existing hit feedback.
- Battle projected turn order: **02 Bust Portrait**.
- Ranch Chores: **09 Ranch Work** for Garden Tending; **01 Full Body** for other Nyla assignments.
- Ranch house day-advance / sleeping UI: **10 Resting / Sleeping** when the ranch has a Base Feline.
- Ranch hub creature reports: **01 Full Body**.

## Strict breeding isolation

The src/data/creatures.ts shared registry retains the pre-integration Base Feline portrait/profile paths:

- /images/creatures/feline/base_feline_portrait.png
- /images/creatures/feline/base_feline_profile.png

Breeding participant images derive from this shared registry. Keeping it unchanged avoids an indirect breeding UI change. Nyla helpers are invoked explicitly only by non-breeding screens, and the shared creature-detail view defaults to useGameplayArt = false because it is reused by breeding screens.

No breeding UI, scene art, animations, scene manifests, generation scripts, logic, or saves were modified. Sphinx and Tiger artwork is unchanged.

## File inventory and known limitation

Approved original 01–06 and 08–10 are available in public/images/creatures/feline/nyla/ as separate PNGs.

**07 Taking Damage** was approved but has not been found in Google Drive or local attachments. Do not regenerate it. Continue using guard + hit feedback until the original approved 07 is uploaded and verified.

**08 Defeated / KO** was retrieved from its approved Google Drive file and integrated as nyla_08_defeated_ko.png.

## Validation

Run npm test and npm run build. The existing GitHub Actions build workflow runs regression tests and a production build; separately verify live Vercel deployment.

In-game checks on desktop and phone: Collection card/details/compare, Feline Habitat and profile, battle Strike vs. Pounce vs. Defend, damage fallback, KO, Ranch Jobs Garden Tending, Ranch House sleep. Compare breeding participant cards and detail modals to the previous build; all breeding scene imagery and mechanics must be identical. Confirm rare Sphinx/Tiger variants, player nicknames, and reduced motion.

Automated checks cannot substitute for real desktop/mobile visual inspection.

## Gameplay Art QA — layout follow-up, October 11

Source PNG parity: compared all nine approved original Google Drive PNGs with their GitHub Git-blob SHA-1 values; every imported image matches its approved original byte-for-byte. All nine images have true RGBA (PNG color type 6) transparency, and Image 10 is landscape-oriented as required.

Measured image 08 (Defeated/KO): the visible alpha>=128 silhouette stops at pixel y=1229 in a 1448-pixel-tall canvas. The bottom ~15% is transparent; applying the standing pose's existing -16px offset leaves Nyla visibly above the battle floor. Added a **Nyla-only KO ground-contact adjustment** of 12% desktop and 10% at widths 850px or less, without changing other combatants or the KO animation. This is an asset-dimension-backed positioning correction; interactive battle screenshots are still required to confirm final appearance.

The bust portrait is 1086x1448. Center-cropping it into a square can cut off the top of the feline ears. Base Feline cards in Feline Habitat and the small battle turn-order portraits now crop from the **top**, preserving the face and ears. Other variants keep the previous image framing. Collection cards already use contain sizing, so they need no change.

Regression tests now cover RGBA PNG headers, portrait/landscape orientation, KO-specific responsive CSS, avatar crop selectors, reduced-motion CSS, and explicit absence of new art overrides in breeding caller components.

Breeding scene, animation, artwork, generation scripts, shared original registry paths, and breeding mechanics remain untouched.

Live gameplay viewport testing on desktop/phone and Vercel deployment verification are outstanding. The local container cannot resolve GitHub to clone the full application, so the GitHub Actions workflow must run npm test and npm run build for commit validation.
