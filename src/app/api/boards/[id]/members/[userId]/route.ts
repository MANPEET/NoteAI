import { authOptions } from "@/lib/auth";
import { canEditBoard, getBoardAccess } from "@/lib/boardAuth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: boardId, userId: targetUserId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
    }

    const body = await req.json()
    const role = body.role === "ADMIN" || body.role === "MEMBER" ? body.role : null
    if (!role) {
      return NextResponse.json({ error: "role must be ADMIN or MEMBER" }, { status: 400 })
    }

    const access = await getBoardAccess(boardId, session.user.id)
    if (!canEditBoard(access)) {
      return NextResponse.json({ error: "Only admins can change member roles" }, { status: 403 })
    }

    const targetMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } }
    })
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found on this board" }, { status: 404 })
    }

    const board = await prisma.board.findUnique({ where: { id: boardId }, select: { ownerId: true } })
    if (board?.ownerId === targetUserId) {
      return NextResponse.json({ error: "The board owner's role cannot be changed" }, { status: 400 })
    }

    if (targetMember.role === role) {
      return NextResponse.json({ error: `User is already a ${role}` }, { status: 400 })
    }

    const updated = await prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId: targetUserId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    return NextResponse.json({ member: updated }, { status: 200 })
  } catch (error: any) {
    console.error("Error updating member role:", error)
    return NextResponse.json(
      { error: error.message || "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }){
    try {
        const { id: boardId, userId: targetUserId } = await params
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }
        const isSelf = targetUserId === session.user.id

        const access = await getBoardAccess(boardId, session.user.id)
        if (!canEditBoard(access) && isSelf) {
            return NextResponse.json({ error: "Not authorized to remove this member" }, { status: 403 })
        }


        const targetMember = await prisma.boardMember.findUnique({
            where: { boardId_userId: { boardId, userId: targetUserId } }
        })
        if (!targetMember) {
            return NextResponse.json({ error: "Member not found on this board" }, { status: 404 })
        }

        await prisma.$transaction(async tx => {
            await tx.boardMember.delete({
                where: {id: targetUserId}
            })

            await tx.boardParticipant.updateMany({
                where: {boardId, claimedBy: targetUserId},
                data: {claimedBy: null}
            })
        })

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error: any) {
        console.error("Error removing board member:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}