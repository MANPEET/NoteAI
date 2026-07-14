'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { Calendar, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Member = { initial: string; name: string; tone: string }

const MEMBERS: Record<string, Member> = {
  M: { initial: 'M', name: 'Michael', tone: 'bg-primary/15 text-primary' },
  J: { initial: 'J', name: 'Jessica', tone: 'bg-primary/15 text-primary' },
  D: { initial: 'D', name: 'David', tone: 'bg-primary/15 text-primary' },
  A: { initial: 'A', name: 'Alex', tone: 'bg-primary/15 text-primary' },
}

type Card = {
  id: string
  title: string
  due?: string
  members?: string[]
  checklist?: { done: number; total: number }
}

const CARDS: Record<string, Card> = {
  c1: { id: 'c1', title: 'Prepare release notes', members: ['D'] },
  c2: { id: 'c2', title: 'Review user documentation', members: ['J'] },
  c3: {
    id: 'c3',
    title: 'Create onboarding guide',
    members: ['J', 'A'],
    checklist: { done: 1, total: 2 },
  },
  c4: { id: 'c4', title: 'Prepare final build', due: 'Mar 13', members: ['M'] },
  c5: { id: 'c5', title: 'Coordinate regression testing', due: 'Mar 14', members: ['M', 'A'] },
  c6: { id: 'c6', title: 'Send testing report & screenshots', due: 'Mar 15', members: ['M'] },
}

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'progress', label: 'In Progress' },
  { id: 'testing', label: 'Testing' },
  { id: 'done', label: 'Done' },
] as const

type ColState = Record<string, string[]>

const INITIAL: ColState = {
  todo: ['c1', 'c2', 'c3'],
  progress: ['c4', 'c5'],
  testing: ['c6'],
  done: [],
}

const SCRIPT: [string, keyof ColState, keyof ColState][] = [
  ['c4', 'progress', 'testing'],
  ['c6', 'testing', 'done'],
  ['c1', 'todo', 'progress'],
  ['c5', 'progress', 'testing'],
  ['c2', 'todo', 'progress'],
  // reverse leg — brings the board back to INITIAL one card at a time
  ['c1', 'progress', 'todo'],
  ['c2', 'progress', 'todo'],
  ['c5', 'testing', 'progress'],
  ['c4', 'testing', 'progress'],
  ['c6', 'done', 'testing'],
]

function MemberPills({ ids }: { ids: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {ids.map((id) => {
        const m = MEMBERS[id]
        return (
          <span
            key={id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-[10px] font-medium',
              m.tone,
            )}
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
              {m.initial}
            </span>
            {m.name}
          </span>
        )
      })}
    </div>
  )
}

function BoardCard({ card, moved }: { card: Card; moved: boolean }) {
  return (
    <motion.div
      layout
      layoutId={card.id}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={cn(
        'rounded-lg border border-border bg-background/70 p-3 shadow-sm',
        moved && 'ring-1 ring-primary/40',
      )}
    >
      <p className="font-serif text-sm leading-snug text-card-foreground">{card.title}</p>
      {card.due ? (
        <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
          <Calendar className="size-3" />
          {card.due}
        </span>
      ) : null}
      {card.checklist ? (
        <div className="mt-2">
          <p className="mb-1 text-[10px] text-muted-foreground">
            {card.checklist.done}/{card.checklist.total} Checklists
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${(card.checklist.done / card.checklist.total) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      ) : null}
      {card.members ? <MemberPills ids={card.members} /> : null}
    </motion.div>
  )
}

export function BoardDemo() {
  const [state, setState] = useState<ColState>(INITIAL)
  const [step, setStep] = useState(0)
  const [lastMoved, setLastMoved] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        const idx = s % SCRIPT.length
        const [cardId, from, to] = SCRIPT[idx]
        setState((prev) => {
          if (idx === 0) {
            setLastMoved(cardId)
            const base = structuredClone(INITIAL) as ColState
            base[from] = base[from].filter((c) => c !== cardId)
            base[to] = [...base[to], cardId]
            return base
          }
          const next: ColState = { ...prev }
          if (!next[from]?.includes(cardId)) return prev
          next[from] = next[from].filter((c) => c !== cardId)
          next[to] = [...next[to], cardId]
          setLastMoved(cardId)
          return next
        })
        return s + 1
      })
    }, 2200)
    return () => clearInterval(timer)
  }, [])

  return (
    <LayoutGroup>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="rounded-xl border border-border bg-card/50 p-2.5">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {col.label}
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] text-muted-foreground">
                {state[col.id].length}
              </span>
            </div>
            <motion.div layout className="flex min-h-16 flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {state[col.id].map((cid) => (
                  <BoardCard key={cid} card={CARDS[cid]} moved={lastMoved === cid} />
                ))}
              </AnimatePresence>
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Plus className="size-3" /> Add a card
              </button>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <Check className="size-3 text-primary" />
        Live updates — changes sync across the team instantly
      </div>
    </LayoutGroup>
  )
}
