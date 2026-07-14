//GET /api/board/[id]

import { authOptions } from "@/lib/auth"
import { canAccessBoard, canEditBoard, getBoardAccess } from "@/lib/boardAuth"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(req: Request, {params} : {params: Promise<{id : string}>}){
    try {
        const {id} = await params
    
        const session = await getServerSession(authOptions)
    
        if(!session?.user.id){
            return NextResponse.json({success:false, message: "User not authenticated"})
        }
    
        const access = await getBoardAccess(id, session.user.id)
        if(!canAccessBoard(access)){
            return NextResponse.json({ error: "Not authorized for this board" }, { status: 403 })
        }
    
        const board = await prisma.board.findUnique({
            where: {id},
            include: {
                columns: {
                    orderBy: {order: "asc"},
                    include: {
                        cards : {
                            orderBy: {order: "asc"},
                            include: {
                                assignees: {
                                    include : {
                                        participant: {
                                            select: {
                                                id: true,
                                                claimedBy: true,
                                                name: true,
                                                user : {
                                                    select: {id: true, name: true, email: true}
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
                        }
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                participants: true
            }
        })
    
        return NextResponse.json({board},{status:200})
    } catch (error:any) {
        console.error("Error fetching board:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}

