# Creature Chronicles animation workflow

Approved by the user on October 23, 2026 after reviewing the painted, glowing nursery hatch. Reuse this process for menus, scenes and other presentation where motion helps the game.

## Choose a useful purpose

Use motion to clarify selection, acknowledge an action, connect related screens, add quiet atmosphere or celebrate a meaningful result. Match its intensity to the action. Menu transitions and selection changes should be brief; a hatch or major reward may use a focused, skippable reveal. Preserve legible information, reachable navigation and the main-screen no-scroll rule. Avoid simultaneous competing effects or constant motion around important text.

Start from the actual current game. Capture desktop and phone states, inspect the relevant source and identify the authoritative assets and gameplay handlers. Follow the existing concept-review workflow for a new visual direction. Routine polish within an approved direction can proceed without repeatedly seeking approval for implementation choices.

## Build assets for their job

Keep canonical room, creature, egg and equipment artwork. Generate an independent painted overlay when an organic texture, glow, light leak, mist or other illustrated effect improves the result. Use the built-in image tool for bitmap generation and true transparency. Preserve the original PNG, exact prompt, reference roles, derivative hashes and provenance. Never bake interface text, a replacement creature or a whole new scene into an effect overlay.

Use the existing native SVG system for crisp symbols, frames and ornamental surfaces. Use CSS or code for progress, timing, transforms and opacity. Additional plugins are useful when they provide a missing capability; do not add a service or paid dependency merely to make the workflow seem more sophisticated.

## Composite in independent layers

Separate the backdrop, object, foreground furniture, effect core, soft bloom and sparse motes. Match lighting and color to the existing scene. Clip on-surface details to the object's alpha; keep bloom in a separate layer so the light can extend naturally beyond its edges. Test blending against both pale and dark artwork. A glow must retain the underlying species/item identity and avoid washing out the illustration.

The approved nursery implementation uses a transparent painted fracture texture, shell-alpha masking, screen blending, a separate blurred amber bloom, the earlier soft halo and sparse editable SVG motes. The principal fractures reveal downward during a 1.8-second presentation. The rejected vector version looked like uniform outlined geometry; the painted version has irregular branches, variable openings and ivory light cores with soft falloff. Use this as a quality reference, not a requirement to put gold cracks or sparks on unrelated actions.

Favor transform and opacity animation. Keep animated layers bounded and lightweight. Reuse one optimized effect across compatible objects rather than generating complete duplicate object images. Check small-screen performance; do not stack large animated blurs without a clear visual benefit.

## Keep presentation independent from gameplay

Use the canonical action, freshness checks, blockers and duplicate guard. For a committed outcome such as hatching, save the outcome once before beginning its presentation. Animation completion, Skip and Escape may reveal the existing receipt; they must never repeat or reverse the transaction. No additional RNG, cost, reward or save write belongs in an effect callback. Browsing and canceled previews remain read-only.

Respect prefers-reduced-motion. Use an immediate result or minimal nonmoving feedback, with no loss of information. Listen for preference changes during a running reveal. Clean up timers and listeners on unmount. Preserve keyboard focus, readable status and explicit selected states; color or motion alone must not carry essential meaning. A celebratory effect should not block progress after its result is ready.

## Review the real motion

Build and run the actual production app with an isolated synthetic save. Inspect real screenshots rather than relying solely on generated concepts or the standalone asset catalog. Check desktop, wide/short desktop, phone portrait, small phone and phone landscape. Review the effect in context at actual display sizes; inspect a close view only as a supplement.

Record a short real runtime clip so the user can judge timing, light buildup and transition to the result. Clearly distinguish generated mockups, asset assemblies, local production captures and hosted verification. Preserve useful screenshots, the clip, validation results and source in the repository. Avoid publishing access tokens, private saves or account data in evidence.

Test the meaningful boundaries: correct images, visible controls, no overflow, correct selection/cancel behavior, exactly one committed outcome, Skip/Escape, automatic completion, reduced motion and reload persistence. Run checks appropriate to the change; do not rerun unrelated suites without a reason. Publish to the established feature branch and report deployment status separately from hosted interaction testing. PR #21 stays draft and unmerged until the user changes that instruction.

## Approved example

- Runtime: src/features/nursery/NurseryScene.tsx, NurseryPolish.tsx and NurseryScenic.module.css.
- Art and source: public/images/ui/nursery-scenic-a/hatch-v2/; shared halo under polish-v1/.
- Asset generation: scripts/build-nursery-hatch-v2.mjs.
- Browser verification: scripts/validate-nursery-hatch-v2.mjs.
- Validation: 76 browser checks at seven viewports plus two nursery data tests; optimized build/TypeScript pass.
- Accepted code: 8f671ec78b403ab1d5d08e5c55a22ff9f1b3667e.
- Actual motion recording: docs/validation/nursery-hatch-v2/hatch-preview.mp4.

The user explicitly approved the final glowing treatment. Preserve it when moving on to the Breeding Pen or other menus.
