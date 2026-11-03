# Complete Record page-turn motion

The existing approved layout, assets and recorded data are preserved. Costs & Growth pages and the three record tabs now share a 620ms directional paper-leaf turn around the gutter, with cream paper grain, back face and a restrained cast shadow. The accessible record changes once at the 310ms midpoint. The header, tabs and footer remain stationary. Phone layouts turn a full folio leaf instead of half the desktop spread.

Navigation is locked synchronously during a turn, preventing repeated clicks from skipping records. The spread is temporarily inert; navigation focus remains outside it. Animation completion clears timers; a 720ms fallback also unlocks the UI. Closing the window cancels pending updates. Reduced-motion users get immediate navigation, and enabling reduced motion during a turn finishes it immediately.

No gameplay reducer, save field, costs or progression calculations changed. No new runtime dependencies or raster assets are needed; motion reuses the existing paper texture.

## Interaction validation

`validate-record-page-turn.cjs` mounts the actual component with lightweight dialog/style substitutes under React and jsdom. It checks midpoint timing, click locking, previous/next and tab direction, focus, animation-end and timer fallback cleanup, immediate/live reduced motion, unmount cancellation and an unchanged source record.

Run with project-installed React/TypeScript and jsdom, or a temporary dependency directory:

```sh
npm install --prefix /tmp/record-motion-check --ignore-scripts --no-audit --no-fund typescript@5 @types/react@19 @types/react-dom@19 react@19.2.4 react-dom@19.2.4 jsdom@26
RECORD_MOTION_DEPENDENCIES=/tmp/record-motion-check node scripts/validate-record-page-turn.cjs
```
