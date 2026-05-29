"use client"

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import { DiamondPlus, LayoutDashboard, Star, FileText } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: SidebarUser
  usageCount: number
  resetDate: Date | null
  recentSummaries: RecentSummary[]
}

const FREE_LIMIT = 5

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function AppSidebar({ user, usageCount, resetDate, recentSummaries, ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathName = usePathname()

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
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props} className="h-dvh">

      {/* Logo */}
      <SidebarHeader>
        <button className="p-1.5 text-left">
          <span className="font-bold text-[17px] tracking-tight">
            Note<span className="text-green-500">AI</span>
          </span>
        </button>
      </SidebarHeader>

      <SidebarContent>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.href} onClick={() => router.push(item.href)}>
                  <SidebarMenuButton
                    className={`flex items-center gap-2 font-medium text-sm cursor-pointer ${
                      item.href === pathName
                        ? "bg-green-500/[0.08] text-green-400"
                        : ""
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Account</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem onClick={() => router.push("/pricing")}>
              <SidebarMenuButton className="flex items-center gap-2 font-medium text-sm cursor-pointer">
                <DiamondPlus size={16} />
                {isPro ? "Manage Plan" : "Upgrade to Pro"}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Usage bar — free only */}
          {!isPro && (
            <div className={`rounded-xl p-3.5 border  mt-4 transition-colors ${
              isAtLimit
                ? "bg-red-500/5 border-red-500/20"
                : "bg-zinc-900 border-zinc-800"
            }`}>

              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-zinc-400 font-medium">
                  Usage (last 30 days)
                </span>
                <span className={`text-[11px] font-mono font-semibold ${
                  isAtLimit ? "text-red-400" : "text-zinc-500"
                }`}>
                  {usageCount}/{FREE_LIMIT}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-zinc-800 mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAtLimit
                      ? "bg-red-500"
                      : usagePercent >= 80
                      ? "bg-gradient-to-r from-yellow-600 to-yellow-400"
                      : "bg-gradient-to-r from-green-600 to-green-400"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              {isAtLimit ? (
                // 5/5 — locked out, show when next slot opens
                <p className="text-[11px] text-yellow-500/90">
                  Next slot opens{" "}
                  <span className="font-semibold">
                    {resetDate
                      ? new Date(resetDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "soon"
                    }
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
        </SidebarGroup>

        {/* Recent Summaries */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Recent Summaries</SidebarGroupLabel>
          <SidebarGroupContent>
            {recentSummaries.length === 0 ? (
              <p className="text-[11px] text-zinc-600 px-3 py-2">No summaries yet</p>
            ) : (
              <SidebarMenu>
                {recentSummaries.map(summary => (
                  <SidebarMenuItem
                    key={summary.id}
                    onClick={() => router.push(`/summary/${summary.id}`)}
                  >
                    <SidebarMenuButton className="flex items-start gap-2 cursor-pointer h-auto py-2">
                      <FileText size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-zinc-300 truncate leading-snug">
                          {summary.title ?? "Untitled Meeting"}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                          {timeAgo(summary.createdAt)}
                        </p>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* User footer */}
      <SidebarFooter>
        <div className="px-3 py-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-[11px] font-bold text-black flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate">
                {user?.name ?? "User"}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm flex-shrink-0"
            >
              ⇥
            </button>
          </div>
        </div>
      </SidebarFooter>

    </Sidebar>
  )
}