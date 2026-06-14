// Small shared UI primitives used across app pages.
import type { ReactNode } from "react";

/** Serif page heading, consistent across Dashboard / Campaigns / Settings. */
export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-[family-name:var(--font-serif)] text-[34px] leading-none tracking-tight">
      {children}
    </h1>
  );
}

/** KPI / metric tile. `accent` renders the value in the brand gradient. */
export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card card-hover p-5">
      <div className="label">{label}</div>
      <div
        className={`num mt-2 text-[30px] font-semibold leading-none ${
          accent
            ? "bg-gradient-to-b from-orange-300 to-orange-500 bg-clip-text text-transparent"
            : "text-neutral-50"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** Pulsing "live" indicator dot. */
export function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" />
    </span>
  );
}

/** Inline error line, consistent styling. */
export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-red-400">{children}</p>;
}

export interface FunnelStage {
  stage: string;
  n: number;
}

/**
 * Horizontal funnel bars. Bars scale against the largest stage; `showPct`
 * additionally prints each stage as a % of the first stage (sent).
 */
export function FunnelBars({
  funnel,
  showPct = false,
}: {
  funnel: FunnelStage[];
  showPct?: boolean;
}) {
  const sent = funnel[0]?.n || 0;
  const top = Math.max(...funnel.map((f) => f.n), 1);
  return (
    <div className="space-y-3.5">
      {funnel.map((f) => (
        <div key={f.stage}>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="capitalize text-neutral-400">{f.stage}</span>
            <span className="num text-neutral-200">
              {f.n.toLocaleString()}
              {showPct && (
                <span className="num ml-2 text-neutral-600">
                  {sent ? Math.round((f.n / sent) * 100) : 0}%
                </span>
              )}
            </span>
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
  );
}
