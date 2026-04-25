"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HUD_LINKS = [
  { href: "/home", label: "Home", activePath: "/home" },
  { href: "/town", label: "Town", activePath: "/town" },
  { href: "/ranch", label: "Ranch", activePath: "/ranch" },
  { href: "/inventory", label: "Inventory", activePath: "/inventory" },
  { href: "/calendar", label: "Calendar", activePath: "/calendar" },
  { href: "/news", label: "News", activePath: "/news" },
] as const;

export function GlobalHudNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Free navigation"
      className="fixed inset-x-2 bottom-2 z-[80] mx-auto max-w-4xl rounded-2xl border border-stone-300 bg-white/94 p-2 shadow-xl backdrop-blur md:inset-x-auto md:bottom-auto md:right-4 md:top-4 md:max-w-none"
    >
      <div className="mb-1 hidden px-2 text-[11px] font-bold uppercase text-stone-500 sm:block md:text-right">
        Free Navigation
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 md:flex md:flex-wrap md:items-center md:justify-end md:gap-2">
        {HUD_LINKS.map((link) => {
          const active = pathname === link.activePath;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-800 hover:bg-stone-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default GlobalHudNav;
