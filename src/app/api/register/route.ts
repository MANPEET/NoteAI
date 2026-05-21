import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
    try {
        const {name,email, password} = await request.json()
    
        if(!name || !email || !password) {
            return NextResponse.json({error: "Name, email and password are required"}, {status: 400})
        }
    
        if(password.length < 6) {
            return NextResponse.json({error: "Password must be at least 6 characters"}, {status: 400})
        }
    
        const userAlreadyExists = await prisma.user.findUnique({
            where: {email}
        })
    
        if(userAlreadyExists){
            return NextResponse.json({error: "User Already Exists"}, {status: 400})
        }
    
        const hashedPassword = await bcrypt.hash(password, 10)
    
        const user = await prisma.user.create({
            data:{
                name,
                email,
                password : hashedPassword
            }
        })
    
        return NextResponse.json({ message: "Account created successfully", userId: user.id },{ status: 201 })
    } catch (error) {
        return NextResponse.json({ message: "Something went wrong", error },{ status: 500 })
    }
}