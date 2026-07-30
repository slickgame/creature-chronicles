# Chapter 1R — Guided Onboarding Redesign

## Purpose

Chapter 1 now teaches Creature Chronicles through player actions instead of asking the player to interpret a long checklist and repeated story pop-ups.

The onboarding follows a simple progression:

1. Veyra shows the player one critical action.
2. The player performs a similar decision with lighter guidance.
3. The player completes an open objective using the systems they learned.

The tutorial advances from saved game outcomes, not from clicking a generic Next button.

## Design principles

- Teach the ranch loop before exposing optimization.
- Highlight real controls with semantic tutorial identifiers.
- Lock unrelated clicks only during the first essential interactions.
- Let later lessons preserve player choice.
- Keep guidance short and contextual.
- Persist progress through save flags and existing system records.
- Allow the walkthrough to be collapsed or skipped.
- Preserve the original starter goals as optional rewarded milestones.
- Do not require all optional milestones to finish Chapter 1.

## Guided chapter path

### Day 1 — Keep the Ranch Standing

The player:

1. Opens and reads the Morning Brief.
2. Opens Ranch Chores.
3. Assigns a suitable helper to Security Patrol.
4. Chooses a second ranch priority independently.
5. Reviews the day.
6. Ends the day and resolves the assignments.

This introduces the daily loop:

`Morning information → decisions → assignments → overnight resolution → new priorities`

### Day 2 — Read the Results

The player:

1. Reviews the overnight resource and condition changes.
2. Produces Feed, gathers Materials, or repairs ranch damage.

Starting stock does not satisfy this lesson. The game requires evidence of an actual production or repair result.

### Day 3 — Town and Progression

The player visits the Guild Hall and completes one beginner request. The request should reinforce ranch production, care, security, or another system already introduced.

### Day 4 — Breeding and Nursery

The player:

1. Opens the Breeding Pen.
2. Selects two valid creature participants.
3. Reviews compatibility, stamina costs, projected genetics, and move inheritance.
4. Begins the first guided pairing.
5. Ends the day to receive the egg.
6. Opens Inventory.
7. Targets the egg with the Quickhatch Catalyst.
8. Confirms consumption and hatches the offspring.

#### Guided first pairing rules

The first valid creature-to-creature pairing during active guided onboarding:

- uses the normal breeding attempt first;
- preserves Energy, Hearts, XP, affection, familiarity, history, participant snapshots, genetics, and move inheritance;
- guarantees conception if the normal deterministic roll fails;
- cannot create a dangerous tutorial complication;
- creates a one-day pregnancy;
- applies only once;
- does not apply to player-receiver sessions;
- does not overwrite an existing active pregnancy or egg.

#### Quickhatch Catalyst

The Quickhatch Catalyst is an Epic tutorial-exclusive inventory item.

Rules:

- Granted exactly once after the guided egg exists.
- Cannot be purchased from the Supply Depot.
- Targets one active egg.
- Requires confirmation before consumption.
- Sets the egg to ready and hatches it immediately.
- Preserves recorded genetics, abilities, lineage, and inherited moves.
- Applies existing Egg Atelier hatch effects.
- Does not consume itself if the hatch fails, such as when habitat capacity is full.
- Creates an Item Use History record with the egg as its target.
- Cannot be used twice.

The purpose is to introduce inventory targeting, exact item effects, rare-item confirmation, consumption, and item history without adding another waiting period to onboarding.

### Day 5 — First Battle

The player:

1. Visits the Battle Outfitter.
2. Inspects the three-creature team, moves, roles, and basic equipment.
3. Enters the Coliseum.
4. Wins the Novice Echo Trial.

The existing Novice Echo Trial is the Chapter 1 combat handoff. More advanced Coliseum modes remain outside the tutorial.

## Tutorial interface

The global tutorial overlay provides:

- Veyra dialogue and current lesson text;
- a highlighted target control;
- a dimmed spotlight around the rest of the screen;
- optional click locking for early critical steps;
- a Help action that scrolls to or opens the relevant system;
- collapse and skip controls;
- progress derived from existing save data.

Target controls use `data-tutorial-id` attributes or wrappers. The overlay does not rely on fixed screen coordinates.

## Beginner Milestones

The original sixteen starter goals remain in the Ranch Handbook as optional Beginner Milestones.

They retain:

- their existing completion rules;
- their existing rewards;
- their reward-claim flags;
- navigation shortcuts;
- compatibility with old saves.

They no longer block the Chapter 1 ending. The guided path is intentionally shorter and focuses on understanding the major game loops.

## Story presentation

Chapter 1 story reactions are limited to larger milestones rather than every minor checklist action. Full completion is unlocked by the guided path or the legacy all-goals path for compatibility.

## Save and compatibility rules

- Existing saves that already completed Chapter 1 do not restart the tutorial automatically.
- Existing story and starter-goal flags remain valid.
- Guided completion also sets the existing onboarding compatibility flag.
- A naturally hatched egg counts as completing the hatch/item lesson fallback so a save cannot become stuck.
- Tutorial-specific stock, target, completion, skip, and one-use flags live in the existing save flag map.

## Acceptance criteria

- A new player can move through the ranch, chore, Guild, breeding, inventory, Battle Outfitter, and Coliseum screens with one persistent guide.
- Early required controls are visibly highlighted.
- Progress survives save and reload.
- The first eligible guided pairing always creates a safe one-day pregnancy.
- The catalyst is granted once, requires confirmation, hatches one egg, and records its use.
- Failed hatching does not consume the catalyst.
- Optional Beginner Milestones remain available and rewarded.
- Chapter 1 can finish while optional milestones remain incomplete.
- Existing completed saves remain completed.
- Automated tests cover the guaranteed pregnancy, catalyst lifecycle, duplicate prevention, and revised completion rule.
