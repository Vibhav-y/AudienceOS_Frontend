"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ChatArtifact, type Proposal, type Coupon } from "@/lib/api";
import { CouponForm, CouponPill } from "@/components/coupon-form";

export function Artifact({ a }: { a: ChatArtifact }) {
  switch (a.type) {
    case "customers": return <Customers a={a} />;
    case "customer_profile": return <CustomerProfile a={a} />;
    case "analytics": return <Analytics a={a} />;
    case "sales": return <Sales a={a} />;
    case "proposal": return <ProposalCard a={a} />;
    case "coupon_picker": return <CouponPickerCard a={a} />;
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
            <th className="pb-1">Name</th><th className="pb-1">Location</th>
            <th className="pb-1 text-right">Spend</th><th className="pb-1 text-right">Orders</th>
            <th className="pb-1 text-right">Last order</th>
          </tr>
        </thead>
        <tbody className="text-neutral-300">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.05]">
              <td className="py-1.5">{String(r.name)}</td>
              <td className="py-1.5 text-neutral-400">
                {String(r.city)}{r.state ? <span className="text-neutral-600">, {String(r.state)}</span> : null}{r.country ? <span className="text-neutral-600">, {String(r.country)}</span> : null}
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
            {String(p.email)} · {String(p.city)}{p.state ? `, ${String(p.state)}` : ""}{p.country ? `, ${String(p.country)}` : ""} · age {String(p.age)}
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
  // Coupon in use — derived from the copy server-side; swapping it rewrites
  // the code inside the message so what's sent always matches the selector.
  const coupons = initial.coupons ?? [];
  const [couponCode, setCouponCode] = useState<string | null>(initial.coupon_code ?? null);

  function swapCoupon(next: string) {
    const chosen = coupons.find((c) => c.code === next);
    if (!chosen) return;
    setMessage((m) => {
      if (couponCode && m.toUpperCase().includes(couponCode)) {
        // replace the old code in place, preserving the sentence around it
        const idx = m.toUpperCase().indexOf(couponCode);
        return m.slice(0, idx) + chosen.code + m.slice(idx + couponCode.length);
      }
      return `${m.trim()} Use code ${chosen.code} at checkout.`;
    });
    setCouponCode(chosen.code);
  }
  const [state, setState] = useState<"idle" | "saving" | "launching" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  // The proposal is saved as a draft server-side the moment it appears, so we
  // usually already have its campaign id. Keep it in state so a launch/save
  // targets that same campaign instead of creating duplicates.
  const [campId, setCampId] = useState<number | null>(initial.campaign_id ?? null);
  // Whether the current copy is persisted as a draft. Seeded true when the
  // server already auto-saved this proposal (campaign_id present).
  const [saved, setSaved] = useState<boolean>(initial.campaign_id != null);

  // True once the user changed the copy since the last save, so "Save as draft"
  // only does work when there's something to persist.
  const dirty = message !== initial.message || channel !== initial.channel;

  const delivered =
    Number(initial.projected_delivered) || Math.round(Number(initial.audience_count) * 0.9);

  // Persist the current edits onto the existing draft (or create one if the
  // server-side auto-save somehow didn't run).
  async function saveDraft() {
    setState("saving"); setError(null);
    try {
      let id = campId;
      if (id) {
        await api.saveDraft(id, { message, channel });
      } else {
        const camp = await api.approve({ ...initial, message, channel, status: "draft" });
        id = camp.id; setCampId(id);
      }
      setSaved(true);
      setState("idle");
    } catch (e) {
      setError((e as Error).message); setState("idle");
    }
  }

  async function launch() {
    setState("launching"); setError(null);
    try {
      let id = campId;
      if (id) {
        // Push any unsaved edits onto the draft, then launch it.
        if (dirty) await api.saveDraft(id, { message, channel });
      } else {
        const camp = await api.approve({ ...initial, message, channel });
        id = camp.id; setCampId(id);
      }
      await api.launch(id);
      setState("done");
      router.push(`/campaigns/${id}`);
    } catch (e) {
      setError((e as Error).message); setState("idle");
    }
  }

  const busy = state === "saving" || state === "launching";

  return (
    <div className={card + " !border-orange-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.45),0_16px_40px_-20px_rgba(249,115,22,0.25)]"}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Campaign proposal</span>
        {saved && !dirty ? (
          <span className="rounded-full border border-neutral-500/20 bg-white/[0.04] px-2.5 py-0.5 text-xs text-neutral-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            Saved as draft
          </span>
        ) : (
          <span className="rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-0.5 text-xs text-orange-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {saved ? "Unsaved edits" : "needs approval"}
          </span>
        )}
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
      {/* coupon selector — swapping rewrites the code inside the copy */}
      {coupons.length > 0 && couponCode && (
        <div className="well mt-3 flex flex-wrap items-center gap-3 p-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">Coupon</div>
            <select
              value={couponCode}
              onChange={(e) => swapCoupon(e.target.value)}
              className="mt-1 rounded-md border border-white/[0.09] bg-black/40 px-2 py-1 font-mono text-sm font-semibold tracking-wide text-orange-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] outline-none focus:border-orange-500/50"
            >
              {coupons.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.kind === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1 text-xs text-neutral-500">
            {coupons.find((c) => c.code === couponCode)?.description ??
              "Changing the coupon updates the code inside the message."}
          </div>
        </div>
      )}
      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">Message · {"{{name}}"} is personalized per customer</div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          className="well w-full px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-orange-500/40 focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_0_0_3px_rgba(249,115,22,0.1)]" />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        {campId && (
          <button
            onClick={() => router.push(`/campaigns/${campId}`)}
            className="px-3 py-2 text-xs text-neutral-400 transition hover:text-neutral-200"
          >
            View draft
          </button>
        )}
        <button
          onClick={saveDraft}
          disabled={busy || (!dirty && saved) || state === "done"}
          className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "saving" ? "Saving…" : saved && !dirty ? "Draft saved ✓" : "Save as draft"}
        </button>
        <button onClick={launch} disabled={busy || state === "done"} className="btn-primary px-4 py-2 text-sm">
          {state === "launching" ? "Launching…" : state === "done" ? "Launched ✓" : `Approve & launch to ${Number(initial.audience_count).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}

// Interactive coupon picker the AGENT shows mid-conversation (via the
// pick_coupon tool) — mirrors how the proposal card works. Clicking a code
// (or adding a new one) replies into the chat so the agent can continue.
function CouponPickerCard({ a }: { a: ChatArtifact }) {
  const [coupons, setCoupons] = useState<Coupon[]>((a.coupons as Coupon[]) ?? []);
  const [chosen, setChosen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  function choose(c: Coupon) {
    if (chosen) return;
    setChosen(c.code);
    const discount = c.kind === "percent" ? `${c.value}% off` : `₹${c.value} off`;
    window.dispatchEvent(
      new CustomEvent("aos:send-prompt", {
        detail: `Use coupon ${c.code} (${discount}) for this offer.`,
      }),
    );
  }

  return (
    <div className={card + " !border-orange-500/20"}>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-orange-400">
          Pick a coupon
        </span>
        {chosen && (
          <span className="rounded-full border border-orange-500/20 bg-orange-500/[0.08] px-2.5 py-0.5 text-xs text-orange-300">
            {chosen} selected ✓
          </span>
        )}
      </div>
      {typeof a.reason === "string" && a.reason && (
        <p className="mb-3 text-sm text-neutral-400">{a.reason}</p>
      )}

      {coupons.length === 0 && !adding ? (
        <p className="mb-3 text-sm text-neutral-600">
          No coupons configured yet — add one below to use it in this offer.
        </p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {coupons.map((c) => (
            <button
              key={c.id ?? c.code}
              onClick={() => choose(c)}
              disabled={!!chosen}
              className={`transition ${
                chosen === c.code
                  ? ""
                  : chosen
                    ? "opacity-40"
                    : "cursor-pointer hover:scale-[1.03] hover:brightness-110"
              }`}
            >
              <CouponPill c={c} />
            </button>
          ))}
        </div>
      )}

      {!chosen &&
        (adding ? (
          <div className="well p-3">
            <CouponForm
              compact
              onAdded={(c) => {
                setCoupons((cs) => [c, ...cs]);
                setAdding(false);
                choose(c); // a code added here is clearly the one they want
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg border border-dashed border-white/[0.14] px-3 py-1.5 text-xs text-neutral-400 transition hover:border-orange-400/40 hover:text-orange-300"
          >
            + Add a new coupon
          </button>
        ))}
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
