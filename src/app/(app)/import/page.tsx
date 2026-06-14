"use client";

import { useMemo, useRef, useState } from "react";
import {
  api,
  type CustomerInput,
  type OrderInput,
  type IngestCustomersResult,
  type IngestOrdersResult,
} from "@/lib/api";

/* ─── tiny CSV parser ──────────────────────────────────────────────────
   Handles quoted fields, escaped quotes ("") and commas/newlines inside
   quotes. Good enough for hand-made or exported customer/order files
   without pulling in a dependency. Returns an array of string-keyed rows. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const s = text.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); field = ""; row = []; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length === 0) return [];
  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ─── field specs per entity ───────────────────────────────────────────── */
const CUSTOMER_FIELDS = [
  { key: "name", label: "Name", required: true, placeholder: "Asha Rao" },
  { key: "email", label: "Email", required: true, placeholder: "asha@example.com" },
  { key: "phone", label: "Phone", required: true, placeholder: "+91 98xxxxxx01" },
  { key: "age", label: "Age", required: true, placeholder: "31", type: "number" },
  { key: "city", label: "City", required: true, placeholder: "Pune" },
  { key: "state", label: "State", required: false, placeholder: "Maharashtra" },
  { key: "country", label: "Country", required: false, placeholder: "India" },
  { key: "address", label: "Address", required: false, placeholder: "14 FC Road" },
] as const;

const ORDER_FIELDS = [
  { key: "customer_email", label: "Customer email", required: true, placeholder: "asha@example.com" },
  { key: "amount", label: "Amount", required: true, placeholder: "1499", type: "number" },
  { key: "category", label: "Category", required: true, placeholder: "beauty" },
  { key: "order_date", label: "Order date", required: false, placeholder: "2026-06-01T10:00:00Z" },
  { key: "external_id", label: "External ID", required: false, placeholder: "shopify-1001" },
] as const;

const CUSTOMER_TEMPLATE =
  "name,email,phone,age,city,state,country,address\n" +
  "Asha Rao,asha@example.com,+91 98xxxxxx01,31,Pune,Maharashtra,India,14 FC Road\n";
const ORDER_TEMPLATE =
  "customer_email,amount,category,order_date,external_id\n" +
  "asha@example.com,1499,beauty,2026-06-01T10:00:00Z,shopify-1001\n";

