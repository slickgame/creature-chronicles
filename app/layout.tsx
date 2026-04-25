import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";
import { GlobalHudNav } from "@/components/game/GlobalHudNav";

export const metadata: Metadata = {
  title: "Creature Chronicles",
  description: "Prototype v0.1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          <GlobalHudNav />
          <div className="min-h-screen pb-24 md:pb-0">{children}</div>
        </GameProvider>
      </body>
    </html>
  );
}
