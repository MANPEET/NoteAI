import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: {id: session.user.id},
            select: {
                stripeCustomerId: true,
                plan: true
            }
        })


        if(!user?.stripeCustomerId || user?.plan !== "pro"){
            return NextResponse.json({ status: "free" })
        }

        const subscription_list = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            limit: 1,
            status: "active"
        })

        if(subscription_list.data.length === 0){
            return NextResponse.json({ status: "free" })
        }

        const subscription = subscription_list.data[0]

        const periodEnd = subscription.items.data[0]?.current_period_end

        return NextResponse.json({ 
            status: "pro",
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd:  periodEnd ? new Date(periodEnd * 1000).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            })
            : null
        })
       
        
    } catch (error : any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}