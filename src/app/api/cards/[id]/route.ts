import { authOptions } from "@/lib/auth"
import { canEditCard, getBoardAccess } from "@/lib/boardAuth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, {params} : {params: Promise<{id: string}> }) {
    try {
        const {id } = await params

        const session = await getServerSession(authOptions)
        if(!session?.user.id){
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }

        const body = await req.json();
        

        const card = await prisma.card.findUnique({
            where: { id },
            include: {
                assignees: { include: { participant: { select: { claimedBy: true } } } },
                column: { select: { boardId: true } }
            }
        })

        if (!card) {
             return NextResponse.json({ error: "Card not found" }, { status: 404 })
        }

        const access = await getBoardAccess(card.column?.boardId!, session.user.id)

        if(!canEditCard(access, card, session.user.id)){
            return NextResponse.json({ error: "Not authorized to edit this card" }, { status: 403 })
        }

        const data : Record<string,any> = {}
        if(typeof body.title === "string") data.title = body.title.trim()
        if(typeof body.description === "string" || body.description === null) data.description = body.description.trim()
        if(typeof body.dueDate === "string" || body.dueDate === null) {
            data.dueDate = body.dueDate ? new Date(body.dueDate) : null
        }

        const updated = await prisma.card.update({
            where : {id},
            data,
            include: {
                assignees: {
                    include: {
                        participant: {
                            select: {
                                id:true,
                                name:true,
                                claimedBy: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                checklist: {
                    include: {
                        items: {
                            select: {
                                id: true,
                                text: true,
                                completed: true
                            }
                        }
                    }
                }
            }
        })

        await pusherServer.trigger(`private-board-${card.column?.boardId}`, "card-updated", {card: updated})

        return NextResponse.json({ card: updated }, { status: 200 })

    } catch (error: any) {
        console.error("Error updating card:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}

