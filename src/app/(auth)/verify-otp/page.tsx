
import { Suspense } from "react"
import VerifyOtpPage from "./VerifyOtpClient"

export default function Page() {
  return (
    <Suspense fallback={
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    }>
      <VerifyOtpPage />
    </Suspense>
  )
}