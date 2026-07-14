import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await fetch("/api/summarize/status").then(res => res.json()) 
  return NextResponse.json({ data })
}

