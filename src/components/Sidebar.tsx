"use client"

import { DiamondPlus, LayoutDashboard, Star, LogOut, Kanban } from "lucide-react"
import { signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"

type SidebarUser = {
  id: string
  name: string | null
  email: string | null
  plan: "free" | "pro"
}

type RecentSummary = {
  id: string
  createdAt: Date
  title: string | null
}

interface AppSidebarProps {
  user: SidebarUser
  usageCount: number
  resetDate: Date | null
  recentSummaries: RecentSummary[]
}

const FREE_LIMIT = 5

export function AppSidebar({ user, usageCount, resetDate, recentSummaries }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isPro = user?.plan === "pro"
  const isAtLimit = usageCount >= FREE_LIMIT
  const remaining = Math.max(FREE_LIMIT - usageCount, 0)
  const usagePercent = Math.min((usageCount / FREE_LIMIT) * 100, 100)

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "U"

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/dashboard" },
    { label: "New Summary", icon: <Star size={16} />, href: "/summarize" },
    { label: "Boards", icon: <Kanban size={16} />, href: "/boards" },
  ]

  return (
    <aside className="flex flex-col h-screen sticky top-0 w-64 text-sidebar-foreground shrink-0 overflow-hidden">

      {/* Logo */}
      <div className="p-4 pb-2">
        <button className="p-1.5 text-left">
          <span className="font-bold text-[17px] tracking-tight">
            Note<span className="text-green-500">AI</span>
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 p-4 gap-4">

        {/* Menu */}
        <div>
          <p className="px-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wide">Menu</p>
          <ul className="space-y-0.5">
            {navItems.map(item => (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    item.href === pathname
                      ? " text-green-400"
                      : "text-white/70 hover:bg-green-400/40"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="px-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wide">Account</p>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => router.push("/pricing")}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium text-white/70 hover:bg-green-400/40 hover:text-white transition-colors cursor-pointer"
              >
                <DiamondPlus size={16} />
                {isPro ? "Manage Plan" : "Upgrade to Pro"}
              </button>
            </li>
          </ul>

          {/* Usage card (free users only) */}
          {!isPro && (
            <div className={`rounded-xl p-3.5 border mt-3 transition-colors ${
              isAtLimit
                ? "bg-red-500/5 border-red-500/20"
                : "bg-zinc-900 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">Usage (last 30 days)</span>
                <span className={`text-[11px] font-mono font-semibold ${
                  isAtLimit ? "text-red-400" : "text-zinc-500"
                }`}>
                  {usageCount}/{FREE_LIMIT}
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-zinc-800 mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAtLimit
                      ? "bg-red-500"
                      : usagePercent >= 80
                      ? "bg-linear-to-r from-yellow-600 to-yellow-400"
                      : "bg-linear-to-r from-green-600 to-green-400"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              {isAtLimit ? (
                <p className="text-[11px] text-yellow-500/90">
                  Next slot opens{" "}
                  <span className="font-semibold">
                    {resetDate
                      ? new Date(resetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "soon"}
                  </span>
                </p>
              ) : usageCount === 0 ? (
                <p className="text-[11px] text-zinc-600">
                  <span className="text-zinc-400 font-medium">5</span> summaries available
                </p>
              ) : (
                <p className="text-[11px] text-zinc-600">
                  <span className="text-zinc-400 font-medium">{remaining}</span>{" "}
                  {remaining === 1 ? "summary" : "summaries"} remaining
                </p>
              )}

              <button
                onClick={() => router.push("/pricing")}
                className="text-[11px] text-green-400 font-semibold hover:text-green-300 transition-colors mt-2 block"
              >
                Upgrade for unlimited →
              </button>
            </div>
          )}
        </div>

      </div>

      {/* User footer */}
      <div className="px-8 py-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-600 to-green-400 flex items-center justify-center text-[11px] font-bold text-black shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate">{user?.name ?? "User"}</p>
            <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

    </aside>
  )
}