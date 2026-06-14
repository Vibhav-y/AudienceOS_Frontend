"use client";

// Shared "add a coupon" form — used on the Coupons page and inside the chat
// composer's quick-add card. Calls the API itself and reports the result up.
import { useState } from "react";
import { api, type Coupon } from "@/lib/api";

const inputCls =
  "rounded-xl border border-white/[0.1] bg-[#16130d] px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60";

export function CouponForm({
  onAdded,
  compact,
}: {
  onAdded?: (c: Coupon) => void;
  compact?: boolean;
}) {
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const v = Number(value);
    if (!code.trim() || !Number.isFinite(v) || v <= 0) {
      setError("enter a code and a positive value");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.addCoupon({
        code: code.trim().toUpperCase(),
        kind,
        value: v,
        description: description.trim() || undefined,
      });
      setCode("");
      setValue("");
      setDescription("");
      onAdded?.(created);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-[1fr_auto_auto]"}`}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="CODE (e.g. COMEBACK15)"
          className={`${inputCls} font-mono tracking-wide ${compact ? "col-span-2" : ""}`}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "percent" | "flat")}
          className={inputCls}
        >
          <option value="percent">% off</option>
          <option value="flat">₹ off</option>
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={kind === "percent" ? "15" : "500"}
          inputMode="decimal"
          className={`${inputCls} ${compact ? "" : "w-24"}`}
        />
      </div>
      <div className="flex gap-2">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Note (optional) — e.g. win-back offer"
          className={`${inputCls} flex-1`}
        />
        <button
          onClick={submit}
          disabled={busy}
          className="btn-primary rounded-xl px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/** Small pill rendering of one coupon, with an optional delete action. */
export function CouponPill({
  c,
  onDelete,
}: {
  c: Coupon;
  onDelete?: (id: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/[0.07] py-1 pl-3 pr-2 text-xs">
      <span className="font-mono font-semibold tracking-wide text-orange-300">{c.code}</span>
      <span className="text-neutral-400">
        {c.kind === "percent" ? `${c.value}% off` : `₹${c.value} off`}
      </span>
      {onDelete && (
        <button
          onClick={() => onDelete(c.id)}
          title="Delete coupon"
          className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-500 transition hover:bg-white/[0.08] hover:text-red-400"
        >
          ×
        </button>
      )}
    </span>
  );
}
