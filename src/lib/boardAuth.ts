import {prisma} from "@/lib/prisma"
import { pusherServer } from "./pusher"

type BoardAccess = {
    member: {role : "MEMBER" | "ADMIN"} | null
    isOwner: boolean
}

export async function getBoardAccess(boardId: string, userId: string) : Promise<BoardAccess>{
    const board = await prisma.board.findUnique({
        where: {id: boardId},
        select: {ownerId : true}
    })

    if(!board) return {member: null, isOwner: false}

    const member = await prisma.boardMember.findUnique({
        where: {boardId_userId: {boardId, userId}},
        select: {role: true}
    })

    return {member, isOwner: board.ownerId === userId}
}

export function canEditCard(
    access: BoardAccess, 
    card: {assignees : {participant: {claimedBy : string | null}} []}, 
    userId: string
) : boolean{
    if(access.isOwner || access.member?.role === "ADMIN") return true
    if(card.assignees.length === 0) return access.member !== null

    return card.assignees.some(a => a.participant.claimedBy === userId)
}

export function canEditBoard(access: BoardAccess){
    return access.isOwner || access.member?.role === "ADMIN"
}

export function canAccessBoard(access: BoardAccess){
    return access.isOwner || access.member !== null
}

//Ensuring all the members of the boards are in participants list
export async function ensureParticipantForUser(boardId: string, userId: string, userName: string){
    const existing = await prisma.boardParticipant.findFirst({
        where: {boardId, claimedBy: userId}
    })
    
    if(existing) return existing

    const matched = await prisma.boardParticipant.findFirst({
        where: {
            boardId, 
            claimedBy: null, 
            name: {contains : userName, mode:"insensitive"}
        }
    })

    if(matched) return await prisma.boardParticipant.update({
        where: {id: matched.id},
        data: {
            claimedBy: userId
        }
    })

    return await prisma.boardParticipant.create({
        data: {
            boardId,
            claimedBy: userId,
            name: userName
        }
    })
}


export async function getCardWithPermission(cardId: string, userId: string){
    const card = await prisma.card.findUnique({
        where: {id: cardId},
        include: {
            assignees: {
                select: {participant: true}
            },
            column: {
                include: {
                    board: {
                        include: {members: true}
                    }
                }
            },
            checklist: {
                include: {
                    items: true,
                }
            }
        }
    })

    if(!card) return {card: null, isAssignee : false, isOwner: false, isMember: false}

    const isMember = card.column?.board.members.some(m => m.userId === userId)
    const isOwner = card.column?.board.members.some(m => m.userId === userId && m.role === "ADMIN")
    const isAssignee = card.assignees.some(a => a.participant.claimedBy === userId)

    return {card, isMember, isOwner, isAssignee}
}

export async function getChecklistWithPermission(checklistId: string, userId: string) {
    const checklist = await prisma.checklist.findUnique({
        where: { id: checklistId },
        include: { card: true },
    });

    if (!checklist || !checklist.cardId) {
        return { checklist: null, isOwner: false, isAssignee: false, isMember: false };
    }

    const { isOwner, isAssignee, isMember } = await getCardWithPermission(checklist.cardId, userId);
    return { checklist, isOwner, isAssignee, isMember };
}

export async function getSubtaskWithPermission(subtaskId: string, userId: string) {
    const subtask = await prisma.subtask.findUnique({
        where: { id: subtaskId },
        include: { checklist: { include: { card: true } } },
    });

    if (!subtask || !subtask.checklist?.cardId) {
        return { subtask: null, isOwner: false, isAssignee: false, isMember: false };
    }

    const { isOwner, isAssignee, isMember } = await getCardWithPermission(subtask.checklist.cardId, userId);
    return { subtask, isOwner, isAssignee, isMember };
}


export async function broadcastCardUpdate(cardId: string) {
    const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
            assignees: { include: { participant: true } },
            checklist: {
                orderBy: { createdAt: "asc" },
                include: { items: { orderBy: { order: "asc" } } },
            },
            column: { select: { boardId: true } },
        },
    });

    if (!card) return;

    const { checklist, column, ...rest } = card;
    const cardPayload = { ...rest,  checklist };

    await pusherServer.trigger(`private-board-${column?.boardId}`, "card-updated", { card: cardPayload });
}
