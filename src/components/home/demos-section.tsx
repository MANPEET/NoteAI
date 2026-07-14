'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { KanbanSquare, MessagesSquare, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppWindow } from './App-Window'
import { BoardDemo } from './board-demo'
import { MeetingDemo } from './meeting-demo'
import { ChatDemo } from './chat-demo'

const TABS = [
  {
    id: 'summary',
    label: 'Meeting Summary',
    icon: ScrollText,
    title: 'Paste a transcript. Get a summary and action items.',
    desc: 'NoteAI reads the whole meeting, writes a clean recap, extracts every follow-up task, and tags who owns what.',
    window: 'note-ai.app/summary',
    duration: 7000,
  },
  {
    id: 'chat',
    label: 'Ask the meeting',
    icon: MessagesSquare,
    title: 'Chat with any meeting like it is a teammate.',
    desc: 'Ask who owns what, what got decided, or what is still blocked — answers come straight from the transcript.',
    window: 'note-ai.app/chat',
    duration: 8000,
  },
  {
    id: 'board',
    label: 'Task Board',
    icon: KanbanSquare,
    title: 'Turn action items into a live team board.',
    desc: 'Every follow-up becomes a card with owners, due dates, and checklists. Updates sync across the team in real time.',
    window: 'note-ai.app/boards',
    duration: 6500,
  },
] as const

export function DemosSection() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('summary')
  const [paused, setPaused] = useState(false)
  const current = TABS.find((t) => t.id === tab)!

  // Auto-advance through the steps on a loop, pausing on hover.
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => {
      const index = TABS.findIndex((t) => t.id === tab)
      setTab(TABS[(index + 1) % TABS.length].id)
    }, current.duration)
    return () => clearTimeout(timer)
  }, [tab, paused, current.duration])

  const selectTab = (id: (typeof TABS)[number]['id']) => setTab(id)

  return (
    <section
      id="demos"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          See it in motion
        </span>
        <h2 className="mt-3 text-balance font-serif text-3xl text-foreground sm:text-4xl">
          From &ldquo;we talked about it&rdquo; to &ldquo;it&apos;s done&rdquo;
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          Three connected surfaces, one workflow. Explore each one below.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const activeTab = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                activeTab
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.35fr]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + '-copy'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="order-2 lg:order-1"
          >
            <h3 className="text-balance font-serif text-2xl text-foreground sm:text-3xl">
              {current.title}
            </h3>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{current.desc}</p>
            <div className="mt-6 flex flex-col gap-3">
              {TABS.map((t, i) => {
                const isActive = t.id === tab
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTab(t.id)}
                    className={cn(
                      'relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-colors',
                      isActive
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:bg-secondary/60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {t.label}
                    </span>
                    {isActive ? (
                      <span className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full bg-primary/15">
                        <motion.span
                          key={t.id + String(paused)}
                          className="block h-full bg-primary"
                          initial={{ width: paused ? '100%' : '0%' }}
                          animate={{ width: '100%' }}
                          transition={{
                            duration: paused ? 0 : t.duration / 1000,
                            ease: 'linear',
                          }}
                        />
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + '-window'}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, type: 'spring', stiffness: 220, damping: 26 }}
            >
              <AppWindow
                title={current.window}
                className="h-110"
                bodyClassName="h-[calc(440px-49px)] overflow-hidden"
              >
                {tab === 'summary' ? (
                  <div className="h-full overflow-y-auto">
                    <MeetingDemo active={tab === 'summary'} />
                  </div>
                ) : null}
                {tab === 'chat' ? <ChatDemo active={tab === 'chat'} /> : null}
                {tab === 'board' ? (
                  <div className="h-full  p-4">
                    <BoardDemo />
                  </div>
                ) : null}
              </AppWindow>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
