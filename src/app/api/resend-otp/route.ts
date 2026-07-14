import { sendOtpEmail } from "@/lib/mailer"
import { prisma } from "@/lib/prisma"
import { generateOtp } from "@/lib/validation"
import { NextResponse } from "next/server"

export async function POST(req:Request){
    try {
        const {email} = await req.json()

        if(!email){
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const normalizedEmail = email.trim().toLowerCase()
        const user = await prisma.user.findUnique({
            where: {email: normalizedEmail}
        })

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
        if(user.emailVerified) return NextResponse.json({ error: "Email already verified" }, { status: 400 })

        const otp = generateOtp()

        await prisma.user.update({
            where: {email: normalizedEmail},
            data: {
                otpCode: otp,
                otpExpiry: new Date(Date.now() +  10 * 60 * 1000)
            }
        })

        await sendOtpEmail(email, otp)
        return NextResponse.json({ message: "Code resent" }, { status: 200 })

    } catch (error:any) {
        console.error("Resend OTP error:", error)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }
}