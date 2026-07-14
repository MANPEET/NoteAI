"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Users } from "lucide-react"

type Participant = { id: string; name: string }

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { status } = useSession()
  const router = useRouter()

  const [boardTitle, setBoardTitle] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/invite/${token}`)
      return
    }

    fetch(`/api/invites/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setBoardTitle(data.board.title)
          setParticipants(data.board.participants)
        }
      })
      .finally(() => setLoading(false))
  }, [status, token, router])

  async function claim(participantId: string | null) {
    setSubmitting(true)
    const res = await fetch(`/api/invites/${token}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setSubmitting(false)
      return
    }
    router.push(`/boards/${data.boardId}`)
  }

  if (loading) {
    return (
      <div className="m-5 rounded-2xl bg-[#09090B] p-16 flex items-center justify-center w-full">
        <Loader2 size={20} className="text-white/30 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-5 rounded-2xl bg-[#09090B] p-16 text-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="m-5 rounded-2xl bg-[#09090B] flex items-center justify-center min-h-[70vh] w-full">
      <div className="max-w-md w-full px-6">
        <div className="w-11 h-11 rounded-xl bg-green-500/8 border border-green-500/15 flex items-center justify-center mb-5">
          <Users size={20} className="text-green-500" />
        </div>

        <h1 className="text-lg font-medium text-white mb-1">Join "{boardTitle}"</h1>
        <p className="text-[13px] text-zinc-500 mb-6 leading-relaxed">
          Which participant from the meeting are you? This links your existing action items automatically.
        </p>

        <div className="space-y-2">
          {participants.map(p => (
            <button
              key={p.id}
              disabled={submitting}
              onClick={() => claim(p.id)}
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-zinc-950 border border-white/[0.07] hover:border-green-500/30 hover:bg-green-500/3 transition-all disabled:opacity-50"
            >
              <span className="w-6 h-6 rounded-full bg-linear-to-br from-green-700 to-green-500 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                {p.name[0].toUpperCase()}
              </span>
              <span className="text-sm text-zinc-200">{p.name}</span>
            </button>
          ))}

          <button
            disabled={submitting}
            onClick={() => claim(null)}
            className="w-full text-left px-4 py-3 rounded-xl border border-white/[0.07] text-zinc-500 hover:text-zinc-300 hover:border-white/13 transition-all disabled:opacity-50"
          >
            I'm not listed — just add me to the board
          </button>
        </div>
      </div>
    </div>
  )
}
