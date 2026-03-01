import Link from "next/link";

const agents = [
  {
    key: "lexi",
    name: "Lexi",
    subtitle: "Fashion & Story Companion",
    emoji: "✨",
    avatarBg: "bg-gradient-to-br from-rose-400 to-fuchsia-500",
    accentColor: "text-rose-500",
    kidName: "Emma",
  },
  {
    key: "kate",
    name: "Kate",
    subtitle: "Fishing & Mechanics Companion",
    emoji: "🎣",
    avatarBg: "bg-gradient-to-br from-teal-400 to-blue-500",
    accentColor: "text-teal-500",
    kidName: "Erik",
  },
];

export default function AppHome() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 mb-6">
          <span className="text-lg">🚀</span>
          <span className="text-sm font-medium text-gray-500 tracking-wide">LITTLECREW</span>
        </div>
        <h1
          className="text-3xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          Who&apos;s building today?
        </h1>
        <p className="text-gray-500 text-lg">Pick your companion to get started</p>
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {agents.map((agent) => (
          <Link
            key={agent.key}
            href={`/app/${agent.key}`}
            className="group w-52 bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 active:scale-95 flex flex-col items-center gap-4"
            style={{ minHeight: "220px" }}
          >
            <div
              className={`w-20 h-20 ${agent.avatarBg} rounded-3xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              {agent.emoji}
            </div>
            <div className="text-center">
              <h2
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {agent.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{agent.subtitle}</p>
              <p className={`text-xs ${agent.accentColor} font-semibold mt-2`}>
                {agent.kidName}&apos;s companion
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