/* ─── row coercion (CSV cells are strings) ─────────────────────────────── */
function toCustomer(r: Record<string, string>): CustomerInput | { error: string } {
  if (!r.name || !r.email || !r.phone || !r.city) return { error: "name, email, phone, city are required" };
  const age = Number(r.age);
  if (!Number.isFinite(age)) return { error: `age "${r.age}" is not a number` };
  const out: CustomerInput = { name: r.name, email: r.email, phone: r.phone, age, city: r.city };
  if (r.state) out.state = r.state;
  if (r.country) out.country = r.country;
  if (r.address) out.address = r.address;
  return out;
}
function toOrder(r: Record<string, string>): OrderInput | { error: string } {
  if (!r.customer_email && !r.customer_id) return { error: "customer_email or customer_id required" };
  if (!r.category) return { error: "category is required" };
  const amount = Number(r.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { error: `amount "${r.amount}" is invalid` };
  const out: OrderInput = { amount, category: r.category };
  if (r.customer_email) out.customer_email = r.customer_email;
  if (r.customer_id) out.customer_id = Number(r.customer_id);
  if (r.order_date) out.order_date = r.order_date;
  if (r.external_id) out.external_id = r.external_id;
  return out;
}

type Entity = "customers" | "orders";

export default function ImportPage() {
  const [entity, setEntity] = useState<Entity>("customers");
  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-none tracking-tight">
          Import data
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Add {entity} one at a time with the form, or upload a CSV to bring in many at once.
          Imports are idempotent — re-uploading the same file is safe.
        </p>
      </div>

      <div className="flex gap-1.5">
        {(["customers", "orders"] as Entity[]).map((e) => (
          <button
            key={e}
            onClick={() => setEntity(e)}
            className={`rounded-lg px-3.5 py-1.5 text-sm capitalize transition ${
              entity === e
                ? "bg-white/[0.08] text-neutral-100 ring-1 ring-white/[0.08]"
                : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {entity === "customers" ? <CustomersPanel /> : <OrdersPanel />}
    </div>
  );
}

/* ─── customers ────────────────────────────────────────────────────────── */
function CustomersPanel() {
  return (
    <>
      <SingleForm
        fields={CUSTOMER_FIELDS}
        submitLabel="Add customer"
        onSubmit={async (v) => {
          const row = toCustomer(v);
          if ("error" in row) throw new Error(row.error);
          const r = await api.ingestCustomers([row]);
          return r.created ? `Added 1 customer.` : `Updated 1 existing customer.`;
        }}
      />
      <CsvUpload
        template={CUSTOMER_TEMPLATE}
        templateName="customers-template.csv"
        columns={CUSTOMER_FIELDS.map((f) => f.key)}
        coerce={toCustomer}
        onSubmit={async (rows) => {
          const r = (await api.ingestCustomers(rows as CustomerInput[])) as IngestCustomersResult;
          return `Imported ${r.ingested} — ${r.created} new, ${r.updated} updated.`;
        }}
      />
    </>
  );
}

/* ─── orders ───────────────────────────────────────────────────────────── */
function OrdersPanel() {
  return (
    <>
      <SingleForm
        fields={ORDER_FIELDS}
        submitLabel="Add order"
        onSubmit={async (v) => {
          const row = toOrder(v);
          if ("error" in row) throw new Error(row.error);
          const r = await api.ingestOrders([row]);
          return r.ingested ? `Added 1 order.` : `Order skipped (duplicate external ID).`;
        }}
      />
      <CsvUpload
        template={ORDER_TEMPLATE}
        templateName="orders-template.csv"
        columns={ORDER_FIELDS.map((f) => f.key)}
        coerce={toOrder}
        onSubmit={async (rows) => {
          const r = (await api.ingestOrders(rows as OrderInput[])) as IngestOrdersResult;
          return `Imported ${r.ingested}${r.deduplicated ? ` — ${r.deduplicated} duplicates skipped` : ""}.`;
        }}
      />
    </>
  );
}

/* ─── single-row form ──────────────────────────────────────────────────── */
function SingleForm({
  fields,
  submitLabel,
  onSubmit,
}: {
  fields: readonly { key: string; label: string; required: boolean; placeholder: string; type?: string }[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<string>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErr(null);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ""),
      );
      const ok = await onSubmit(cleaned);
      setMsg(ok);
      setValues({});
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
        Add one
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-[12px] text-neutral-500">
              {f.label}{f.required && <span className="text-orange-400/80"> *</span>}
            </span>
            <input
              type={f.type ?? "text"}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/[0.1] bg-[#16130d] px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-white/[0.1] bg-gradient-to-b from-orange-400 to-orange-500 px-5 py-2.5 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:from-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {msg && <span className="text-[13px] text-emerald-400">{msg}</span>}
        {err && <span className="text-[13px] text-red-400">{err}</span>}
      </div>
    </form>
  );
}

/* ─── CSV upload ───────────────────────────────────────────────────────── */
function CsvUpload({
  template,
  templateName,
  columns,
  coerce,
  onSubmit,
}: {
  template: string;
  templateName: string;
  columns: readonly string[];
  coerce: (r: Record<string, string>) => unknown | { error: string };
  onSubmit: (rows: unknown[]) => Promise<string>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [raw, setRaw] = useState<Record<string, string>[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate every parsed row up-front so the user sees problems before sending.
  const { valid, errors } = useMemo(() => {
    const valid: unknown[] = [];
    const errors: { row: number; error: string }[] = [];
    raw.forEach((r, i) => {
      const out = coerce(r);
      if (out && typeof out === "object" && "error" in out) errors.push({ row: i + 2, error: (out as { error: string }).error });
      else valid.push(out);
    });
    return { valid, errors };
  }, [raw, coerce]);

  async function onFile(file: File) {
    setResult(null); setError(null); setFileName(file.name);
    try {
      const rows = parseCsv(await file.text());
      if (rows.length === 0) { setError("No rows found in that file."); setRaw([]); return; }
      setRaw(rows);
    } catch {
      setError("Couldn't read that file."); setRaw([]);
    }
  }

  async function submit() {
    setBusy(true); setResult(null); setError(null);
    try {
      setResult(await onSubmit(valid));
      setRaw([]); setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const preview = raw.slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-neutral-400">
          Bulk upload (CSV)
        </span>
        <button
          onClick={() => downloadCsv(templateName, template)}
          className="text-[12px] text-orange-400 transition hover:text-orange-300"
        >
          Download template
        </button>
      </div>

      <p className="mb-3 text-[12px] text-neutral-500">
        Expected columns: <span className="text-neutral-400">{columns.join(", ")}</span>
      </p>

      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/[0.12] bg-black/20 px-4 py-6 text-sm text-neutral-400 transition hover:border-orange-400/40 hover:text-neutral-200">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
        />
        {fileName ? <span className="text-neutral-200">{fileName}</span> : "Click to choose a .csv file"}
      </label>

      {raw.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
            <span className="text-neutral-300">{raw.length} rows parsed</span>
            <span className="text-emerald-400">{valid.length} valid</span>
            {errors.length > 0 && <span className="text-red-400">{errors.length} with errors</span>}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-neutral-500">
                  {columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-white/[0.05]">
                    {columns.map((c) => <td key={c} className="px-3 py-1.5">{r[c] ?? <span className="text-neutral-600">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {raw.length > preview.length && (
            <div className="mt-1 text-[11px] text-neutral-600">…and {raw.length - preview.length} more</div>
          )}

          {errors.length > 0 && (
            <div className="mt-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3 text-[12px] text-red-300">
              {errors.slice(0, 4).map((e) => (
                <div key={e.row}>Row {e.row}: {e.error}</div>
              ))}
              {errors.length > 4 && <div className="text-red-400/70">…and {errors.length - 4} more</div>}
              <div className="mt-1 text-red-400/70">Rows with errors are skipped on import.</div>
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy || valid.length === 0}
            className="mt-4 rounded-xl border border-white/[0.1] bg-gradient-to-b from-orange-400 to-orange-500 px-5 py-2.5 text-sm font-medium text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:from-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Importing…" : `Import ${valid.length} row${valid.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {result && <p className="mt-3 text-[13px] text-emerald-400">{result}</p>}
      {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
