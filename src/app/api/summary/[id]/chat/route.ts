import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { messages } = await req.json();

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Cap history to last 20 messages to avoid token bloat
    const trimmedMessages = messages.slice(-20);

    const summary = await prisma.summary.findUnique({ where: { id } });

    if (!summary || summary.userId !== session.user.id) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }

    if (!summary.transcript) {
      return NextResponse.json({ error: "No transcript available" }, { status: 400 });
    }

    const result = summary.result as any;

    const summaryContext = `
      You are an AI assistant helping a user understand a meeting.
      Your job is to answer questions about the meeting accurately and concisely.

      Instructions:
      - Use the FULL TRANSCRIPT as the primary source of truth.
      - Use the SUMMARY as a high-level reference.
      - When answering questions about people, decisions, concerns, or action items, prefer information directly stated in the transcript.
      - If information exists in the transcript but not the summary, use the transcript.
      - If the answer cannot be found in either source, clearly say it was not discussed.
      - Do not make up facts, decisions, action items, dates, or participants.
      - When relevant, quote or reference specific parts of the discussion.
      - Keep answers conversational and helpful.

      MEETING SUMMARY

      Title: ${result.title}
      Date: ${new Date(summary.createdAt).toLocaleDateString()}

      High-Level Summary:
      ${result.summary}

      Participants:
      ${result.participants?.join(", ") || "Not specified"}

      Action Items:
      ${
        result.actionItems?.length
          ? result.actionItems
              .map((a: any, i: number) =>
                `${i + 1}. ${a.task}${a.owner ? ` (Owner: ${a.owner})` : ""}${a.deadline ? ` - Due: ${a.deadline}` : ""}`
              )
              .join("\n")
          : "None"
      }

      Key Decisions:
      ${result.keyDecisions?.length ? result.keyDecisions.map((d: string, i: number) => `${i + 1}. ${d}`).join("\n") : "None"}

      Open Questions:
      ${result.openQuestions?.length ? result.openQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n") : "None"}

      Sentiment: ${result.sentiment}
      Topics: ${result.topics?.join(", ") || "None"}

      FULL TRANSCRIPT
      ${summary.transcript}
    `;

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: summaryContext },
        ...trimmedMessages,
      ],
      temperature: 0.2,
      max_completion_tokens: 2000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",  // fixed
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}