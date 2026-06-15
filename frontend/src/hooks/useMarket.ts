import { useState, useEffect, useCallback } from "react";
import type { Coin, CoinDetail, TimeRange } from "@/types";
import { apiClient } from "@/services/api";
import { mockCoins } from "@/services/mock-data";

type TopCoinRow = {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  change7d: number;
  marketCapRank: number;
  sparkline: number[];
};

export function useMarket() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof Coin>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchCoins = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<TopCoinRow[]>("/market/top?limit=250");
      const mapped: Coin[] = data.map((c) => ({
        id: c.id,
        symbol: c.symbol,
        name: c.name,
        icon: c.image ?? undefined,
        price: c.price,
        marketCap: c.marketCap,
        volume24h: c.volume24h,
        change24h: c.change24h,
        change7d: c.change7d,
        rank: c.marketCapRank,
        sparkline: Array.isArray(c.sparkline) && c.sparkline.length > 0 ? c.sparkline : undefined,
      }));
      setCoins(mapped);
    } catch {
      setCoins(mockCoins);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCoins();
  }, [fetchCoins]);

  const filtered = coins
    .filter((c) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.symbol.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return 0;
    });

  const toggleSort = (key: keyof Coin) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return {
    coins: filtered,
    allCoins: coins,
    isLoading,
    error,
    search,
    setSearch,
    sortBy,
    sortDir,
    toggleSort,
    refetch: fetchCoins,
  };
}

const rangeToQuery: Record<TimeRange, "1d" | "7d" | "30d" | "90d"> = {
  "1d": "1d",
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  "1y": "90d",
  all: "90d",
};

function syntheticHistoryFromListCoin(c: Coin, points = 30): CoinDetail["priceHistory"] {
  const base = c.price;
  const spark = c.sparkline;
  if (spark && spark.length >= 2) {
    return spark.map((price, i) => ({
      timestamp: Date.now() - (spark.length - 1 - i) * 86400000,
      price,
    }));
  }
  return Array.from({ length: points }, (_, i) => ({
    timestamp: Date.now() - (points - 1 - i) * 86400000,
    price: base * (0.92 + (i / (points - 1)) * 0.16),
  }));
}

export function useCoinDetail(coinId: string | undefined, listCoin?: Coin | null) {
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

  useEffect(() => {
    if (!coinId) {
      setCoin(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setCoin(null);
    setIsLoading(true);
    const rangeParam = rangeToQuery[timeRange] ?? "7d";
    const row = listCoin;

    Promise.all([
      apiClient.get<{
        id: string;
        currency: string;
        price: number | null;
        marketCap: number | null;
        volume24h: number | null;
        change24h: number | null;
      }>(`/market/price/${coinId}`),
      apiClient.get<{
        coinId: string;
        range: string;
        prices: Array<{ timestamp: string; price: number }>;
      }>(`/market/history/${coinId}?range=${rangeParam}`),
    ])
      .then(([price, history]) => {
        if (cancelled) return;
        setCoin({
          id: coinId,
          symbol: row?.symbol ?? price.id,
          name: row?.name ?? price.id,
          icon: row?.icon,
          price: price.price ?? 0,
          marketCap: price.marketCap ?? 0,
          volume24h: price.volume24h ?? 0,
          change24h: price.change24h ?? 0,
          change7d: row?.change7d ?? 0,
          rank: row?.rank ?? 0,
          ath: 0,
          athDate: "",
          atl: 0,
          atlDate: "",
          circulatingSupply: 0,
          totalSupply: 0,
          priceHistory: history.prices.map((p) => ({
            timestamp: new Date(p.timestamp).getTime(),
            price: p.price,
          })),
        });
      })
      .catch(() => {
        if (cancelled) return;
        const found = mockCoins.find((c) => c.id === coinId);
        if (found) {
          setCoin({
            ...found,
            ath: found.price * 1.4,
            athDate: "",
            atl: found.price * 0.2,
            atlDate: "",
            circulatingSupply: 0,
            totalSupply: 0,
            priceHistory: Array.from({ length: 30 }, (_, i) => ({
              timestamp: Date.now() - (29 - i) * 86400000,
              price: found.price * (0.9 + Math.random() * 0.2),
            })),
          });
          return;
        }
        if (row && row.id === coinId) {
          setCoin({
            ...row,
            ath: row.price * 1.4,
            athDate: "",
            atl: row.price * 0.2,
            atlDate: "",
            circulatingSupply: 0,
            totalSupply: 0,
            priceHistory: syntheticHistoryFromListCoin(row),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coinId, timeRange, listCoin?.id]);

  return { coin, isLoading, timeRange, setTimeRange };
}
