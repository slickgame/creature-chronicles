# iPhone Testing with Vercel

Creature Chronicles is prepared as an installable mobile web app. The repository still needs a one-time Vercel connection before an internet-accessible URL exists.

## One-time Vercel setup

1. Sign in to Vercel with the GitHub account that can access `slickgame/creature-chronicles`.
2. Choose **Add New → Project**.
3. Import the `slickgame/creature-chronicles` repository.
4. Confirm the detected framework is **Next.js**.
5. Leave the root directory as the repository root.
6. Set the production branch to **master**. This repository does not use `main` as its default production branch.
7. Add any required environment variables before deploying. The current local-save MVP does not require Supabase variables for basic testing, but future connected saves will.
8. Deploy the project.

After Git integration is active:

- Pull requests and pushed branches receive Preview Deployments.
- Changes merged into `master` receive a Production Deployment.
- Vercel supplies a public `*.vercel.app` address that can be opened from the iPhone while away from the development computer.

## Install on iPhone

1. Open the Vercel deployment in Safari.
2. Tap Safari's **Share** button.
3. Choose **Add to Home Screen**.
4. Keep the name **Creature Chronicles** and tap **Add**.
5. Launch it from the new Home Screen icon.

The app manifest requests standalone display, a dark theme, and the existing paw crest as the install icon.

## Vacation testing checklist

- Create or load a save.
- Rotate between portrait and landscape orientation.
- Confirm the iPhone safe areas do not cover buttons around the notch or Home indicator.
- Test Ranch, Town, Builder's Yard, Expansion Fields, Coliseum, and move-detail dialogs.
- Force a predator event through Dev Tools when available, or use a progressed save with enough pressure and low security.
- Complete a predator defense and confirm the Morning Brief records the outcome.
- Close Safari or the installed app during a pending predator event, reopen it, and confirm the same event remains pending.
- Reload after recording victory or defeat and confirm rewards or penalties are not duplicated.

## Save warning

The present MVP stores saves in the browser's local storage. Safari and an installed Home Screen web app may maintain separate storage contexts depending on iOS behavior and how the app is opened. Keep one primary launch method for a vacation test save, and do not rely on that save being synchronized to the desktop browser. Supabase cloud saves remain a later deployment milestone.

## Preview versus production

Use a Preview Deployment to test an open pull request without changing the main public build. Use the Production Deployment after the validated pull request is merged into `master`.
