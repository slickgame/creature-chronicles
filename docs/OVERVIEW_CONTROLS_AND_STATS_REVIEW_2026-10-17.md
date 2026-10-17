# Overview controls and Stats & Growth review

## Shipped correction

Previous screen uses the native kit arrow SVG, and the artwork expansion control uses its native two-corner expansion SVG. Both render at explicit 21–24px with empty image alt text; their named buttons retain existing navigation and artwork behavior. ScreenNavigation accepts an optional backIcon, and only CollectionScreen supplies it, preserving other screens.

More actions reserves a dedicated 16px line below the footer rule and above the footer buttons. Its surface prevents divider interference; opening the existing Breeding / Compare menu and closing it remains read-only.

Production build passes. Focused ESLint: zero errors, ten native-image/effect advisories. The isolated synthetic-save browser run passes 27 checks over 1920×960, 1440×900, 1920×720, 2560×1440, 390×844, 360×740 and 844×390. Checks include loaded icon dimensions, divider/text and summary/button clearance, Overview card containment, secondary-page fit, section navigation, artwork expansion, previous-screen navigation, details/removal cancellation on desktop and phone, and exact save preservation. No runtime errors. See docs/validation/overview-controls-results.json and actual-game overview-controls screenshots.

## Next visual review: Stats & Growth

Current actual-game screenshots are stats-growth-current-{desktop,phone}.webp and stats-growth-forecast-current-{desktop,phone}.webp under docs/validation. These demonstrate the remaining old brown text and card treatment. Current mechanics retain six creature attributes, innate grades, progress toward the next point, and an Attributes / Next level toggle. Equipment battle stats remain separate.

Proposed alternatives reuse the approved navy/gold surfaces, ivory typography, painted icon language and emerald selection. A uses six compact attribute cards with an inline selected-attribute detail area. B uses six compact ledger rows with aligned Value / Innate grade / Growth columns and the same detail area. Phones page their rows/cards; no scrolling information wall. Future growth, XP, energy capacity and strongest-stat explanations must remain accessible.

This is a concept review for the Stats interior, following AGENTS.md’s continuing visual-review rule. It does not change Stats gameplay or publish an unchosen new layout. PR21 remains draft and unmerged.
