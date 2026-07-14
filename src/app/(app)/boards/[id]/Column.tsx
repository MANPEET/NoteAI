import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { CSS } from "@dnd-kit/utilities"
import CardPreview from "./Cardpreview";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { error } from "console";

type Participant = { id: string; name: string; claimedBy: string | null }
type Assignee = { participant: Participant }
type SubTask = { id: string; text: string; completed: boolean }

type CardType = {
  id: string; title: string; description: string | null
  dueDate: string | null; order: number; columnId: string
  assignees: Assignee[]; subtasks?: SubTask[]
}
type ColumnType = { id: string; name: string; order: number; cards: CardType[] }


export default function Column({ column, onCardClick, boardId }: { column: ColumnType; onCardClick: (c: CardType) => void, boardId: string}) {
    const { setNodeRef } = useDroppable({ id: column.id })
    const [addingCard, setAddingCard] = useState<boolean>(false)
    const [newTitle, setNewTitle] = useState("")
    const [saving, setSaving] = useState<boolean>(false)
    const inputRef = useRef<HTMLTextAreaElement | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!addingCard) return

        inputRef.current?.focus()

        scrollRef.current?.scrollIntoView({
            behavior: "smooth"
        })
      
    }, [addingCard])

    const createCard = async() => {
        if(!newTitle.trim()) {
            setAddingCard(false)
            return null
        }
        
        setSaving(true)
        try {
            const res = await fetch(`/api/boards/${boardId}/cards`, {
                method: "POST",
                headers: {"content-type": "application-json"},
                body: JSON.stringify({
                    title: newTitle.trim(),
                    columnId: column.id
                })
            })

            const data = await res.json()

            if(data.error){
                toast.error(data.error)
            }


            setNewTitle("")
            setAddingCard(false)

        } catch (error) {
            toast.error("Something went wrong.")
        }finally{
            setSaving(false)
        }
    }

  return (
    <div ref={setNodeRef} className="flex flex-col w-72 shrink-0 rounded-xl bg-zinc-950 border border-white/[0.07] max-h-full">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex-1">{column.name}</h3>
        <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 border border-white/[0.07] px-2 py-0.5 rounded-full">
          {column.cards.length}
        </span>
      </div>
      <div className="mx-3 h-px bg-white/5 mb-2 shrink-0" />

      <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={scrollRef} className="flex flex-col gap-2 px-3 pb-2 overflow-y-auto flex-1 min-h-10 col-scroll">
            {column.cards.map(card => (
                <SortableCard key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))}

            {addingCard && (
                <>
                    <div  className="bg-zinc-900 border rounded-xl p-3.5 transition-all border-white/[0.07] hover:border-white/12"
                    >
                        <textarea  
                            placeholder="Enter a title" 
                            className="w-full  text-sm font-bold bg-transparent text-white outline-none resize-none  placeholder:text-white/20  overflow-y-hidden transition-colors"
                            ref={inputRef}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onInput={(e) => {
                                const textarea = e.currentTarget
                                textarea.style.height = "auto"
                                textarea.style.height = `${textarea.scrollHeight}px`
                            }}

                        />
                    </div>

                    <div className="flex items-center justify-between w-full my-1">
                        <button 
                            className="bg-green-600/40 p-2 text-white text-[12px] rounded-md w-20 transition-all disabled:opacity-40" 
                            onClick={() => createCard()}
                            disabled={!newTitle.trim() || saving}
                        >
                            {saving ? "Adding..." : "Add card"}
                        </button>

                        <button
                            onClick={() => { setAddingCard(false); setNewTitle("") }}
                            className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-white transition-colors"
                        >
                        Cancel
                        </button>
                    </div>
                </>
            )}

        </div>
      </SortableContext>

            {!addingCard && (
                <div className="px-3 pb-3 shrink-0">
                    <button className="w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/4 transition-all" onClick={() => setAddingCard(!addingCard)}>
                        <Plus size={12} /> Add a card
                    </button>
                </div>
            )}
    </div>
  )
}

function SortableCard({ card, onClick }: { card: CardType; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  return (
    <div
      ref={setNodeRef} //Connects this DOM element to the drag system
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes} {...listeners}
      onClick={onClick}
    >
      <CardPreview card={card}/>
    </div>
  )
}