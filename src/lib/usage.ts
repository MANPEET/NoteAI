import { prisma } from "./prisma";

export async function usageCount(userId: string): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    
    const count = await prisma.summary.count({
        where: {
            userId,
            createdAt : {gte: since}
        },
    })

    return count
}

export async function canCreateSummary(userId: string, plan:string) : Promise<{
    allowed: boolean,
    used: number,
    limit: number,
    resetDate: Date | null
}>
{
    if(plan === "pro"){
        return {allowed: true, used: 0, limit: Infinity, resetDate: null}
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const used = await usageCount(userId);
    const limit = 5

    if(used < limit) return { allowed: true, used, limit, resetDate: null }

    const oldest = await prisma.summary.findFirst({
        where: {
            userId,
            createdAt: {gte : since}
        },
        orderBy: {createdAt: "asc"},
        select: {createdAt : true}
    })

    const resetDate = oldest ? new Date(new Date(oldest.createdAt).getTime() + 30 * 24 * 60 *60 * 1000) : null

    return {allowed : false, used, limit, resetDate}
}