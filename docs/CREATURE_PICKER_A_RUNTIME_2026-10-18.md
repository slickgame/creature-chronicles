# Choose creature — compact roster A

The user selected A and requested removal of the female symbol because the creatures are intersex. The picker omits sex symbols and sex labels altogether. Its legacy Cards view also omits the label, and the roster's advanced filters no longer expose the binary Sex filter. This is presentation only; saved identity and breeding mechanics are unchanged.

The unchanged A/B/C comparison is `public/images/ui/creature-picker-a/approved-options.png`. A is selected. Generated with the built-in image tool as UI concept art using the existing game screenshot for visual style; the sample characters and values in the board are illustrative. Runtime uses the existing canonical card artwork, painted talent star, open/closed Care locks, Energy bolt, navy/gold surfaces and Tinos typography.

CreaturePickerA replaces the parchment sidebar with a focused roster and selected-creature summary. Selecting a row previews locally. Open profile confirms the viewed creature and restores the existing profile section; Back to profile cancels the preview. Escape from the picker also returns. Search and filters no longer change the underlying profile selection. Search, paging, preview, Cards and Compare do not save. Favorite and lock retain their explicit existing actions. Readiness is informational; training or low Energy does not prevent viewing a profile.

Desktop shows up to four rows and a portrait/identity summary beside them. Phones use compact rows and a bottom summary/action. Short screens reduce row count. PagedItems adds optional maximum capacity and initial selected-item position; defaults preserve its other callers. Search/filter changes reset pages. The selected creature is initially on the displayed page. Existing Cards, Compare and full Filters & Sort dialogs remain available.

Actual desktop/phone screenshots and browser results are under docs/validation. Screenshots use isolated sample-save creatures and real canonical feline art. They are not user-save transactions. PR21 stays draft and unmerged.

Validation: production build passed. The dedicated browser suite passed 37 checks across 1440×900, 1280×720, 390×844, 360×740, 844×390 and 390×500, including long names, read-only preview/search/cancel, original profile identity and Care tab preservation, Compare, empty results, filters and persisted favorite/lock toggles. No runtime exceptions. Relevant lint: zero errors, 15 native-image warnings. Desktop and phone results were visually inspected against A; short-landscape summary density was corrected after the long-name test exposed an overflow.

Next review: bring Filters & Sort and the comparison chooser into the same style, preserving every supported filter and keeping their content accessible on small screens.
