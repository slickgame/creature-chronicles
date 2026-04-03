import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold">Creature Chronicles</h1>
      <p className="text-lg text-center">Prototype v0.1</p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/ranch"
          className="rounded-xl bg-blue-600 px-4 py-3 text-center text-white"
        >
          New Game
        </Link>

        <Link
          href="/ranch"
          className="rounded-xl bg-green-600 px-4 py-3 text-center text-white"
        >
          Load Game
        </Link>

        <Link
          href="/ranch"
          className="rounded-xl bg-purple-600 px-4 py-3 text-center text-white"
        >
          Enter Ranch
        </Link>
      </div>
    </main>
  );
}