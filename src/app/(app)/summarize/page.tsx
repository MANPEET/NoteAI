"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sparkles,
  AlertTriangle,
  Zap,
  Wand2,
  Video,
  Users
} from "lucide-react"

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

      router.push(`/summary/${data.summary.id}`)
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden rounded-3xl w-full m-5 border border-white/10 bg-[#09090B] text-white">


      <div className="relative z-10 px-8 py-14 ">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-5xl font-semibold tracking-tight bg-linear-to-b from-white to-zinc-500 bg-clip-text text-transparent mb-3">
            New Summary
          </h1>

          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Paste your transcript and let AI extract action items,
            decisions, summaries, and insights instantly.
          </p>
        </motion.div>

        {/* Free Plan Notice */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-xl p-5 mb-8"
          >
            <div className="absolute inset-0 bg-linear-to-r from-yellow-500/10 to-transparent opacity-40" />

            <div className="relative flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>

              <div className="flex-1">
                <p className="text-yellow-100 font-medium">
                  Free Plan
                </p>

                <p className="text-yellow-200/70 text-sm mt-1">
                  2,000 character limit · 5 summaries/month
                </p>
              </div>

              <a
                href="/pricing"
                className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm hover:bg-yellow-500/20 transition"
              >
                Upgrade →
              </a>
            </div>
          </motion.div>
        )}

        {/* Label + Counter */}
        <div className="mb-3 flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-300">
            Paste your transcript
          </label>

          <div
            className={`
              rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-xl
              ${
                isOverLimit
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : transcript.length > charLimit * 0.9
                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                  : "border-white/10 bg-white/5 text-zinc-400"
              }
            `}
          >
            {transcript.length.toLocaleString()} /{" "}
            {charLimit.toLocaleString()}
          </div>
        </div>

        {/* Textarea */}
        <motion.div
          layout
          className="relative"
        >
          <div className="absolute -inset-[px] rounded-3xl bg-linear-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 blur-sm opacity-70" />

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={14}
            placeholder={`John (9:02 AM): Let's discuss the Q3 budget...\nSarah (9:03 AM): I think we should increase social spend...`}
            className="
              relative
              w-full
              rounded-3xl
              border
              border-white/10
              bg-black/40
              backdrop-blur-2xl
              p-6
              text-sm
              leading-8
              text-zinc-100
              placeholder:text-zinc-600
              focus:outline-none
              focus:ring-2
              focus:ring-green-500/20
              transition-all
              duration-300
              resize-none
              shadow-2xl
            "
          />
        </motion.div>

        {/* Warning */}
        {isOverLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4"
          >
            <AlertTriangle className="h-5 w-5 text-red-400" />

            <p className="text-sm text-red-300">
              Transcript exceeds the{" "}
              {isPro ? "20,000" : "2,000"} character limit.
            </p>
          </motion.div>
        )}

        {/* Tips */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/3 backdrop-blur-xl p-6">

          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-green-400" />
            <p className="text-sm font-medium text-zinc-200">
              Tips for better summaries
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
              <Users className="h-5 w-5 text-green-400 mb-3" />

              <p className="text-sm font-medium text-white mb-2">
                Include speaker names
              </p>

              <p className="text-sm text-zinc-500 leading-relaxed">
                Helps AI assign action items accurately.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
              <Video className="h-5 w-5 text-green-400 mb-3" />

              <p className="text-sm font-medium text-white mb-2">
                Works everywhere
              </p>

              <p className="text-sm text-zinc-500 leading-relaxed">
                Zoom, Google Meet, Teams, and plain text.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
              <Wand2 className="h-5 w-5 text-green-400 mb-3" />

              <p className="text-sm font-medium text-white mb-2">
                Better context
              </p>

              <p className="text-sm text-zinc-500 leading-relaxed">
                Longer transcripts create richer summaries.
              </p>
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSubmit}
          disabled={loading || !transcript.trim() || isOverLimit}
          className="
            group
            relative
            mt-8
            w-full
            overflow-hidden
            rounded-3xl
            bg-linear-to-r
            from-green-400
            to-emerald-500
            px-6
            py-5
            font-semibold
            text-black
            shadow-[0_0_50px_rgba(34,197,94,0.25)]
            transition-all
            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >

          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

          <div className="relative flex items-center justify-center gap-2">

            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>

                Analyzing transcript...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Summary
              </>
            )}

          </div>
        </motion.button>
      </div>
    </div>
  )
}

