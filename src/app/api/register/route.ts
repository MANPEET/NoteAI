import { sendOtpEmail } from "@/lib/mailer"
import { prisma } from "@/lib/prisma"
import { generateOtp, validateRegisterInput } from "@/lib/validation"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const {name,email, password} = await request.json()
    
        const validationError = validateRegisterInput({name,email,password})
        if(validationError){
            return NextResponse.json({ error: validationError }, { status: 400 })
        }

        const normalizedEmail = email.trim().toLowerCase()

    
        const userAlreadyExists = await prisma.user.findUnique({
            where: {email : normalizedEmail}
        })
    
        if(userAlreadyExists?.emailVerified){
            return NextResponse.json({error: "User Already Exists"}, {status: 400})
        }
    
        const hashedPassword = await bcrypt.hash(password, 10)
        const otp = generateOtp()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    
        const user = await prisma.user.upsert({
            where: {email: normalizedEmail},
            update: {name: name.trim(), password: hashedPassword, otpCode: otp, otpExpiry},
            create: {name: name.trim(), password: hashedPassword, otpCode: otp, otpExpiry, email: normalizedEmail}
        })

        await sendOtpEmail(normalizedEmail, otp)
    
       return NextResponse.json({ message: "Verification code sent", email: normalizedEmail }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ message: "Something went wrong", error },{ status: 500 })
    }
}