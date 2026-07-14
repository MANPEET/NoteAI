import { UserProvider } from "@/components/providers/user-provider"
import SidebarVisibility from "@/components/SidebarVisibility"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCreateSummary } from "@/lib/usage"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user.email) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
    }
  })

  if (!user) redirect("/login")

  const [recentSummaries, usageInfo] = await Promise.all([
    prisma.summary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true }
    }),
    canCreateSummary(user.id, user.plan)
  ])

  return (
    <UserProvider value={{ plan: user.plan as "free" | "pro" }}>
      
        <div className="flex bg-sidebar">
            <SidebarVisibility
                user={{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    plan: user.plan as "free" | "pro",
                }}
                usageCount={usageInfo.used}
                resetDate={usageInfo.resetDate}
                recentSummaries={recentSummaries}
            />
       
        
          {children}
        </div>
        
    </UserProvider>
  )
}