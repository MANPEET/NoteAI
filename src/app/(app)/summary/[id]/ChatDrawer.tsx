import { Bot, CornerDownLeft, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "Who is responsible for the most action items?",
  "What was the main decision made?",
  "Are there any unresolved blockers?",
  "Summarize this in one sentence.",
]

export default function ChatDrawer({
    open,
    onClose,
    summaryId,
    summaryTitle,
    messages,
    setMessages,
}: {
    open: boolean
    onClose: () => void
    summaryId: string
    summaryTitle: string
    messages: ChatMessage[]
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}) {
    const [input, setInput] = useState("")
    const [streaming, setStreaming] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    const [panelWidth, setPanelWidth] = useState(360)
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, width: 0 })

    const startDrag = (e: React.MouseEvent) => {
        dragStart.current = { x: e.clientX, width: panelWidth }
        setIsDragging(true)
    }

    useEffect(() => {
        if (!isDragging) return

        const onMove = (e: MouseEvent) => {
            const delta = dragStart.current.x - e.clientX
            const next = Math.min(560, Math.max(260, dragStart.current.width + delta))
            setPanelWidth(next)
        }

        const onUp = () => setIsDragging(false)
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)

        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onUp)
        }
    }, [isDragging])

    useEffect(() => {
        if (open && messages.length === 0) {
        setMessages([
            {
            role: "assistant",
            content: `Hi! I've read the meeting summary for **${summaryTitle}**. Ask me anything about it — action items, decisions, participants, or anything else.`,
            },
        ])
        }
    }, [open])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, streaming])

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 300)
    }, [open])

    async function sendMessage(message: string) {
        if (!message.trim() || streaming) return

        const userMsg: ChatMessage = { role: "user", content: message.trim() }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setStreaming(true)
        setInput("")

        setMessages(prev => [...prev, { role: "assistant", content: "" }])

        try {
            const res = await fetch(`/api/summary/${summaryId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            })

            if (!res.ok) throw new Error("Request failed")

            const reader = res.body!.getReader()
            const decoder = new TextDecoder()
            let assistantMsg = ""

            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                assistantMsg += decoder.decode(value, { stream: true })
                setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: "assistant", content: assistantMsg }
                    return updated
                })
            }
        } catch {
        setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
                role: "assistant",
                content: "Sorry, something went wrong. Please try again later.",
            }
            return updated
        })
        } finally {
            setStreaming(false)
        }
    }

    function renderContent(message: string) {
        const parts = message.split(/(\*\*[^*]+\*\*)/g)
        return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
            <strong key={i} className="font-semibold text-white">
                {part.slice(2, -2)}
            </strong>
            )
        }
        return <span key={i}>{part}</span>
        })
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage(input)
        }
    }

    return (
        <>
        
        {open && (
            <div
            onMouseDown={startDrag}
            className="w-1 shrink-0 cursor-col-resize group relative"
            style={{
                background: isDragging ? "rgba(34,197,94,0.4)" : "transparent",
                transition: isDragging ? "none" : "background 0.15s",
            }}
            >
            
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(34,197,94,0.6)" }}
            />
            </div>
        )}

        
        <div
            className="flex flex-col shrink-0 h-full"
            style={{
                width: open ? `${panelWidth}px` : 0,
                transition: isDragging ? "none" : "width 0.2s ease-out",
                background: "#09090b",
                borderLeft: open ? "1px solid rgba(255,255,255,0.07)" : "none",
                userSelect: isDragging ? "none" : "auto",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4 "
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                    >
                        <Bot size={15} className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Chat with AI</p>
                        <p className="text-[11px] text-zinc-600">Ask about this meeting</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-zinc-900 transition-all"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-scroll">
                {messages.length === 1 && (
                    <div className="space-y-2">
                        <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-semibold px-1">
                            Try asking
                        </p>
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(s)}
                                className="w-full text-left text-xs text-zinc-400 px-3 py-2.5 rounded-xl border border-white/6 hover:border-green-500/20 hover:text-white hover:bg-green-500/3 transition-all"
                                style={{ background: "#111" }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                        {msg.role === "assistant" && (
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
                            >
                                <Bot size={12} className="text-green-400" />
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user" ? "text-black font-medium rounded-br-sm" : "text-zinc-300 rounded-bl-sm"
                            }`}
                            style={
                            msg.role === "user"
                                ? { background: "#22c55e" }
                                : { background: "#141414", border: "1px solid rgba(255,255,255,0.06)" }
                            }
                        >
                            {msg.content === "" && streaming && i === messages.length - 1 ? (
                                <div className="flex gap-1 items-center py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" style={{ animation: "bounce 1.2s infinite 0s" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" style={{ animation: "bounce 1.2s infinite 0.2s" }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" style={{ animation: "bounce 1.2s infinite 0.4s" }} />
                                </div>
                            ) : (
                                renderContent(msg.content)
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
            className="px-4 py-4 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
            <div
                className="flex items-end gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "#111", border: "1px solid rgba(255,255,255,0.09)" }}
            >
                <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about the meeting..."
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent text-md text-white placeholder-zinc-700 resize-none outline-none disabled:opacity-50 h-12"
                style={{ maxHeight: "400px", lineHeight: "1.5" }}
                
                />
                <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || streaming}
                    className="w-7  p-1.5 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 shrink-0 mb-0.5"
                    style={{
                        background: input.trim() && !streaming ? "#22c55e" : "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    <Send size={15} className={input.trim() && !streaming ? "text-black" : "text-zinc-600"} />
                </button>
            </div>
            <p className="text-[10px] text-zinc-700 mt-2 text-center">
                <CornerDownLeft size={9} className="inline mr-1" />
                Enter to send · Shift+Enter for new line
            </p>
            </div>
        </div>

        <style>{`
            @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
            }
        `}</style>
        </>
    )
}