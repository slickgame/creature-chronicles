# Approved ranch UI implementation — 29 September 2026

Implements the approved A/B/D direction: A is the scenic ranch home, and clicking its compact Today card opens B as an expanded ledger. D supplies the shared menu and End Day review. The separate roster redesign (C) is outside this change.

## Player-facing changes

- Scenic ranch with existing building art, a compact resource header, Today priorities, and Ranch / Creatures / Nursery / Town / Inventory shortcuts.
- All four ranch plots remain available, including expansion prerequisites, building status and upgrade routes. Phone layouts use two columns with scrolling; desktop keeps the illustrated setting.
- Today expands into a parchment ledger with feed projections, ready eggs, eligible unassigned helpers, tax timing, ranch condition and training returns. Each row links to its relevant screen.
- Morning Brief & Daily Records keeps the existing daily event choices, goals, activities and creature moods. The guided tutorial's morning and evening targets remain connected.
- One shared menu exposes Inventory, Creatures, Ranch Status, Journal, Travel and Save & Options. Town and Egg Atelier open it directly. Inventory retains expanded items, item history, creature targeting and tutorial catalyst actions.
- End Day reviews current obligations before sleeping, supports cancellation, preserves the existing evening-phase transaction and duplicate-day protection, and presents the morning report.
- Save replacement/deletion names the file and player, starts with the safe cancellation action focused, and supports Escape. New Game selects the first empty slot when available. Options no longer presents placeholder volume/speed values as working settings.
- Native dialogs provide focus containment, Escape, inert backgrounds, scrolling and focus restoration. Browser pinch zoom is enabled.

## Implementation notes

`projectRanchDay` is the detached, storage-free portion of the existing active ranch-day lifecycle. The actual sleep action retains the original transaction wrapper and uses this same resolver. The planner includes earned pre-feeding goal rewards and overnight chore output. Opening it does not advance time, award items or write storage.

The active TypeScript aliases and wrapper chain remain intact, including the expanded inventory, tutorial inventory, Town C4, GameProvider C4 and ranch-day provider. Existing story, predator and failed-run gates remain in place.

The new screen replaces the former ranch overlay stack. Journal contains the starter goals and unlocked story records, and Veyra's existing advisor is available from the shared menu.

## Validation

- **141/141 regression tests passed**, including three new planner tests for non-mutation/storage isolation, projection/overnight feed agreement, and Day 30 tax timing.
- **Next.js production build passed** (Turbopack): compilation, TypeScript and static page generation completed.
- Browser checks used Chromium with synthetic saves. All four ranch plots had no overlapping building controls at 1440, 768, 390 and 360 pixel widths.
- Verified Today expansion, menu/inventory transitions, keyboard focus containment, Escape, first-empty-slot selection, replacement/deletion cancellation, and tutorial Begin Ranch Day preserving both phase and progress signal.
- Verified Sleep & Advance Day changes Day 1 to Day 2 once and displays the morning report.
- Targeted lint completed without errors. Existing image-element guidance and a state synchronization warning remain.

## Limits and release status

This is a feature-branch implementation for review, not a production deployment. Browser checks exercised the modified navigation and synthetic-save flows, not every battle, economy or story branch. The local checkout included UI/ranch/town art but omitted the large breeding-scene and creature-art collections; therefore the full asset-preparation/asset-validation pipeline was not run. The production build used a locally generated scene manifest. No generated manifest or asset substitutions are committed.

Approved concepts and implementation screenshots are in the existing [UI review folder](https://drive.google.com/drive/folders/1VwRT3iq4h_aO1CA4FgUxpoBypXi7aeKu).
