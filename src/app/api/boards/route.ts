import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { error, time } from "console"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { title } from "process"

const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Testing", "Done"]

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({success:false, message: "User not authenticated"})
        }

        const body = await req.json()
        const title = typeof body.title === "string" ? body.title.trim() : ""
        const summaryId = typeof body.summaryId === "string" ? body.summaryId : null

        if(!title){
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }

        //if linked to a summary, confirm the summary belong to the user
        if(summaryId){
            const summary = await prisma.summary.findUnique({
                where: {id: summaryId}
            })

            if(!summary || summary.userId !== session.user.id){
                return NextResponse.json({ error: "Invalid summary" }, { status: 403 })
            }
        }

        const board = await prisma.board.create({
            data: {
                title,
                summaryId,
                ownerId : session.user.id,
                members: {
                    create : {userId: session.user.id, role: "ADMIN"}
                },
                columns: {
                    create: DEFAULT_COLUMNS.map((name, i) => ({name, order: i}))
                }
            },
            include: {columns: true}
        })

        return NextResponse.json({ board }, { status: 201 })

    } catch (error: any) {
        console.error("Error creating board:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}

export async function GET(req:Request) {
    try {
        const session = await getServerSession(authOptions)

        if(!session?.user.id){
            return NextResponse.json({error:"User needs to be signed in."}, {status: 401})
        }

        //Fetch all the boards where user is a member or owner of
        const boards = await prisma.board.findMany({
            where: {
                OR: [
                    {ownerId: session.user.id },
                    {members: {
                        some: {
                            userId: session.user.id
                        }
                    }}
                ]   
            },
            include: {
                members: {select: {id: true}},
                columns: {select: {cards: {select: {id: true}}}},
                owner: {select: {id: true, name: true}}
            }
        })

        const result = boards.map(board => ({
            id: board.id,
            title: board.title,
            ownerId: board.ownerId,
            isOwner: board.ownerId === session.user.id,
            cardCount : board.columns.reduce((sum, c) => sum + c.cards.length, 0),
            updatedAt: board.updatedAt
        }))

        return NextResponse.json({ boards: result }, { status: 200 })

    } catch (error: any) {
        console.error("Error listing boards:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}