import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

export async function POST(req:Request, {params}: {params: Promise<{token: string}>}) {
    try {
        const {token} = await params

        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({error: "User must be logged in"}, {status: 403})
        }

        const body = await req.json()
        const participantId = typeof body.participantId === "string" ? body.participantId : null 

        const board = await prisma.board.findUnique({
            where: {inviteToken: token}
        })

        if (!board) {
            return NextResponse.json({ error: "Invite link is invalid or expired" }, { status: 404 })
        }

        await prisma.$transaction(async tx => {
            await prisma.boardMember.upsert({
                where: {boardId_userId : {boardId: board.id, userId: session.user.id}},
                update: {},
                create: {
                    boardId: board.id,
                    userId: session.user.id,
                    role: "MEMBER"
                }
            })

            if(participantId){
                const participant = await prisma.boardParticipant.findFirst({
                    where: {id: participantId}
                })

                if(!participant || participant.boardId !== board.id || participant.claimedBy){
                    throw new Error("This participant has already been claimed or is invalid")
                }

                await tx.boardParticipant.update({
                    where: {id: participantId},
                    data: {
                        claimedBy: session.user.id
                    }
                })
            }
            else{
                await tx.boardParticipant.create({
                    data: {
                        boardId: board.id,
                        name: session.user.name || "New User",
                        claimedBy: session.user.id
                    }
                })
            }
        })

        return NextResponse.json({ boardId: board.id }, { status: 200 })

    } catch (error: any) {
        console.error("Error claiming invite:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}