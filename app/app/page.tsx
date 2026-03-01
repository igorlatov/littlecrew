import Link from "next/link";

export default function AppHome() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Choose Your Companion
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Lexi - Emma's companion */}
          <Link
            href="/app/lexi"
            className="group block p-8 bg-gradient-to-br from-purple-900/50 to-pink-900/50 hover:from-purple-800/60 hover:to-pink-800/60 rounded-3xl border-2 border-purple-500/30 hover:border-purple-400/50 transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center text-4xl">
                👗
              </div>
              <h2 className="text-3xl font-bold text-purple-300">Lexi</h2>
              <p className="text-slate-300 text-lg">
                Creative companion for Emma
              </p>
              <p className="text-sm text-slate-400">
                Fashion, stories, and fun ideas!
              </p>
            </div>
          </Link>

          {/* Kate - Erik's companion */}
          <Link
            href="/app/kate"
            className="group block p-8 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 hover:from-blue-800/60 hover:to-cyan-800/60 rounded-3xl border-2 border-blue-500/30 hover:border-blue-400/50 transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-4xl">
                🎮
              </div>
              <h2 className="text-3xl font-bold text-blue-300">Kate</h2>
              <p className="text-slate-300 text-lg">
                Creative companion for Erik
              </p>
              <p className="text-sm text-slate-400">
                Games, systems, and how things work!
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
