'use client'

import { motion } from 'motion/react'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    desc: 'For individuals and small teams getting started.',
    cta: 'Get started',
    highlight: false,
    features: [
      '5 meeting summaries per month',
      'Checklists & subtasks',
      'Shareable invite links',
      'PDF export & sharing',
    ],
  },
  {
    name: 'Pro',
    price: '$12',
    cadence: 'per user / month',
    desc: 'For teams that live in meetings and ship fast.',
    cta: 'Upgrade',
    highlight: true,
    features: [
      'Unlimited meeting summaries',
      'Unlimited boards & members',
      'Chat with AI on every meeting',
      'Real-time sync & presence',
      'PDF export & sharing',
      'Priority support',
    ],
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</span>
        <h2 className="mt-3 text-balance font-serif text-3xl text-foreground sm:text-4xl">
          Simple pricing that scales with your team
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          Start free. Upgrade when your team is ready. Cancel anytime.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 220, damping: 26 }}
            className={cn(
              'relative flex flex-col rounded-2xl border p-7',
              plan.highlight
                ? 'border-primary/50 bg-card shadow-2xl shadow-primary/10'
                : 'border-border bg-card/60',
            )}
          >
            {plan.highlight ? (
              <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                <Sparkles className="size-3.5" /> Most popular
              </span>
            ) : null}

            <h3 className="font-serif text-2xl text-card-foreground">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="font-serif text-4xl text-card-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.cadence}</span>
            </div>

            {plan.cta === "Upgrade" ? (
                <Link href="/pricing">
                    <Button
                        className={cn('mt-6 w-full rounded-full', !plan.highlight && 'bg-secondary text-foreground hover:bg-secondary/80')}
                        variant={plan.highlight ? 'default' : 'secondary'}
                    >
                        {plan.cta}
                    </Button>
                </Link>
                
            ) : (
                <Button
                    className={cn('mt-6 w-full rounded-full', !plan.highlight && 'bg-secondary text-foreground hover:bg-secondary/80')}
                    variant={plan.highlight ? 'default' : 'secondary'}
                >
                    {plan.cta}
                </Button>
            )}

            <ul className="mt-7 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-card-foreground/90">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="size-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
