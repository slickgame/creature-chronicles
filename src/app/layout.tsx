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
  themeColor: "#10151b",
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
