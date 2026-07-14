"use client"

import { cn } from "@/lib/utils"
import { Menu, Sparkles, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import Link from "next/link"

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#demos' },
  { label: 'Pricing', href: '#pricing' },
]

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 16)
        onScroll()
        window.addEventListener('scroll', onScroll, {passive: true})

        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
            <nav className={cn(`pointer-events-auto w-full max-w-6xl rounded-full border border-border px-3 py-2 transition-all duration-300`, scrolled ? "bg-card/80 shadow-lg shadow-black/30 backdrop-blur-xl" : "bg-card/60 backdrop-blur-md")}>
                <div className="flex items-center justify-between  gap-4 px-5">
                    <a href="#" className="flex items-center justify-center gap-2">
                        <span className="flex  items-center rounded-md  text-primary justify-center">
                            <Sparkles className="size-4"/>
                        </span>

                        <span className="text-lg font-semibold tracking-tight">
                            Note<span className="text-primary">AI</span>
                        </span>
                    </a>

                    <div className="hidden items-center gap-1 md:flex">
                        {links.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                                {l.label}
                            </a>
                        ))}
                    </div>
                    
                    <div className="hidden items-center gap-2 md:flex">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-muted-foreground hover:text-foreground"
                            >
                            <Link href="/dashboard" prefetch={false}>Sign in</Link>

                        </Button>
                        <Button size="sm" className="rounded-full">
                            <Link href="/register" prefetch={false}>Get started</Link>
                        </Button>
                    </div>

                    <button
                        type="button"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        onClick={() => setOpen((o) => !o)}
                        className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
                        >
                        {open ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>

                </div>

                {open ? (
                    <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 md:hidden">
                        {links.map(l => (
                            <a
                                key={l.href}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                                {l.label}
                            </a>
                        ))}

                        <div className="mt-1 flex gap-2 px-1">
                            <button  className="flex-1 rounded-lg">
                                <Link href="/dashboard">Sign in</Link>
                            </button>

                            <button className="flex-1 rounded-lg">
                                <Link href="/register">Get started</Link>
                            </button>
                        </div>
                    </div>
                ) : null}
                
            </nav>
        </div>
    )
}