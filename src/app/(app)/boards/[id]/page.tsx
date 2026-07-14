"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, useDroppable
} from "@dnd-kit/core"
import { getPusherClient } from "@/lib/pusherClient"
import {
  ArrowLeft, Check, Link2,
  Users} from "lucide-react"
import Column from "./Column"
import CardPreview from "./Cardpreview"
import CardEditModal from "./CardEditModal"
import { MemberPanel } from "./MemberPanel"

type Participant = { id: string; name: string; claimedBy: string | null }
type Assignee = { participant: Participant }
type CardType = {
  id: string; title: string; description: string | null
  dueDate: string | null; order: number; columnId: string
  assignees: Assignee[]; checklist?: Checklist[]
}
type ColumnType = { id: string; name: string; order: number; cards: CardType[] }
export type BoardType = {
  id: string; title: string; inviteToken: string
  columns: ColumnType[]; members: Member[]; participants: Participant[]
}

type Member = {
  id: string,
  role:"ADMIN" | "MEMBER",
  user: {id: string, name: string, email: string} 
}

type Checklist = {
    id: string;
    title: string;
    items: Subtask[]
}

type Subtask = {
    id: string;
    text: string;
    completed: boolean
}


const SCROLLBAR_CSS = `
  .board-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
  .board-scroll::-webkit-scrollbar-track { background: transparent; }
  .board-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
  .board-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
  .col-scroll::-webkit-scrollbar { width: 4px; }
  .col-scroll::-webkit-scrollbar-track { background: transparent; }
  .col-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 999px; }
  .col-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
`

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [board, setBoard] = useState<BoardType | null>(null)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [editingCard, setEditingCard] = useState<CardType | null>(null)
  const [copied, setCopied] = useState(false)

  const [membersOpen, setMembersOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    if (document.getElementById("board-scrollbar-css")) return
    const el = document.createElement("style")
    el.id = "board-scrollbar-css"
    el.textContent = SCROLLBAR_CSS
    document.head.appendChild(el)
  }, [])

  useEffect(() => {
    fetch(`/api/boards/${id}`).then(r => r.json()).then(d => setBoard(d.board))
  }, [id])

  useEffect(() => {
    if (!id) return
    const pusher = getPusherClient()
    if (!pusher) return

    const ch = pusher.subscribe(`private-board-${id}`)
    ch.bind("card-updated", ({ card: u }: { card: CardType }) => {
      setBoard(prev => {
          if (!prev) return prev
          const next = structuredClone(prev) as BoardType
          for (const col of next.columns) col.cards = col.cards.filter(c => c.id !== u.id)
          const col = next.columns.find(c => c.id === u.columnId)
          if (col) col.cards.splice(u.order, 0, u)
          return next
      })
    })


    ch.bind('card-created', ({card: newCard} : {card: CardType}) => {
      setBoard(prev => {
        if(!prev) return prev
        const next = structuredClone(prev) as BoardType
        const column = next.columns.find(col => col.id === newCard.columnId)

        if(column){
          const alreadyExists = column.cards.some(card => card.id === newCard.id)

          if(!alreadyExists){
            column.cards.push(newCard)
          }
        }

        return next
      })
    })


    return () => { pusher.unsubscribe(`private-board-${id}`) }
  }, [id])

  if (!board) return (
    <div className="m-5 rounded-2xl bg-[#09090B] flex items-center justify-center h-[calc(100vh-2.5rem)] w-full ">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
        <p className="text-xs text-white/40">Loading board...</p>
      </div>
    </div>
  )

  function findColumnOfCard(cardId: string) {
    return board!.columns.find(col => col.cards.some(c => c.id === cardId))
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveCard(board!.columns.flatMap(c => c.cards).find(c => c.id === e.active.id) || null)
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveCard(null)
    if (!over) return
    const sourceCol = findColumnOfCard(active.id as string)
    const targetCol = board!.columns.find(c => c.id === over.id) || findColumnOfCard(over.id as string)
    if (!sourceCol || !targetCol) return

    setBoard(prev => {
      if (!prev) return prev
      const next = structuredClone(prev) as BoardType
      const from = next.columns.find(c => c.id === sourceCol.id)!
      const to = next.columns.find(c => c.id === targetCol.id)!
      const idx = from.cards.findIndex(c => c.id === active.id)
      const [moved] = from.cards.splice(idx, 1)
      const overIdx = to.cards.findIndex(c => c.id === over.id)
      const insertAt = overIdx >= 0 ? overIdx : to.cards.length
      to.cards.splice(insertAt, 0, moved)
      fetch(`/api/cards/${moved.id}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: to.id, order: insertAt })
      })
      return next
    })
  }


  function copyInviteLink() {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${board!.inviteToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  

  return (
    <div className="m-5 rounded-2xl bg-[#09090B] overflow-hidden flex flex-col h-[calc(100vh-2.5rem)]">

      {/* Header */}
      <div className="px-4 my-4 h-14 flex items-center justify-between border-b border-white/[0.07] shrink-0">
        <div>
          <h2 className="text-base font-medium tracking-tight text-white">{board.title}</h2>
          <p className="text-[11px] text-white/60 mt-0.5">
            {board.columns.length} columns · {board.members.length} {board.members.length === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-white/[0.07] text-white/60 hover:text-white hover:border-white/13 transition-all"
          >
            <ArrowLeft size={12} /> Back
          </button>
          <button
            onClick={() => setMembersOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-white/[0.07] text-white/60 hover:text-white hover:border-white/13 transition-all"
          >
            <Users size={12} />
            Members ({board.members.length})
          </button>

          {membersOpen && (
            <MemberPanel
              board={board}
              onClose={() => setMembersOpen(false)}
              onBoardUpdate={setBoard}
            />
          )}
        </div>
      </div>

      
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 board-scroll">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 h-full items-start pt-1">
            {board.columns.sort((a, b) => a.order - b.order).map(col => (
              <Column 
                key={col.id} 
                column={col} 
                onCardClick={setEditingCard} 
                boardId= {board.id}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard && <CardPreview card={activeCard} dragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {editingCard && (
        <CardEditModal
          board={board}
          card={editingCard}
          boardParticipants={board.participants}
          onClose={() => setEditingCard(null)}
          onSaved={(updated) => {
            setBoard(prev => {
              if (!prev) return prev
              const next = structuredClone(prev) as BoardType
              for (const col of next.columns) {
                const idx = col.cards.findIndex(c => c.id === updated.id)
                if (idx >= 0) col.cards[idx] = updated
              }
              return next
            })
            setEditingCard(null)
          }}
        />
      )}
    </div>
  )
}





