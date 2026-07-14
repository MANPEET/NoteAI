import { authOptions } from "@/lib/auth";
import { getChecklistWithPermission, broadcastCardUpdate } from "@/lib/boardAuth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: checklistId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 });
        }

        const { checklist, isOwner, isAssignee, isMember } = await getChecklistWithPermission(checklistId, session.user.id);

        if (!checklist) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
        if (!isMember) return NextResponse.json({ error: "Not a board member" }, { status: 403 });
        if (!isOwner && !isAssignee) return NextResponse.json({ error: "Only owner or assignee can manage subtasks" }, { status: 403 });

        const { text } = await req.json();

        if (!text || typeof text !== "string" || !text.trim()) {
            return NextResponse.json({ error: "text is required" }, { status: 400 });
        }

        const lastItem = await prisma.subtask.findFirst({
            where: { checklistId },
            orderBy: { order: "desc" },
        });

        const subtask = await prisma.subtask.create({
            data: {
                text: text.trim(),
                order: (lastItem?.order ?? -1) + 1,
                checklistId,
            },
        });

        await broadcastCardUpdate(checklist.cardId!);

        return NextResponse.json({ subtask }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating subtask:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}