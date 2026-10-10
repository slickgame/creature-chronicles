# Habitat Courtyard B

Approved by the user on 2026-09-30 after reviewing A and B concepts.

## Implementation

- Shared Habitat screen uses B's sunny courtyard, wood navigation header, parchment occupancy strip, selected full-body creature, care panel and bottom resident dock.
- The courtyard is one shared background across the five existing creature families. Family titles, residents, capacity and open spaces come from the save; no new habitat assignment or transfer mechanic is introduced.
- Existing variant `profilePath` artwork is contained without cropping for the selected creature. Resident rows retain portrait thumbnails. The concept's illustrated character and sample residents are not replacement game assets.
- Live energy, hearts, affection, injury recovery days, pregnancy and training status remain connected to existing game data. Feed respects training restrictions and existing energy/affection caps. Training details and expected delivery dates appear in Full Profile.
- Full Profile preserves Overview, Stats & Growth, Work Skills, Talents, Lineage and Care. Manage contains rename and protection; release and donation require a separate confirmation with Cancel initially focused.
- Resident pages adapt to the available width, with one Previous and one Next control. Height changes do not reset the page. The roster's habitat shortcut selects the requested creature by ID and opens its page directly, replacing DOM polling and scrolling.
- Main screens do not scroll. Long profiles, management, action feedback and navigation open native dialogs. Short feedback summaries open their complete message; single-line names remain fully available in the profile.
- Back and Menu occupy the header. Collection Tracker is available through the shared responsive navigation; Ranch Office, Chores and Breeding retain their existing destinations.
- Empty habitats explain automatic family membership and offer the Breeding Pen route.

## Asset provenance

`public/images/ui/interiors-v1/habitat.webp` was generated from the approved corrected B concept. The generated scene removes all UI and the concept character, preserving the courtyard, bench, foliage and purple paw banner. The PNG was converted to WebP at quality 88. No existing creature artwork was generated or changed. Wood, parchment and icons reuse the approved ranch assets.

## Validation

- Production `next build`, including TypeScript: pass.
- Existing regression suite: 141 tests pass.
- Targeted ESLint: no errors; two image-element warnings in Habitat and the existing effect warning in NavigationChrome.
- Production Chromium at 1440×900, 1280×720, 390×844, 360×740 and 844×390: no main-page scrolling, overflowing controls or scrolling subpanels. Verified full-body images load and use `contain`.
- Seven-resident fixture: every resident reachable, last-page selection, feeding saved once, all six profile tabs, rename, protection, canceled release/donation, one confirmed release, Menu focus return and Back navigation.
- Additional checks: last-page roster handoff on desktop and phone, Ranch Office destination, training-disabled feeding with Rhea details, last-resident donation, and empty habitats on phone portrait/landscape with their Breeding destination.
- Screenshots reviewed with existing full-body artwork masked during layout inspection. The legacy ranch's Feline building is covered by its Today card at the landscape entry viewport; the isolated habitat test enters at desktop size and then resizes. This pass does not change ranch-map positioning.

The local sparse checkout omits the large breeding-art collections. The build uses the existing ignored local scene-manifest stub; neither the stub nor synthetic review saves are committed. Save schemas and gameplay balance are unchanged. Published only to the existing draft PR's preview branch.
