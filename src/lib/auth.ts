import type {NextAuthOptions} from "next-auth"
import {PrismaAdapter} from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"


const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: {label: "Email", type: "email"},
                password: {label: "Password", type: "password"}
            },

            async authorize(credentials) {
                if(!credentials?.email || !credentials.password) {
                    throw new Error("Email and password are required")
                }

                const user = await prisma.user.findUnique({
                    where: {email : credentials.email}
                })

                if(!user || !user.password){
                    throw new Error("No account found with this email")
                }

                const matchPassword = await bcrypt.compare(credentials.password, user.password)

                if(!matchPassword){
                    throw new Error("Password is incorrect")
                }

                return user
            }
        })
    ],
    callbacks: {
        async jwt({token, user}){

            if(user){
                token.id = user.id,
                token.plan = (user as any).plan || "free"
            }

            return token
        },

        async session({session, user}) {
            if(session.user) {
                session.user.id = user.id;
                session.user.plan = (user as any).plan || "free"
            }

            return session
        }
    },

    session: {
        strategy: "jwt"
    },

    pages: {
        signIn: "/auth/login",
    }
}