# Mission board expansion — 2026-10-11

Adds a guaranteed weekly supply delivery, chore commission and battle bounty alongside creature service and permanent placement requests. New boards retain six base requests and a safe Field Hauling service. Existing same-week boards keep their requests and receive the three new categories once.

Deliveries rotate Feed/Materials requirements. Chores rotate through all five jobs and count only successful helper shifts after acceptance; skipped, tired and injured helpers do not count. Bounties count recorded Circuit/C4 victories after acceptance, including practice wins and individual gauntlet stages, but not losses, draws or repeated result IDs. Chore/bounty targets increase from week three. All new rewards are Gold and GP, with existing Guild upgrade bonuses and first-completion bonus.

Delivery confirmation rechecks and consumes exact stock. Claims recheck acceptance, deadline and progress, and pay once. Save normalization retains objective state; no reset is required. Multiple accepted requests can share progress.

The existing illustrated board gains category labels, colored notice edges, filters, progress bars, deadlines, contextual destination buttons and a final payout review. Review includes automatic daily/starter-goal bonuses through the existing reward pipeline. Compact detail/review panels have solid parchment backgrounds. Reuses approved supply, chore and Coliseum illustrations; no new image assets or reward items were needed.

Validation:
- Next.js production build and TypeScript pass.
- 36 focused tests pass: five new commission cases, ten C2, eleven C4, seven ranch-day and three planner tests. C4 assertions cover mission-win counting and duplicate IDs.
- Scoped ESLint: zero errors; existing image/effect warning patterns remain.
- Production Chromium: 1440×900, 1280×720, 390×844 and 844×390 layout checks; no main-page scrolling or horizontal detail overflow. Screenshots reviewed.
- Browser flows: category filters, acceptance, cancellation with unchanged stock, exact delivery deduction and final payout, disabled repeated claim, incomplete chore/bounty blockers and Coliseum navigation.
- Local QA uses neutral image placeholders because the sparse checkout excludes most existing assets. Artwork references match existing production components.
- Local manifest stub, test saves and QA screenshots are excluded from the commit.

Publish only to the existing preview branch; PR #21 remains draft and unmerged.
Next proposed batch: authored NPC quest chains with visible relationship milestones and useful rewards.
