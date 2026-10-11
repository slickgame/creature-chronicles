# General talents — first gameplay pass

New creature talent rolls use a shared, species-independent pool. Each talent grants exactly one effect, with explicit values for F / D / C / B / A / S. Existing species and variant talent definitions are retained only for old records and authored enemies; they are excluded from new creature, adoption, egg-shop and mutation pools.

| Talent | Effect | F | D | C | B | A | S |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hot-Blooded | Fertility during breeding | 1 | 2 | 3 | 4 | 6 | 8 |
| Eager Learner | Chore-skill XP, % | 5 | 8 | 10 | 15 | 20 | 30 |
| Lasting Vigor | Reduced pair Breeding Energy cost | 1 | 2 | 3 | 4 | 6 | 8 |
| Diligent | All chore scores | .25 | .5 | .75 | 1 | 1.5 | 2 |
| Sure Strike | Battle Physical Power | 1 | 2 | 3 | 4 | 6 | 8 |
| Thick Hide | Battle Defense | 1 | 2 | 3 | 4 | 6 | 8 |
| Light-Footed | Battle Speed | 1 | 2 | 3 | 4 | 6 | 8 |
| Sound Sleeper | Extra maximum Energy recovered daily, % | 5 | 8 | 10 | 15 | 20 | 30 |

Hot-Blooded modifies effective Fertility in the existing pregnancy formula, not the stored stat or innate grade. Preview notes show base + talent = effective Fertility. The runtime and preview share the structured talent engine; the private name-keyword breeding adapter was removed. Unrelated launch talents no longer accidentally grant pregnancy chance or breeding XP.

Fresh saves give each starter one C-grade talent: Mira/Eager Learner, Rook/Sure Strike, Bruna/Diligent, Pip/Hot-Blooded, Marlow/Sound Sleeper. These assignments introduce different uses, not species restrictions. Market talent incidence is 60/70/80/90/100% across quality tiers (plus existing rarity bonuses); existing tier grade weights and second-talent chances remain. Grades are rolled independently of talent identity. Shop grade upgrades and Egg Atelier polish refresh the displayed numeric effect.

Parent talents retain their grades when inherited. New mutations, including Mutation Catalyst, use the general pool. Existing inheritance probabilities and two-talent hatch cap remain unchanged. Empty talent arrays and starter talent identities survive reloads; missing legacy arrays still receive fallback repair. Start a new save to test the new starter setup. No automatic save deletion or elaborate creature conversion is added.

Title art now uses Arrival before the opening, then Porch Welcome, including completed Chapter 1 saves. Later chapter backgrounds are deferred.

## Verification

Production Next.js build and TypeScript. Focused tests cover one-effect grade scaling; live breeding fertility and preview/result agreement; chore/recovery/battle effects; all-species market diversity; inherited grades and general-only mutations; save/reload persistence; egg-shop grades; existing talent definitions, tutorial, move inheritance, chores, breeding regression and title selection.

Browser checks cover the new C-grade Hot-Blooded description at desktop, phone portrait and phone landscape, save reload persistence, and completed-chapter selection of the welcome title. Sparse local art is unchanged. PR #21 remains draft and unmerged.
