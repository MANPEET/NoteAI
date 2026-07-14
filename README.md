This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

const [panelWidth, setPanelWidth] = useState(360);
const [isDragging, setIsDragging] = useState(false);
const dragStart = useRef({ x: 0, width: 0 });

const startDrag = (e) => {
dragStart.current = { x: e.clientX, width: panelWidth };
setIsDragging(true);
};

useEffect(() => {
if (!isDragging) return;
const onMove = (e) => {
const delta = dragStart.current.x - e.clientX;
const next = Math.min(560, Math.max(260, dragStart.current.width + delta));
setPanelWidth(next);
};
const onUp = () => setIsDragging(false);
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onUp);
return () => {
window.removeEventListener("mousemove", onMove);
window.removeEventListener("mouseup", onUp);
};
}, [isDragging]);

{/_ Remove the backdrop + translate-x drawer, use this instead _/}

<div
  style={{
    display: "flex",
    height: "100%",
    position: "relative",
  }}
>
  {/* Your main content */}
  <div style={{ flex: 1, minWidth: 0 }}>
    {children}
  </div>

{/_ Drag handle _/}
{open && (

<div
onMouseDown={startDrag}
style={{
        width: "4px",
        cursor: "col-resize",
        flexShrink: 0,
        background: isDragging ? "rgba(34,197,94,0.5)" : "transparent",
        transition: "background 0.15s",
      }}
/>
)}

{/_ Chat panel — no translate-x, just width _/}

  <div
    style={{
      width: open ? `${panelWidth}px` : 0,
      overflow: "hidden",
      transition: isDragging ? "none" : "width 0.2s ease-out",
      flexShrink: 0,
      background: "#09090b",
      borderLeft: "1px solid rgba(255,255,255,0.07)",
    }}
  >
    {/* ...your header, messages, input — unchanged */}
  </div>
</div>

{(activePanel === "checklist" ) && (
<div className="mb-5">
<div className="flex items-center justify-center gap-1 mb-2.5">
<CheckSquare2 size={20} className="text-white/90" />
<input value ={checklistTitle} onChange={(e) => (e)}className="font-semibold text-white/90 flex-1 p-1.5 text-md" />
{/_ {subtasks.length > 0 && (
<span className="text-[11px] text-white/90 font-mono">{completedCount}/{subtasks.length}</span>
)} _/}
</div>

              </div>
            )}
