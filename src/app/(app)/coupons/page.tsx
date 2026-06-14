"use client";

import { useEffect, useState } from "react";
import { api, type Coupon } from "@/lib/api";
import { PageTitle, ErrorText } from "@/components/ui";
import { CouponForm } from "@/components/coupon-form";
import { dateShort } from "@/lib/format";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.coupons().then(setCoupons).catch((e) => setError(e.message));
  }, []);

  async function remove(id: number) {
    try {
      await api.deleteCoupon(id);
      setCoupons((cs) => (cs ?? []).filter((c) => c.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !coupons) return <ErrorText>{error}</ErrorText>;

  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <PageTitle>Coupons</PageTitle>
        <p className="mt-2 text-sm text-neutral-400">
          Codes the AI strategist may offer when drafting discounts. It only
          ever uses codes from this list — never invented ones.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="label">Add a coupon</h2>
        <div className="mt-4">
          <CouponForm onAdded={(c) => setCoupons((cs) => [c, ...(cs ?? [])])} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="label">Active coupons</h2>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        {!coupons ? (
          <p className="mt-4 text-sm text-neutral-600">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No coupons yet — add one above and the agent can start offering it
            in campaign copy.
          </p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="label pb-2.5 font-semibold">Code</th>
                <th className="label pb-2.5 font-semibold">Discount</th>
                <th className="label pb-2.5 font-semibold">Note</th>
                <th className="label pb-2.5 font-semibold">Added</th>
                <th className="pb-2.5" />
              </tr>
            </thead>
            <tbody className="text-neutral-300">
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-white/[0.05]">
                  <td className="py-2.5 font-mono font-semibold tracking-wide text-orange-300">
                    {c.code}
                  </td>
                  <td className="num py-2.5">
                    {c.kind === "percent" ? `${c.value}% off` : `₹${c.value} off`}
                  </td>
                  <td className="py-2.5 text-neutral-500">{c.description ?? "—"}</td>
                  <td className="py-2.5 text-xs text-neutral-600">
                    {c.created_at ? dateShort(c.created_at) : "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => remove(c.id)}
                      className="rounded-lg px-2.5 py-1 text-xs text-neutral-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
