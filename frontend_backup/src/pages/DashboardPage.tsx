import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { CoinCard } from "../components/dashboard/CoinCard";
import { MarketTable } from "../components/dashboard/MarketTable";

export function DashboardPage() {
  const { data: topCoinsResponse } = useQuery({
    queryKey: ["market-top-coins"],
    queryFn: () => api.getTopCoins(10),
  });

  const coins = mapTopCoinsToCoins(topCoinsResponse?.data) ?? getFallbackCoins();

  const [btc, eth, sui] = coins;

  return (
        <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl">Live Crypto Updates 🪐</h1>
          <p className="mt-2 text-sm text-quantix.muted">
            Streamed tickers, portfolio-aware insights, and execution-ready context.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select className="rounded-md border border-quantix.border bg-quantix.card/80 px-3 py-1 text-sm text-quantix.muted">
            <option>USDT</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
          <select className="rounded-md border border-quantix.border bg-quantix.card/80 px-3 py-1 text-sm text-quantix.muted">
            <option>Top Gainers</option>
            <option>Top Losers</option>
            <option>Most Volume</option>
          </select>
          <select className="rounded-md border border-quantix.border bg-quantix.card/80 px-3 py-1 text-sm text-quantix.muted">
            <option>7D</option>
            <option>24H</option>
            <option>30D</option>
          </select>
          <Link to="/market" className="text-quantix.primary underline-offset-2 hover:underline">
            See all
          </Link>
        </div>
      </header>

      {/* Coin cards */}
      <section className="grid gap-3 md:grid-cols-3">
        {btc && (
          <CoinCard
            symbol={btc.symbol}
            name={btc.name}
            price={btc.price}
            change24h={btc.change24h}
            spark={btc.spark}
          />
        )}
        {eth && (
          <CoinCard
            symbol={eth.symbol}
            name={eth.name}
            price={eth.price}
            change24h={eth.change24h}
            spark={eth.spark}
          />
        )}
        {sui && (
          <CoinCard
            symbol={sui.symbol}
            name={sui.name}
            price={sui.price}
            change24h={sui.change24h}
            spark={sui.spark}
          />
        )}
      </section>

      {/* Market table */}
      <section className="mt-2">
        <div className="flex items-center justify-between text-sm">
          <h2 className="font-heading text-lg">Market Overview</h2>
          <div className="rounded-full border border-quantix.border/70 px-3 py-1 text-xs text-quantix.muted">
            {topCoinsResponse?.meta?.source ? `Source: ${topCoinsResponse.meta.source}` : "Mock data"}
          </div>
        </div>
        <MarketTable rows={mapOverviewToRows(coins.slice(0, 6))} />
      </section>

      {/* Promo banner */}
      <section className="glass-card mt-2 flex items-center justify-between rounded-xl border border-quantix.border/70 px-4 py-3 text-sm">
        <div>
          <div className="font-heading text-sm md:text-base">
            Get 2.5% off fees for your next rebalance
          </div>
          <div className="mt-1 text-quantix.muted">
            Lock in before the window closes and route via the most efficient DEX path.
          </div>
        </div>
        <CountdownPill />
      </section>
    </div>
  );
}

function getFallbackCoins() {
  const makeSpark = () => Array.from({ length: 24 }).map((_, i) => 100 + i * 2 + (Math.random() - 0.5) * 8);
  return [
    { symbol: "BTC/USDT", name: "Bitcoin", price: 67250, change24h: 1.8, spark: makeSpark() },
    { symbol: "ETH/USDT", name: "Ethereum", price: 3450, change24h: -0.4, spark: makeSpark() },
    { symbol: "SUI/USDT", name: "Sui", price: 1.42, change24h: 3.7, spark: makeSpark() },
    { symbol: "SOL/USDT", name: "Solana", price: 142.5, change24h: 2.3, spark: makeSpark() },
    { symbol: "DOGE/USDT", name: "Dogecoin", price: 0.168, change24h: -2.1, spark: makeSpark() },
    { symbol: "USDT", name: "Tether", price: 1.0, change24h: 0.01, spark: makeSpark() },
  ];
}

function mapTopCoinsToCoins(data: any[] | undefined) {
  if (!Array.isArray(data) || data.length === 0) return undefined;

  const makeSpark = () =>
    Array.from({ length: 24 }).map(
      (_, i) => 100 + i * 2 + (Math.random() - 0.5) * 8,
    );

  return data.map((c) => ({
    symbol: c.symbol?.toUpperCase?.() ?? "",
    name: c.name ?? "",
    price: c.price ?? 0,
    change24h: c.change24h ?? 0,
    spark: makeSpark(),
    marketCap: c.marketCap ?? 0,
    volume7d: c.volume24h ?? 0,
  }));
}

function mapOverviewToRows(coins: any[]) {
  if (!Array.isArray(coins) || coins.length === 0) {
    return getFallbackCoins().map((c, idx) => ({
      rank: idx + 1,
      symbol: c.symbol,
      name: c.name,
      price: c.price,
      change1h: (Math.random() - 0.5) * 1.5,
      change7d: c.change24h,
      change7dAlt: (Math.random() - 0.5) * 8,
      marketCap: 500_000_000_00 + idx * 10_000_000_0,
      volume7d: 100_000_000_00 + idx * 5_000_000_0,
      spark: c.spark,
    }));
  }

  return coins.map((c: any, idx: number) => ({
    rank: idx + 1,
    symbol: c.symbol ?? "",
    name: c.name ?? "",
    price: c.price ?? 0,
    change1h: c.change1h ?? 0,
    change7d: c.change7d ?? 0,
    change7dAlt: c.change7dAlt ?? c.change7d ?? 0,
    marketCap: c.marketCap ?? 0,
    volume7d: c.volume7d ?? 0,
    spark: c.spark ?? [],
  }));
}

function CountdownPill() {
  const [secondsLeft, setSecondsLeft] = useState<number>(23 * 60 + 42);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="rounded-full border border-quantix.amber/60 bg-quantix.card/80 px-4 py-2 text-[11px] text-quantix.amber">
      <span className="mr-2 text-quantix.muted">Window closes in</span>
      <span className="font-mono">
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
