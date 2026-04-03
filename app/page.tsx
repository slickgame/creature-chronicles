import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-100 to-orange-200 flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-xl rounded-3xl border-4 border-amber-900 bg-white/80 p-8 text-center shadow-xl">
        <h1 className="text-5xl font-bold text-amber-900">
          Creature Chronicles
        </h1>
        <p className="mt-3 text-lg text-stone-700">Prototype v0.1</p>
        <p className="mt-2 text-sm text-stone-600">
          Breed creatures, raise eggs, grow your ranch.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/ranch"
            className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-white font-semibold shadow"
          >
            New Game
          </Link>

          <Link
            href="/ranch"
            className="rounded-2xl bg-green-600 px-4 py-3 text-center text-white font-semibold shadow"
          >
            Load Game
          </Link>

          <Link
            href="/ranch"
            className="rounded-2xl bg-purple-600 px-4 py-3 text-center text-white font-semibold shadow"
          >
            Enter Ranch
          </Link>
        </div>
      </div>
    </main>
  );
}