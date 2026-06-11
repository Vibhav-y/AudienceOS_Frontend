"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ChatArtifact, type Proposal } from "@/lib/api";

export function Artifact({ a }: { a: ChatArtifact }) {
  switch (a.type) {
    case "customers": return <Customers a={a} />;
    case "customer_profile": return <CustomerProfile a={a} />;
    case "analytics": return <Analytics a={a} />;
    case "sales": return <Sales a={a} />;
    case "proposal": return <ProposalCard a={a} />;
    default: return null;
  }
}

const card = "card mt-3 p-4";
const inr = (n: number) => "₹" + Math.round(n).toLocaleString();
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

function Customers({ a }: { a: ChatArtifact }) {
  const rows = (a.rows as Record<string, unknown>[]) ?? [];
  return (
    <div className={card}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-orange-400">Audience</span>
        <span className="text-xs text-neutral-500">
          {Number(a.count).toLocaleString()} match{rows.length < Number(a.count) ? ` · top ${rows.length}` : ""}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-neutral-500">
            <th className="pb-1">Name</th><th className="pb-1">City</th>
            <th className="pb-1 text-right">Spend</th><th className="pb-1 text-right">Orders</th>
            <th className="pb-1 text-right">Last order</th>
          </tr>
        </thead>
        <tbody className="text-neutral-300">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.05]">
              <td className="py-1.5">{String(r.name)}</td>
              <td className="py-1.5 text-neutral-400">
                {String(r.city)}{r.state ? <span className="text-neutral-600">, {String(r.state)}</span> : null}
              </td>
              <td className="py-1.5 text-right">{inr(Number(r.total_spent))}</td>
              <td className="py-1.5 text-right">{String(r.order_count)}</td>
              <td className="py-1.5 text-right text-neutral-400">{fmtDate(r.last_order_date as string)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerProfile({ a }: { a: ChatArtifact }) {
  if (!a.found) return <div className={card}><p className="text-sm text-neutral-400">No customer found for “{String(a.query)}”.</p></div>;
  const p = a.profile as Record<string, unknown>;
  const orders = (a.orders as Record<string, unknown>[]) ?? [];
  return (
    <div className={card}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-lg font-semibold">{String(p.name)}</div>
          <div className="text-xs text-neutral-500">
            {String(p.email)} · {String(p.city)}{p.state ? `, ${String(p.state)}` : ""} · age {String(p.age)}
          </div>
          {p.address ? <div className="mt-0.5 text-xs text-neutral-600">{String(p.address)}</div> : null}
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500">Lifetime spend</div>
          <div className="text-lg font-semibold text-orange-400">{inr(Number(p.total_spent))}</div>
        </div>
      </div>
      {orders.length > 0 && (
        <table className="mt-3 w-full text-sm">
          <thead><tr className="text-left text-xs text-neutral-500"><th className="pb-1">Date</th><th className="pb-1">Category</th><th className="pb-1 text-right">Amount</th></tr></thead>
          <tbody className="text-neutral-300">
            {orders.map((o, i) => (
              <tr key={i} className="border-t border-white/[0.05]">
                <td className="py-1.5 text-neutral-400">{fmtDate(o.order_date as string)}</td>
                <td className="py-1.5 capitalize">{String(o.category)}</td>
                <td className="py-1.5 text-right">{inr(Number(o.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Sales({ a }: { a: ChatArtifact }) {
  const label: Record<string, string> = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days", all: "All time" };
  const cats = (a.by_category as { category: string; orders: number; revenue: number }[]) ?? [];
  return (
    <div className={card}>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-400">Sales</div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">{label[String(a.period)] ?? "Sales"}</div>
          <div className="mt-0.5 text-3xl font-semibold text-orange-400">{inr(Number(a.revenue))}</div>
        </div>
        <div className="text-right text-xs text-neutral-500">{Number(a.orders).toLocaleString()} orders</div>
      </div>
      {cats.length > 0 && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-neutral-500"><th className="pb-1">Category</th><th className="pb-1 text-right">Orders</th><th className="pb-1 text-right">Revenue</th></tr></thead>
          <tbody className="text-neutral-300">
            {cats.map((c, i) => (
              <tr key={i} className="border-t border-white/[0.05]">
                <td className="py-1.5 capitalize">{c.category}</td>
                <td className="py-1.5 text-right">{c.orders.toLocaleString()}</td>
                <td className="py-1.5 text-right">{inr(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Analytics({ a }: { a: ChatArtifact }) {
  const d = a.data as Record<string, unknown>;
  const funnel = (d.funnel as { stage: string; n: number }[]) ?? [];
  const top = funnel[0]?.n || 1;
  const revenue = Number(d.attributed_revenue ?? d.revenue ?? 0);
  return (
    <div className={card}>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
        {a.scope === "campaign" ? "Campaign performance" : "Performance"}
      </div>
      <div className="mb-2 flex justify-between text-xs uppercase tracking-wide text-neutral-500">
        <span>{a.scope === "campaign" ? "Campaign funnel" : "Account funnel"}</span>
        <span className="text-orange-400">{inr(revenue)} attributed</span>
      </div>
      <div className="space-y-2">
        {funnel.map((f) => (
          <div key={f.stage}>
            <div className="mb-0.5 flex justify-between text-xs">
              <span className="capitalize text-neutral-400">{f.stage}</span>
              <span className="text-neutral-300">{f.n.toLocaleString()}</span>
            </div>
            <div className="well h-1.5 overflow-hidden">
              <div className="bar-fill h-full" style={{ width: `${Math.round((f.n / top) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHANNELS = ["whatsapp", "sms", "email", "rcs"];

function ProposalCard({ a }: { a: ChatArtifact }) {
  const router = useRouter();
  const initial = a.proposal as Proposal;
  const [message, setMessage] = useState(initial.message);
  const [channel, setChannel] = useState(initial.channel);
  const [state, setState] = useState<"draft" | "launching" | "done">("draft");
  const [error, setError] = useState<string | null>(null);
  // Once approved, remember the campaign so a retry after a failed launch
  // re-launches it instead of approving a duplicate campaign.
  const [campId, setCampId] = useState<number | null>(null);

  // The backend already projected delivery; only fall back to the simulator's
  // 90% rate for old persisted proposals that predate the field.
  const delivered =
    Number(initial.projected_delivered) || Math.round(Number(initial.audience_count) * 0.9);

  async function launch() {
    setState("launching"); setError(null);
    try {
      let id = campId;
      if (!id) {
        const camp = await api.approve({ ...initial, message, channel });
        id = camp.id;
        setCampId(id);
      }
      await api.launch(id);
      setState("done");
      router.push(`/campaigns/${id}`);
    } catch (e) {
      setError((e as Error).message); setState("draft");
    }
  }

  return (
    <div className={card + " !border-orange-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.45),0_16px_40px_-20px_rgba(249,115,22,0.25)]"}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Campaign proposal</span>
        <span className="rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-0.5 text-xs text-orange-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">needs approval</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Mini label="Audience" v={Number(initial.audience_count).toLocaleString()} sub={initial.segment_name} />
        {/* channel is editable */}
        <div className="well p-3">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">Channel</div>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}
            className="mt-1 w-full rounded-md border border-white/[0.09] bg-black/40 px-2 py-1 text-sm font-semibold uppercase text-neutral-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] outline-none focus:border-orange-500/50">
            {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch.toUpperCase()}</option>)}
          </select>
          <div className="mt-1 line-clamp-2 text-xs text-neutral-400">{initial.channel_reason}</div>
        </div>
        <Mini label="Est. delivered" v={delivered.toLocaleString()} sub="≈90% of audience reached" />
      </div>
      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">Message · {"{{name}}"} is personalized per customer</div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          className="well w-full px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-orange-500/40 focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_0_0_3px_rgba(249,115,22,0.1)]" />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button onClick={launch} disabled={state !== "draft"}
          className="btn-primary px-4 py-2 text-sm">
          {state === "launching" ? "Launching…" : state === "done" ? "Launched ✓" : `Approve & launch to ${Number(initial.audience_count).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

function Mini({ label, v, sub }: { label: string; v: string; sub?: string }) {
  return (
    <div className="well p-3">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{v}</div>
      {sub && <div className="mt-0.5 line-clamp-2 text-xs text-neutral-400">{sub}</div>}
    </div>
  );
}
