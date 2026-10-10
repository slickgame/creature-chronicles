# Approved opening integration

Six-page arrival: inheritance letter, journey, gate, porch welcome, actual generated starter, evening ledger. Approved artwork is delivered as quality-95 WebP exports; original PNG masters are retained separately. Existing intro and story-log flags are preserved.

The starter page uses the existing record's name and profile artwork (variant fallback); it does not generate creatures, stats, names, rewards or resources. An empty roster receives neutral copy. The candidate horse silhouette is not used because it would misrepresent other species.

Page turns persist the opening page. Skip Opening marks only the story seen; it does not disable the tutorial. Begin the First Morning returns to the ranch's existing morning-brief step without changing the day, resources, or tutorial completion. The optional shortcut to Chores was removed so it does not bypass the morning brief.

Validation: Next production build and TypeScript passed. Three new opening regression cases and six existing guided-tutorial cases passed. Diff whitespace check passed. Local Chromium crashes at startup with SIGSEGV; desktop/mobile visual verification and browser interaction checks remain pending. No browser pass is claimed.

Scope: opening integration only. Full tutorial reorder, town/battle/breeding lesson revisions and title-menu presentation remain subsequent work. Keep PR #21 draft and unmerged.
