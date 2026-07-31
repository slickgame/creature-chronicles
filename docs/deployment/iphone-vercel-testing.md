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

The app manifest requests standalone display, a dark theme, safe-area support, and the existing paw crest as the install icon.

## Move a desktop save to the iPhone

The main menu now includes **Transfer Save**. Portable files use a `.ccsave` extension and include an integrity checksum.

On the desktop build:

1. Open **Transfer Save** from the main menu.
2. Choose the source save file.
3. Use one of these options:
   - **Download .ccsave** and move the file with AirDrop, iCloud Drive, email, or another private transfer method.
   - **Share** to open the system share sheet when supported.
   - **Copy Travel Code** and place it in a private notes app or message to yourself.

On the iPhone build:

1. Open **Transfer Save** from the main menu.
2. Choose the `.ccsave` file from Files, or paste the travel code.
3. Confirm that the preview shows the expected player, ranch, day, creature count, and egg count.
4. Select a destination file.
5. Press **Import**. Replacing an occupied file requires a second confirmation press.
6. Return to the main menu and continue the imported save.

Legacy raw save JSON from the older Dev Tools importer is still accepted, but it does not have a checksum.

## Moving the save back to desktop

Desktop and iPhone saves do not automatically synchronize. Before switching devices again:

1. Export the newest save from the device you last played on.
2. Import it into the other device.
3. Confirm the Ranch Day and update timestamp before continuing.

Do not continue playing two copies independently unless you intend to keep separate progress branches.

## Vacation testing checklist

- Import a desktop travel save into the iPhone.
- Rotate between portrait and landscape orientation.
- Confirm the iPhone safe areas do not cover buttons around the notch or Home indicator.
- Test Ranch, Town, Builder's Yard, Expansion Fields, Coliseum, and move-detail dialogs.
- Visit **The Rose Lantern**, acknowledge its house rules, complete a salon visit and hospitality shift, and spend a Rumor Token.
- Open **Dev Tools → Predator Event Lab**.
- Create an intercepted low-threat incident and confirm enemies begin below full HP.
- Create a full-strength severe breach and inspect the larger reward/penalty preview.
- Complete a predator defense and confirm the Morning Brief records the outcome.
- Close Safari or the installed app during a pending predator event, reopen it, and confirm the same event remains pending.
- Reload after recording victory or defeat and confirm rewards or penalties are not duplicated.
- Export the resulting iPhone save and import it back into a different desktop slot.

## Save and privacy warning

The MVP stores saves in browser local storage. Travel files contain the complete game save, including the player name and all current progression. Transfer them privately and delete old copies when they are no longer needed.

Safari and an installed Home Screen web app may maintain separate storage contexts depending on iOS behavior and how the app is opened. Use one primary launch method for a vacation test save. The travel-save feature provides manual portability, not automatic cloud synchronization. Supabase cloud saves remain a later deployment milestone.

## Preview versus production

Use a Preview Deployment to test an open pull request without changing the main public build. Use the Production Deployment after the validated pull request is merged into `master`.
