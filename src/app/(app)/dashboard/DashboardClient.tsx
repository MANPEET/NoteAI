"use client"

import { useUser } from "@/components/providers/user-provider"
import { ArrowRight, DiamondIcon, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface ActionItem {
  task: string
  owner: string | null
  deadline: string | null
}

interface SummaryResult {
  title: string
  summary: string
  participants: string[]
  keyDecisions: string[]
  actionItems: ActionItem[]
  openQuestions: string[]
  sentiment: "positive" | "neutral" | "tense"
  topics: string[]
}

interface Summary {
  id: string
  title: string
  createdAt: Date
  result: SummaryResult | any
}

interface Props {
  summaries: Summary[]
  totalActionItems: number
  usageCount: number
}

const FREE_LIMIT = 5

const sentimentConfig = {
  positive: { dot: "bg-green-500", label: "Positive", text: "text-green-400" },
  neutral:  { dot: "bg-zinc-500",  label: "Neutral",  text: "text-zinc-400"  },
  tense:    { dot: "bg-red-400",   label: "Tense",    text: "text-red-400"   },
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function DashboardClient({
  summaries,
  totalActionItems,
  usageCount,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "positive" | "neutral" | "tense">("all")

  const {plan} =  useUser();

  const isPro = plan === "pro"
  const usagePercent = Math.min((usageCount / FREE_LIMIT) * 100, 100)

  const filtered = summaries.filter(s => {
    const r = s.result as SummaryResult
    const matchSearch =
      search === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      r.topics?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      r.participants?.some(p => p.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter === "all" || r.sentiment === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col flex-1 overflow-hidden m-5 text-white rounded-2xl bg-[#09090B]">

      {/* Topbar */}
        <div className="my-4.5 px-7 h-15 flex items-center justify-between border-b border-white/[0.07] shrink-0">
            <div >
                <h1 className="text-[18px] font-bold tracking-tight">Dashboard</h1>
                <p className="text-xs text-zinc-600 mt-0.5">
                    {summaries.length === 0
                    ? "No summaries yet"
                    : `${summaries.length} summar${summaries.length === 1 ? "y" : "ies"}`}
                </p>
            </div>
            <button
            onClick={() => router.push("/summarize")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
                ✦ New Summary
            </button>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
           <div className="bg-[#1d1d1d] border border-gray-400/40 rounded-2xl p-5">
            <p className="text-xs text-zinc-500 font-medium mb-2">Summaries this month</p>
            <p className="text-3xl font-bold tracking-tight leading-none">
              {usageCount}
              {!isPro && (
                <span className="text-base font-normal text-zinc-600"> /{FREE_LIMIT}</span>
              )}
            </p>
            {!isPro && (
              <>
                <div className="h-1 bg-zinc-900 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-green-700 to-green-500 transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-600 mt-1.5">
                  {FREE_LIMIT - usageCount} remaining · Free plan
                </p>
              </>
            )}
          </div>

            <div className="bg-[#1d1d1d] border border-gray-400/40 rounded-2xl p-5">
                <p className="text-xs text-zinc-500 font-medium mb-2">Total Summaries</p>
                <p className="text-3xl font-bold tracking-tight text-green-500 leading-none">
                {summaries.length}
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">Since you joined</p>
            </div>

           <div className="bg-[#1d1d1d] border border-gray-400/40 rounded-2xl p-5">
                <p className="text-xs text-zinc-500 font-medium mb-2">Action items</p>
                <p className="text-3xl font-bold tracking-tight text-green-500 leading-none">
                {totalActionItems}
                </p>
                <p className="text-[11px] text-zinc-600 mt-2">Across all summaries</p>
            </div>
        </div>
        

        {/* Search + filters */}

        <div className="flex items-center gap-5 my-6">
            <div className="bg-[#1d1d1d] rounded-xl flex-1  p-2.5 flex gap-2.5 items-center max-w-75">
                <Search className="size-4 text-zinc-400"/>
                <input 
                    type="text"
                    placeholder="Search Summaries"
                    onChange={(e) => setSearch(e.target.value)}
                    className="text-sm text-zinc-400 w-full focus:outline-none"
                />
            </div>

            <div className="flex gap-1.5">
                {(["all", "positive", "neutral", "tense"] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`py-2.5 px-3.5 rounded-lg text-xs font-semibold capitalize transition-all border cursor-pointer ${
                        filter === f
                            ? "bg-green-500/8 text-green-400 border-green-500/20"
                            : "bg-zinc-950 text-zinc-500 border-white/[0.07] hover:text-white"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
        

        {/* List header */}
        <div className="flex items-center justify-between mb-7">
          <h3 className="text-sm font-semibold">Recent Summaries</h3>
          <button className="text-[12px] text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
            View all 
            <ArrowRight size={12} className="text-white/60 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Empty state */}
        {summaries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-[#1d1d1d] border-gray-400/40 rounded-2xl flex items-center justify-center text-2xl mb-4">
                    ✦
                </div> 

                <div className="text-xl text-white font-bold mb-0.5">No summaries yet</div>
                <span className="text-zinc-400/40 text-sm">Paste your first meeting transcript and AI will extract all the key insights.</span>

                <button
                    onClick={() => router.push("/summarize")}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black text-sm font-bold transition-all hover:-translate-y-0.5 my-4 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    >
                        ✦ Create your first summary
                </button>
            </div>
        )}
        
        {/* No search results */}
        {summaries.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-zinc-600">No summaries match your search.</p>
            <button
              onClick={() => { setSearch(""); setFilter("all") }}
              className="mt-2 text-green-400 text-sm hover:text-green-300"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Cards grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(summary => {
              const result = summary.result as SummaryResult
              const sentiment = sentimentConfig[result.sentiment] ?? sentimentConfig.neutral

              return (
                <button
                  key={summary.id}
                  onClick={() => router.push(`/summary/${summary.id}`)}
                  className="group bg-[#1d1d1d] border border-white/[0.07] rounded-2xl p-4.25 text-left hover:border-green-500/20 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-b from-green-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">

                    {/* Title */}
                    <h3 className="text-[13.5px] font-semibold text-white leading-snug mb-1.5 line-clamp-2">
                      {summary.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${sentiment.dot}`} />
                      <span className={`text-[11px] font-semibold ${sentiment.text}`}>
                        {sentiment.label}
                      </span>
                    </div>
                  </div>

                  

                  {/* Preview */}
                  <p className="text-xs text-zinc-600 leading-relaxed mb-3 line-clamp-2">
                    {result.summary}
                  </p>

                  {/* Tags */}
                  {result.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {result.topics.slice(0, 3).map(t => (
                        <span
                          key={t}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-500 border border-white/5"
                        >
                          {t}
                        </span>
                      ))}
                      {result.topics.length > 3 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-600 border border-white/5">
                          +{result.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2.5">
                      {result.participants?.length > 0 && (
                        <div className="flex -space-x-1.5">
                          {result.participants.slice(0, 3).map(name => (
                            <div
                              key={name}
                              title={name}
                              className="w-5 h-5 rounded-full bg-linear-to-br from-green-700 to-green-500 border border-black flex items-center justify-center text-[9px] font-bold text-black"
                            >
                              {name[0].toUpperCase()}
                            </div>
                          ))}
                          {result.participants.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[9px] text-zinc-400">
                              +{result.participants.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-[11px] text-zinc-600">
                        {result.actionItems?.length ?? 0} tasks
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-700">
                      {timeAgo(summary.createdAt)}
                    </span>
                  </div>

                  
                </button>
              )
            })}
          </div>
        )}
        
      </div>
    </div>
  )
}