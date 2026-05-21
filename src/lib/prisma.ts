import { PrismaClient } from "@prisma/client";


const global = globalThis as unknown as { 
    prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma
}