"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function GlobalHudNav() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const items = [
    { href: "/calendar", label: "Calendar", active: pathname === "/calendar" },
    { href: "/news", label: "News", active: pathname === "/news" },
  ];

  return (
    <div className="fixed right-4 top-4 z-[100]">
      <div className="flex gap-2 rounded-2xl border-2 border-stone-900 bg-white/90 p-2 shadow-2xl backdrop-blur">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold shadow transition ${
              item.active
                ? "bg-stone-900 text-white"
                : "bg-indigo-700 text-white hover:opacity-90"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
