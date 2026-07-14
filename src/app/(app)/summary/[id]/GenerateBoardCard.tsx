import { Kanban, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GenerateBoardCard({ summaryId, isPro }: { summaryId: string; isPro: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function generate() {
    setLoading(true)
    setError("")
    const res = await fetch(`/api/summary/${summaryId}/board`, { method: "POST" })
    const data = await res.json()
    setLoading(false)
    if (data.error) {
      setError(data.error)
      return
    }
    router.push(`/boards/${data.boardId}`)
  }

  return (
    <div className="m-8 bg-zinc-900/60 border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4 justify-between text-sm text-white/60 w-[55%]">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-green-500/8 border border-green-500/15 flex items-center justify-center shrink-0">
          <Kanban size={20} className="text-green-500" />
        </div>
        <div>
          <p className="text-sm font-semibold">Generate Kanban Board</p>
          <p className="text-xs text-zinc-600 mt-0.5">
            {isPro
              ? "Turn action items into a board your team can work from"
              : "Upgrade to Pro to turn this summary into a Kanban board"}
          </p>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>

      {isPro ? (
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-black text-sm font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] disabled:opacity-60 disabled:translate-y-0 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Building board...
            </>
          ) : (
            <>
              <Kanban size={14} />
              Generate Board
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => router.push("/pricing")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-black text-sm font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] shrink-0"
        >
          <Lock size={13} />
          Upgrade to Pro
        </button>
      )}
    </div>
  )
}