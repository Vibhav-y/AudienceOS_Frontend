// Campaign list building blocks: summary strip, mini funnel, and the card.
import Link from "next/link";
import type { Campaign } from "@/lib/api";
import { inr, num, dateShort } from "@/lib/format";
import { StatusBadge } from "@/components/status";
import { ChannelIcon } from "@/components/channel-icon";

/** Aggregate strip above the campaign grid. */
export function StatStrip({ campaigns }: { campaigns: Campaign[] }) {
  const live = campaigns.filter((c) => c.status === "launched").length;
  const reach = campaigns.reduce((a, c) => a + (c.audience_count ?? 0), 0);
  const revenue = campaigns.reduce((a, c) => a + (c.revenue ?? 0), 0);
  const items = [
    { label: "Campaigns", value: num(campaigns.length) },
    { label: "Live now", value: num(live) },
    { label: "Total reach", value: num(reach) },
    { label: "Attributed revenue", value: inr(revenue), accent: true },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5"
        >
          <div className="text-[11px] uppercase tracking-wider text-neutral-500">{s.label}</div>
          <div
            className={`mt-1 text-xl font-semibold tabular-nums ${
              s.accent ? "text-orange-400" : "text-neutral-100"
            }`}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact funnel bar: delivered and converted as proportions of sent. */
export function MiniFunnel({ c }: { c: Campaign }) {
  const sent = c.sent ?? 0;
  if (sent === 0) return <div className="text-[12px] text-neutral-600">Not launched yet</div>;
  const delivered = c.delivered ?? 0;
  const converted = c.converted ?? 0;
  const convRate = ((converted / sent) * 100).toFixed(1);
  const pct = (n: number) => `${Math.min(100, (n / sent) * 100)}%`;
  return (
    <div className="space-y-2">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-500/40"
          style={{ width: pct(delivered) }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-orange-400"
          style={{ width: pct(converted) }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] tabular-nums text-neutral-500">
        <span>{num(sent)} sent</span>
        <span>{num(delivered)} delivered</span>
        <span className="text-orange-400">{convRate}% conv</span>
      </div>
    </div>
  );
}

/** One campaign in the grid — links to its detail page. */
export function CampaignCard({ c }: { c: Campaign }) {
  return (
    <Link
      href={`/campaigns/${c.id}`}
      className="group flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.035]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] text-neutral-500">
            <span className="text-neutral-400">
              <ChannelIcon channel={c.channel} />
            </span>
            <span className="font-semibold uppercase tracking-wide">{c.channel}</span>
          </div>
          <h3 className="mt-1.5 truncate font-medium text-neutral-100 group-hover:text-white">
            {c.name}
          </h3>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {c.message && (
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">{c.message}</p>
      )}

      <div className="mt-4 flex-1" />

      <div className="mb-3 flex items-center justify-between text-[12px] text-neutral-500">
        <span>{num(c.audience_count)} recipients</span>
        {(c.revenue ?? 0) > 0 && (
          <span className="font-medium text-orange-400">{inr(c.revenue ?? 0)}</span>
        )}
      </div>

      <MiniFunnel c={c} />

      {c.created_at && (
        <div className="mt-3 text-[11px] text-neutral-600">{dateShort(c.created_at)}</div>
      )}
    </Link>
  );
}
