import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { notFound, redirect } from "next/navigation";
import ResultClient from "./ResultClient";

export default async function SummaryPage({params}: {params : Promise<{ id: string }>}) {

    const {id} = await params;
    const session = await getServerSession(authOptions);

    if(!session) redirect("/login");

    const summary = await prisma.summary.findUnique({
        where: {
            id,
        }
    })

    if(!summary || summary.userId !== session.user.id) notFound();

    return (
        <ResultClient
            summary={summary} 
            plan={session.user.plan as "free" | "pro" }
        />
    )
}