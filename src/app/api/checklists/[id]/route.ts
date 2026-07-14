import { authOptions } from "@/lib/auth";
import { getChecklistWithPermission, broadcastCardUpdate } from "@/lib/boardAuth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: checklistId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 });
        }

        const { checklist, isOwner, isAssignee, isMember } = await getChecklistWithPermission(checklistId, session.user.id);

        if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
        if (!isMember) return NextResponse.json({ error: "Not a board member" }, { status: 403 });
        if (!isOwner && !isAssignee) return NextResponse.json({ error: "Only owner or assignee can manage checklists" }, { status: 403 });

        const { title } = await req.json();

        if (!title || typeof title !== "string" || !title.trim()) {
            return NextResponse.json({ error: "title is required" }, { status: 400 });
        }

        const updated = await prisma.checklist.update({
            where: { id: checklistId },
            data: { title: title.trim() },
        });

        await broadcastCardUpdate(checklist.cardId!);

        return NextResponse.json({ checklist: updated }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating checklist:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: checklistId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 });
        }

        const { checklist, isOwner, isAssignee, isMember } = await getChecklistWithPermission(checklistId, session.user.id);

        if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
        if (!isMember) return NextResponse.json({ error: "Not a board member" }, { status: 403 });
        if (!isOwner && !isAssignee) return NextResponse.json({ error: "Only owner or assignee can manage checklists" }, { status: 403 });

        const cardId = checklist.cardId!;
        await prisma.checklist.delete({ where: { id: checklistId } });

        await broadcastCardUpdate(cardId);

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Error deleting checklist:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}