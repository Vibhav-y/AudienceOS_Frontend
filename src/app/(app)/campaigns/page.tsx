"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api, type Campaign } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";
import { CampaignsSkeleton } from "@/components/skeleton";
import { PageTitle, ErrorText } from "@/components/ui";
import { StatStrip, CampaignCard } from "@/components/campaign-card";

type SortKey = "recent" | "name" | "audience" | "revenue";
const STATUS_TABS = ["all", "draft", "approved", "launched", "done"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function CampaignsPage() {
  const { data: campaigns, error } = usePoll<Campaign[]>(api.campaigns, 5000);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: campaigns?.length ?? 0 };
    for (const c of campaigns ?? []) m[c.status] = (m[c.status] ?? 0) + 1;
    return m;
  }, [campaigns]);

  const visible = useMemo(() => {
    let rows = campaigns ?? [];
    if (tab !== "all") rows = rows.filter((c) => c.status === tab);
    const needle = q.trim().toLowerCase();
    if (needle)
      rows = rows.filter(
        (c) =>
          c.name?.toLowerCase().includes(needle) ||
          c.message?.toLowerCase().includes(needle),
      );
    const sorted = [...rows];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name":
          return (a.name ?? "").localeCompare(b.name ?? "");
        case "audience":
          return (b.audience_count ?? 0) - (a.audience_count ?? 0);
        case "revenue":
          return (b.revenue ?? 0) - (a.revenue ?? 0);
        default:
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }
    });
    return sorted;
  }, [campaigns, tab, q, sort]);

  if (error && !campaigns) return <ErrorText>{error}</ErrorText>;
  if (!campaigns) return <CampaignsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <PageTitle>Campaigns</PageTitle>
        <Link
          href="/chat"
          className="rounded-xl border border-white/[0.1] bg-gradient-to-b from-orange-400 to-orange-500 px-4 py-2 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:from-orange-300"
        >
          + New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No campaigns yet.{" "}
          <Link href="/chat" className="text-orange-400">
            Plan one →
          </Link>
        </p>
      ) : (
        <>
          <StatStrip campaigns={campaigns} />

          {/* controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] capitalize transition ${
                    tab === t
                      ? "bg-white/[0.08] text-neutral-100 ring-1 ring-white/[0.08]"
                      : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300"
                  }`}
                >
                  {t}
                  {counts[t] ? <span className="ml-1.5 text-neutral-600">{counts[t]}</span> : null}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search campaigns…"
                className="w-full rounded-xl border border-white/[0.1] bg-[#16130d] px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60 sm:w-48"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-xl border border-white/[0.1] bg-[#16130d] px-3 py-2 text-sm text-neutral-300 outline-none focus:border-orange-400/60"
              >
                <option value="recent">Newest</option>
                <option value="name">Name</option>
                <option value="audience">Audience</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>

          {/* grid */}
          {visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-600">
              No campaigns match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((c) => (
                <CampaignCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
