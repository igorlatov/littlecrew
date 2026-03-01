import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          LittleCrew
        </h1>
        <p className="text-xl md:text-2xl text-slate-300">
          AI companions for creative kids
        </p>
        <Link
          href="/app"
          className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-lg font-semibold transition-colors"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
