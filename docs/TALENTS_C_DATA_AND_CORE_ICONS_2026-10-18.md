# Talents C: shared details and first ten icons

This stage supplies shared presentation data and production artwork; it does not replace the live Talents interface yet.

`src/data/talents/talentPresentation.ts` derives details from the central definitions and owned grade for all 83 registered talents. Source, applicability, conditions and stacking are separate. Active effects are distinguished from planned inheritance, retired chores, informational roles and unverified saved records. Guard Dog conditions use the actual farm-security engine. Browsing is read-only.

The ten current-generation talents have dedicated painted ivory/gold RGBA icons under `public/images/ui/talents-c/icons`. The untouched generated source, exact prompt, crop metadata and hashes accompany them. Remaining 73 IDs temporarily use the approved generic painted talent symbol. One icon per ID is planned; grade badges remain shared.

Validation: 20 focused tests passed, including all 83 definitions across six grades (498 combinations), recipe XP scope, inactive effects, farm conditions and unknown records. TypeScript and focused ESLint passed. The contact sheet decoded all 80 image instances at 24/32/48/96px on navy and parchment; the attached review is an asset assembly, not a game screenshot.

Next: complete the remaining 73 icons, then integrate the approved C register and full-detail views with responsive paging, live values and preserved navigation. Eager Learner already applies to Crafting and Cooking; the reference concept's old limitation must not return. PR21 stays draft and unmerged.
