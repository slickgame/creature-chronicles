"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HUD_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/town", label: "Town" },
  { href: "/ranch", label: "Ranch" },
  { href: "/calendar", label: "Calendar" },
  { href: "/news", label: "News" },
];

export function GlobalHudNav() {
  const pathname = usePathname();

  return (
    <div className="fixed right-4 top-4 z-[80] flex flex-wrap items-center gap-2 rounded-2xl border border-stone-300 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
      {HUD_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              active
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-800 hover:bg-stone-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export default GlobalHudNav;
