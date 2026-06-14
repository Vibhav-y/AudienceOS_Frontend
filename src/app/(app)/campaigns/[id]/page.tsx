"use client";

import { use, useState } from "react";
import Link from "next/link";
import { api, type CampaignDetail } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { num, inr } from "@/lib/format";
import { CampaignDetailSkeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status";
import { PageTitle, StatCard, LiveDot, ErrorText, FunnelBars } from "@/components/ui";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // Poll while callbacks stream in (usePoll pauses when the tab is hidden).
  const { data, error } = usePoll<CampaignDetail>(() => api.campaign(id), 2000, [id]);
  const [launching, setLaunching] = useState(false);
  const [launchErr, setLaunchErr] = useState<string | null>(null);

  async function launch() {
    setLaunching(true);
    setLaunchErr(null);
    try {
      await api.launch(Number(id));
    } catch (e) {
      setLaunchErr((e as Error).message);
    } finally {
      setLaunching(false);
    }
  }

  if (error && !data) return <ErrorText>{error}</ErrorText>;
  if (!data) return <CampaignDetailSkeleton />;

  const launchable = data.status === "draft" || data.status === "approved";

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/campaigns"
          className="text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          ← Campaigns
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <PageTitle>{data.name}</PageTitle>
          <StatusBadge status={data.status} />
          {launchable && (
            <button
              onClick={launch}
              disabled={launching}
              className="ml-auto rounded-xl border border-white/[0.1] bg-gradient-to-b from-orange-400 to-orange-500 px-4 py-2 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:from-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {launching ? "Launching…" : `Launch to ${num(data.audience_count)}`}
            </button>
          )}
        </div>
        <p className="mt-2.5 text-sm text-neutral-400">
          <span className="font-semibold uppercase tracking-wide text-neutral-300">
            {data.channel}
          </span>
          {" · "}
          {data.message}
        </p>
        {data.status === "draft" && (
          <p className="mt-2 text-xs text-neutral-500">
            This campaign is saved as a draft — it hasn&rsquo;t sent anything yet. Launch it when
            you&rsquo;re ready.
          </p>
        )}
        {data.status === "launched" && (data.funnel[0]?.n ?? 0) === 0 && (
          <p className="mt-2 flex items-center gap-2 text-xs text-orange-300">
            <LiveDot />
            Sending to {num(data.audience_count)} recipients — results appear here as they arrive.
          </p>
        )}
        {launchErr && <p className="mt-2 text-xs text-red-400">{launchErr}</p>}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Attributed orders" value={num(data.attributed_orders)} />
        <StatCard label="Attributed revenue" value={inr(data.attributed_revenue)} accent />
        <StatCard label="Failed" value={num(data.failed)} />
      </section>

      <section className="card p-6">
        <h2 className="label">Conversion funnel</h2>
        <div className="mt-5">
          <FunnelBars funnel={data.funnel} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
          <span className="flex items-center gap-2">
            <LiveDot />
            Live · refreshes every 2s
          </span>
          {(data.duplicates > 0 || data.out_of_order > 0) && (
            <span title="The channel simulator deliberately duplicates and reorders callbacks; the receipt state machine absorbs them.">
              <span className="num text-neutral-400">{data.duplicates}</span> duplicate callback
              {data.duplicates === 1 ? "" : "s"} ignored ·{" "}
              <span className="num text-neutral-400">{data.out_of_order}</span> out-of-order event
              {data.out_of_order === 1 ? "" : "s"} handled
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
