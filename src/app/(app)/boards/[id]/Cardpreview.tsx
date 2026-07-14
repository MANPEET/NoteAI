import { Calendar } from "lucide-react";

type Participant = { id: string; name: string; claimedBy: string | null }
type Assignee = { participant: Participant }
type SubTask = { id: string; text: string; completed: boolean }

type CardType = {
  id: string; title: string; description: string | null
  dueDate: string | null; order: number; columnId: string
  assignees: Assignee[]; checklist?: Checklist[]
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


export default function CardPreview({ card, dragging }: { card: CardType; dragging?: boolean }) {
    const dueDate = card.dueDate ? new Date(card.dueDate) : null
    const isOverdue = dueDate && dueDate < new Date()
    const totalChecklists = (card.checklist ?? []).length

    const completedChecklists =
    (card.checklist ?? []).filter(checklist => checklist.items.length > 0 && checklist.items.every(item => item.completed)).length


  return (
    <div className={`bg-zinc-900 border rounded-xl p-3.5 cursor-pointer transition-all
      ${dragging
        ? "border-green-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rotate-1 scale-[1.02]"
        : "border-white/[0.07] hover:border-white/12"
      }`}
    >
      <p className="text-sm font-medium text-white leading-snug">{card.title}</p>
      {card.description && (
        <p className="text-xs text-white/40 mt-1 line-clamp-2 leading-relaxed">{card.description}</p>
      )}

      {totalChecklists > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/30">{completedChecklists}/{totalChecklists} Checklists</span>
          </div>
          <div className="w-full h-1 rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-linear-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{ width: `${totalChecklists ? (completedChecklists / totalChecklists) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {(dueDate || card.assignees.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {dueDate && (
            <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium
              ${isOverdue ? "bg-red-500/8 text-red-400 border-red-500/15" : "bg-zinc-950 text-white/40 border-white/[0.07]"}`}
            >
              <Calendar size={10} />
              {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {card.assignees.map(a => (
            <span key={a.participant.id} className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-green-500/8 border border-green-500/15 text-green-400 font-medium">
              <span className="w-3.5 h-3.5 rounded-full bg-linear-to-br from-green-700 to-green-500 flex items-center justify-center text-[7px] font-bold text-black shrink-0">
                {a.participant.name[0].toUpperCase()}
              </span>
              {a.participant.name}
              {!a.participant.claimedBy && <span className="text-green-700/70">· pending</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}