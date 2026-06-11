"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, type ChatSession } from "@/lib/api";

const LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p: string) => p.startsWith("/dashboard"),
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-4H3v4ZM13 3v4h8V3h-8Z" />
      </svg>
    ),
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    match: (p: string) => p.startsWith("/campaigns"),
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-7-7 18-2.5-7.5L3 11Z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  // Restore the persisted collapse state. The inline script in the root layout
  // sets the data attribute pre-paint to avoid a flash; mirror it into React.
  useEffect(() => {
    setCollapsed(document.documentElement.dataset.sidebar === "compact");
  }, []);

  // Drive the shared --sidebar-w via a data attribute so the fixed chat
  // composer (md:left-[var(--sidebar-w)]) follows the rail width.
  useEffect(() => {
    document.documentElement.dataset.sidebar = collapsed ? "compact" : "expanded";
    try { localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  // Recents stay fresh as the user chats (new sessions appear within 5s).
  useEffect(() => {
    let alive = true;
    const tick = () => api.chatSessions().then((s) => alive && setSessions(s)).catch(() => {});
    tick();
    const t = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const activeChat = pathname.startsWith("/c/") ? Number(pathname.split("/")[2]) : null;

  return (
    <aside
      style={{ width: "var(--sidebar-w)" }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0e0f11]/80 transition-[width] duration-200 ease-out md:flex"
    >
      {/* logo + collapse toggle */}
      <div className={`flex px-3 pb-4 pt-5 ${collapsed ? "flex-col items-center gap-3" : "items-center gap-2.5"}`}>
        <Link href="/" className="flex min-w-0 items-center gap-2.5" title="AudienceOS">
          <img src="/logo.png" alt="AudienceOS" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg" />
          {!collapsed && (
            <span className="truncate text-[16px] font-semibold tracking-tight">
              Audience<span className="bg-gradient-to-b from-orange-300 to-orange-500 bg-clip-text text-transparent">OS</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-white/[0.05] hover:text-neutral-200 ${collapsed ? "" : "ml-auto"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <div className="px-3">
        {/* new chat */}
        <button onClick={() => router.push("/chat")} title="New chat"
          className={`flex w-full items-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] text-sm text-neutral-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.4)] transition hover:border-white/[0.14] hover:from-white/[0.07] ${collapsed ? "justify-center py-2.5" : "gap-2.5 px-3 py-2.5"}`}>
          <span className="text-base leading-none text-orange-400">＋</span>{!collapsed && <span>New chat</span>}
        </button>

        {/* primary nav */}
        <nav className="mt-4 space-y-0.5">
          <NavItem
            href="/chat"
            collapsed={collapsed}
            active={pathname.startsWith("/chat") || pathname.startsWith("/c/")}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.4-.7L3 21l1.8-5.6a8.4 8.4 0 1 1 16.2-3.9Z" />
              </svg>
            }
            label="Chat"
          />
          {LINKS.map((l) => (
            <NavItem key={l.href} href={l.href} collapsed={collapsed} active={l.match(pathname)} icon={l.icon} label={l.label} />
          ))}
        </nav>
      </div>

      {/* recents — hidden in the compact rail */}
      {!collapsed && sessions.length > 0 && (
        <>
          <div className="px-6 pb-1 pt-6 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            Recents
          </div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => router.push(`/c/${s.id}`)}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left text-[13px] transition ${
                  s.id === activeChat
                    ? "bg-white/[0.06] text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/[0.06]"
                    : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200"
                }`}>
                {s.title}
              </button>
            ))}
          </div>
        </>
      )}
      {(collapsed || sessions.length === 0) && <div className="flex-1" />}

      {!collapsed && (
        <div className="border-t border-white/[0.05] px-5 py-4 text-[11px] leading-relaxed text-neutral-600">
          AI-native CRM — you approve before anything sends.
        </div>
      )}
    </aside>
  );
}

function NavItem({ href, active, icon, label, collapsed }: { href: string; active: boolean; icon: React.ReactNode; label: string; collapsed: boolean }) {
  return (
    <Link href={href} title={collapsed ? label : undefined}
      className={`flex items-center rounded-lg text-sm transition ${collapsed ? "justify-center py-2.5" : "gap-2.5 px-3 py-2"} ${
        active
          ? "bg-white/[0.06] text-neutral-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/[0.06]"
          : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200"
      }`}>
      <span className={active ? "text-orange-400" : "text-neutral-500"}>{icon}</span>
      {!collapsed && label}
    </Link>
  );
}
