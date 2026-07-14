"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const length = 6;

  const [otp, setOtp] = useState(new Array(length).fill(""))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState("")

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if(inputRefs.current[0]){
        inputRefs.current[0].focus()
    }
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: otp.join("") }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error)
      setLoading(false)
    } else {
      router.push("/login?verified=true")
      toast.success("Account Created Successfully")
    }
  }

  async function handleResend() {
    setResending(true)
    setResendMsg("")
    const res = await fetch("/api/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setResending(false)
    if (res.ok) {
        toast.success("New Code Sent");
    } else {
        toast.error(data.error);
    }
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target?.value;
    if(!value) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    if(value && index < length - 1 && inputRefs.current[index + 1]){
        inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key != "Backspace") return

    if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        return;
    }

    if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);

        inputRefs.current[index - 1]?.focus();
    }
  }

  const handleClick = (index: number) => {
    inputRefs.current[index]?.setSelectionRange(1,1)
  }

  return (
    <div className="bg-black bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-bold text-green-400 mb-1 text-center">Verify your email</h1>
        <p className="text-gray-400 mb-8 text-center">We sent a 6-digit code to {email}</p>

        <form onSubmit={handleVerify} className="space-y-2.5 w-full ">

          <div className="flex items-center justify-center">
            {otp.map((value,index) => {
                    return <input
                        key={index}
                        type="text"
                        ref={(input) => {(inputRefs.current[index] = input)}}
                        value={value}
                        onChange={e => handleChange(index, e)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        onClick={() => handleClick(index)}
                        className="w-10 h-10  mr-5  bg-zinc-900 text-white text-center text-md border border-zinc-500 focus:outline-none focus:border-green-500 "
                    />
            })}
          </div>


          <Button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-green-600 hover:bg-[#16a34a] text-black h-10 text-md font-bold cursor-pointer my-4"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-green-400 hover:underline text-sm disabled:opacity-50"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
          {resendMsg && <p className="text-zinc-400 text-xs mt-1">{resendMsg}</p>}
        </div>
      </div>
    </div>
  )
}