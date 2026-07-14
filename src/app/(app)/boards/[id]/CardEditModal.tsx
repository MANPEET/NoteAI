import { useRef, useState } from "react"

import {
  Calendar, Check, Plus, X,Trash2,
  Menu,
  CheckSquare2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner";


type Participant = { id: string; name: string; claimedBy: string | null }
type Assignee = { participant: Participant }
type CardType = {
  id: string; title: string; description: string | null
  dueDate: string | null; order: number; columnId: string
  assignees: Assignee[]; checklist?: Checklist[]
}
type ColumnType = { id: string; name: string; order: number; cards: CardType[] }
type BoardType = {
  id: string; title: string; inviteToken: string
  columns: ColumnType[]; members: any[]; participants: Participant[]
}

type Checklist = {
    id: string;
    title: string;
    items: SubTask[];
}

type SubTask = {
    id: string;
    text: string;
    completed: boolean;
}

export default function CardEditModal({ board, card, boardParticipants, onClose, onSaved }: {
  board: BoardType
  card: CardType
  boardParticipants: Participant[]
  onClose: () => void
  onSaved: (c: CardType) => void
}) {
  const [title, setTitle] = useState(card.title)
  const [checklistTitle, setChecklistTitle] = useState('Checklist')
  const [description, setDescription] = useState(card.description || "")
  const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 10) || "")

  const [newSubtask, setNewSubtask] = useState("")
  const [saving, setSaving] = useState(false)
  const [assignees, setAssignees] = useState(card.assignees)

  const [checklists, setChecklists] = useState<Checklist[]>(card.checklist ?? [])

  const [activePanel, setActivePanel] = useState<"dates" | "checklist" | "members" | null>(null)

  const subtaskInputRef = useRef<HTMLInputElement>(null);


  async function addChecklist() {
        const title = checklistTitle.trim()

        if(!title) return

        const tempId = crypto.randomUUID()
        setChecklists(prev => [...prev, { id: tempId, title, items: [] }])

        try {
            const res = await fetch(`/api/cards/${card.id}/checklists`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({title})
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)  

            setChecklists(prev => prev.map(c => c.id === tempId ? { id: data.checklist.id, title: data.checklist.title, items: [] } : c))
        } catch (error: any) {
            setChecklists(prev => prev.filter(c => c.id !== tempId))
            toast.error(error.message || "Failed to add checklist")
        }
  }


  async function deleteChecklist(checklistId: string) {

    const removed = checklists.find(c => c.id === checklistId)
    const removedIndex = checklists.findIndex(c => c.id === checklistId)
    setChecklists(prev => prev.filter(c => c.id !== checklistId))

    try {
      const res = await fetch(`/api/checklists/${checklistId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
    } catch(error: any) {
      if (removed) {
        setChecklists(prev => {
          const next = [...prev]
          next.splice(removedIndex, 0, removed)
          return next
        })
      }

      toast.error(error.message || "Failed to delete checklist")
    }
  }

  async function renameChecklist(checklistId: string, title: string) {
    const prevTitle = checklists.find(c => c.id === checklistId)?.title
    setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, title } : c))

    if (!title.trim()) return

    try {
      const res = await fetch(`/api/checklists/${checklistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
    } catch(error: any) {
      setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, title: prevTitle! } : c))
      toast.error(error.message || "Failed to rename checklist")
    }
  }

  // ---- Subtask-level actions ----

  async function addSubtask(checklistId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    const tempId = crypto.randomUUID()
    setChecklists(prev => prev.map(c =>
      c.id === checklistId ? { ...c, items: [...c.items, { id: tempId, text: trimmed, completed: false }] } : c
    ))

    try {
      const res = await fetch(`/api/checklists/${checklistId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.map(i => i.id === tempId ? { id: data.subtask.id, text: data.subtask.text, completed: data.subtask.completed } : i) }
          : c
      ))
    } catch (error: any) {
      setChecklists(prev => prev.map(c =>
        c.id === checklistId ? { ...c, items: c.items.filter(i => i.id !== tempId) } : c
      ))
      toast.error(error.message || "Failed to add subTask")
    }
  }

  async function toggleSubtask(checklistId: string, subtaskId: string) {
    const checklist = checklists.find(c => c.id === checklistId)
    const prevState = checklist?.items.find(i => i.id === subtaskId)?.completed

    setChecklists(prev => prev.map(c =>
      c.id === checklistId
        ? { ...c, items: c.items.map(i => i.id === subtaskId ? { ...i, completed: !i.completed } : i) }
        : c
    ))

    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !prevState }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
    } catch(error:any) {
      setChecklists(prev => prev.map(c =>
        c.id === checklistId
          ? { ...c, items: c.items.map(i => i.id === subtaskId ? { ...i, completed: prevState! } : i) }
          : c
      ))

      toast.error(error.message || "Failed to Update subTask")
    }
  }

  async function deleteSubtask(checklistId: string, subtaskId: string) {
    const checklist = checklists.find(c => c.id === checklistId)
    const removed = checklist?.items.find(i => i.id === subtaskId)
    const removedIndex = checklist?.items.findIndex(i => i.id === subtaskId) ?? -1

    setChecklists(prev => prev.map(c =>
      c.id === checklistId ? { ...c, items: c.items.filter(i => i.id !== subtaskId) } : c
    ))

    try {
      const res = await fetch(`/api/subtasks/${subtaskId}`, { method: "DELETE" })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
    } catch(error: any) {
      if (removed) {
        setChecklists(prev => prev.map(c => {
          if (c.id !== checklistId) return c
          const next = [...c.items]
          next.splice(removedIndex, 0, removed)
          return { ...c, items: next }
        }))
      }

      toast.error(error.message || "Failed to add subTask")
    }
  }



  async function save() {
    setSaving(true)
    const res = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, dueDate: dueDate || null })
    })
    const data = await res.json()
    setSaving(false)
    if (!data.error) onSaved({ ...data.card, assignees })
  }

  async function toggleAssignee(participantId: string, isAssigned: boolean) {
    const res = await fetch(`/api/cards/${card.id}/assignees`, {
      method: isAssigned ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    })
    const data = await res.json()
    if (!data.error) {
      setAssignees(data.card.assignees);
    }
  }

  const dueDateFormatted = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null

  const assignedParticipants = boardParticipants.filter(p => assignees.some(a => a.participant.id === p.id))

  const column = board.columns.find(col => col.id === card.columnId)!;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1D1F21] border border-white/[0.07] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-zinc-700" />
            <span className="text-md text-white/40 font-medium">{column.name}</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1 rounded hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto col-scroll px-6 py-5 min-w-0">

           
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={1.5}
              className="w-full text-[22px] font-bold bg-transparent text-white outline-none resize-none leading-snug mb-1 placeholder:text-white/20 focus:bg-white/2 rounded-lg px-2 py-2 -mx-2 transition-colors"
              placeholder="Card title"
            />

           
            <div className="flex flex-wrap gap-2 mb-5 mt-3">
              {[
                { key: "members" as const, icon: <Plus size={12} />, label: "Members" },
                { key: "dates" as const, icon: <Calendar size={12} />, label: dueDate ? dueDateFormatted! : "Dates" },
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={async() => {
                    setActivePanel(p => p === btn.key ? null : btn.key)
                    activePanel === 'checklist'  && await addChecklist()
                }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                    ${activePanel === btn.key 
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : btn.key === "dates" && dueDate
                        ? "bg-green-500/6 border-green-500/20 text-green-400"
                        : "bg-zinc-800 border-white/[0.07] text-white/60 hover:text-white hover:border-white/15"
                    }`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}

              <button
                  onClick={addChecklist}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                    bg-zinc-800 border-white/[0.07] text-white/60 hover:text-white hover:border-white/15"
                >
                  <Check size={12} />
                  <label>Checklist</label>
                </button>
            </div>

            
            {activePanel === "dates" && (
              <div className="mb-5">
                <MiniCalendar value={dueDate} onChange={v => { setDueDate(v); setActivePanel(null) }} />
              </div>
            )}

           
            {activePanel === "members" && (
              <div className="mb-5 border border-white/[0.07] rounded-xl overflow-hidden bg-zinc-950">
                {boardParticipants.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-4">No participants yet</p>
                )}
                {boardParticipants.map(p => {
                  const isAssigned = assignees.some(a => a.participant.id === p.id)
                  return (
                    <label key={p.id}
                      onClick={() => toggleAssignee(p.id, isAssigned)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-b border-white/5 last:border-0
                        ${isAssigned ? "bg-green-500/5" : "hover:bg-white/2"}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-linear-to-br from-green-700 to-green-500 flex items-center justify-center text-[9px] font-bold text-black shrink-0">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-zinc-300 flex-1">{p.name}</span>
                      {!p.claimedBy && <span className="text-xs text-zinc-600">pending</span>}
                    </label>
                  )
                })}
              </div>
            )}

            
            {assignedParticipants.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Members</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {assignedParticipants.map(p => (
                    <div key={p.id} title={p.name}
                      className="w-8 h-8 rounded-full bg-linear-to-br from-green-700 to-green-500 flex items-center justify-center text-[14px] font-bold text-black"
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                  ))}
                  <button
                    onClick={() => setActivePanel("members")}
                    className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-zinc-700 transition-all"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}

            
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 flex items-center justify-center opacity-40">
                  <Menu className="text-white" size={20}/>
                </div>
                <p className="text-md font-semibold text-white/70">Description</p>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                rows={3}
                className="w-full bg-zinc-900 border border-white/[0.07] rounded-lg p-3 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-green-500/30 transition-colors resize-none"
              />
            </div>

            
            <div className="mb-5 flex flex-col gap-6">
                {checklists.map(checklist => (
                  <ChecklistBlock
                    key={checklist.id}
                    checklist={checklist}
                    onRename={title => renameChecklist(checklist.id, title)}
                    onDeleteChecklist={() => deleteChecklist(checklist.id)}
                    onAddItem={text => addSubtask(checklist.id, text)}
                    onToggleItem={id => toggleSubtask(checklist.id, id)}
                    onDeleteItem={id => deleteSubtask(checklist.id, id)}
                  />
                ))}
            </div>

            <div className="px-4 py-3 border-t border-white/6 shrink-0 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-white/[0.07] text-white/50 hover:text-white hover:border-white/15 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-green-500 hover:bg-green-600 text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] disabled:opacity-60 disabled:translate-y-0"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>

          </div>

          
        </div>
      </div>
    </div>
  )
}

function MiniCalendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(value ? new Date(value).getFullYear() : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth() : today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"]
  const selectedDate = value ? new Date(value + "T00:00:00") : null

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function selectDay(day: number) {
    onChange(new Date(viewYear, viewMonth, day).toISOString().slice(0, 10))
  }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-zinc-900 border border-white/[0.07] rounded-xl p-3 w-56 shadow-xl select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-white/6 text-white/50 hover:text-white transition-colors">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-white">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-white/6 text-white/50 hover:text-white transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-white/25 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
          const isSel = selectedDate && day === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear()
          return (
            <button key={i} onClick={() => selectDay(day)}
              className={`text-center text-xs py-1.5 rounded transition-all font-medium
                ${isSel ? "bg-green-500 text-black font-bold"
                  : isToday ? "bg-white/8 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"}`}
            >{day}</button>
          )
        })}
      </div>
      {value && (
        <button onClick={() => onChange("")} className="mt-2 w-full text-[11px] text-white/30 hover:text-white/60 transition-colors text-center">
          Clear date
        </button>
      )}
    </div>
  )
}

