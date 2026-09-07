import { useState, useEffect, useCallback } from "react";
import type { PortfolioSummary, Holding, AddHoldingRequest, ApiError, PortfolioLog } from "@/types";
import { apiClient } from "@/services/api";

function normalizeLogId(log: PortfolioLog & { _id?: string }): PortfolioLog {
  return { ...log, id: log.id || log._id || "" };
}

type TopCoinRow = {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  price: number;
  change24h: number;
};

type MarketQuote = {
  price: number;
  change24h: number | null;
  image?: string;
};

type PriceSource = Holding["priceSource"];

function isUsablePrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

async function fetchMarketSnapshot(): Promise<{
  byId: Map<string, MarketQuote>;
  bySymbol: Map<string, MarketQuote>;
}> {
  const byId = new Map<string, MarketQuote>();
  const bySymbol = new Map<string, MarketQuote>();
  try {
    const rows = await apiClient.get<TopCoinRow[]>("/market/top?limit=250");
    for (const row of rows) {
      if (!isUsablePrice(row.price)) continue;
      const quote: MarketQuote = {
        price: row.price,
        change24h: Number.isFinite(row.change24h) ? row.change24h : null,
        image: row.image ?? undefined,
      };
      byId.set(row.id, quote);
      const symbol = (row.symbol ?? "").trim().toLowerCase();
      if (symbol && !bySymbol.has(symbol)) bySymbol.set(symbol, quote);
    }
  } catch {
    // Snapshot is optional; live + journal fallbacks still apply.
  }
  return { byId, bySymbol };
}

function lastJournalPrice(coinId: string, symbol: string | null, trades: PortfolioLog[]): number | null {
  const id = coinId.trim().toLowerCase();
  const sym = (symbol ?? "").trim().toLowerCase();
  for (const log of trades) {
    if (log.actionType !== "buy" && log.actionType !== "sell") continue;
    if (!isUsablePrice(log.price)) continue;
    const logId = (log.coinId ?? "").trim().toLowerCase();
    const logSym = (log.symbol ?? "").trim().toLowerCase();
    if ((id && logId === id) || (sym && logSym === sym)) return log.price;
  }
  return null;
}

async function fetchLiveQuote(coinId: string): Promise<MarketQuote | null> {
  try {
    const price = await apiClient.get<{ price: number | null; change24h: number | null }>(
      `/market/price/${encodeURIComponent(coinId)}`
    );
    if (!isUsablePrice(price.price)) return null;
    return {
      price: price.price,
      change24h: price.change24h != null && Number.isFinite(price.change24h) ? price.change24h : null,
    };
  } catch {
    return null;
  }
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
      const [portfolio, market, journalResult] = await Promise.all([
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
        fetchMarketSnapshot(),
        (async () => {
          try {
            const qs = new URLSearchParams();
            qs.set("page", "1");
            qs.set("pageSize", "50");
            qs.append("actionTypes", "buy");
            qs.append("actionTypes", "sell");
            const jr = await apiClient.getWithMeta<PortfolioLog[]>(`/portfolio/logs?${qs.toString()}`);
            return Array.isArray(jr.data) ? jr.data.map((log) => normalizeLogId(log as PortfolioLog & { _id?: string })) : [];
          } catch {
            return [] as PortfolioLog[];
          }
        })(),
      ]);

      const trades = journalResult;

      const priced = await Promise.all(
        portfolio.holdings.map(async (h) => {
          const qty = Number(h.quantity) || 0;
          const avg = Number(h.buyPrice) || 0;
          const symbol = h.symbol ?? null;
          const fromTop =
            market.byId.get(h.coinId) ??
            (symbol ? market.bySymbol.get(symbol.toLowerCase()) : undefined);

          let source: PriceSource = "unavailable";
          let currentPrice: number | null = null;
          let change24h: number | null = null;
          let icon = fromTop?.image ?? market.byId.get(h.coinId)?.image;

          if (fromTop) {
            source = "market";
            currentPrice = fromTop.price;
            change24h = fromTop.change24h;
            icon = fromTop.image ?? icon;
          } else {
            const live = await fetchLiveQuote(h.coinId);
            if (live) {
              source = "live";
              currentPrice = live.price;
              change24h = live.change24h;
            } else {
              const journalPx = lastJournalPrice(h.coinId, symbol, trades);
              if (journalPx != null) {
                source = "journal";
                currentPrice = journalPx;
              }
            }
          }

          const pricedOk = currentPrice != null && currentPrice > 0;
          const value = pricedOk ? qty * currentPrice : 0;
          const invested = qty * avg;
          const deltaUsd =
            pricedOk && change24h != null && Number.isFinite(change24h)
              ? value * (change24h / 100)
              : 0;

          return {
            holding: h,
            qty,
            avg,
            currentPrice,
            source,
            value,
            invested,
            deltaUsd,
            includeInTotals: pricedOk,
            icon,
          };
        })
      );

      const valued = priced.filter((p) => p.includeInTotals);
      const totalValue = valued.reduce((sum, p) => sum + p.value, 0);
      const totalCost = valued.reduce((sum, p) => sum + p.invested, 0);
      const totalPnl = totalValue - totalCost;
      const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
      const change24h = valued.reduce((sum, p) => sum + p.deltaUsd, 0);
      const priorApprox = totalValue - change24h;
      const change24hPercent = priorApprox > 0 ? (change24h / priorApprox) * 100 : 0;

      const holdings: Holding[] = priced.map((p) => {
        const live = p.currentPrice ?? 0;
        const pnl = p.includeInTotals ? p.value - p.invested : 0;
        return {
          id: p.holding._id,
          _id: p.holding._id,
          coinId: p.holding.coinId,
          symbol: p.holding.symbol,
          name: p.holding.name,
          amount: p.qty,
          avgBuyPrice: p.avg,
          currentPrice: live,
          value: p.includeInTotals ? p.value : 0,
          invested: p.invested,
          pnl,
          pnlPercent: p.includeInTotals && p.invested > 0 ? (pnl / p.invested) * 100 : 0,
          allocation:
            p.includeInTotals && totalValue > 0
              ? Number(((p.value / totalValue) * 100).toFixed(2))
              : 0,
          priceSource: p.source,
          ...(p.icon ? { icon: p.icon } : {}),
        };
      });

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
      setSummary(null);
      setRecentJournalTrades([]);
      const apiErr = err as ApiError;
      setError(apiErr?.message ?? "Could not load portfolio. Is the API running?");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

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
