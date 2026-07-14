import { authOptions } from "@/lib/auth"
import {  canEditBoard, getBoardAccess } from "@/lib/boardAuth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"

const ASSIGNEE_INCLUDE = {
  assignees: {
    include: {
      participant: {
        select: { id: true, name: true, claimedBy: true, user: { select: { id: true, name: true } } }
      }
    }
  }
} as const

export async function POST(req:Request, {params} : {params: Promise<{id: string}>}) {
    try {
        const {id} = await params

        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }

        const body = await req.json()

        const participantId = typeof body.participantId === "string" ? body.participantId : null
        
        if(!participantId){
            return NextResponse.json({ error: "Participant Id is required" }, { status: 400 })
        }

        const card = await prisma.card.findUnique({
            where: {id},
            include: {
                column: {
                    select: {boardId: true}
                }
            }
        })

        if(!card){
            return NextResponse.json({ error: "Card not found" }, { status: 404 })
        }

        const participant = await prisma.boardParticipant.findFirst({
            where: {
                id: participantId
            }
        })

        if(!participant || participant.boardId !== card.column?.boardId){
            return NextResponse.json({ error: "Invalid participant" }, { status: 400 })
        }

        const access = await getBoardAccess(card.column.boardId!, session.user.id)

        

        const selfAssign = session.user.id === participant.claimedBy
        if(!selfAssign && !canEditBoard(access)){
            return NextResponse.json({ error: "Not authorized to assign this card" }, { status: 403 })
        }
 

        await prisma.cardAssignee.upsert({
            where: {cardId_participantId : {cardId: id, participantId}},
            update: {},
            create: {cardId : id, participantId}
        })

        const updated = await prisma.card.findUnique({
            where: {id},
            include: ASSIGNEE_INCLUDE
        })

        await pusherServer.trigger(`personal-board-${card.column.boardId}`, "card-updated", {card: updated})

        return NextResponse.json({ card: updated }, { status: 200 })

         
    } catch (error: any) {
        console.error("Error assigning card:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}

export async function DELETE(req: Request, {params}:{params : Promise<{id: string}>}) {
    try {
        const {id} = await params

        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }

        const body = await req.json()

        const participantId = typeof body.participantId === "string" ? body.participantId : null

        if(!participantId){
            return NextResponse.json({error: "Participant Id is required"}, {status: 404})
        }

        const card = await prisma.card.findUnique({
            where: {id},
            include: {
                column: {
                    select: {
                        boardId: true
                    }
                }
            }
        })

        if(!card){
            return NextResponse.json({error: "Card not found"}, {status: 403})
        }

        const participant = await prisma.boardParticipant.findUnique({
            where: {id: participantId}
        })

        if(!participant || card.column?.boardId !== participant.boardId){
             return NextResponse.json({ error: "Invalid participant" }, { status: 400 })
        }

        const access = await getBoardAccess(card.column?.boardId!, session.user.id)
        const isSelfUnassign  = participant?.claimedBy === session.user.id

        if(!isSelfUnassign  && !canEditBoard(access)){
            return NextResponse.json({ error: "Not authorized to assign this card" }, { status: 403 })
        }

        await prisma.cardAssignee.deleteMany({
            where: {cardId: id, participantId},
        })

        const updated = await prisma.card.findUnique({
            where: {id},
            include: ASSIGNEE_INCLUDE
        })

        await pusherServer.trigger(`private-board-${card.column.boardId}`, "card-updated", { card: updated })
 
        return NextResponse.json({ card: updated }, { status: 200 })

    } catch (error: any) {
        console.error("Error unassigning card:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}