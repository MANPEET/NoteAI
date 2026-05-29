import { AppSidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateSummary } from "@/lib/usage";
import { getServerSession } from "next-auth/next";
import { Roboto } from "next/font/google";
import { redirect } from "next/navigation";

const roboto = Roboto({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
})
export default async function AppLayout({children} : {children: React.ReactNode}){
    const session = await getServerSession(authOptions)
    if(!session?.user.email) redirect("/login")

    const user = await prisma.user.findUnique({
        where: {email: session.user.email},
        select: {
            id: true,
            name: true,
            email: true,
            plan: true,
        }
    })

    if(!user) redirect("/login")

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [recentSummaries] = await Promise.all([

       
        prisma.summary.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt : "desc"
            },
            take : 5,
            select: {
                id: true,
                title: true,
                createdAt: true
            }
        })
    ])

    const usageInfo = await canCreateSummary(user.id, user.plan)


    return(
        <div className={`min-h-screen flex text-white ${roboto.className}`}>
            <SidebarProvider>
                <AppSidebar 
                    user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        plan: user.plan as "free" | "pro",
                    }}
                    usageCount={usageInfo.used}
                    resetDate={usageInfo.resetDate}
                    recentSummaries={recentSummaries}
                    variant="inset"/>

                    {children}
            </SidebarProvider>
        </div>
    )
}

