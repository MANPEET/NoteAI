"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Kanban, Layers, Users, Crown } from "lucide-react"
import { toast } from "sonner"

type BoardSummary = {
  id: string
  title: string
  isOwner: boolean
  memberCount: number
  cardCount: number
  updatedAt: string
}

export default function BoardsListPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)

  useEffect(() => {
    fetch("/api/boards")
      .then(res => res.json())
      .then(data => {
        if(data.error){
          return toast.error(data.error)
        }

        setBoards(data.boards || [])

      })
  }, [])

  return (
    <div className="m-5 rounded-2xl bg-[#09090B] overflow-hidden min-h-[calc(100vh-2.5rem)] w-full">
      
      <div className="px-4 my-4 h-14.25 flex items-center justify-between border-b border-white/[0.07] shrink-0">
        <div>
          <h2 className="text-base font-medium tracking-tight text-white">Boards</h2>
          <p className="text-[11px] text-white/60 mt-0.5">
            {boards === null ? "Loading..." : `${boards.length} ${boards.length === 1 ? "board" : "boards"}`}
          </p>
        </div>
      </div>

      <div className="p-6">
        {boards === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-32 rounded-xl bg-zinc-950 border border-white/[0.07] animate-pulse" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map(b => (
              <button
                key={b.id}
                onClick={() => router.push(`/boards/${b.id}`)}
                className="text-left bg-zinc-950 border border-white/[0.07] rounded-xl p-5 hover:border-green-500/25 hover:bg-green-500/2 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/8 border border-green-500/15 flex items-center justify-center shrink-0">
                    <Kanban size={16} className="text-green-500" />
                  </div>
                  {b.isOwner && (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                      <Crown size={11} className="text-yellow-500/70" /> Owner
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-medium text-white truncate group-hover:text-green-400 transition-colors">
                  {b.title}
                </h3>

                <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Layers size={11} /> {b.cardCount} {b.cardCount === 1 ? "card" : "cards"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {b.memberCount} {b.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <p className="text-[10px] text-zinc-600 mt-3">
                  Updated {new Date(b.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.07] flex items-center justify-center mb-4">
        <Kanban size={20} className="text-zinc-600" />
      </div>
      <p className="text-sm font-medium text-white">No boards yet</p>
      <p className="text-[13px] text-zinc-500 mt-1 max-w-sm">
        Generate one from a meeting summary, or accept an invite from a teammate to join theirs.
      </p>
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-5 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-black text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]"
      >
        Go to your summaries
      </button>
    </div>
  )
}
