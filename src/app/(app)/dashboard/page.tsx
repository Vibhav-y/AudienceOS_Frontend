"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Overview } from "@/lib/api";
import { DashboardSkeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status";

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      api.overview()
        .then((d) => { if (alive) { setData(d); setError(null); } })
        .catch((e) => alive && setError(e.message));
    tick();
    const t = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // A transient poll failure shouldn't wipe the dashboard — keep showing
  // the last good data and surface the error inline.
  if (error && !data) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <DashboardSkeleton />;

  const sent = data.funnel[0]?.n || 0;
  const converted = data.funnel.find((f) => f.stage === "converted")?.n ?? 0;
  const convRate = sent ? ((converted / sent) * 100).toFixed(1) : "0.0";
  const top = Math.max(sent, 1);

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-none tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {data.base.customers.toLocaleString()} customers · {data.base.orders.toLocaleString()} orders ·{" "}
            {data.base.campaigns.toLocaleString()} campaigns
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-neutral-500">
          {error ? (
            <span className="text-amber-400">Reconnecting…</span>
          ) : (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
              </span>
              Live · refreshes every 3s
            </>
          )}
        </span>
      </div>

      {/* KPI row */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Messages sent" value={sent.toLocaleString()} />
        <Kpi label="Conversion rate" value={`${convRate}%`} />
        <Kpi label="Attributed orders" value={data.attributed_orders.toLocaleString()} />
        <Kpi label="Attributed revenue" value={`₹${data.attributed_revenue.toLocaleString()}`} accent />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Global funnel */}
        <section className="card p-6">
          <h2 className="label">Overall funnel</h2>
          <div className="mt-5 space-y-3.5">
            {data.funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="capitalize text-neutral-400">{f.stage}</span>
                  <span className="num text-neutral-200">
                    {f.n.toLocaleString()}
                    <span className="num ml-2 text-neutral-600">
                      {sent ? Math.round((f.n / sent) * 100) : 0}%
                    </span>
                  </span>
                </div>
                <div className="well h-2.5 overflow-hidden">
                  <div
                    className="bar-fill h-full transition-all duration-500"
                    style={{ width: `${Math.round((f.n / top) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="num mt-5 text-xs text-neutral-600">{data.failed.toLocaleString()} failed deliveries</p>
        </section>

        {/* Channel breakdown */}
        <section className="card p-6">
          <h2 className="label">By channel</h2>
          {data.by_channel.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">No sends yet.</p>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="label pb-2.5 font-semibold">Channel</th>
                  <th className="label pb-2.5 text-right font-semibold">Sent</th>
                  <th className="label pb-2.5 text-right font-semibold">Delivered</th>
                  <th className="label pb-2.5 text-right font-semibold">Converted</th>
                  <th className="label pb-2.5 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {data.by_channel.map((ch) => (
                  <tr key={ch.channel} className="border-t border-white/[0.05]">
                    <td className="py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-200">{ch.channel}</td>
                    <td className="num py-2.5 text-right">{ch.sent.toLocaleString()}</td>
                    <td className="num py-2.5 text-right">{ch.delivered.toLocaleString()}</td>
                    <td className="num py-2.5 text-right text-orange-400">{ch.converted.toLocaleString()}</td>
                    <td className="num py-2.5 text-right">₹{ch.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Delivery pipeline — the chaos the receipt state machine absorbed */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="label">Delivery pipeline</h2>
          <span className={`flex items-center gap-1.5 text-xs ${data.pipeline.channel_up ? "text-orange-400" : "text-red-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${data.pipeline.channel_up ? "bg-orange-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-red-400"}`} />
            channel service {data.pipeline.channel_up ? "up" : "down"}
          </span>
        </div>
        <div className="mt-5 grid gap-px overflow-hidden rounded-lg bg-white/[0.04] sm:grid-cols-5">
          <Stat label="Events processed" value={data.pipeline.events.toLocaleString()} />
          <Stat label="Duplicates ignored" value={data.pipeline.duplicates.toLocaleString()}
            hint="repeat callbacks dropped by idempotency key" />
          <Stat label="Out-of-order absorbed" value={data.pipeline.out_of_order.toLocaleString()}
            hint="late events blocked from downgrading status" />
          <Stat label="Send queue" value={data.pipeline.queue_depth.toLocaleString()}
            hint="messages waiting in the channel service" />
          <Stat label="Dead letters" value={data.pipeline.dead_letters.toLocaleString()}
            hint="callbacks that exhausted retries" warn={data.pipeline.dead_letters > 0} />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-600">
          The channel simulator deliberately duplicates and reorders callbacks — these counters show the
          receipt state machine correcting for it.
        </p>
      </section>

      {/* Recent campaigns */}
      <section className="card p-6">
        <h2 className="label">Recent campaigns</h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No campaigns yet. <Link href="/chat" className="text-orange-400">Plan one →</Link>
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="label pb-2.5 font-semibold">Campaign</th>
                  <th className="label pb-2.5 font-semibold">Channel</th>
                  <th className="label pb-2.5 font-semibold">Status</th>
                  <th className="label pb-2.5 text-right font-semibold">Audience</th>
                  <th className="label pb-2.5 text-right font-semibold">Sent</th>
                  <th className="label pb-2.5 text-right font-semibold">Converted</th>
                  <th className="label pb-2.5 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {data.recent.map((c) => (
                  <tr key={c.id} className="border-t border-white/[0.05] transition hover:bg-white/[0.025]">
                    <td className="py-2.5">
                      <Link href={`/campaigns/${c.id}`} className="font-medium text-neutral-200 hover:text-orange-400">{c.name}</Link>
                    </td>
                    <td className="py-2.5 text-xs uppercase tracking-wide text-neutral-500">{c.channel}</td>
                    <td className="py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="num py-2.5 text-right">{c.audience_count.toLocaleString()}</td>
                    <td className="num py-2.5 text-right">{c.sent.toLocaleString()}</td>
                    <td className="num py-2.5 text-right text-orange-400">{c.converted.toLocaleString()}</td>
                    <td className="num py-2.5 text-right">₹{c.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="bg-[#0d0e10] p-4" title={hint}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">{label}</div>
      <div className={`num mt-1.5 text-2xl font-semibold ${warn ? "text-amber-400" : "text-neutral-100"}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] leading-tight text-neutral-600">{hint}</div>}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card card-hover p-5">
      <div className="label">{label}</div>
      <div className={`num mt-2 text-[30px] font-semibold leading-none ${accent ? "bg-gradient-to-b from-orange-300 to-orange-500 bg-clip-text text-transparent" : "text-neutral-50"}`}>
        {value}
      </div>
    </div>
  );
}
