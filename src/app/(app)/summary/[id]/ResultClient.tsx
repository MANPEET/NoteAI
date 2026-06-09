"use client"

import { AlertTriangle, ArrowDown, ArrowLeft, Calendar, Check, ChevronRight, Download, FileText, HelpCircle, Link2, Loader2, Minus, Smile, User, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { jsPDF } from "jspdf";


interface ActionItem {
    task: string;
    owner: string | null;
    deadline: string | null;
}

interface SummaryResult {
  title: string
  summary: string
  participants: string[]
  keyDecisions: string[]
  actionItems: ActionItem[]
  openQuestions: string[]
  sentiment: "positive" | "neutral" | "tense"
  topics: string[]
}

interface Summary {
  id: string
  title: string
  createdAt: Date
  result: SummaryResult | any
}

interface Props {
  summary: Summary
  plan: "free" | "pro"
}

export default function ResultClient({summary,plan} : Props){
    const result = summary.result as SummaryResult;
    const router = useRouter();
    const [copied, setCopied] = useState<Boolean>(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())

    const isPro = plan === "pro";
    const [downloading, setDownloading] = useState(false);

    const sentimentConfig = {
        positive: { label: "Positive", Icon: Smile,    class: "bg-green-500/[0.08] text-green-400 border-green-500/15" },
        neutral:  { label: "Neutral",  Icon: Minus,    class: "bg-zinc-900 text-zinc-400 border-white/[0.07]" },
        tense:    { label: "Tense",    Icon: AlertTriangle, class: "bg-red-500/[0.08] text-red-400 border-red-500/15" },
    }

    const sentiment = sentimentConfig[result.sentiment] || sentimentConfig.neutral;
    const SentimentIcon = sentiment.Icon

    async function handleCopyLink() {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleDownloadPDF() {
        if(!isPro) return;

        setDownloading(true);

        try {
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            const pageWidth = 210;
            const margin = 20;
            const contentWidth = pageWidth - margin * 2;
            let y = 0;

            function setStyle(
                size: number,
                color: [number, number, number],
                style: "normal" | "bold" = "normal"
            ) {
                doc.setFontSize(size);
                doc.setTextColor(...color);
                doc.setFont("helvetica", style);
            }

            function addWrappedText(
                text: string,
                x: number,
                yPos: number,
                options: {
                    fontSize?: number;
                    color?: [number, number, number];
                    fontStyle?: "normal" | "bold";
                    maxWidth?: number;
                    lineHeightFactor?: number;
                } = {}
            ): number {
                const fs = options.fontSize ?? 10;
                const lh = options.lineHeightFactor ?? 1.5;
                setStyle(fs, options.color ?? [60, 60, 60], options.fontStyle ?? "normal");
                const lines = doc.splitTextToSize(text, options.maxWidth ?? contentWidth) as string[];
                doc.text(lines, x, yPos);
                return yPos + lines.length * fs * 0.3528 * lh;
            }

            function checkPageBreak(neededHeight = 20) {
                if (y + neededHeight > 272) {
                    doc.addPage();
                    y = margin;
                }
            }

            function addSectionHeader(title: string) {
                checkPageBreak(14);
                y += 6;
                setStyle(7.5, [160, 160, 160], "bold");
                doc.text(title.toUpperCase(), margin, y);
                y += 2.5;
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(margin, y, pageWidth - margin, y);
                y += 5;
            }

            y = margin + 4;

            setStyle(8, [160, 160, 160], "normal");
            doc.text("NoteAI", margin, y);

            const dateStr = new Date(summary.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });

            doc.text(dateStr, pageWidth - margin, y, { align: "right" });
            y += 5;

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 8;

            setStyle(18, [15, 15, 15], "bold");
            const titleLines = doc.splitTextToSize(result.title, contentWidth) as string[];
            doc.text(titleLines, margin, y);
            y += titleLines.length * 18 * 0.3528 * 1.2 + 3;

            const sentimentLabel: Record<string, string> = {
                positive: "Positive",
                neutral: "Neutral",
                tense: "Tense",
            };

            const metaParts: string[] = [];

            if (result.participants?.length > 0) {
                metaParts.push(
                    `${result.participants.length} participant${result.participants.length !== 1 ? "s" : ""}`
                );
            }

            if (result.actionItems?.length > 0) {
                metaParts.push(
                    `${result.actionItems.length} action item${result.actionItems.length !== 1 ? "s" : ""}`
                );
            }

            if (result.sentiment) {
                metaParts.push(`Sentiment: ${sentimentLabel[result.sentiment] ?? result.sentiment}`);
            }

            setStyle(9, [140, 140, 140], "normal");
            doc.text(metaParts.join("   ·   "), margin, y);
            y += 10;

            doc.setDrawColor(30, 30, 30);
            doc.setLineWidth(0.6);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;

            addSectionHeader("Summary");

            y = addWrappedText(result.summary, margin, y, {
                fontSize: 10,
                color: [50, 50, 50],
                lineHeightFactor: 1.6,
            });

            y += 4;

            if (result.participants?.length > 0) {
                addSectionHeader("Participants");

                result.participants.forEach((name: string, i: number) => {
                    checkPageBreak(8);
                    setStyle(10, [50, 50, 50], "normal");
                    doc.text(`${i + 1}.  ${name}`, margin + 2, y);
                    y += 5.5;
                });

                y += 2;
            }

            if (result.actionItems?.length > 0) {
                addSectionHeader("Action Items");

                result.actionItems.forEach((item, i) => {
                    checkPageBreak(14);

                    setStyle(8, [180, 180, 180], "bold");
                    doc.text(String(i + 1).padStart(2, "0"), margin, y);

                    const taskLines = doc.splitTextToSize(item.task, contentWidth - 14) as string[];

                    setStyle(10, [20, 20, 20], "bold");
                    doc.text(taskLines, margin + 9, y);

                    y += taskLines.length * 10 * 0.3528 * 1.4;

                    const meta: string[] = [];

                    if (item.owner) meta.push(`Owner: ${item.owner}`);
                    if (item.deadline) meta.push(`Due: ${item.deadline}`);

                    if (meta.length) {
                        setStyle(8.5, [140, 140, 140], "normal");
                        doc.text(meta.join("     "), margin + 9, y);
                        y += 4.5;
                    }

                    y += 3;
                });
            }

            if (result.keyDecisions?.length > 0) {
                addSectionHeader("Key Decisions");

                result.keyDecisions.forEach((d: string) => {
                    checkPageBreak(12);

                    doc.setFillColor(30, 30, 30);
                    doc.rect(margin, y - 2.2, 2, 2, "F");

                    y = addWrappedText(d, margin + 5, y, {
                        fontSize: 10,
                        color: [50, 50, 50],
                        maxWidth: contentWidth - 5,
                        lineHeightFactor: 1.5,
                    });

                    y += 3;
                });
            }

            if (result.openQuestions?.length > 0) {
                addSectionHeader("Open Questions");

                result.openQuestions.forEach((q: string) => {
                    checkPageBreak(12);

                    doc.setDrawColor(180, 180, 180);
                    doc.setLineWidth(0.4);
                    doc.rect(margin, y - 2.2, 2, 2, "S");

                    y = addWrappedText(q, margin + 5, y, {
                        fontSize: 10,
                        color: [80, 80, 80],
                        maxWidth: contentWidth - 5,
                        lineHeightFactor: 1.5,
                    });

                    y += 3;
                });
            }

            if (result.topics?.length > 0) {
                addSectionHeader("Topics");

                y = addWrappedText(result.topics.join("   /   "), margin, y, {
                    fontSize: 9.5,
                    color: [100, 100, 100],
                });
            }

            const pageCount = doc.getNumberOfPages();

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.3);
                doc.line(margin, 284, pageWidth - margin, 284);

                setStyle(7.5, [180, 180, 180], "normal");
                doc.text("NoteAI — Meeting Summary", margin, 289);
                doc.text(`${i} / ${pageCount}`, pageWidth - margin, 289, {
                    align: "right",
                });
            }

            doc.save(`${result.title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            setDownloading(false);
        }
    }

    function toggleChecked(index: number) {
        setCheckedItems(prev => {
            const next = new Set(prev);
            next.has(index) ? next.delete(index) : next.add(index);
            return next;
        })
    }

    return (
        <div className="flex flex-col flex-1 overflow-y-auto m-5 rounded-2xl bg-[#09090B]">

            <div className="flex flex-col flex-1 overflow-hidden">
                
                {/* Header */}
                <div className="px-4 my-4 h-14.25 flex items-center justify-between border-b border-white/[0.07] shrink-0">
                    <div>
                        <h2 className = "text-base font-medium tracking-tight text-white ">{result.title}</h2>
                        <p className="text-[11px] text-white/60 mt-0.5">
                            {new Date(summary.createdAt).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                            {" · "}
                            {result.actionItems?.length ?? 0} Action Items
                            {" · "}
                            {result.participants?.length ?? 0} participants
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-white/[0.07] text-white/60 hover:text-white hover:border-white/13 transition-all">
                            <ArrowLeft size={12} />
                            Back
                        </button>

                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-white/[0.07] text-white/60 hover:text-white hover:border-white/13 transition-all"
                        >
                            {copied ? <Check size={12} /> : <Link2 size={12} />}
                            {copied ? "Copied!" : "Share"}
                        </button>
                        {isPro && (
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium border border-white/[0.07] text-white/60 hover:text-white hover:border-white/13  transition-all disabled:opacity-50"
                            >
                                {downloading ? "Generating..." : (
                                    <div className="flex items-center gap-1.5">
                                        <ArrowDown size={12} />
                                        PDF
                                    </div>)}
                            </button>
                        )}

                        <button
                            onClick={() => router.push("/summarize")}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-black text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            >
                                ✦ New Summary
                        </button>
                    </div>
                </div>

                <div>
                    <div className="max-w-195 p-2">
                        <div className="flex flex-wrap gap-2 mb-8">
                            <span className ={`flex items-center gap-1.5 justify-center text-xs px-3 py-1 rounded-full border font-semibold ${sentiment.class}`}>
                                <SentimentIcon size={11} />
                                {sentiment.label}
                            </span>
                            {result.topics?.map(t => (
                                <span key={t} className="text-xs px-3 py-3 rounded-full border border-white/[0.07] text-white/60">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <Section title="Summary">
                    <p className="text-[15px] text-zinc-400 leading-[1.8] font-light">{result.summary}</p>
                </Section>

                {result.participants?.length > 0 && (
                    <Section title="Participants">
                        <div className="flex flex-wrap gap-2">
                            {result.participants.map(name => (
                                <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-white/[0.07] text-sm text-zinc-300">
                                    <div className="w-5 h-5 rounded-full bg-linear-to-br from-green-700 to-green-500 flex items-center justify-center text-[9px] font-bold text-black">
                                        {name[0].toUpperCase()}
                                    </div>
                                    {name}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {result.actionItems?.length > 0 && (
                    <Section title="Action Items">
                        <div className="flex flex-col gap-2">
                            {result.actionItems.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => toggleChecked(i)}
                                    className="bg-zinc-950 border border-white/[0.07] rounded-xl p-4 flex gap-3 items-start cursor-pointer hover:border-white/12 transition-colors"
                                >
                                    <div className={`w-4.25 h-4.25 rounded-[5px] shrink-0 flex items-center justify-center text-[10px] font-bold transition-all ${checkedItems.has(i) ? "bg-green-500 text-black" : "bg-zinc-900 border border-white/[0.07] text-zinc-400"}`}>
                                        {checkedItems.has(i) ? <Check size={10} /> : ""}
                                    </div>

                                    <div>
                                            <p className={`text-sm font-medium transition-colors ${checkedItems.has(i) ? "line-through text-zinc-600" : "text-white"}`}>
                                            {item.task}
                                        </p>
                                        <div className="flex gap-3 mt-1.5">
                                            {item.owner && (
                                                <span className="flex items-center gap-1 text-sm text-white/60">
                                                    <User size={12} /> {item.owner}
                                                </span>
                                            )}
                                            {item.deadline && (
                                                <span className="flex items-center gap-1 text-sm text-white/60">
                                                    <Calendar size={12} /> {item.deadline}
                                                </span>
                                                )}
                                        </div>
                                    </div>
                                </div>

                            ))}
                        </div>
                    </Section>
                    
                )}

                {result.keyDecisions?.length > 0 && (
                    <Section title="Key Decisions">
                        <div className="flex flex-col">
                            {result.keyDecisions.map((d, i) => (
                                <div key={i} className="flex gap-3 items-start py-3 border-b border-white/5 last:border-0">
                                    <ChevronRight size={14} className="text-green-500 shrink-0 mt-0.5" />
                                    <span className="text-sm text-zinc-400">{d}</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {result.openQuestions?.length > 0 && (
                    <Section title="Open Questions">
                        <div className="flex flex-col gap-2">
                            {result.openQuestions.map((q, i) => (
                                <div key={i} className="flex gap-2.5 items-start p-3 rounded-xl bg-yellow-500/3 border border-yellow-500/8">
                                    <HelpCircle size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                                    <span className="text-sm text-zinc-400">{q}</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                <div className="m-8 bg-zinc-900/60 border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4 justify-between text-sm text-white/60">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-green-500/8 border border-green-500/15 flex items-center justify-center shrink-0">
                            <FileText size={20} className="text-green-500" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Download as PDF</p>
                            <p className="text-xs text-zinc-600 mt-0.5">
                                {isPro
                                    ? "Export this summary as a clean, shareable PDF"
                                    : "Upgrade to Pro to export summaries as PDF"
                                }
                            </p>
                        </div>
                    </div>

                    {isPro ? (
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-black text-sm font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] disabled:opacity-60 disabled:translate-y-0 shrink-0"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Generating...
                                </>
                                ) : (
                                <>
                                    <Download size={14} />
                                    Download PDF
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push("/pricing")}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-black text-sm font-bold border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,197,94,0.25)] shrink-0"
                        >
                            <Lock size={13} />
                            Upgrade to Pro
                            
                        </button>
                    )}
                </div>
                
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 mx-4">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest ">
          {title}
        </h3>
        <div className=" h-px bg-white/5 flex-1" />
      </div>
      {children}
    </div>
  )
}