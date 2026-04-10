
"use client";

import Link from "next/link";

export default function BreedingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-100 to-rose-200 p-6">
      <div className="mx-auto max-w-3xl rounded-3xl border-4 border-rose-900 bg-white/90 p-8 text-center shadow-xl">
        <h1 className="text-4xl font-bold text-rose-950">💞 Breeding Moved</h1>
        <p className="mt-4 text-lg text-stone-700">
          Breeding is now handled inside Ranch Operations so creature care, eggs, and pair selection all live in one place.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/ranch?tab=breeding"
            className="rounded-2xl bg-rose-700 px-5 py-3 font-semibold text-white shadow"
          >
            Open Ranch Breeding
          </Link>

          <Link
            href="/ranch?tab=nursery"
            className="rounded-2xl border border-rose-300 bg-white px-5 py-3 font-semibold text-stone-900 shadow"
          >
            Open Nursery
          </Link>
        </div>
      </div>
    </main>
  );
}
