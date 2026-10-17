# Creature page icon refinement R3

All requested navigation, creature selection, record and footer icons now use one editable ivory/gold family. Fifteen SVG files cover sixteen visible placements; Lineage is reused, and both Inventory placements use identical pouch artwork. Icons have pale enamel faces, thin gold bevels, clear dark cutouts and restrained highlights.

Overview: creature portrait. Stats & Growth: bars with ascending arrow. Work Skills: hammer and crop. Talents: layered star. Lineage: branching family tree. Inventory: detailed pouch. Equipment: sword and guard. Care: heart/check. Choose creature: paw and selection arrow. Identity: creature ID card. Health & protection: shield/cross. Role strengths: group/star. Profile & Care: portrait/heart. Habitat: barn/fence. Inventory action: same pouch as the tab.

The review board shows each symbol enlarged and at 24, 32 and 40px. The assembly uses the actual SVG assets; four viewport sizes and phone secondary pages retain their layout checks, including 14px desktop record-to-footer clearance. No runtime/save APIs changed; live-game integration remains pending.

Run scripts/build-creature-overview-icons.py to rebuild the family. The main asset builder invokes it as its final step, so earlier silhouette studies cannot overwrite these assets. The standalone icon archive contains complete self-contained SVGs, this documentation, source, and a review image. It supersedes the icon files in the earlier full kit; frames and painted vital icons retain R2.
