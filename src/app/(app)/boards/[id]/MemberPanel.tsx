import { useSession } from "next-auth/react";
import { BoardType } from "./page";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Shield, UserMinus, Users, X } from "lucide-react";

export function MemberPanel({board, onClose, onBoardUpdate} : {
    board: BoardType,
    onClose: () => void,
    onBoardUpdate: (updated: BoardType) => void
}){
    const {data: session} = useSession();
    const [loading, setLoading] = useState<string | null>(null)

    const member = board.members.find(m => m.user.id === session?.user.id)
    const isAdmin = member?.role === "ADMIN"

    async function updateRole(userId: string, role: "ADMIN" | "MEMBER"){
        try {
            setLoading(userId + role)
            const res = await fetch(`/api/boards/${board.id}/members/${userId}`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({role})
            })
            const data = await res.json()
            if(data.error) return toast.error(data.error)

            onBoardUpdate({...board, members: board.members.map(m => 
                m.user.id === userId ? {...m, role} : m
            )})

            toast.success(`${data.member.user.name} has been ${role === "ADMIN" ? "promoted" : "demoted"} to ${role}`)
        } catch (error: any) {
            toast.error(error)
        }
    }

    async function removeFromBoard(userId: string, role: "ADMIN" | "MEMBER") {
        try {
            const res = await fetch(`/api/boards/${board.id}/members/${userId}`, {method: "DELETE"})
            const data = await res.json()
            if(data.error) return toast.error(data.error)

            onBoardUpdate({...board, members: board.members.filter(m => m.user.id !== userId)})
            toast.success(`${data.member.user.name} has been removed from board`)
        } catch (error: any) {
            toast.error(error)
        }
    } 

    return(
        <>
            <div onClick={onClose} className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-40" />

            <div className="fixed top-0 right-0 bottom-0 w-90 bg-[#0c0c0e] border-l-[rgba(255,255,255,0.07)] z-50 flex flex-col" style={{animation: "slideIn 0.25s ease"}}>

                {/* Header */}
                <div className="p-5 border-b border-b-[rgba(255,255,255,0.07)] flex items-center justify-between">
                    <span className="text-sm text-white/70">{board.members.length} members on this board</span>

                    <button className="text-[#52525b] border-none outline-none" onClick={onClose}>
                        <X className="size-4" />
                    </button>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto p-3">
                    {board.members.map(member => {
                        const isSelf = member.user.id === session?.user.id
                        const initials = member.user.name
                            ? member.user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)
                            : member.user.email?.[0].toUpperCase() ?? "?"

                        return(
                            <div key={member.id} className="flex items-center gap-3 p-3 rounded-md bg-transparent           transition-colors"
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs shrink-0 text-black font-bold">
                                    {initials}
                                </div>

                                {/*name and email */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-white/80 text-sm font-bold">{member.user.name}</p>
                                        {isSelf && <p className="text-[#52525b] text-xs">(you)</p>}
                                    </div>
                                    <p className="text-xs text-[#52525b] overflow-hidden text-ellipsis whitespace-nowrap">{member.user.email}</p>
                                </div>

                                <div className={`text-xs rounded-xl px-2 py-1 ${member.role === "ADMIN" ? "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[#22c55e]" : "bg-muted/60 border border-muted text-[#71717a]"} `}>
                                    {member.role}
                                </div>

                                {/* Action items (only admin)*/}
                                {isAdmin && (
                                    <div className="flex gap-1.5 shrink-0">
                                        {member.role === "MEMBER" ? (
                                            <button 
                                                title="Make Admin"
                                                disabled={!!loading}
                                                onClick={() => updateRole(member.user.id, "ADMIN")}
                                                className="bg-none border border-muted rounded-md w-7 h-7 cursor-pointer flex items-center justify-center text-[#52525b] transition-colors duration-150"
                                                onMouseEnter={e => { e.currentTarget.style.color = "#22c55e"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)" }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                                            >
                                                <Shield size={13} />
                                            </button>
                                        ) : (
                                            !isSelf && (
                                                <button 
                                                    title="Demote to member"
                                                    disabled={!!loading}
                                                    onClick={() => updateRole(member.user.id, "MEMBER")}
                                                    className="bg-none border border-muted rounded-md w-7 h-7 cursor-pointer flex items-center justify-center text-[#52525b] transition-colors duration-150"
                                                    onMouseEnter={e => { e.currentTarget.style.color = "#22c55e"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)" }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                                                >
                                                    <ChevronRight size={13} />
                                            </button>
                                            )
                                        )}

                                        <button 
                                                title={isSelf ? "Leave board" : "Remove from board"}
                                                disabled={!!loading}
                                                onClick={() => removeFromBoard(member.user.id, "ADMIN")}
                                                className="bg-none border border-muted rounded-md w-7 h-7 cursor-pointer flex items-center justify-center text-[#52525b] transition-colors duration-150"
                                                onMouseEnter={e => { e.currentTarget.style.color = "#22c55e"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)" }}
                                                onMouseLeave={e => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                                            >
                                                <UserMinus size={13} />
                                            </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Invite Footer */}
                <div className="px-4 py-5 border-t border-black/70">
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/invite/${board.inviteToken}`)
                            toast.success("Invite link Copied")
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)" }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                        className="w-full bg-black/40 border border-black/80 p-3 text-sm cursor-pointer rounded-md flex items-center justify-center gap-1.5"
                    >
                        <Users size={14} /> Copy invite link
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {from {transform : translateX(100%)} to {transform : translateX(0)}}
            `}</style>
        </>

        
    )

}