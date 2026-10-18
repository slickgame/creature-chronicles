# Revised Work Skills A

The approved aligned ledger replaces only ranch CompactWork. Eight skills: Harvesting, Material Gathering, Husbandry, Hunting, Crafting, Cooking, Breeding and Cleaning. All skills/Gathering/Crafting & Cooking/Breeding & Care filters remember selections. Rows page according to available space; selection stays on its page after resize and returns after Back/Escape. Phones use Skills/Selected skill focus views and a compact creature header, restoring normal proportions on other sections. Direct RGBA atlas artwork, gold frames and Tinos regular/bold match the selected concept.

Progress comes from saves, including exact XP, mastered level 20, and natural starting levels. Stable hauling/production IDs retain existing progress under Material Gathering/Husbandry. Hunting is a new record: missing old records inherit the former shared Production progress once; future Hunting trail/Dairy work trains independent Hunting/Husbandry records. Output formulas/caps, costs, blockers, talents, commissions and no-Gold work rules stay intact. Other legacy skills are retained in saves.

Crafting/Cooking show saved proficiency and explicitly state that recipe training needs integration. Breeding has no fabricated level or XP. Cleaning is a planned habitat action; the user deferred habitat dirtiness, illness and enforced rest. Planning note saved in Drive: https://drive.google.com/file/d/1iLuUNDY4F2nPDDsgUWGaDFxpGbh-fKH_/view . No hygiene penalties are activated here.

Skill details has Progress, Use & training, and Creature context sections. Browsing is read-only. Complete explanations remain in the detail popup, with a compact selected-skill summary on phones.

Validation: production build; focused ESLint (zero errors, four existing/native-image warnings); 32 chore/work/compatibility and farm regression tests pass. scripts/validate-work-skills-a.mjs passes 240 browser checks on seven viewports, all eight skills, every detail section, filters, phone focus views, selection restoration, actual nonzero XP, mastered state and byte-identical saves. Actual screenshots and detailed results are retained under docs/validation/work-a-*.

The browser runner accepts WORK_QA_FIXTURE, WORK_QA_OUTPUT and WORK_QA_CHROMIUM. The fixture is a synthetic established save with a first creature named Mira. Missing unrelated legacy art in the sparse checkout is replaced only for capture; the production Work Skills atlas and canonical portrait are present.

PR21 remains draft/unmerged. Next: connect creature selection and skill training to Crafting/Cooking recipes; define Breeding skill benefits before activation. Habitat hygiene stays deferred.
