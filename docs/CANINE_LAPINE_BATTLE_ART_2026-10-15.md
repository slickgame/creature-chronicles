# Canine/lapine integration and persistent battle sprites — 2026-10-15 UTC

## Approved sources and derivatives

All ten approved Daisy base canine images and all ten approved base lapine images were downloaded from the existing approved masters folders:

- Daisy: https://drive.google.com/drive/folders/1A1LPHdpK_w1G9o6RYpuLIEgqgJACPPRs
- Lapine: https://drive.google.com/drive/folders/1j6IgjORCnXBs6DMaDXgD5D8xWbyp7ack

Each set contains full body, portrait, idle, basic attack, special attack, guard, taking damage, KO, work and sleeping. `CANINE_LAPINE_ART_MANIFEST_2026-10-15.json` records each Drive file ID/URL, original SHA-256, derivative SHA-256, dimensions, role and production path. File byte sizes matched Drive metadata at download.

Masters remain unchanged in Drive. Production derivatives preserve alpha, use WebP quality 92/method 6 and proportionally fit within 1440×1440 without cropping. Twenty derivatives total 5,200,430 bytes. No new art was generated, no generation prompts were invented, and no anatomy, outfit, colors or poses were edited.

## Integration

Shared variant defaults and exact-obsolete-URL migration update canine and lapine cards/profiles, including saves and archived structured snapshots. Custom image strings are retained. Canonical rare variants retain their distinct artwork. Creature names, abilities and statistics are unchanged. Breeding scenes and scene manifest remain separate and unchanged.

`baseGameplayArt.ts` centralizes the four common species' approved sets and combat pose priority: fainted/KO → damage → actor shield/guard → basic or special/signature attack → idle. Existing feline/equine helper APIs remain compatible. Gathering uses work poses; the end-day review uses one sleeping image per resident common variant.

The live Circuit and challenge arena (`BattleArenaB`) previously used static full-body art and changed the image's React key on each presentation event. The older portrait stage's feline/equine combat helpers were not used there. The live arena now uses all four species' pose sets, mirrors enemy sprites to face the opposing team, and retains one stable image node per combatant. Pre-decoding uses unattached image objects; it adds no hidden battlefield copies.

Movement animates a persistent wrapper using cancellable Web Animations. Each beat's cleanup cancels the previous animation, including rapid changes, idle transitions and unmount. The creature image is no longer keyed or recreated per action. Dedicated KO poses remain readable with mild desaturation rather than the previous near-transparent grayscale treatment. Floating effect text retains independent beat keys; HP/BE playback, targets, combat rules and rewards are unchanged.

## Verification

- 319 regression tests pass, including new pose priority/rare-variant isolation, twenty-asset checksums and idempotent URL migration tests.
- Final optimized production build and TypeScript pass with no QA route present.
- Scoped lint: zero errors, 15 warnings (existing image and hook advisories).
- Isolated browser fixture uses the actual production arena and engine-generated round frames, not replacement creature markup. All four species appear on both sides across two teams at 1440×900, 390×844 and 844×390.
- 216 pose transitions and 180 rapid action changes retain exactly six persistent battlefield image nodes, one per combatant, with no residual wrapper animations after cleanup. Every requested sprite decodes and matches its expected role. Enemy facing, real round playback, pause/step, 2× and reduced motion pass with no page errors.
- All twenty new assets decode in Chromium. Actual roster/profile views at desktop and phone use the approved art for all four families, including old URLs migrated from a save. All four work-pose selectors and four sleeping previews decode correctly.
- Temporary QA route and fixtures are removed before the final production build and publication. Sparse-checkout legacy image gaps are handled only in the test harness; the existing tracked battle background was restored locally for final screenshots.

Publication and protected Vercel deployment status are reported separately. PR #21 stays draft and unmerged.
