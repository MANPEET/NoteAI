"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const FREE_CHAR_LIMIT = 2000
const PRO_CHAR_LIMIT = 20000

export default function SummarizePage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [transcript, setTranscript] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isPro = session?.user?.plan === "pro"
  const charLimit = isPro ? PRO_CHAR_LIMIT : FREE_CHAR_LIMIT
  const isOverLimit = transcript.length > charLimit

  async function handleSubmit() {
    if (!transcript.trim() || isOverLimit) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      // Redirect to the result page
      router.push(`/summary/${data.summary.id}`)

    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-white/8 px-8 py-4 flex justify-between items-center">
        <span className="font-bold text-lg tracking-tight">
          Note<span className="text-green-500">AI</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{session?.user?.email}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            isPro
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-zinc-800 text-zinc-400 border border-white/8"
          }`}>
            {isPro ? "Pro" : "Free"}
          </span>
          <a href="/dashboard" className="text-zinc-400 hover:text-white text-sm transition-colors">
            Dashboard
          </a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">New Summary</h1>
          <p className="text-zinc-400">Paste your transcript and let AI extract everything.</p>
        </div>

        {/* Free tier notice */}
        {!isPro && (
          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-yellow-400">⚡</span>
            <p className="text-yellow-400/90 text-sm">
              <strong>Free plan:</strong> 2,000 character limit · 5 summaries/month.{" "}
              <a href="/pricing" className="underline hover:text-yellow-300">Upgrade to Pro →</a>
            </p>
          </div>
        )}

        {/* Textarea */}
        <div className="mb-2 flex justify-between items-center">
          <label className="text-sm text-zinc-400 font-medium">Paste your transcript</label>
          <span className={`text-xs font-mono ${
            isOverLimit
              ? "text-red-400"
              : transcript.length > charLimit * 0.9
              ? "text-yellow-400"
              : "text-zinc-600"
          }`}>
            {transcript.length.toLocaleString()} / {charLimit.toLocaleString()}
          </span>
        </div>

        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          rows={14}
          placeholder={`John (9:02 AM): Let's discuss the Q3 budget...\nSarah (9:03 AM): I think we should increase social spend...`}
          className="w-full bg-zinc-900 border border-white/8 rounded-xl p-4 text-white placeholder-zinc-700 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10 resize-none text-sm font-mono leading-relaxed transition-all"
        />

        {/* Over limit warning */}
        {isOverLimit && (
          <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
            <span>⚠</span>
            Transcript exceeds the {isPro ? "20,000" : "2,000"} character limit.
            {!isPro && <a href="/pricing" className="underline">Upgrade to Pro</a>}
          </p>
        )}

        {/* Tips */}
        <div className="mt-4 bg-zinc-900 border border-white/8 rounded-xl p-4">
          <p className="text-xs text-zinc-500 font-semibold mb-2 uppercase tracking-wider">💡 Tips</p>
          <p className="text-xs text-zinc-600 leading-7">→ Include speaker names for accurate action item assignment<br/>→ Works with Zoom, Google Meet, Teams & plain text<br/>→ Longer transcripts give richer summaries (Pro: 20,000 chars)</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/5 border border-red-500/15 rounded-xl p-4">
            <p className="text-red-400 text-sm flex gap-2"><span>⚠</span>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !transcript.trim() || isOverLimit}
          className="w-full mt-5 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl text-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Analyzing transcript...
            </>
          ) : (
            "✦ Generate Summary"
          )}
        </button>
      </div>
    </div>
  )
}