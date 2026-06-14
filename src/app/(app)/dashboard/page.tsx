"use client";

import Link from "next/link";
import { api, type Overview } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { num, inr } from "@/lib/format";
import { DashboardSkeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status";
import { PageTitle, StatCard, LiveDot, ErrorText, FunnelBars } from "@/components/ui";
import { DashboardInsights } from "@/components/dashboard-insights";

export default function DashboardPage() {
  const { data, error } = usePoll<Overview>(api.overview, 3000);

  // A transient poll failure shouldn't wipe the dashboard — keep showing
  // the last good data and surface the error inline.
  if (error && !data) return <ErrorText>{error}</ErrorText>;
  if (!data) return <DashboardSkeleton />;

  const sent = data.funnel[0]?.n || 0;
  const converted = data.funnel.find((f) => f.stage === "converted")?.n ?? 0;
  const convRate = sent ? ((converted / sent) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between">
        <div>
          <PageTitle>Dashboard</PageTitle>
          <p className="mt-2 text-sm text-neutral-400">
            {num(data.base.customers)} customers · {num(data.base.orders)} orders ·{" "}
            {num(data.base.campaigns)} campaigns
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-neutral-500">
          {error ? (
            <span className="text-amber-400">Reconnecting…</span>
          ) : (
            <>
              <LiveDot />
              Live · refreshes every 3s
            </>
          )}
        </span>
      </div>

      {/* KPI row */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Messages sent" value={num(sent)} />
        <StatCard label="Conversion rate" value={`${convRate}%`} />
        <StatCard label="Attributed orders" value={num(data.attributed_orders)} />
        <StatCard label="Attributed revenue" value={inr(data.attributed_revenue)} accent />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Global funnel */}
        <section className="card p-6">
          <h2 className="label">Overall funnel</h2>
          <div className="mt-5">
            <FunnelBars funnel={data.funnel} showPct />
          </div>
          <p className="num mt-5 text-xs text-neutral-600">{num(data.failed)} failed deliveries</p>
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
                    <td className="py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-200">
                      {ch.channel}
                    </td>
                    <td className="num py-2.5 text-right">{num(ch.sent)}</td>
                    <td className="num py-2.5 text-right">{num(ch.delivered)}</td>
                    <td className="num py-2.5 text-right text-orange-400">{num(ch.converted)}</td>
                    <td className="num py-2.5 text-right">{inr(ch.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Deeper insights: trend, coupons, top customers, send-time heatmap */}
      <DashboardInsights />

      {/* Delivery pipeline — the chaos the receipt state machine absorbed */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="label">Delivery pipeline</h2>
          <span
            className={`flex items-center gap-1.5 text-xs ${
              data.pipeline.channel_up ? "text-orange-400" : "text-red-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                data.pipeline.channel_up
                  ? "bg-orange-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                  : "bg-red-400"
              }`}
            />
            channel service {data.pipeline.channel_up ? "up" : "down"}
          </span>
        </div>
        <div className="mt-5 grid gap-px overflow-hidden rounded-lg bg-white/[0.04] sm:grid-cols-5">
          <PipelineStat label="Events processed" value={num(data.pipeline.events)} />
          <PipelineStat
            label="Duplicates ignored"
            value={num(data.pipeline.duplicates)}
            hint="repeat callbacks dropped by idempotency key"
          />
          <PipelineStat
            label="Out-of-order absorbed"
            value={num(data.pipeline.out_of_order)}
            hint="late events blocked from downgrading status"
          />
          <PipelineStat
            label="Send queue"
            value={num(data.pipeline.queue_depth)}
            hint="messages waiting in the channel service"
          />
          <PipelineStat
            label="Dead letters"
            value={num(data.pipeline.dead_letters)}
            hint="callbacks that exhausted retries"
            warn={data.pipeline.dead_letters > 0}
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-600">
          The channel simulator deliberately duplicates and reorders callbacks — these counters
          show the receipt state machine correcting for it.
        </p>
      </section>

      {/* Recent campaigns */}
      <section className="card p-6">
        <h2 className="label">Recent campaigns</h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No campaigns yet.{" "}
            <Link href="/chat" className="text-orange-400">
              Plan one →
            </Link>
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
                  <tr
                    key={c.id}
                    className="border-t border-white/[0.05] transition hover:bg-white/[0.025]"
                  >
                    <td className="py-2.5">
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="font-medium text-neutral-200 hover:text-orange-400"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2.5 text-xs uppercase tracking-wide text-neutral-500">
                      {c.channel}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="num py-2.5 text-right">{num(c.audience_count)}</td>
                    <td className="num py-2.5 text-right">{num(c.sent)}</td>
                    <td className="num py-2.5 text-right text-orange-400">{num(c.converted)}</td>
                    <td className="num py-2.5 text-right">{inr(c.revenue)}</td>
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

/** Pipeline counter tile — specific to this page's anomaly strip. */
function PipelineStat({
  label,
  value,
  hint,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-[#14110b] p-4" title={hint}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </div>
      <div
        className={`num mt-1.5 text-2xl font-semibold ${
          warn ? "text-amber-400" : "text-neutral-100"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-[11px] leading-tight text-neutral-600">{hint}</div>}
    </div>
  );
}
