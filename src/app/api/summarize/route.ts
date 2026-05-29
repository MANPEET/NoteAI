import { authOptions } from "@/lib/auth";
import { groq } from "@/lib/groq";

import { prisma } from "@/lib/prisma";
import { canCreateSummary } from "@/lib/usage";

import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try{
        const session = await getServerSession(authOptions);

        if(!session?.user?.id) {
            return NextResponse.json({error: "User must be logged in"}, {status: 401})
        }


        const body = await req.json()
        const transcript = typeof body.transcript === "string" 
        ? body.transcript.trim()
        : String(body.transcript)

        if(!transcript || transcript.length === 0){
            return NextResponse.json({error: "Transcript cannot be empty"}, {status: 402})
        }

        const user = await prisma.user.findUnique({
            where: {id : session.user.id }
        })

        if(!user){
            return NextResponse.json({error: "No user found"}, {status: 402})
        }

        if(user.plan === "free" && transcript.length > 2000){
            return NextResponse.json(
                { error: "Free plan is limited to 2,000 characters. Upgrade to Pro for up to 20,000 characters." },
                { status: 403 }
            )     
        }

       const usage = await canCreateSummary(user.id, user.plan)

       if(!usage.allowed){
            const resetMsg = usage.resetDate 
            ? `Next slot opens on : ${usage.resetDate.toLocaleDateString("en-US", {month : "short", day: "numeric"})}`
            : ""

            return NextResponse.json(
                { error: `You have used all ${usage.limit} free summaries in the last 30 days.${resetMsg} Upgrade to Pro for unlimited.` },
                {status: 403 }
            )
       }

        const prompt = `
            Analyze this meeting transcript and return ONLY this exact JSON structure, nothing else:

            {
                "title": "short descriptive meeting title (max 8 words)",
                "participants": ["name1", "name2"],
                "summary": "2-3 sentence high level summary",
                "keyDecisions": ["decision 1", "decision 2"],
                "actionItems": [
                    {
                    "task": "specific task description",
                    "owner": "person responsible or null",
                    "deadline": "when or null"
                    }
                ],
                "openQuestions": ["unresolved question"],
                "sentiment": "positive or neutral or tense",
                "topics": ["topic1", "topic2"]
            }

            Rules:
            - Return empty arrays [] for fields with no data
            - sentiment must be exactly: positive, neutral, or tense
            - Extract real names from the transcript

            Transcript:
            ${transcript}
        `

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: "You are a meeting analyst. Return only valid JSON, no markdown, no backticks, no explanation."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature : 0.2,
            response_format : {type : "json_object"}
        })

        const raw = completion.choices[0].message.content || ""

        let parsedResult;
        try {
            parsedResult = JSON.parse(raw)
        } catch (error) {
            return NextResponse.json(
                { error: "AI returned an invalid response. Please try again." },
                { status: 500 }
            )
        }

        const summary = await prisma.summary.create({
            data : {
                userId : user.id,
                title: parsedResult.title || "Untitled Meeting",
                result: parsedResult,
                transcript
            }
        })

        

        return NextResponse.json({summary} , {status : 200})
    } 
    catch (error) {
        console.error("Error summarizing text:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}