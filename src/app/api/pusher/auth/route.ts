import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get("socket_id")
    const channelName = params.get("channel_name")

    if (!socketId || !channelName) {
        return NextResponse.json({ error: "Missing socket_id or channel_name" }, { status: 400 })
    }

    const boardId = channelName.replace("private-board-", "")
    const member = await prisma.boardMember.findUnique({
        where: {boardId_userId: {boardId, userId: session.user.id}}
    })

    if (!member) {
        return NextResponse.json({ error: "Not a member of this board" }, { status: 403 })
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName)

    return NextResponse.json(authResponse)
}