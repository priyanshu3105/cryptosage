import { useEffect, useState } from "react";
import { fetchTopCoins } from "./market.api";
import type { MarketTopResponse } from "./market.types";

export function useMarket(limit = 50) {
  const [data, setData] = useState<MarketTopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchTopCoins(limit);
        if (!alive) return;
        setData(res);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load market data");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [limit]);

  return { data, loading, error };
}