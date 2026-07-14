import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request){
    try {
        const {otp, email} = await req.json()

        if(!otp || !email){
            return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
        }


        const normalizedEmail = email.trim().toLowerCase()
        const user = await prisma.user.findUnique({where: {email: normalizedEmail}})

        if(!user || !user.otpCode){
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        if(user.otpExpiry && user.otpExpiry < new Date()){
            return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 })
        }

        if(user.otpCode !== otp){
            return NextResponse.json({ error: "Incorrect code" }, { status: 400 })
        }

        await prisma.user.update({
            where: {email},
            data: {
                emailVerified: new Date(),
                otpCode: null,
                otpExpiry: null
            }
        })

        return NextResponse.json({ message: "Email verified" }, { status: 200 })

    } catch (error: any) {
        console.error("Verify OTP error:", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}