'use client'

import { motion } from 'motion/react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COLUMNS = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Task boards', 'AI summaries', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
]

export function Footer() {
  return (
    <footer className="px-4 pb-10">
      {/* CTA band */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        className="relative mx-auto mb-16 max-w-7xl overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 text-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-105 -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]"
        />
        <h2 className="relative mx-auto max-w-2xl text-balance font-serif text-3xl text-foreground sm:text-4xl">
          Stop losing follow-ups after the meeting ends
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
          Join thousands of teams turning conversations into completed work with NoteAI.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" className="group h-11 rounded-full px-6 text-[15px]">
            Start for free
            <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 rounded-full border-border bg-card/40 px-6 text-[15px]"
          >
            Talk to sales
          </Button>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl ">
        <div className="grid gap-10 border-t border-border pt-12 md:grid-cols-[1.5fr_repeat(2,1fr)] ">
          <div>
            <a href="#top" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Note<span className="text-primary">AI</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              From &ldquo;we talked about this&rdquo; to &ldquo;here&apos;s where we track it.&rdquo;
              Meeting notes and task boards, finally connected.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NoteAI. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
