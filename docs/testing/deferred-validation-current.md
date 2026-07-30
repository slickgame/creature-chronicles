# Current Deferred Validation Status

The project owner has not yet run the planned local validation pass for the following implemented patches:

- Section 6 — Economy and Energy Balance Lab
- Section 7 — Inventory and Breeding Item Expansion
- Section 8 — Save-System Reliability and Versioning
- Section 9 — Automated Testing and Asset Validation
- Section 10 — Ranch Day Loop
- Section 11A — Unified Creature Capability and Talent Audit
- Section 11B — Chore Skills, Species Aptitudes, Role Tags, and Work-Skill Radars
- Battle M1 — Move and Combat Data Foundation
- Battle M2 — Round Engine Completion
- Battle M3 — Player-Facing Target-First 3v3 UI
- Battle M4 — Deterministic Enemy AI
- Battle M5 — Breeding Move Inheritance
- Battle M6 — Battle Outfitter Integration and Move Training
- Coliseum C1 — PvE Progression Foundation

None of these patches should be described as fully verified until the project owner completes the automated, build, migration, UI, save, gameplay, and local-asset checks.

The current combined starting commands are:

```powershell
git pull origin master
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm test
npm run build
npm run dev
```

Detailed subsystem checklists remain in:

- `docs/testing/section-6-and-7-validation.md`
- `docs/testing/battle-m3-validation.md`
- `docs/testing/battle-m4-validation.md`
- `docs/testing/battle-m5-validation.md`
- `docs/testing/battle-m6-validation.md`
- `docs/testing/coliseum-c1-validation.md`
