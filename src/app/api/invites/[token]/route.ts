import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function GET(req:Request, {params} : {params: Promise<{token : string}>}) {
    try {
        const {token} = await params

        const session = await getServerSession(authOptions)

        const board = await prisma.board.findUnique({
            where: {inviteToken : token},
            select: {
                id: true,
                title: true,
                participants: {
                    where: {
                        claimedBy: null
                    },
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if(!board){
            return NextResponse.json({ error: "Invite link is invalid or expired" }, { status: 404 })
        }

        return NextResponse.json({board, requireAuth: !session?.user.id})
    } catch (error: any) {
        console.error("Error fetching invite:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}