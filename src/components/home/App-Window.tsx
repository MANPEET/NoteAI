import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AppWindow({
  title,
  children,
  className,
  bodyClassName,
  toolbar,
}: {
  title?: string
  children: ReactNode
  className?: string
  bodyClassName?: string
  toolbar?: ReactNode
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-background/60 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-destructive/70" />
          <span className="size-3 rounded-full bg-chart-5/70" />
          <span className="size-3 rounded-full bg-primary/70" />
        </div>
        {title ? (
          <span className="ml-2 truncate text-xs font-medium text-muted-foreground">
            {title}
          </span>
        ) : null}
        {toolbar ? <div className="ml-auto">{toolbar}</div> : null}
      </div>
      <div className={cn('relative', bodyClassName)}>{children}</div>
    </div>
  )
}
