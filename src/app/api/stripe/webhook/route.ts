import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const config = {
    api : {
        bodyParser: false,
    }
}

export async function POST(request: Request) {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    // Verify the event came from Stripe
    try{
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    }
    catch(err){
        console.error("Webhook signature failed:", err)

        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 400 }
        )
    }

    try{
        switch(event.type){

            case "checkout.session.completed":{
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId

                if(userId){
                    await prisma.user.update({
                        where: { id: userId },
                        data: { plan: "pro" },
                    })
                }
                break
            }

            case "invoice.paid":{
                const invoice = event.data.object as Stripe.Invoice
                const customerId = invoice.customer as string

                if(customerId){
                    const user = await prisma.user.findUnique({
                        where: { stripeCustomerId: customerId },
                    })

                    if(user){
                         await prisma.user.update({
                            where: { stripeCustomerId: customerId },
                            data: { plan: "pro" },
                        })
                    }

                }
                break 
            }
            
            case "invoice.payment_failed":{
                const invoice = event.data.object as Stripe.Invoice
                const customerId = invoice.customer as string

                const user = await prisma.user.findUnique({
                    where: { stripeCustomerId: customerId },
                })

                if(user){
                    await prisma.user.update({
                        where: {stripeCustomerId: customerId },
                        data: { plan: "free" },
                    })
                }
                break
            }

            case "customer.subscription.deleted":{
                const subscription = event.data.object as Stripe.Subscription
                const customerId = subscription.customer as string

                const user = await prisma.user.findUnique({
                    where: { stripeCustomerId: customerId },
                })

                if(user){
                    await prisma.user.update({
                        where: {stripeCustomerId: customerId },
                        data: { plan: "free" },
                    })
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    }
    catch(err){
        console.error("Error processing webhook:", err)
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        )
    }
}