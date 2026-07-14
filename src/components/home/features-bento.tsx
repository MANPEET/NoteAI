'use client'

import { motion } from 'motion/react'
import {
  Bot,
  CheckSquare,
  Link2,
  ListChecks,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function Cell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 ',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
      {children}
    </span>
  )
}

export function FeaturesBento() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Everything in one place
        </span>
        <h2 className="mt-3 text-balance font-serif text-3xl text-foreground sm:text-4xl">
          One tool for notes, tasks, and everything after
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          Stop copy-pasting between a notes doc and a task tracker. NoteAI connects them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[0,0.5fr]">
        <Cell className="md:col-span-2 md:row-span-1 ">
          <Icon>
            <Sparkles className="size-5" />
          </Icon>
          <h3 className="font-serif text-xl text-card-foreground">AI meeting summaries</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Paste or upload a transcript and get a clean recap with sentiment, key topics, and the
            decisions that actually mattered — in seconds.
          </p>
          <div className="mt-5 rounded-xl border border-border bg-background/60 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                Positive
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                sprint planning
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                3 participants
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The team finalized the checklist and subtask flow, agreed to ship the mobile build
              Friday, and assigned QA to Emily before launch.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                { task: 'Fix duplicate card issue', who: 'John' },
                { task: 'Finalize add-card input UI', who: 'Sarah' },
                { task: 'Retest checklist persistence', who: 'Emily' },
              ].map((a) => (
                <div
                  key={a.task}
                  className="flex items-center gap-2 rounded-md border border-border/70 bg-card px-2.5 py-1.5"
                >
                  <CheckSquare className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate text-[11px] text-card-foreground">{a.task}</span>
                  <span className="ml-auto shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    {a.who}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Cell>

        
        <Cell>
          <Icon>
            <CheckSquare className="size-5" />
          </Icon>
          <h3 className="font-serif text-lg text-card-foreground">Auto action items</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every follow-up is extracted and assigned to the right person automatically.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['John', 'Sarah', 'Emily', 'David'].map((n) => (
              <span
                key={n}
                className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {n}
              </span>
            ))}
          </div>
        </Cell>

        <Cell>
          <Icon>
            <Bot className="size-5" />
          </Icon>
          <h3 className="font-serif text-lg text-card-foreground">Chat with any meeting</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ask questions about a meeting&apos;s content and get instant, grounded answers.
          </p>
          <div className="mt-4 space-y-1.5">
            <p className="ml-auto w-fit rounded-lg rounded-br-sm bg-primary/15 px-2.5 py-1 text-[11px] text-primary">
              Who owns the most action items?
            </p>
            <p className="w-fit rounded-lg rounded-bl-sm border border-border bg-background/60 px-2.5 py-1 text-[11px] text-card-foreground">
              John — with 2 follow-ups.
            </p>
          </div>
        </Cell>

        {/* Real-time board — wide */}
        <Cell className="md:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Icon>
                <RadioTower className="size-5" />
              </Icon>
              <h3 className="font-serif text-xl text-card-foreground">Real-time team board</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Trello-style columns and cards. When a teammate checks something off, everyone sees
                it instantly — no refresh required.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Live
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { col: 'To Do', count: 2, cards: ['Update FAQ section', 'Review docs'] },
              { col: 'In Progress', count: 2, cards: ['Prepare final build', 'Provide screenshots'] },
              { col: 'Done', count: 1, cards: ['Ship release notes'] },
            ].map((c) => (
              <div key={c.col} className="rounded-lg border border-border bg-background/60 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {c.col}
                  </p>
                  <span className="text-[9px] text-muted-foreground">{c.count}</span>
                </div>
                <div className="space-y-1.5">
                  {c.cards.map((card) => (
                    <div
                      key={card}
                      className="rounded border border-border/70 bg-card px-2 py-1.5 text-[10px] leading-tight text-card-foreground"
                    >
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Cell>

        {/* Checklists */}
        <Cell>
          <Icon>
            <ListChecks className="size-5" />
          </Icon>
          <h3 className="font-serif text-lg text-card-foreground">Checklists & subtasks</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Break any card into smaller steps and watch progress fill up.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/2 rounded-full bg-primary" />
          </div>
        </Cell>

        {/* Invite link */}
        <Cell>
          <Icon>
            <Link2 className="size-5" />
          </Icon>
          <h3 className="font-serif text-lg text-card-foreground">Invite with a link</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Share a board with one link. Invitees land right where they belong.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-2">
            <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-[11px] text-muted-foreground">
              note-ai.app/b/launch-plan
            </span>
            <span className="ml-auto shrink-0 rounded bg-primary px-1.5 py-0.5 text-[9px] font-medium text-primary-foreground">
              Copy
            </span>
          </div>
        </Cell>

        {/* Secure auth — wide */}
        <Cell className="md:col-span-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Icon>
                <ShieldCheck className="size-5" />
              </Icon>
              <h3 className="font-serif text-xl text-card-foreground">Secure by default</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Sign in with Google or email &amp; password — with email verification to keep every
                account safe.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <span className="rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-card-foreground">
                Google
              </span>
              <span className="rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-card-foreground">
                Email + verify
              </span>
            </div>
          </div>
        </Cell>
      </div>
    </section>
  )
}
