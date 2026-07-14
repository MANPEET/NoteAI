import { authOptions } from "@/lib/auth"
import { ensureParticipantForUser } from "@/lib/boardAuth"
import { groq } from "@/lib/groq"
import { prisma } from "@/lib/prisma"
import { create } from "domain"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Testing", "Done"]

async function generateBoardLayout(parsedResult:any) {
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system", 
                content: "You are a project planner. Convert meeting action items into a Kanban board. Return only valid JSON, no markdown."
            },
            {
                role: "user",
                content: `
                    Given these action items and decisions, assign each task to a column.
                    Use cues like "already started", "blocked on", "finished", "need to test"
                    to pick the right column. Default to "To Do" if no status cue exists.

                    Columns available: ${DEFAULT_COLUMNS.join(", ")}

                    Action items: ${JSON.stringify(parsedResult.actionItems || [])}
                    Decisions: ${JSON.stringify(parsedResult.keyDecisions || [])}

                    Return ONLY:
                    {
                        "cards": [
                            {
                                "title": "string",
                                "column": "one of the column names above, exact match",
                                "description": "string",
                                "owners": ["Full Name"],
                                "dueDate": "ISO date or null"
                            }
                        ]
                    }
                `
            }

        ],
        temperature: 0.1,
        max_completion_tokens: 3000,
        response_format: {type: "json_object"}
    })

    const raw =  completion.choices[0].message.content || "{}"
    try {
        return JSON.parse(raw)
    } catch {
        return { cards: [] }
    }
}

export async function POST(req: Request, {params}: {params: Promise<{id: string}>}) {
    try {
        const {id : summaryId} = await params
    
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
          return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }
    
        const summary = await prisma.summary.findFirst({
            where: {id : summaryId}
        })

        const user = await prisma.user.findUnique({ where: { id: session.user.id } })

        if (user?.plan !== "pro") {
            return NextResponse.json(
                { error: "Generating a Kanban board is a Pro feature. Upgrade to continue." },
                { status: 403 }
            )
        }
    
        if(!summary || summary.userId !== session.user.id){
            return NextResponse.json({ error: "Summary not found" }, { status: 404 })
        }
    
        const parsedResult = summary.result as any;
        const participantNames = (parsedResult.participants || []).map((p: any) => typeof p === "string" ? p : p.name)

        //Create a default board with signed in user as admin 

        const board = await prisma.board.create({
            data: {
                title: summary.title || "Untitled Meeting",
                ownerId: session.user.id,
                summaryId: summary.id,
                columns: {create: DEFAULT_COLUMNS.map((name,i) => ({name, order: i}))},
                members: {create : {userId: session.user.id, role: "ADMIN"}}
            },
            include: {columns: true}
        })


        const participants = await prisma.$transaction(
            participantNames.map((name : string) => 
                prisma.boardParticipant.upsert({
                    where: {boardId_name: {boardId: board.id, name}},
                    update: {},
                    create: {boardId: board.id, name}
                })
            )
        )

        await ensureParticipantForUser(board.id, session.user.id, session.user.name || "You")

        const layout = await generateBoardLayout(parsedResult)

        const findColumn = (column : string) => 
           board.columns.find(c => c.name.toLowerCase() === (column || "").toLowerCase()) 
            || board.columns.find(c => c.name === "To Do")!

        const resolveParticipants = async (owners: string[]): Promise<typeof participants> => {
            if (!owners || owners.length === 0) return []

            const resolved = []
            for (const ownerName of owners) {
                if (!ownerName?.trim()) continue

                const match = participants.find(p =>
                    p.name.toLowerCase().includes(ownerName.toLowerCase()) ||
                    ownerName.toLowerCase().includes(p.name.toLowerCase())
                )
                if (match) {
                    resolved.push(match)
                } else {
                
                const created = await prisma.boardParticipant.create({
                    data: { boardId: board.id, name: ownerName.trim() }
                })
                participants.push(created) 
                resolved.push(created)
                }
            }
            return resolved
        }
            
        
        const columnCardCounts: Record<string, number> = {}
        for (const aiCard of layout.cards || []) {
            const column = findColumn(aiCard.column)
            const order = columnCardCounts[column.id] ?? 0
            columnCardCounts[column.id] = order + 1

           
            const resolvedParticipants = await resolveParticipants(aiCard.owners || [])

            await prisma.card.create({
                data: {
                columnId: column.id,
                title: aiCard.title,
                description: aiCard.description || null,
                dueDate: aiCard.dueDate ? new Date(aiCard.dueDate) : null,
                order,
                assignees: resolvedParticipants.length > 0
                    ? { create: resolvedParticipants.map(p => ({ participantId: p.id })) }
                    : undefined
                }
            })
        }

        return NextResponse.json({ boardId: board.id }, { status: 201 })
    } catch (error: any) {
        console.error("Error generating board:", error)

        return NextResponse.json(
            { error: error.message || "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}