"use client";

// Deeper dashboard sections fed by /analytics/insights (30s poll):
//   RevenueTrend   — 30-day revenue bars with attributed overlay (pure SVG)
//   CouponPerf     — per-coupon sends / conversions / revenue
//   TopCustomers   — spend leaderboard + live segment counts from Settings
//   SendTimeHeatmap— engagement by weekday × hour
import { api, type Insights } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { num, inr } from "@/lib/format";

export function DashboardInsights() {
  const { data, error } = usePoll<Insights>(api.insights, 30_000);

  if (!data) {
    return (
      <section className="card p-6">
        <h2 className="label">Insights</h2>
        <p className="mt-4 text-sm text-neutral-600">{error ?? "Loading insights…"}</p>
      </section>
    );
  }

  return (
    <>
      <RevenueTrend trend={data.trend} />
      <div className="grid gap-5 lg:grid-cols-2">
        <CouponPerf coupons={data.coupons} />
        <TopCustomers top={data.top_customers} segments={data.segments} />
      </div>
      <SendTimeHeatmap cells={data.heatmap} />
    </>
  );
}

/* ── 30-day revenue trend ─────────────────────────────────────────── */

function RevenueTrend({ trend }: { trend: Insights["trend"] }) {
  const W = 900;
  const H = 180;
  const PAD = 4;
  const max = Math.max(...trend.map((d) => d.revenue), 1);
  const bw = (W - PAD * 2) / Math.max(trend.length, 1);
  const total = trend.reduce((a, d) => a + d.revenue, 0);
  const attributed = trend.reduce((a, d) => a + d.attributed_revenue, 0);

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="label">Revenue · last 30 days</h2>
        <div className="text-xs text-neutral-500">
          <span className="num text-neutral-200">{inr(total)}</span> total ·{" "}
          <span className="num text-orange-400">{inr(attributed)}</span> attributed to campaigns
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="mt-4 w-full"
        role="img"
        aria-label="Daily revenue for the last 30 days"
      >
        {trend.map((d, i) => {
          const x = PAD + i * bw;
          const hTotal = (d.revenue / max) * H;
          const hAttr = (d.attributed_revenue / max) * H;
          return (
            <g key={d.day}>
              <title>{`${d.day} · ${inr(d.revenue)} (${d.orders} orders) · ${inr(d.attributed_revenue)} attributed`}</title>
              {/* total revenue */}
              <rect
                x={x + 1.5}
                y={H - hTotal}
                width={bw - 3}
                height={Math.max(hTotal, d.revenue > 0 ? 2 : 0)}
                rx={2}
                fill="rgba(248,244,238,0.16)"
              />
              {/* attributed overlay */}
              <rect
                x={x + 1.5}
                y={H - hAttr}
                width={bw - 3}
                height={Math.max(hAttr, d.attributed_revenue > 0 ? 2 : 0)}
                rx={2}
                fill="#c08736"
              />
              {/* sparse date labels */}
              {i % 5 === 0 && (
                <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#655a4c">
                  {d.day.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-5 text-[11px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-[rgba(248,244,238,0.16)]" /> all orders
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-orange-400" /> attributed to campaigns
        </span>
      </div>
    </section>
  );
}

/* ── coupon performance ───────────────────────────────────────────── */

function CouponPerf({ coupons }: { coupons: Insights["coupons"] }) {
  const used = [...coupons].sort((a, b) => b.revenue - a.revenue || b.sent - a.sent);
  return (
    <section className="card p-6">
      <h2 className="label">Coupon performance</h2>
      {used.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">No coupons configured yet.</p>
      ) : (
        <div className="mt-4 max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="label pb-2.5 font-semibold">Code</th>
                <th className="label pb-2.5 text-right font-semibold">Sent</th>
                <th className="label pb-2.5 text-right font-semibold">Converted</th>
                <th className="label pb-2.5 text-right font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {used.map((c) => (
                <tr key={c.code} className="border-t border-white/[0.05]">
                  <td className="py-2">
                    <span className="font-mono text-xs font-semibold tracking-wide text-orange-300">
                      {c.code}
                    </span>
                    <span className="ml-2 text-[11px] text-neutral-600">
                      {c.kind === "percent" ? `${c.value}%` : `₹${c.value}`}
                    </span>
                  </td>
                  <td className="num py-2 text-right">{num(c.sent)}</td>
                  <td className="num py-2 text-right text-orange-400">{num(c.converted)}</td>
                  <td className="num py-2 text-right">{inr(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ── top customers + live segments ────────────────────────────────── */

function TopCustomers({
  top,
  segments,
}: {
  top: Insights["top_customers"];
  segments: Insights["segments"];
}) {
  const t = segments.thresholds;
  const pills = [
    { label: `Dormant ${t.dormant_days}d+`, n: segments.dormant },
    { label: `High-value ₹${t.high_value_spend.toLocaleString()}+`, n: segments.high_value },
    { label: `Loyal ${t.loyal_order_count}+ orders`, n: segments.loyal },
    { label: "Never ordered", n: segments.never_ordered },
  ];
  return (
    <section className="card p-6">
      <h2 className="label">Top customers</h2>
      {/* live segment counts, resolved with the Settings thresholds */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {pills.map((p) => (
          <span
            key={p.label}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-400"
          >
            {p.label} · <span className="num text-neutral-100">{num(p.n)}</span>
          </span>
        ))}
      </div>
      <table className="mt-4 w-full text-sm">
        <tbody className="text-neutral-300">
          {top.map((c, i) => (
            <tr key={c.id} className="border-t border-white/[0.05]">
              <td className="num w-6 py-2 text-xs text-neutral-600">{i + 1}</td>
              <td className="py-2">
                <span className="font-medium text-neutral-200">{c.name}</span>
                {c.city && <span className="ml-2 text-[11px] text-neutral-600">{c.city}</span>}
              </td>
              <td className="num py-2 text-right text-neutral-500">{num(c.order_count)} orders</td>
              <td className="num py-2 text-right font-medium text-orange-400">
                {inr(c.total_spent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ── best send-time heatmap ───────────────────────────────────────── */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SendTimeHeatmap({ cells }: { cells: Insights["heatmap"] }) {
  const grid = new Map(cells.map((c) => [`${c.dow}:${c.hour}`, c.n]));
  const max = Math.max(...cells.map((c) => c.n), 1);
  const best = cells.length
    ? cells.reduce((a, b) => (b.n > a.n ? b : a))
    : null;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="label">Engagement by send time</h2>
        {best && (
          <span className="text-xs text-neutral-500">
            Best window:{" "}
            <span className="text-orange-400">
              {DAYS[best.dow]} {best.hour}:00–{best.hour + 1}:00
            </span>
          </span>
        )}
      </div>
      {cells.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No engagement events yet — launch a campaign to populate this.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* hour labels */}
            <div className="ml-9 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-px text-center">
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} className="text-[9px] text-neutral-600">
                  {h % 3 === 0 ? h : ""}
                </span>
              ))}
            </div>
            {DAYS.map((d, dow) => (
              <div key={d} className="mt-px flex items-center">
                <span className="w-9 shrink-0 text-[10px] text-neutral-500">{d}</span>
                <div className="grid flex-1 grid-cols-[repeat(24,minmax(0,1fr))] gap-px">
                  {Array.from({ length: 24 }, (_, h) => {
                    const n = grid.get(`${dow}:${h}`) ?? 0;
                    const a = n / max;
                    return (
                      <div
                        key={h}
                        title={`${d} ${h}:00 — ${n} engagement event${n === 1 ? "" : "s"}`}
                        className="aspect-square rounded-[2px]"
                        style={{
                          background:
                            n === 0
                              ? "rgba(248,244,238,0.04)"
                              : `rgba(192,135,54,${0.18 + a * 0.82})`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="mt-3 text-[11px] text-neutral-600">
              Opens, reads, clicks and conversions by local hour — darker gold = more engagement.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
