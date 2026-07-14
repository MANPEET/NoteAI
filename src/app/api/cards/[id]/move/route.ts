import { authOptions } from "@/lib/auth"
import { canEditCard, getBoardAccess } from "@/lib/boardAuth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function PATCH(req:Request, {params} : {params : Promise<{id: string}>}) {
    try {
        const {id} = await params

        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }

        const body = await req.json();

        const columnId = typeof body.columnId === "string" ? body.columnId : null
        const order = typeof body.order === "number" ? body.order : null

        if (!columnId || order === null) {
            return NextResponse.json({ error: "columnId and order are required" }, { status: 400 })
        }

        const card = await prisma.card.findUnique({
            where: {id},
            include: {
                assignees: { include: { participant: { select: { claimedBy: true } } } },
                column: { select: { boardId: true } }
            }
        })

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 })
        }

        const access = await getBoardAccess(card.column?.boardId!, session.user.id)
        if (!canEditCard(access, card, session.user.id)) {
            return NextResponse.json({ error: "Not authorized to move this card" }, { status: 404})
        }

        const targetColumn = await prisma.column.findFirst({
            where: {id: columnId}
        })

        if (!targetColumn || targetColumn.boardId !== card.column?.boardId) {
            return NextResponse.json({ error: "Invalid target column" }, { status: 400 })
        }

        const updated = await prisma.card.update({
            where: {id},
            data: {columnId, order},
            include: {
                assignees: {
                    include: {
                        participant:{
                            select: {
                                id: true,
                                claimedBy: true,
                                name: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        await pusherServer.trigger(`private-board-${card.column.boardId}`,"card-updated", {card: updated})

        return NextResponse.json({ card: updated }, { status: 200 })

    } catch (error: any) {
        console.error("Error moving card:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}