import { useState, useEffect, useCallback } from "react";
import type { PortfolioSummary, Holding, AddHoldingRequest, ApiError, PortfolioLog } from "@/types";
import { apiClient } from "@/services/api";
import { mockPortfolioSummary, mockLogs } from "@/services/mock-data";

function isDemoSession() {
  return localStorage.getItem("auth_token") === "demo-token";
}

function normalizeLogId(log: PortfolioLog & { _id?: string }): PortfolioLog {
  return { ...log, id: log.id || log._id || "" };
}

type TopCoinRow = { id: string; image: string | null };

/** Coin id → image URL from /market/top (CoinGecko), for holdings avatars. */
async function fetchCoinIconMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await apiClient.get<TopCoinRow[]>("/market/top?limit=250");
    for (const row of rows) {
      if (row.image) map.set(row.id, row.image);
    }
  } catch {
    // offline / demo: holdings still work without icons
  }
  return map;
}

export function usePortfolio() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [recentJournalTrades, setRecentJournalTrades] = useState<PortfolioLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [portfolio, iconByCoinId] = await Promise.all([
        apiClient.get<{
          _id: string;
          id?: string;
          name: string;
          holdings: Array<{
            _id: string;
            coinId: string;
            symbol: string | null;
            name: string | null;
            quantity: number;
            buyPrice: number;
          }>;
        }>("/portfolio"),
        fetchCoinIconMap(),
      ]);

      const priced = await Promise.all(
        portfolio.holdings.map(async (h) => {
          try {
            const price = await apiClient.get<{
              price: number | null;
              change24h: number | null;
            }>(`/market/price/${h.coinId}`);
            const currentPrice = price.price ?? 0;
            const pct = price.change24h;
            const deltaUsd =
              pct != null && Number.isFinite(pct) && currentPrice > 0
                ? h.quantity * currentPrice * (pct / 100)
                : 0;
            return { holding: h, currentPrice, deltaUsd };
          } catch {
            return { holding: h, currentPrice: 0, deltaUsd: 0 };
          }
        })
      );

      const holdingsWithPrice = priced.map((p) => ({ ...p.holding, currentPrice: p.currentPrice }));

      const totalValue = holdingsWithPrice.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
      const totalCost = holdingsWithPrice.reduce((sum, h) => sum + h.quantity * h.buyPrice, 0);
      const totalPnl = totalValue - totalCost;
      const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

      const change24h = priced.reduce((sum, p) => sum + p.deltaUsd, 0);
      const priorApprox = totalValue - change24h;
      const change24hPercent = priorApprox > 0 ? (change24h / priorApprox) * 100 : 0;

      const holdings: Holding[] = holdingsWithPrice.map((h) => {
        const value = h.quantity * h.currentPrice;
        const invested = h.quantity * h.buyPrice;
        const pnl = value - invested;
        const icon = iconByCoinId.get(h.coinId);
        return {
          id: h._id,
          _id: h._id,
          coinId: h.coinId,
          symbol: h.symbol,
          name: h.name,
          amount: h.quantity,
          avgBuyPrice: h.buyPrice,
          currentPrice: h.currentPrice,
          value,
          pnl,
          pnlPercent: invested > 0 ? (pnl / invested) * 100 : 0,
          allocation: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(2)) : 0,
          ...(icon ? { icon } : {}),
        };
      });

      let trades: PortfolioLog[] = [];
      try {
        // Use repeated actionTypes so Express parses as an array (comma-separated can fail or parse oddly).
        const qs = new URLSearchParams();
        qs.set("page", "1");
        qs.set("pageSize", "25");
        qs.append("actionTypes", "buy");
        qs.append("actionTypes", "sell");
        const jr = await apiClient.getWithMeta<PortfolioLog[]>(`/portfolio/logs?${qs.toString()}`);
        const rows = Array.isArray(jr.data) ? jr.data : [];
        trades = rows.map((log) => normalizeLogId(log as PortfolioLog & { _id?: string }));
      } catch {
        trades = [];
      }

      setSummary({
        id: portfolio.id ?? portfolio._id,
        name: portfolio.name,
        totalValue,
        totalPnl,
        totalPnlPercent,
        change24h,
        change24hPercent,
        holdings,
      });
      setRecentJournalTrades(trades);
    } catch (err) {
      if (isDemoSession()) {
        let demoSummary = mockPortfolioSummary;
        try {
          const iconMap = await fetchCoinIconMap();
          demoSummary = {
            ...mockPortfolioSummary,
            holdings: mockPortfolioSummary.holdings.map((h) => {
              const icon = iconMap.get(h.coinId);
              return icon ? { ...h, icon } : h;
            }),
          };
        } catch {
          /* keep mock without icons */
        }
        setSummary(demoSummary);
        setRecentJournalTrades(
          mockLogs
            .filter((l) => l.actionType === "buy" || l.actionType === "sell")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        );
        setError(null);
      } else {
        setSummary(null);
        setRecentJournalTrades([]);
        const apiErr = err as ApiError;
        setError(apiErr?.message ?? "Could not load portfolio. Is the API running?");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const addHolding = async (_data: AddHoldingRequest) => {
    await apiClient.post("/portfolio/holdings", {
      coinId: _data.coinId,
      quantity: _data.amount,
      buyPrice: _data.avgBuyPrice,
      symbol: _data.symbol,
      name: _data.name,
    });
    await fetchPortfolio();
  };

  return { summary, recentJournalTrades, isLoading, error, fetchPortfolio, addHolding };
}
