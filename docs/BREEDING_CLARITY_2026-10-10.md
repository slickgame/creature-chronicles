# Breeding and talent clarity

The Breeding Pen's Inheritance dialog now opens on Talents, with a separate Moves view preserving the existing technique preview. Parent cards show exact talent names, grades and effects side by side, stacking on phones.

The displayed probabilities are separate checks: first parent talent, conditional second distinct talent, and a new talent mutation when a slot remains. They use the runtime genetics context and shared mutation calculation. They are explicitly not independent odds for every listed talent. Armed Trait Stabilizer and Mutation Catalyst describe their additional conditional checks without incorrectly adding them to baseline percentages. Player pairings explain that the player supplies no creature talents; offspring odds require two different creatures.

Talent instances now optionally store immediate-parent or mutation origin. Inheritance overwrites an ancestor's origin with the actual contributing parent; mutations are labeled separately. Trait Stabilizer records its parent too. This metadata passes through pregnancies, eggs, hatching and birth history. Old records with no origin show an honest unrecorded-origin message.

The hatch dialog displays Talent Results before the full profile. Names, grades, exact effects and origins are visible, and all talent roll notes have a separate disclosure rather than being truncated behind stat notes. Birth History retains the same talent summary. The first-pairing and hatch tutorial hints explain talent selection and checking results, including that guaranteed tutorial conception does not guarantee a talent. No inheritance balance changes or extra tutorial blockers were introduced.

Validation: production build and TypeScript; 32 tests across talent clarity, general talents, tutorial, move inheritance and breeding regression; scoped ESLint has zero errors (existing image/memoization/unused-variable warnings). Browser review covers desktop, phone portrait and landscape parent comparison/odds, the preserved Moves tab, hatch results, birth-history origins, and exactly one hatch transaction. Local missing artwork is substituted only in the test browser. PR #21 remains draft and unmerged.

Next planned batch: mission-board variety and readable requirements/rewards, with starter tasks tied to chores, deliveries and battles.
