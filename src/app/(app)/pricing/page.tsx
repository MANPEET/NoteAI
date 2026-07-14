"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Check, FileWarning, MailWarning } from "lucide-react"
import { useUser } from "@/components/providers/user-provider"
import { useSearchParams,useRouter } from "next/navigation"
import { toast } from "sonner"

interface SubscriptionStatus{
    status: string,
    cancelAtPeriodEnd: boolean,
    currentPeriodEnd: string | null
}

export default function PricingPage() {

    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [cancelLoading, setCancelLoading] = useState(false)
    const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null)
    const [showCancel, setShowCancel] = useState<Boolean>(false)

    const {plan} = useUser()
    const isPro = plan === "pro"

    useEffect(() => {
        if(isPro){
            fetch("/api/stripe/status")
            .then(res => res.json())
            .then(setSubStatus)
        }
    }, [isPro])

    

    const plans = [
        {
        name: "Free",
        price: 0,
        description: "Basic usage for getting started",
        features: [
            "5 summaries per month",
            "2,000 character limit",
            "Last 3 summaries saved",
            "Google & email login",
        ],
        highlight: false,
        },
        {
        name: "Pro",
        price:  12,
        description: "For power users and creators",
        features: [
            "Unlimited summaries",
            "20,000 character limit",
            "Full history",
            "PDF export",
            "File uploads",
            "Shareable links",
        ],
        highlight: true,
        },
    ]

    const upgraded = searchParams.get("upgraded") === "true"
    const cancelled = searchParams.get("cancelled") === "true"

    async function handleUpgrade(){
        if(isPro || loading) return
        setLoading(true)

        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {"Content-type": "application/json"}
            })

            const data = await res.json()

            if(data.error){
                toast.error(data.error)
            }

            window.location.href = data.url


        } catch (error) {
            toast.error("Something went wrong")
        }
        finally{
            setLoading(false)
        }
    }

    async function handleCancel() {
        setCancelLoading(true)

        try {
            const res = await fetch("/api/stripe/cancel", {method: "POST"})
            const data = await res.json()

            if(data.error){
                toast.error(data.error)
                return
            }

            const statusRes = await fetch("/api/stripe/status")
            const status = await statusRes.json()
            setSubStatus(status)
            setCancelLoading(false)

        } catch (error) {
            toast.error("Something went wrong")
        }
        finally{
            setCancelLoading(false)
        }
    }

    async function handleReactivate(){
        setCancelLoading(true)

        try {
            const res = await fetch("/api/stripe/reactivate", {method: "POST"})
            const data = await res.json()


            const statusRes = await fetch("/api/stripe/status")
            const status = await statusRes.json()
            setSubStatus(status)
            setCancelLoading(false)

            return toast.success("You are a PRO Member now")

            router.refresh()
        } catch (error) {
            toast.error("Something went wrong")
        }
        finally{
            setCancelLoading(false)
        }
    }



  return (
    <div className="flex flex-col flex-1  m-5 text-white rounded-2xl bg-[#09090B]">

      <div className="py-10">
        <div className="absolute top-50 left-1/2 -translate-x-1/2 w-125 h-125 bg-green-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-50 right-0 w-100 h-100 bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Unlock NoteAI Pro
        </h1>

        <p className="text-green-400 mt-3 text-xl">
          Get unlimited meeting summaries, longer transcript support, and premium AI-powered insights for every conversation.
        </p>

      </div>

       {upgraded && (
            <div className="flex items-center gap-3 bg-green-500/6 border border-green-500/15 rounded-2xl p-4 mb-8">
              <span className="text-xl shrink-0">🎉</span>
              <div>
                <p className="text-sm font-semibold text-green-400">Welcome to Pro!</p>
                <p className="text-xs text-green-600 mt-0.5">
                  You now have unlimited summaries, PDF exports, and shareable links.
                </p>
              </div>
            </div>
          )}

          
        {cancelled && (
            <div className="flex items-center gap-3 bg-zinc-950 border border-white/[0.07] rounded-2xl p-4 mb-8">
              <span className="text-xl shrink-0"></span>
              <p className="text-sm text-zinc-500">
                No worries — you can upgrade anytime. You're still on the Free plan.
              </p>
            </div>
          )}
        
        {subStatus?.cancelAtPeriodEnd && (
            <div className="flex items-start justify-between gap-4 bg-gray-500/4 border border-gray-500/15 rounded-2xl m-8 p-5 mb-0">
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0 py-0.5"><MailWarning size={14} /></span>
                <div>
                  <p className="text-sm font-semibold text-white-400">
                    Subscription cancellation scheduled
                  </p>
                  <p className="text-sm text-gray-300/40  leading-relaxed">
                    Your Pro access will end on{" "}
                    <strong className="text-gray-500">{subStatus.currentPeriodEnd}</strong>.
                    You'll be moved to the Free plan after that date.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReactivate}
                disabled={cancelLoading}
                className="shrink-0 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {cancelLoading ? "..." : "Keep Pro"}
              </button>
            </div>
        )}

      
      <div className="mt-12 grid md:grid-cols-2 gap-12 max-w-5xl w-full mx-20">

        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-6 transition ${
              plan.highlight
                ? "border-green-500/30 bg-zinc-900 shadow-[0_0_40px_rgba(34,197,94,0.1)]"
                : "border-white/10 bg-zinc-900"
            }`}
          >

           
            {plan.highlight && (
              <div className="absolute -top-3 left-6 bg-green-500 text-black text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </div>
            )}

            
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {plan.description}
            </p>

            
            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-bold">
                ${plan.price}
              </span>
              <span className="text-zinc-400 mb-1">/mo</span>
            </div>

            
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check size={16} className="text-green-400" />
                  {feature}
                </li>
              ))}
            </ul>

            
                <div className="mt-6">
                    {plan.name === "Free" ? (
                        <button
                            disabled={!isPro || subStatus?.cancelAtPeriodEnd}
                            onClick={() => {
                                !subStatus?.cancelAtPeriodEnd && setShowCancel(true)
                            }}
                            className={`w-full py-3 rounded-xl  border border-white/10  text-sm font-medium ${isPro &&!subStatus?.cancelAtPeriodEnd ? "bg-green-500 text-black hover:bg-green-400 cursor-pointer" : "bg-zinc-900 text-zinc-500 cursor-not-allowed"}`}
                        >
                            {isPro ? "Downgrade" : "Current Plan"}
                        </button>
                    ) : (
                        <button
                            disabled={(isPro && !subStatus?.cancelAtPeriodEnd) || loading}
                            onClick={subStatus?.cancelAtPeriodEnd ? handleReactivate : handleUpgrade}
                            className={`w-full py-3 rounded-xl text-sm font-medium transition ${
                                isPro && !subStatus?.cancelAtPeriodEnd
                                ? "bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed"
                                : "bg-green-500 text-black hover:bg-green-400"
                            }`}
                        >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    />
                                    <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                    />
                                </svg>
                                Redirecting to Stripe...
                            </div>
                        ) : isPro && !subStatus?.cancelAtPeriodEnd ? (
                            <div className="flex items-center justify-center gap-2">
                            <Check size={16} />
                            Current Plan
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                {subStatus?.cancelAtPeriodEnd ? "Reactivate Pro" : "Upgrade to Pro"}
                                <ArrowRight size={16} />
                            </div>
                        )}
                        </button>
                    )}
                </div>
          </div>
        ))}
      </div>

      
      <p className="text-center text-xs text-zinc-500 mt-10">
        No hidden fees. No credit card required for Free plan.
      </p>

      {isPro && !subStatus?.cancelAtPeriodEnd && showCancel && (
        <div className="absolute inset-0 bg-black/90 h-screen flex items-center justify-center overflow-hidden">
            <div className="flex flex-col items-center justify-center gap-4 bg-zinc-950 border border-white/[0.07] rounded-2xl p-8 w-120 ">
                <div className="flex items-start justify-center gap-3">
                    <span className="text-xl shrink-0 pt-0.5"><FileWarning size={14}/></span>
                    <div>
                        <p className="text-md font-semibold text-white mb-2">
                            Are you sure you want to cancel?
                        </p>
                        <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                            You'll lose access to unlimited summaries, PDF exports, and shareable links
                            on <strong className="text-green-500 font-bold">{subStatus?.currentPeriodEnd}</strong>.
                            This action can be undone before that date.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => setShowCancel(false)}
                        className="px-4 py-2 rounded-lg border border-white/[0.07] text-zinc-400 text-xs font-semibold hover:text-white hover:border-white/13 transition-all cursor-pointer"
                    >
                        Keep my plan
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                        {cancelLoading ? (
                        <>
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Cancelling...
                        </>
                        ) : (
                        "Yes, cancel subscription"
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}