"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HUD_LINKS = [
  { href: "/home", label: "Home", activePath: "/home" },
  { href: "/town", label: "Town", activePath: "/town" },
  { href: "/ranch", label: "Ranch", activePath: "/ranch" },
  { href: "/inventory", label: "Inventory", activePath: "/inventory" },
  { href: "/calendar", label: "Calendar", activePath: "/calendar" },
  { href: "/news", label: "News", activePath: "/news" },
  { href: "/regions", label: "Regions", activePath: "/regions" },
] as const;

export function GlobalHudNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const menuId = "global-free-navigation-menu";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label="Free navigation"
      className="fixed bottom-3 right-3 z-[80] md:bottom-auto md:right-4 md:top-4"
    >
      <div className="relative flex flex-col items-end">
        <button
          type="button"
          aria-label="Open free navigation quick menu"
          aria-controls={menuId}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold shadow-lg backdrop-blur transition ${
            open
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white/55 text-stone-900 hover:bg-white/85 focus:bg-white/90"
          }`}
        >
          Quick Menu
        </button>

        {open ? (
          <div
            id={menuId}
            className="absolute bottom-full right-0 mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-stone-300 bg-white/95 p-2 shadow-2xl backdrop-blur md:bottom-auto md:top-full md:mb-0 md:mt-2"
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-2">
              <p className="text-[11px] font-bold uppercase text-stone-500">Free Navigation</p>
              <p className="text-[11px] font-semibold text-stone-500">No time cost</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {HUD_LINKS.map((link) => {
                const active = pathname === link.activePath;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-800 hover:bg-stone-200 focus:bg-stone-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export default GlobalHudNav;
