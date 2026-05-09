import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/state/GameProvider";

export const metadata: Metadata = {
  title: "Creature Chronicles",
  description: "Creature Chronicles MVP rebuild.",
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