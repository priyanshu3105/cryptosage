import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type SortKey = "marketCap" | "price" | "change24h" | "volume24h" | "name";

function usd(value: number, fractionDigits = 2) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fractionDigits,
  });
}

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function MarketPage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const marketQuery = useQuery({
    queryKey: ["market-top", 50],
    queryFn: () => api.getTopCoins(50),
    refetchInterval: 60_000,
  });

  const filteredCoins = useMemo(() => {
    const coins = marketQuery.data?.data ?? [];
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? coins.filter(
          (coin) =>
            coin.name.toLowerCase().includes(normalized) ||
            coin.symbol.toLowerCase().includes(normalized)
        )
      : coins;

    return [...filtered].sort((left, right) => {
      const order = sortDirection === "asc" ? 1 : -1;

      switch (sortKey) {
        case "name":
          return left.name.localeCompare(right.name) * order;
        case "price":
          return (left.price - right.price) * order;
        case "change24h":
          return (left.change24h - right.change24h) * order;
        case "volume24h":
          return (left.volume24h - right.volume24h) * order;
        case "marketCap":
        default:
          return (left.marketCap - right.marketCap) * order;
      }
    });
  }, [marketQuery.data?.data, query, sortDirection, sortKey]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Market Explorer</h1>
          <p className="mt-2 text-sm text-quantix.muted">
            Search, sort, and inspect the top crypto assets by market capitalization.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by coin or symbol"
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text placeholder:text-quantix.muted"
          />
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
          >
            <option value="marketCap">Sort by market cap</option>
            <option value="price">Sort by price</option>
            <option value="change24h">Sort by 24h change</option>
            <option value="volume24h">Sort by volume</option>
            <option value="name">Sort by name</option>
          </select>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
          >
            <option value="desc">High to low</option>
            <option value="asc">Low to high</option>
          </select>
        </div>
      </header>

      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        <div className="mb-4 flex items-center justify-between text-xs text-quantix.muted">
          <span>{filteredCoins.length} results</span>
          <span>{marketQuery.data?.meta?.source ?? "CoinGecko"}</span>
        </div>

        {marketQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-quantix.muted">Loading market data...</div>
        ) : marketQuery.isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Unable to load market data right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-quantix.muted">
                <tr>
                  <th className="px-3 py-3">Coin</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">24h</th>
                  <th className="px-3 py-3">Volume</th>
                  <th className="px-3 py-3">Market cap</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin) => (
                  <tr key={coin.id} className="border-t border-quantix.border/50">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {coin.image ? <img src={coin.image} alt="" className="h-8 w-8 rounded-full" /> : null}
                        <div>
                          <div className="font-medium text-quantix.text">{coin.name}</div>
                          <div className="text-xs uppercase tracking-[0.16em] text-quantix.muted">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 font-mono text-quantix.text">{usd(coin.price)}</td>
                    <td className={`px-3 py-4 font-mono ${coin.change24h >= 0 ? "text-quantix.green" : "text-quantix.red"}`}>
                      {coin.change24h >= 0 ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </td>
                    <td className="px-3 py-4 font-mono text-quantix.muted">{compact(coin.volume24h)}</td>
                    <td className="px-3 py-4 font-mono text-quantix.muted">{compact(coin.marketCap)}</td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        to={`/market/${coin.id}`}
                        className="rounded-lg border border-quantix.border px-3 py-2 text-xs text-quantix.text hover:bg-quantix.surface/70"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
