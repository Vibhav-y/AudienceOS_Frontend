"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Campaign } from "@/lib/api";
import { CampaignsSkeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      api.campaigns()
        .then((c) => { if (alive) { setCampaigns(c); setError(null); } })
        .catch((e) => alive && setError(e.message));
    tick();
    const t = setInterval(tick, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (error && !campaigns) return <p className="text-sm text-red-400">{error}</p>;
  if (!campaigns) return <CampaignsSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-none tracking-tight">
        Campaigns
      </h1>
      {campaigns.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No campaigns yet. <Link href="/chat" className="text-orange-400">Plan one →</Link>
        </p>
      ) : (
        <div className="card divide-y divide-white/[0.05] overflow-hidden">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.025]"
            >
              <div className="min-w-0">
                <div className="font-medium text-neutral-100">{c.name}</div>
                <div className="mt-1 truncate text-xs text-neutral-500">
                  <span className="font-semibold uppercase tracking-wide text-neutral-400">{c.channel}</span>
                  {" · "}{(c.audience_count ?? 0).toLocaleString()} recipients
                  {c.message ? <> · “{c.message}”</> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {c.created_at && (
                  <span className="hidden text-xs text-neutral-600 sm:inline">
                    {new Date(c.created_at).toLocaleDateString("en-IN")}
                  </span>
                )}
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
