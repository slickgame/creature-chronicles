import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./guild-board.css";
import "./breeding-compact.css";
import "./breeding-scene-modal.css";
import "./breeding-records.css";
import "./night-mode.css";
import "./content-sizing.css";
import "./breeding-focused-polish.css";
import "./mobile-install.css";
import "./battle-overlay-safe-area.css";
import "./tutorial-dock.css";
import "./adoption-hearth-hub.css";
import "./egg-atelier-tutorial-cleanup.css";
import "./egg-atelier-landing-concept.css";
import "./egg-atelier-background-art.css";
import "./egg-atelier-landing-viewport-fit.css";
import "./egg-atelier-landing-fidelity-v2.css";
import "./egg-atelier-talk-fidelity.css";
import "./egg-atelier-talk-composition-final.css";

/* Egg Services uses some shared MarketScreen class names. Load its broad
   overlay rules before the dedicated Registry/Furniture stacks so those
   completed screens always win the cascade and retain their authored layouts. */
import "./egg-atelier-services-backdrop-v5.css";
import "./egg-atelier-services-backdrop-v6.css";
import "./egg-atelier-services-fullscreen-v7.css";
import "./egg-atelier-services-isolation-v8.css";

import "./egg-atelier-furniture-catalog-fidelity.css";
import "./egg-atelier-furniture-catalog-composition-v2.css";
import "./egg-atelier-furniture-catalog-composition-v3.css";
import "./egg-atelier-furniture-catalog-composition-v4.css";
import "./egg-atelier-furniture-catalog-final.css";
import "./egg-atelier-furniture-catalog-heading-final.css";
import "./egg-atelier-furniture-catalog-readability.css";
import "./egg-atelier-registry-fidelity.css";
import "./egg-atelier-registry-composition-v2.css";
import "./egg-atelier-registry-composition-v3.css";
import "./egg-atelier-registry-composition-v4.css";
import "./egg-atelier-registry-composition-v5.css";
import "./egg-atelier-registry-composition-v6.css";
import "./egg-atelier-registry-composition-v7.css";
import "./egg-atelier-registry-composition-v8.css";
import "./egg-atelier-registry-composition-v9.css";
import "./egg-atelier-registry-composition-v10.css";
import "./egg-atelier-registry-composition-v11.css";
import "./egg-atelier-registry-composition-v12.css";
/* Hard restoration guard: Furniture uses data-* hooks injected by
   EggAtelierUiBridge, so this final sheet cannot affect Registry/Services. */
import "./egg-atelier-furniture-catalog-restore-v5.css";
import { GameProvider } from "@/state/GameProvider";

export const metadata: Metadata = {
  title: "Creature Chronicles",
  description: "Manage the ranch, raise creatures, and defend it in tactical 3v3 battles.",
  manifest: "/manifest.webmanifest",
  applicationName: "Creature Chronicles",
  appleWebApp: {
    capable: true,
    title: "Creature Chronicles",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/images/ui/icons/icon_paw_crest.png",
    apple: "/images/ui/icons/icon_paw_crest.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
