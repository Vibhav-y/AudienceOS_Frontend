"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { api, type CampaignDetail } from "@/lib/api";
import { CampaignDetailSkeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      api
        .campaign(id)
        .then((d) => { if (alive) { setData(d); setError(null); } })
        .catch((e) => alive && setError(e.message));
    tick();
    // poll while callbacks stream in
    const t = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  if (error && !data) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <CampaignDetailSkeleton />;

  const top = data.funnel[0]?.n || 1;

  return (
    <div className="space-y-7">
      <div>
        <Link href="/campaigns" className="text-xs text-neutral-500 transition hover:text-neutral-300">
          ← Campaigns
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-none tracking-tight">
            {data.name}
          </h1>
          <StatusBadge status={data.status} />
        </div>
        <p className="mt-2.5 text-sm text-neutral-400">
          <span className="font-semibold uppercase tracking-wide text-neutral-300">{data.channel}</span>
          {" · "}{data.message}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Attributed orders" value={data.attributed_orders.toLocaleString()} />
        <Metric label="Attributed revenue" value={`₹${data.attributed_revenue.toLocaleString()}`} accent />
        <Metric label="Failed" value={data.failed.toLocaleString()} />
      </section>

      <section className="card p-6">
        <h2 className="label">Conversion funnel</h2>
        <div className="mt-5 space-y-3.5">
          {data.funnel.map((f) => (
            <div key={f.stage}>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="capitalize text-neutral-400">{f.stage}</span>
                <span className="num text-neutral-200">{f.n.toLocaleString()}</span>
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
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
            </span>
            Live · refreshes every 2s
          </span>
          {(data.duplicates > 0 || data.out_of_order > 0) && (
            <span title="The channel simulator deliberately duplicates and reorders callbacks; the receipt state machine absorbs them.">
              <span className="num text-neutral-400">{data.duplicates}</span> duplicate callback{data.duplicates === 1 ? "" : "s"} ignored ·{" "}
              <span className="num text-neutral-400">{data.out_of_order}</span> out-of-order event{data.out_of_order === 1 ? "" : "s"} handled
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card card-hover p-5">
      <div className="label">{label}</div>
      <div className={`num mt-2 text-[30px] font-semibold leading-none ${accent ? "bg-gradient-to-b from-orange-300 to-orange-500 bg-clip-text text-transparent" : "text-neutral-50"}`}>
        {value}
      </div>
    </div>
  );
}
