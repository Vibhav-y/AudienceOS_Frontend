"use client";

import { useEffect, useState } from "react";
import { api, type AppSettings } from "@/lib/api";

// Each configurable threshold. `step`/`min`/`max` mirror the backend bounds.
const FIELDS: {
  key: keyof Omit<AppSettings, "updated_at">;
  label: string;
  help: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "dormant_days",
    label: "Dormant after",
    help: "Days since a customer's last order before the agent treats them as dormant / lapsed.",
    unit: "days",
    min: 1,
    max: 3650,
    step: 1,
  },
  {
    key: "high_value_spend",
    label: "High-value spend",
    help: "Minimum lifetime spend for a customer to count as high-value / VIP.",
    unit: "total spent",
    min: 0,
    max: 100_000_000,
    step: 100,
  },
  {
    key: "loyal_order_count",
    label: "Loyal order count",
    help: "Minimum number of orders for a customer to count as loyal / repeat.",
    unit: "orders",
    min: 1,
    max: 10_000,
    step: 1,
  },
];

export default function SettingsPage() {
  const [form, setForm] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState<AppSettings | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;
    api.settings()
      .then((s) => { if (alive) { setForm(s); setSaved(s); } })
      .catch((e) => alive && setLoadErr(e.message));
    return () => { alive = false; };
  }, []);

  const dirty =
    !!form && !!saved &&
    FIELDS.some((f) => Number(form[f.key]) !== Number(saved[f.key]));

  function set(key: keyof AppSettings, value: string) {
    setOk(false);
    setForm((f) => (f ? { ...f, [key]: value === "" ? "" : Number(value) } : f));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setSaveErr(null);
    setOk(false);
    try {
      const next = await api.saveSettings({
        dormant_days: Number(form.dormant_days),
        high_value_spend: Number(form.high_value_spend),
        loyal_order_count: Number(form.loyal_order_count),
      });
      setForm(next);
      setSaved(next);
      setOk(true);
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loadErr) return <p className="text-sm text-red-400">{loadErr}</p>;
  if (!form) return <p className="text-sm text-neutral-500">Loading settings…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-none tracking-tight">
          Settings
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          These thresholds define what plain-language segments mean. The AI agent
          uses them when you ask it to reach “dormant”, “high-value”, or “loyal”
          customers — so those words map to your numbers, not its guesses.
        </p>
      </div>

      <div className="space-y-3">
        {FIELDS.map((f) => (
          <div
            key={f.key}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <label htmlFor={f.key} className="text-[15px] font-medium text-neutral-100">
                  {f.label}
                </label>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">{f.help}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <input
                  id={f.key}
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={form[f.key] as number | string}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-32 rounded-xl border border-white/[0.1] bg-[#16130d] px-3 py-2 text-right text-sm tabular-nums text-neutral-100 outline-none transition focus:border-orange-400/60"
                />
                <span className="w-20 text-[12px] text-neutral-600">{f.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="rounded-xl border border-white/[0.1] bg-gradient-to-b from-orange-400 to-orange-500 px-5 py-2.5 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:from-orange-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:from-white/[0.05] disabled:to-white/[0.02] disabled:text-neutral-500"
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
        {ok && !dirty && <span className="text-[13px] text-emerald-400">Settings saved.</span>}
        {saveErr && <span className="text-[13px] text-red-400">{saveErr}</span>}
      </div>
    </div>
  );
}