function ChecklistBlock({ checklist, onRename, onDeleteChecklist, onAddItem, onToggleItem, onDeleteItem }: {
  checklist: Checklist
  onRename: (title: string) => void
  onDeleteChecklist: () => void
  onAddItem: (text: string) => void
  onToggleItem: (id: string) => void
  onDeleteItem: (id: string) => void
}) {
  const [titleDraft, setTitleDraft] = useState(checklist.title)
  const [newItem, setNewItem] = useState("")
  const itemInputRef = useRef<HTMLInputElement>(null)

  const completedCount = checklist.items.filter(i => i.completed).length
  const pct = checklist.items.length ? Math.round((completedCount / checklist.items.length) * 100) : 0

  function submitAdd() {
    if (!newItem.trim()) return
    onAddItem(newItem.trim())
    setNewItem("")
    itemInputRef.current?.focus()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2.5">
        <CheckSquare2 size={20} className="text-white/90 shrink-0" />
        <input
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={() => { if (titleDraft.trim() && titleDraft !== checklist.title) onRename(titleDraft) }}
          onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
          className="text-sm font-semibold text-white/90 bg-transparent outline-none flex-1 hover:bg-white/3 focus:bg-white/5 rounded-lg p-1.5 -mx-1.5 transition-colors "
        />
        
        <button
          onClick={onDeleteChecklist}
          className="text-white/50 border-white/20 border rounded-lg px-3 py-1.5 text-sm hover:bg-gray-500/10 cursor-pointer "
        >
          Delete
        </button>
      </div>

      <div className="flex items-center gap-0.5">
        <span className="text-xs text-white/90 w-8 ">{pct}%</span>
        <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-green-600 to-green-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 mb-3 mt-1.5">
        {checklist.items.map(s => (
          <div key={s.id}
            className="flex items-center gap-3 py-1.5 px-2 rounded-lg group hover:bg-white/3 transition-colors"
          >
            <button
              onClick={() => onToggleItem(s.id)}
              className={`w-4 h-4 rounded-[3px] shrink-0 flex items-center justify-center transition-all border
                ${s.completed ? "bg-green-500 border-green-500" : "bg-transparent border-white/25 hover:border-green-500/60"}`}
            >
              {s.completed && <Check size={10} className="text-black" strokeWidth={3} />}
            </button>
            <span className={`text-sm flex-1 transition-colors ${s.completed ? "line-through text-white/25" : "text-zinc-300"}`}>
              {s.text}
            </span>
            <button
              onClick={() => onDeleteItem(s.id)}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1 rounded hover:bg-red-500/10"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          ref={itemInputRef}
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); submitAdd() } }}
          placeholder="Add an item"
          className="flex-1 bg-zinc-900 border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-green-500/30 transition-colors"
        />
        <button
          onClick={submitAdd}
          disabled={!newItem.trim()}
          className="px-3 py-2 rounded-lg bg-zinc-800 border border-white/[0.07] text-white/50 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition-all text-xs font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}