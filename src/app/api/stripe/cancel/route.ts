import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(){
    const session = await getServerSession(authOptions)

    if(!session?.user.id){
        return NextResponse.json({status: 400, message: "User not authenticated"})
    }

    try {
        const user = await prisma.user.findUnique({
            where: {id: session.user.id},
            select: {
                id: true,
                plan: true,
                stripeCustomerId: true
            }
        })
    
        if(!user || !user.id){
             return NextResponse.json({status: 400, error: "User not found"})
        }
    
        if(user.plan != "pro"){
            return NextResponse.json({status: 400, error: "User does not have a pro plan"})
        }
    
        if(!user.stripeCustomerId){
            return NextResponse.json({status: 400, error: "No stripe customer found"})
        }
    
        const subscription_list = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: "active",
            limit: 1
        })
        
        if(subscription_list.data.length === 0){
            return NextResponse.json({status: 400, error: "No Active subscriptions found"})
        }

        const subscription = subscription_list.data[0]
        
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true
        })

        const cancelDate = updatedSubscription.items.data[0]?.current_period_end
            ? new Date(updatedSubscription.items.data[0]?.current_period_end * 1000).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            })
            : null
    
        return NextResponse.json({
            success: true,
            cancelDate,
            message: `Your subscription will be cancelled on ${cancelDate}. You'll keep Pro access until then.`
        })
        
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

}