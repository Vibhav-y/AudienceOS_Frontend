"use client";

// usePoll — the one polling flow for every live page.
//
// Fetches immediately, then re-fetches every `ms` while the tab is visible
// (hidden tabs don't hammer the API), refreshes the moment the tab returns,
// and keeps the last good data through transient failures so a blip never
// wipes the screen.
import { useEffect, useState } from "react";

export function usePoll<T>(
  fetcher: () => Promise<T>,
  ms: number,
  deps: unknown[] = [],
): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      fetcher()
        .then((d) => {
          if (alive) {
            setData(d);
            setError(null);
          }
        })
        .catch((e) => alive && setError((e as Error).message));

    tick();
    const t = setInterval(() => {
      if (!document.hidden) tick();
    }, ms);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error };
}
