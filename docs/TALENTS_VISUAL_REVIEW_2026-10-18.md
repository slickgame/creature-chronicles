# Talents visual review — October 18, 2026

## Current game

Captured actual local production gameplay at commit 092012ae49ec95923d303203a0d29bde831c8506, using a synthetic established save. Mira owns Eager Learner C. Current screenshots: docs/validation/talents-current-1440.webp and talents-current-390.webp; current detail windows: talents-details-1440.webp and talents-details-390.webp. Browsing was verified read-only with no browser errors. Sparse-checkout fallback covers only unavailable unrelated legacy artwork.

The current interior has low-contrast dark text, hides the useful effect behind a click, and leaves substantial unused space. The surrounding creature shell and canonical portrait are already approved.

## Review options

- A — Talent ledger: compact list plus selected explanation. Recommended for consistency with Work Skills and readable applicability/trigger fields.
- B — Benefit cards: prominent numerical benefit and a compact explanation strip.
- C — Compact register: scan-friendly talent/grade/effect/applicability rows and focused full details.

All three show desktop and phone proposals, clearly marked CONCEPT / SAMPLE DATA. They use two illustrative talents to exercise the layout; the current synthetic Mira owns only Eager Learner. No talent slots, talent XP or upgrade mechanic is proposed. Generated images are preview attachments, not installed runtime assets. Existing character art must remain the canonical repository image during implementation.

## Applicability finding

Eager Learner C currently grants +10% gathering skill XP through getChoreTalentSummary and workPreview. recipePreview currently computes XP from recipe output and batch quantity without applying chore XP talent percentages. Concepts therefore explicitly label the current gathering scope. The missing recipe XP bonus is flagged for the implementation follow-up; it has not been changed in this review.

Sound Sleeper C supplies an extra 10% of maximum Energy during daily recovery, capped at maximum. This is recovery, not an increase to maximum Energy. Source General is separate from effect applicability. Breeding and Cleaning skill progression remain planned.

## Implementation decision

Await the user's A/B/C preference before replacing the Talents interior, following the project's established visual-review workflow. Retain viewport fitting, paged overflow, canonical portrait, navigation and footer actions. Phone proposals must be fitted to actual viewport height; concept illustrations are not a license to clip content.

## Generation

Built-in image generation, one call per option, with the current desktop Talents capture and approved Work Skills screenshot as image references. The preview images were displayed directly and are retained as conversation image attachments.

### Shared prompt (verbatim)

Use case: ui-mockup.
Create a polished Creature Chronicles TALENTS interface comparison board, landscape 1536x1024, showing ONE complete desktop creature page on the left and its complete phone adaptation on the right. This is a design proposal, not an actual game screenshot. Top labels clearly identify the option and "CONCEPT · SAMPLE DATA".
Input image 1 is the CURRENT Talents game screenshot: preserve Mira's exact canonical artwork, face, body, clothing, pose and pastoral image; preserve the surrounding creature-page navigation and footer functions. Input image 2 is the APPROVED Work Skills visual reference: match its finely ornamented thin gold frames, deep midnight navy panels, carved ivory-and-gold painted icons, warm ivory readable serif text and dark emerald active buttons. The Talents INTERIOR is the redesign target. Render a production-quality coherent mockup with text clarity and carefully bounded compact panels. No new character design.
Desktop: Ranch Roster header, Choose creature, Previous screen, Menu; Mira portrait at left, identity "Mira", "Base Feline · Female", Common, Level 1, Ready. Eight section tabs: Overview, Stats & Growth, Work Skills, Talents (active), Lineage, Inventory, Equipment, Care. Bottom actions Profile & Care, Habitat, Inventory. Phone: compact portrait/identity, Creature section selector set to Talents, focused small-screen content, previous/next paging where needed, same bottom actions. Keep all boxes above footer dividers and all controls inside the viewport. No long scrolling and no clipped text.
Use TWO illustrative General talents, clearly sample data, not claims that the current Mira owns both:
1. Eager Learner, Grade C, source General: "+10% gathering skill XP". Applies to Harvesting, Material Gathering, Husbandry and Hunting. Activates automatically when gathering work completes. Exact short limitation: "Recipe XP does not currently receive this bonus." Icon: beautifully painted ivory book with a small gold star.
2. Sound Sleeper, Grade C, source General: "Extra daily recovery: 10% of max Energy". Applies during daily Energy recovery, capped at maximum Energy. Icon: beautifully painted ivory crescent moon, small gold stars.
Present Source separately from Applies to. A talent grade is not creature level and these are automatic bonuses. Do not add talent XP bars, upgrade/train talent buttons, unlock slots, invented equipped states, purchase actions, or fake effects. A "View Work Skills" navigation action is appropriate. Category filters "All", "Work", "Battle", "Care" may organize the view without implying that source categories are the same as effect categories.


### Option prompts (verbatim, appended to shared prompt)

#### A

Title "A · Talent ledger". Recommend the clearest list-and-detail design matching Work Skills. In the desktop Talents content area place a compact two-row talent list on the left and a selected-talent explanation panel on the right. Selected Eager Learner row emerald with gold trim, name, small grade badge and exact effect summary. The right pane has larger book-star art, Eager Learner heading, "Grade C · General", a compact highlighted "+10% gathering skill XP" benefit, then clear "Applies to" and "When it works" fields. The recipe limitation is a quiet readable note. Keep pane heights content-driven rather than stretching both to the bottom. Small "View Work Skills" action below. Phone uses "Talents" / "Selected talent" focus tabs; show selected-talent focus with compact title, benefit, applicability and trigger cards, back-to-list control. Make this version refined, restrained and especially easy to understand.

#### B

Title "B · Benefit cards". Use a compact card gallery rather than the list-and-side-pane layout of option A. Desktop has two medium talent cards in one row: painted icon, title, Grade C and General source, with the NUMERIC BENEFIT visually prominent: "+10% gathering skill XP" and "10% of max Energy / extra daily recovery". Highlight Eager Learner in subtle emerald. Under the two cards use one shallow full-width selected-talent explanation strip split into "Applies to" and "When it works", including the exact recipe limitation and View Work Skills action. Maintain generous reading space, defined card proportions, delicate gold corners and a compact composition; never stretch the two cards across empty full-height space. Phone shows one talent card per page with "1 of 2" previous/next controls, then the selected card's concise explanation and automatic-trigger note on the same focused page. Same approved shell and canonical artwork.

#### C

Title "C · Compact register". Use a very compact ledger/table for the desktop Talents content, different from A's list-plus-sidebar and B's gallery. Columns: "Talent", "Grade", "Effect", "Applies to". Two readable rows with painted small icons and exact summaries. Eager Learner row is selected. Below the table show a compact selected-talent field card with Source, When it works and the recipe limitation, plus "View Work Skills". A "View full details" action opens paged explanation rather than forcing all text into the rows. Phone shows a compact two-row talent register with name/grade/effect (not a squashed four-column table), and a selected talent summary below, with button to full details. This option is for quickest scanning and more owned talents, with visible pagination. Preserve portrait, navigation, footer and warm ivory typography. No progress bars.
