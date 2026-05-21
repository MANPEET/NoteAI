"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) router.push("/dashboard")
  }, [session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,  
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">NoteAI</h1>
        <p className="text-gray-400 mb-8 text-center">
          Turn your meeting transcripts into clear summaries
        </p>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-gray-400 text-sm text-center mb-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Sign up
          </a>
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google */}
        <Button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-white text-gray-900 hover:bg-gray-100"
        >
          Continue with Google
        </Button>
      </div>
    </div>
  )
}