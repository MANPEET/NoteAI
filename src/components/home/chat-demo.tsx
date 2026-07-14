'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bot, SendHorizontal, Sparkles } from 'lucide-react'

type Msg = { role: 'user' | 'ai'; text: string }

const SCRIPT: Msg[] = [
  { role: 'user', text: 'Who owns the most action items?' },
  {
    role: 'ai',
    text: 'John has 2 of 5 action items — fixing the duplicate card issue and refactoring the subtask composer. Sarah and Emily each own one.',
  },
  { role: 'user', text: 'Any unresolved blockers?' },
  {
    role: 'ai',
    text: 'One: checklist persistence needs a retest after the deploy. Emily flagged it as the only open risk for the sprint.',
  },
]

const SUGGESTIONS = [
  'What was the main decision?',
  'Summarize this in one sentence',
  'List every deadline',
]

export function ChatDemo({ active = true }: { active?: boolean }) {
  const [visible, setVisible] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    setVisible([])
    setTyping(false)
    let i = 0
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const next = () => {
      if (cancelled || i >= SCRIPT.length) return
      const msg = SCRIPT[i]
      if (msg.role === 'ai') {
        setTyping(true)
        timers.push(
          setTimeout(() => {
            if (cancelled) return
            setTyping(false)
            setVisible((v) => [...v, msg])
            i += 1
            timers.push(setTimeout(next, 1600))
          }, 1100),
        )
      } else {
        setVisible((v) => [...v, msg])
        i += 1
        timers.push(setTimeout(next, 900))
      }
    }
    timers.push(setTimeout(next, 600))
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [active])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [visible, typing])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Bot className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-card-foreground">Chat with AI</p>
          <p className="text-xs text-muted-foreground">Ask about this meeting</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-hidden px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {visible.map((m, i) => (
            <motion.div
              key={`${m.role}-${i}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start gap-2'}
            >
              {m.role === 'ai' ? (
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
              ) : null}
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground'
                    : 'max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-background/70 px-3.5 py-2 text-sm text-card-foreground'
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing ? (
          <div className="flex items-center gap-2">
            <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="size-3.5" />
            </span>
            <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-border bg-background/70 px-4 py-3">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="size-1.5 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2.5">
          <span className="flex-1 text-sm text-muted-foreground">Ask anything about the meeting…</span>
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SendHorizontal className="size-4" />
          </span>
        </div>
      </div>
    </div>
  )
}
