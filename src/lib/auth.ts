import type {NextAuthOptions} from "next-auth"
import {PrismaAdapter} from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import GoogleProvider from "next-auth/providers/google"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        session({session, user}) {
            if(session.user) {
                session.user.id = user.id;
                session.user.plan = (user as any).plan || "free"
            }

            return session
        }
    },
    pages: {
        signIn: "/auth/login",
    }
}