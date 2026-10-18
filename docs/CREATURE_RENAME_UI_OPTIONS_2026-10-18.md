# Creature rename review — October 18, 2026

Original review baseline: removal C fidelity at `055f6ac2600210c716528c22f1cba390d6917c16`. The user subsequently continued with recommended A; implementation is documented in CREATURE_RENAME_A_RUNTIME_2026-10-18.md. The original options and provenance below remain the review record.

## Actual current game

`validation/creature-rename-before-1440.webp` and `validation/creature-rename-before-390.webp` are actual current production-build captures from an isolated save. Both popups were canceled and storage equality checked. Relevant canonical portraits and Care assets are present; missing unrelated sparse-checkout art uses the established QA fallback.

CareLedger currently uses a plain label/input with a 24-character browser limit, Cancel and Save name. GameProvider trims and rejects blank names; Habitat has a separate name editor in Manage without that same input limit. A future integration should share the chosen window and validate consistently at the action boundary, keep identity/history/equipment unchanged, reject blanks, preserve cancellation without writes, support keyboard submission/Escape and fit mobile keyboards.

## Options

- A — Identity card: portrait strip, quill/name field, counter and compact actions. Recommended continuation of C.
- B — Name ledger: current and edited names shown explicitly.
- C — Nameplate preview: ornate centered identity preview.

All concepts retain existing free naming behavior and show a proposed 24-character counter. No random-name feature, payment, duplicate-name policy or new gameplay effects are implied. Choose the visual direction before implementation, following AGENTS.md's continuing visual reviews rule. PR21 stays draft/unmerged.

## Provenance

Built-in image generation, preview-only board `exec-a413a41e-6200-409c-b12f-ca634f2ca2fe.png`. References: actual current popup and selected removal C. Selected concept must be copied unchanged into the project before runtime integration.

Exact prompt:

Use case: ui-mockup. Asset type: Creature Chronicles Rename creature UI concept review board. Input image 1 is the CURRENT live popup, use only as functional context. Input image 2 is the APPROVED C art direction; match its deep navy, rich carved gold ornament, warm ivory bold Tinos serif, large painted ivory/gold icons, muted teal primary action and canonical black feline Mira with amber eyes, black bob and white shirt. Produce a polished high resolution wide comparison board with THREE CLEARLY DISTINCT compact rename-window proposals, labeled A · Identity card, B · Name ledger, C · Nameplate preview, with board subtitle CONCEPT · SAMPLE DATA. All fit desktop and phone without scrolling. Each column shows a desktop modal at top and a smaller labeled Phone adaptation below; keep readable large typography and restrained information. Every proposal title 'Rename creature', top-right close ×, current creature Mira, Base Feline · Female, Common · Level 1, one editable field labeled 'New name' containing 'Mira', visible counter '4 / 24', primary button 'Save name' and secondary 'Cancel'. Optional tiny helper 'Up to 24 characters.' No payment, no random-name generator, no duplicate-name warning or invented gameplay effects. Include clear small note 'Only the name changes.' Both Save and Cancel must be obvious. A: compact portrait identity strip across top, gold quill/name-tag icon beside field, simple large gold-framed navy name field and single horizontal Cancel / Save name footer on desktop; phone stacks buttons. Balanced compact window, recommended continuation of C. B: small portrait at left on desktop, structured two stacked lines Current name 'Mira' and New name editable 'Mira'; explicit gentle before/after name ledger hierarchy and clear 4/24 counter, bottom two actions; phone stacks identity then current/new lines. C: a larger centered gold-edged creature nameplate with small portrait and LIVE PREVIEW label, editable name field beneath, counter, compact save/cancel; phone same centered composition. Keep options materially distinct in layout while same approved art family. No unrelated stats, hearts, equipment, removal warning, extra tabs, slogans, or tall empty panels. Preserve Mira's existing character identity and outfit. This is a UI mockup board, not actual game screenshots.
