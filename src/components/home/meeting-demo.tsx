'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Check, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUMMARY =
  'The team reviewed progress on the board system, finalized the checklist and subtask flow, and assigned action items for the upcoming sprint.'

const TAGS = ['board system', 'checklist flow', 'sprint planning']

const PARTICIPANTS = [
  { initial: 'J', name: 'John (Development)' },
  { initial: 'S', name: 'Sarah (Design)' },
  { initial: 'E', name: 'Emily (QA)' },
]

const ACTIONS = [
  { text: 'Fix duplicate card issue for subtasks', owner: 'John' },
  { text: 'Finalize UI for the add-card input', owner: 'Sarah' },
  { text: 'Retest checklist persistence after deploy', owner: 'Emily' },
]

function useTypewriter(text: string, active: boolean, speed = 18) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!active) return
    setOut('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, active, speed])
  return out
}

export function MeetingDemo({ active = true }: { active?: boolean }) {
  const typed = useTypewriter(SUMMARY, active)
  const done = typed.length >= SUMMARY.length

  return (
    <div className="flex h-full flex-col gap-5 p-5 text-left sm:p-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            <Smile className="size-3.5" /> Positive
          </span>
          {TAGS.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <h4 className="font-serif text-lg text-card-foreground">
          Board System Progress & Checklist Implementation
        </h4>
        <p className="text-xs text-muted-foreground">Tue, Jun 30 · 5 action items · 3 participants</p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Summary
        </p>
        <p className="text-sm leading-relaxed text-card-foreground/90">
          {typed}
          {!done ? <span className="animate-caret text-primary">▋</span> : null}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Participants
        </p>
        <div className="flex flex-wrap gap-2">
          {PARTICIPANTS.map((p) => (
            <span
              key={p.initial}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pl-1 pr-3 text-xs text-card-foreground"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {p.initial}
              </span>
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Action items
        </p>
        <div className="flex flex-col gap-2">
          {ACTIONS.map((a, i) => (
            <motion.div
              key={a.text}
              initial={{ opacity: 0, y: 8 }}
              animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ delay: 0.15 + i * 0.25, type: 'spring', stiffness: 300, damping: 26 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5"
            >
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded border border-border',
                  'bg-primary/15 text-primary',
                )}
              >
                <Check className="size-3" />
              </span>
              <span className="flex-1 text-sm text-card-foreground">{a.text}</span>
              <span className="text-xs text-muted-foreground">{a.owner}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
