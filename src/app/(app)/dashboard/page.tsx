import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { usageCount } from "@/lib/usage";
import  DashboardClient  from "./DashboardClient";

export default async function DashboardPage() {
    const session = await getServerSession();

    const [summaries, totalActionItems, count] = await Promise.all([
        prisma.summary.findMany({
            where: {
                userId: session?.user?.id,
            },
            orderBy: {
                createdAt: "desc",
            }
        }),

        prisma.summary.findMany({
            where: {
                userId: session?.user?.id,
            },
            select: {
                result: true,
            }
        })
        .then(sums => sums.reduce((acc,s) => {
            const r = s.result as any
            return acc + (r?.actionItems?.length ?? 0)
        }, 0)),

        usageCount(session!.user?.id)
    ])

    return <DashboardClient
        summaries = {summaries}
        totalActionItems = {totalActionItems}
        usageCount = {count}
        plan = {session?.user.plan as "free"| "pro"}
    />
}