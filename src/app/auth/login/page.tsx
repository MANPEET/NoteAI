"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.push("/dashboard")
  }, [session, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-white mb-2">NoteAI</h1>
        <p className="text-gray-400 mb-8">
          Turn your meeting transcripts into clear summaries
        </p>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-white text-gray-900 hover:bg-gray-100 font-medium"
        >
          Continue with Google
        </Button>
      </div>
    </div>
  )
}