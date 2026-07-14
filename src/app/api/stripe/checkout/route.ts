import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server"

export async function POST(){
    try {
        const session = await getServerSession(authOptions)
    
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
          )
        }
    
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                stripeCustomerId: true,
                plan: true,
            }
        })
    
        if(!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    
        if(user.plan === "pro") {
            return NextResponse.json({ error: "Already a pro user" }, { status: 400 })
        }
    
        let customerId = user.stripeCustomerId;
    
        if(!customerId){
            // Create Stripe customer
    
            const customer = await stripe.customers.create({
                email: user.email!,
                name: user.name ?? undefined,
                metadata: {userId: user.id},
            })
    
            customerId = customer.id
    
            await prisma.user.update({
                where: { id: user.id },
                data: {stripeCustomerId: customerId},
            })
            
        }

        const baseUrl = process.env.NEXTAUTH_URL!.replace(/\/$/, "")
    
        // Create Stripe checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: process.env.STRIPE_PRO_PRICE_ID!,
                    quantity: 1,
                }
            ],
            success_url: `${baseUrl}/dashboard?upgraded=true`,
            cancel_url: `${baseUrl}/dashboard?cancelled=true`,
            metadata: {
                userId: user.id,
            },
            subscription_data: {
                metadata: {userId: user.id},
            }
        })
    
        return NextResponse.json({ url: checkoutSession.url })
    } catch (error: any) {
        console.error("Stripe checkout error:", {
            message: error?.message,
            type: error?.type,
            code: error?.code,
            statusCode: error?.statusCode,
            raw: error?.raw,
        })
        return NextResponse.json(
            { error: error?.message || "Something went wrong" },
            { status: 500 }
        )
    }
}