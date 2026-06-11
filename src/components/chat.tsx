"use client";

import { useEffect, useRef, useState } from "react";
import { api, type ChatMessage } from "@/lib/api";
import { Artifact } from "@/components/artifacts";
import { Markdown } from "@/components/markdown";
import { ChatThreadSkeleton } from "@/components/skeleton";

const SUGGESTIONS = [
  { label: "Check performance", q: "How is my account performing overall?" },
  { label: "Sales today", q: "What were our sales today?" },
  { label: "Find an audience", q: "Find high-value customers who haven't ordered in over 60 days" },
  { label: "Draft a win-back", q: "Draft a WhatsApp win-back campaign for dormant premium customers with 20% off" },
];

const STEP_LABEL: Record<string, string> = {
  find_customers: "Searching customers",
  lookup_customer: "Looking up the customer",
  get_sales: "Crunching sales numbers",
  get_analytics: "Reviewing performance",
  propose_campaign: "Drafting the campaign",
};

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Working late?";
}

export function Chat({ sessionId }: { sessionId?: number }) {
  const [activeId, setActiveId] = useState<number | null>(sessionId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingThread, setLoadingThread] = useState(!!sessionId);
  const endRef = useRef<HTMLDivElement>(null);
  // Stick to the bottom only while the user is already there — never hijack
  // the scroll position while they're reading earlier messages.
  const stickToBottom = useRef(true);

  useEffect(() => {
    const onScroll = () => {
      stickToBottom.current =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load the conversation for the routed session.
  useEffect(() => {
    setActiveId(sessionId ?? null);
    if (sessionId) {
      setLoadingThread(true);
      api.chatMessages(sessionId)
        .then(setMessages)
        .catch(() => setMessages([]))
        .finally(() => setLoadingThread(false));
    } else {
      setMessages([]);
      setLoadingThread(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // Instant (not smooth): a long smooth animation fights the user's own
    // scrolling and feels like the page "scrolling up on its own".
    if (stickToBottom.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, status]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput(""); setError(null); setBusy(true); setStatus("Thinking");
    let id = activeId;
    try {
      if (!id) {
        id = (await api.newChatSession()).id;
        setActiveId(id);
        // reflect the session in the URL without remounting (keeps the stream alive)
        window.history.replaceState(null, "", `/c/${id}`);
      }
      setMessages((m) => [...m, { role: "user", content }]);
      const turn = await api.sendChatStream(id, content, (tool) =>
        setStatus(STEP_LABEL[tool] ?? "Working"),
      );
      setMessages((m) => [...m, { role: "assistant", content: turn.content, data: { artifacts: turn.artifacts, trace: turn.trace } }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false); setStatus(null);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex">
      {/* conversation column */}
      <div className="flex flex-1 flex-col items-center">
        {loadingThread ? (
          <ChatThreadSkeleton />
        ) : empty ? (
          <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col items-center justify-center">
            <div className="mb-7 flex items-center gap-3">
              <Sparkle />
              <h1 className="font-[family-name:var(--font-serif)] text-5xl leading-none text-neutral-100">
                {greeting()}
              </h1>
            </div>
            <div className="w-full">
              <Composer value={input} setValue={setInput} onSend={send} busy={busy} big />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s.q} onClick={() => send(s.q)}
                    className="rounded-full border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] px-3.5 py-1.5 text-xs text-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.35)] transition hover:border-white/[0.16] hover:text-neutral-100">
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-1 flex-col">
            <div className="flex-1 space-y-7 py-6">
              {messages.map((m, i) => <Message key={i} m={m} />)}
              {busy && <Working status={status} />}
              {error && <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2.5 text-sm text-red-300">{error}</div>}
              {/* spacer so the last message clears the fixed composer */}
              <div ref={endRef} className="h-28" />
            </div>
            {/* composer pinned to the viewport bottom, offset past the sidebar */}
            <div className="fixed inset-x-0 bottom-0 z-30 transition-[left] duration-200 ease-out md:left-[var(--sidebar-w)]">
              <div className="mx-auto max-w-[1280px] px-6 md:px-10">
                <div className="mx-auto max-w-4xl">
                  <div className="pointer-events-none h-6 bg-gradient-to-t from-[#0a0b0c] to-transparent" />
                  <div className="bg-[#0a0b0c] pb-4">
                    <Composer value={input} setValue={setInput} onSend={send} busy={busy} />
                    <p className="mt-2 text-center text-[11px] text-neutral-600">
                      AudienceOS can run segments and draft campaigns — you approve before anything sends.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Composer({
  value, setValue, onSend, busy, big,
}: {
  value: string; setValue: (v: string) => void; onSend: (t: string) => void; busy: boolean; big?: boolean;
}) {
  return (
    <div className={`input-surface flex items-end gap-2 p-2 ${big ? "px-3 py-2.5" : ""}`}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(value); } }}
        rows={big ? 2 : 1}
        autoFocus
        placeholder="How can I help you today?"
        className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
      />
      <button onClick={() => onSend(value)} disabled={busy || !value.trim()}
        className="btn-primary mb-0.5 flex h-9 w-9 items-center justify-center !rounded-xl">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

function Message({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  const artifacts = m.data?.artifacts ?? [];
  const trace = m.data?.trace ?? [];
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-b from-orange-400 to-orange-600 px-4 py-2.5 text-sm leading-relaxed text-orange-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_-2px_rgba(249,115,22,0.4)]">
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-400/15 bg-gradient-to-b from-orange-400/20 to-orange-600/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <Sparkle small />
      </div>
      <div className="min-w-0 flex-1">
        {trace.length > 0 && <Trace trace={trace} />}
        {m.content && <Markdown>{m.content}</Markdown>}
        {artifacts.map((a, i) => <Artifact key={i} a={a} />)}
      </div>
    </div>
  );
}

// What the agent actually did this turn — collapsed by default, expandable
// to the tool names + arguments for anyone auditing the run.
function Trace({ trace }: { trace: { tool: string; args: unknown }[] }) {
  return (
    <details className="group mb-2">
      <summary className="cursor-pointer select-none list-none text-xs text-neutral-500 transition hover:text-neutral-300">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
        {trace.map((t) => STEP_LABEL[t.tool] ?? t.tool).join(" · ")}
      </summary>
      <div className="well mt-2 space-y-1 p-3">
        {trace.map((t, i) => (
          <div key={i} className="text-xs">
            <span className="font-mono text-orange-400">{t.tool}</span>
            <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-all text-neutral-500">
              {JSON.stringify(t.args)}
            </pre>
          </div>
        ))}
      </div>
    </details>
  );
}

// Live working indicator: shows the agent's current step with a shimmer.
function Working({ status }: { status: string | null }) {
  return (
    <div className="flex gap-4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-400/15 bg-gradient-to-b from-orange-400/20 to-orange-600/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        <Sparkle small spin />
      </div>
      <div className="flex items-center gap-2 py-1.5">
        <span className="shimmer text-sm font-medium">{status ?? "Thinking"}</span>
        <span className="flex gap-1">
          <Dot delay="0ms" /><Dot delay="150ms" /><Dot delay="300ms" />
        </span>
      </div>
    </div>
  );
}
function Dot({ delay }: { delay: string }) {
  return <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-500/70" style={{ animationDelay: delay }} />;
}

function Sparkle({ small, spin }: { small?: boolean; spin?: boolean }) {
  const s = small ? 14 : 30;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={`text-orange-400 ${spin ? "animate-spin-slow" : ""}`}>
      <path d="M12 2c.4 4.5 2.9 7 7.4 7.4C14.9 9.8 12.4 12.3 12 16.8 11.6 12.3 9.1 9.8 4.6 9.4 9.1 9 11.6 6.5 12 2Z" fill="currentColor" opacity="0.9" />
      <path d="M19 14c.2 2.2 1.4 3.4 3.6 3.6-2.2.2-3.4 1.4-3.6 3.6-.2-2.2-1.4-3.4-3.6-3.6 2.2-.2 3.4-1.4 3.6-3.6Z" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
