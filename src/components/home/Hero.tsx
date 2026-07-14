'use client'

import { motion } from 'motion/react'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { BoardDemo } from './board-demo'
import { AppWindow } from './App-Window'
import Link from 'next/link'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.28 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
} as const

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-4 pb-16 pt-32 sm:pt-40">

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div variants={item} className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />  
            AI meeting notes, meet your team board
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-6 text-balance font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl"
        >
          Close the loop from <span className="text-primary">meeting</span> to{' '}
          <span className="italic">done</span>.
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
        >
          NoteAI turns your meeting transcripts into clean summaries and action items — then tracks
          them on a real-time board your whole team actually uses.
        </motion.p>

        <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/dashboard">
            <Button size="lg" className="group h-11 rounded-full px-6 text-[15px]">
                Start for free
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </a>
          <Button
            size="lg"
            variant="outline"
            className="h-11 rounded-full border-border bg-card/40 px-6 text-[15px]"
          >
            Watch demo
          </Button>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <span className="flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="size-4 fill-primary text-primary" />
            ))}
          </span>
          Loved by 4,000+ teams — no credit card required
        </motion.div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.35, duration: 0.7, type: 'spring', stiffness: 120, damping: 22 }}
        className="mx-auto mt-16 max-w-6xl "
      >
        <AppWindow
          title="note-ai.app/boards — Mobile App Launch"
          toolbar={
            <span className="hidden rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground sm:inline-block">
              5 columns · 2 members
            </span>
          }
          className="bg-card/80 backdrop-blur"
          bodyClassName="p-4 sm:p-6"
        >
          <BoardDemo />
        </AppWindow>
      </motion.div>
    </section>
  )
}
