import { authOptions } from "@/lib/auth";
import { canEditBoard, getBoardAccess } from "@/lib/boardAuth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { error } from "console";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req:Request, {params} : {params : Promise<{id: string}>}) {
    try {

        const {id: boardId} = await params;
        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({error: "User not authenticated"}, {status: 401})
        }

        const body = await req.json();
        const {title, columnId} = body;

        if(!title.trim()){
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        if(!boardId || !columnId){
            return NextResponse.json({ error: "boardId and columnId are required" }, { status: 400 })
        }

        const access = await getBoardAccess(boardId, session?.user.id!)
        if(!canEditBoard(access)){
            return NextResponse.json({ error: "Not authorized to add a card" }, { status: 403 })
        }

        const board = await prisma.board.findFirst({
            where: {
                id: boardId,
                members: {some: {userId: session?.user.id}}
            },
            include: {
                members: true
            }
        })

        if(!board){
            return NextResponse.json({ error: "Board not found or you don't have access" },{ status: 404 })
        }

        const column = await prisma.column.findFirst({
            where: {
                id: columnId,
                boardId
            }
        })

        if (!column) {
            return NextResponse.json({ error: "Column not found" }, { status: 404 })
        }

        const lastCard = await prisma.card.findFirst({
            where: {columnId},
            orderBy: {order: "desc"},
            select: {order: true}
        })

        const orderCount = lastCard ? lastCard.order + 1 : 0

        const card = await prisma.card.create({
            data: {
                title,
                columnId,
                order: orderCount,  
                createdById: session?.user.id
            },
            include: {
                assignees: {select: {participant: true}},
                checklist: {select: {items: true}}
            }
        })

        await pusherServer.trigger(`private-board-${boardId}`, "card-created" , {card})

        return NextResponse.json({ card }, { status: 201 })

    } catch (error: any) {
        console.error("Create card error:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        )
    }
}