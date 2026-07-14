import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const session = await getServerSession(authOptions)
    
        if(!session?.user.id){
            return NextResponse.json({status: 400, error: "User not authenticated"})
        }
    
        const user = await prisma.user.findUnique({
            where: {id: session.user.id},
            select: {
                id: true,
                stripeCustomerId: true
            }
        })
    
        if(!user?.stripeCustomerId){
            return NextResponse.json({status: 400, error: "User not found"})
        }
    
        const subscription_list = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: "active",
            limit: 1
        })
    
    
        const subscription = subscription_list.data[0]
    
        if(!subscription || !subscription.cancel_at_period_end){
            return NextResponse.json({status: 400, error: "No cancelled subscriptions found"})
        }
    
        await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: false
        })

        return NextResponse.json({success: true})
        
    } catch (error: any) {
        console.error("Reactivate error:", error)
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        )
    }

}