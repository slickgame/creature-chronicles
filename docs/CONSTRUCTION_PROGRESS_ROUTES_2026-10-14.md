# Construction progress and completed-facility routes — 2026-10-14

Construction pages distinguish available crew, another builder project, pending production construction with its ready day, and completed facilities with active benefits. Paid projects hide purchase bills, source buttons and shortage warnings. Completed projects display their real benefit and open the matching activity. No construction timing, costs, reserves, rewards or save schema changed.

| Facility | Destination |
|---|---|
| Quarry | Stone gathering |
| Sawmill | Planks recipe |
| Kiln | Charcoal recipe |
| Furnace | Iron recipe |
| Forge | Nails recipe |
| Managed woodlot | Wood gathering |
| Supported iron mine | Iron ore gathering |

The activity opens in place. Back/Escape returns to the selected construction project and preserves its prerequisite trail. Switching planning sections clears the old prerequisite trail. Links appear only for completed facilities; existing engine eligibility checks still apply to workers and recipes.

Validation: direct optimized Next build; scoped lint zero errors (three existing native-image warnings); 16 builder/production regression tests. Browser exercised all seven completed destinations, return preservation and unchanged saves at 1440×900, 390×844, 844×390. Separate pending-project fixture verified ready-day/paid feedback, disabled commissioning and absence of early gathering/source actions at all three sizes. Screenshots reviewed. Browser harness was rebuilt after temporary QA files were cleared; missing legacy sparse-checkout images were blocked only in the harness. Overnight completion behavior remains covered by existing engine tests; this UI pass used explicit pending/completed fixtures.

Art: reuses approved parchment and resource illustrations; no newly generated artwork or prompts.

Next: make equipment milestone previews (+3/+6/+9/+12/+15) easier to compare, including substat additions, improvements and the Gold needed to reach each milestone.
