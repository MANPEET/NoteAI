import { authOptions } from "@/lib/auth";
import { getCardWithPermission, broadcastCardUpdate } from "@/lib/boardAuth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: cardId } = await params;

        const session = await getServerSession(authOptions);
        if (!session?.user.id) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 });
        }

        const { card, isOwner, isAssignee, isMember } = await getCardWithPermission(cardId, session.user.id);

        if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });
        if (!isMember) return NextResponse.json({ error: "Not a board member" }, { status: 403 });
        if (!isOwner && !isAssignee) return NextResponse.json({ error: "Only owner or assignee can manage checklists" }, { status: 403 });

        const { title } = await req.json();

        const checklist = await prisma.checklist.create({
            data: {
                title: title?.trim() || "Checklist",
                cardId,
            },
            include: { items: true },
        });

        await broadcastCardUpdate(cardId);

        return NextResponse.json({ checklist }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating checklist:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}