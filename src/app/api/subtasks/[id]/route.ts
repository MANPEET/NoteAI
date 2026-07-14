import { authOptions } from "@/lib/auth";
import { getSubtaskWithPermission, broadcastCardUpdate } from "@/lib/boardAuth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: subtaskId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 });
        }

        const { subtask, isOwner, isAssignee, isMember } = await getSubtaskWithPermission(subtaskId, session.user.id);

        if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        if (!isMember) return NextResponse.json({ error: "Not a board member" }, { status: 403 });
        if (!isOwner && !isAssignee) return NextResponse.json({ error: "Only owner or assignee can manage subtasks" }, { status: 403 });

        const body = await req.json();
        const data: { text?: string; completed?: boolean } = {};

        if (typeof body.text === "string") data.text = body.text.trim();
        if (typeof body.completed === "boolean") data.completed = body.completed;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const updated = await prisma.subtask.update({ where: { id: subtaskId }, data });

        await broadcastCardUpdate(subtask.checklist!.cardId!);

        return NextResponse.json({ subtask: updated }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating subtask:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: subtaskId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 });
        }

        const { subtask, isOwner, isAssignee, isMember } = await getSubtaskWithPermission(subtaskId, session.user.id);

        if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        if (!isMember) return NextResponse.json({ error: "Not a board member" }, { status: 403 });
        if (!isOwner && !isAssignee) return NextResponse.json({ error: "Only owner or assignee can manage subtasks" }, { status: 403 });

        const cardId = subtask.checklist!.cardId!;
        await prisma.subtask.delete({ where: { id: subtaskId } });

        await broadcastCardUpdate(cardId);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Error deleting subtask:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}