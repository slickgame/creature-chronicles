# Painted illuminated hatch fractures

Replaces the basic vector crack overlay in the live nursery. The existing eggs, cradle, registered creature portraits and original transparent halo are unchanged. No additional paid plugin or external image service is needed: the new painted texture was generated with the built-in image tool, and native CSS/SVG handles compositing and motion.

source/painted-fractures.png is the unchanged RGBA master. painted-fractures.webp is the 900px derivative. The texture has organic irregular fissures, ivory light cores and amber diffusion. Live compositing uses the shell's alpha mask and screen blending, a separate blurred bloom layer, and sparse editable motes. Fractures reveal downward, then hold briefly before the same saved portrait receipt. Skip and reduced motion retain the original behavior; no extra hatch transaction is introduced.

Rebuild with node scripts/build-nursery-hatch-v2.mjs followed by the original source PNG path. The manifest records exact source/derivative hashes and alpha bounds. Source prompt is preserved alongside the master. Previous cracks.svg remains only as archived editable source and is no longer used for the live hatch.

Actual production screenshots/results: docs/validation/nursery-hatch-v2. Synthetic separate test saves are used. All visual comparisons must preserve the original five species shells; do not ship a regenerated egg as part of the effect.
