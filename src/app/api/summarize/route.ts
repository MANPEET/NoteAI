import { authOptions } from "@/lib/auth";
import { groq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { canCreateSummary } from "@/lib/usage";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

function chunkTranscript(transcript: string, chunkSize = 3500): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < transcript.length) {
    let end = Math.min(i + chunkSize, transcript.length)
    if (end < transcript.length) {
      const lastNewline = transcript.lastIndexOf("\n", end)
      if (lastNewline > i) end = lastNewline
    }
    chunks.push(transcript.slice(i, end))
    i = end
  }
  return chunks
}

async function extractFromChunk(chunk: string, chunkIndex: number, totalChunks: number) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are a meeting analyst. Extract meaningful action items, decisions, and questions from this transcript. Return only valid JSON, no markdown, no backticks."
      },
      {
        role: "user",
        content: `
          Extract from this meeting transcript (part ${chunkIndex + 1} of ${totalChunks}).

          Rules for action items:
          - Only extract tasks someone explicitly committed to ("I'll do X", "we need to get X done", "can you handle X")
          - Skip casual mentions, hypotheticals, or things already completed
          - If multiple people are working on the same task, list them all in owners — do not split into separate items
          - If two items are clearly the same work discussed differently, merge them into one
          - Omit deadline if none was mentioned — do not guess

          Rules for decisions and questions:
          - Only include decisions that were actually reached, not ones still being debated
          - Only include questions that were explicitly left unresolved

          Return ONLY this JSON:
          {
            "actionItems": [
              {
                "task": "clear, specific description of what needs to be done",
                "owners": ["Full Name"],
                "deadline": "date string or null"
              }
            ],
            "keyDecisions": ["decision that was reached"],
            "openQuestions": ["question left unresolved"]
          }

          Transcript chunk:
          ${chunk}
        `
      }
    ],
    temperature: 0.1,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  })

  const raw = completion.choices[0].message.content || "{}"
  try {
    return JSON.parse(raw)
  } catch {
    return { actionItems: [], keyDecisions: [], openQuestions: [] }
  }
}

async function extractMeta(chunk: string) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are a meeting analyst. Return only valid JSON, no markdown, no backticks."
      },
      {
        role: "user",
        content: `
          From this meeting transcript extract:
          {
            "title": "short descriptive title, max 8 words",
            "participants": ["Full Name (Role if mentioned)"],
            "summary": "3-4 sentence high level summary of the entire meeting",
            "sentiment": "positive or neutral or tense",
            "topics": ["topic1", "topic2"]
          }

          Transcript:
          ${chunk}
        `
      }
    ],
    temperature: 0.1,
    max_tokens: 800,
    response_format: { type: "json_object" }
  })

  const raw = completion.choices[0].message.content || "{}"
  try {
    return JSON.parse(raw)
  } catch {
    return { title: "Untitled Meeting", participants: [], summary: "", sentiment: "neutral", topics: [] }
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
    }

    const body = await req.json()
    const transcript = typeof body.transcript === "string"
      ? body.transcript.trim()
      : String(body.transcript)

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "Transcript cannot be empty" }, { status: 402 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 402 })
    }

    if (user.plan === "free" && transcript.length > 2000) {
      return NextResponse.json(
        { error: "Free plan is limited to 2,000 characters. Upgrade to Pro for up to 20,000 characters." },
        { status: 403 }
      )
    }

    const usage = await canCreateSummary(user.id, user.plan)
    if (!usage.allowed) {
      const resetMsg = usage.resetDate
        ? `Next slot opens on: ${usage.resetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : ""
      return NextResponse.json(
        { error: `You have used all ${usage.limit} free summaries in the last 30 days. ${resetMsg} Upgrade to Pro for unlimited.` },
        { status: 403 }
      )
    }

    const chunks = chunkTranscript(transcript)

    
    const chunkResults = []
    for (const [i, chunk] of chunks.entries()) {
      const result = await extractFromChunk(chunk, i, chunks.length)
      chunkResults.push(result)
    }

   
    const meta = await extractMeta(chunks[0])

   
    const parsedResult = {
      title: meta.title || "Untitled Meeting",
      participants: meta.participants || [],
      summary: meta.summary || "",
      sentiment: meta.sentiment || "neutral",
      topics: meta.topics || [],
      actionItems: chunkResults.flatMap(r => r.actionItems || []),  // owners: string[] now
      keyDecisions: chunkResults.flatMap(r => r.keyDecisions || []),
      openQuestions: chunkResults.flatMap(r => r.openQuestions || [])
    }

    const summary = await prisma.summary.create({
      data: {
        userId: user.id,
        title: parsedResult.title,
        result: parsedResult,
        transcript
      }
    })

    return NextResponse.json({ summary }, { status: 200 })

  } catch (error: any) {
    console.error("Error summarizing text:", error)
    return NextResponse.json(
      { error: error.message || "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}