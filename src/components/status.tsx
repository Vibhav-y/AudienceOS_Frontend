// Shared campaign status badge so every page renders states consistently.
const STYLE: Record<string, { cls: string; dot: string }> = {
  draft: { cls: "border-white/[0.08] bg-white/[0.03] text-neutral-300", dot: "bg-neutral-400" },
  approved: { cls: "border-amber-500/20 bg-amber-500/[0.07] text-amber-300", dot: "bg-amber-400" },
  launched: { cls: "border-orange-500/20 bg-orange-500/[0.07] text-orange-300", dot: "bg-orange-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]" },
  done: { cls: "border-sky-500/20 bg-sky-500/[0.07] text-sky-300", dot: "bg-sky-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLE[status] ?? STYLE.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${s.cls}`}>
      <span className={`h-1 w-1 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
