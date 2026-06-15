import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMarket, useCoinDetail } from "@/hooks/useMarket";
import { PageTransition } from "@/components/shared/Animations";
import { TableSkeleton, CardSkeleton } from "@/components/shared/Skeletons";
import { ErrorCard } from "@/components/shared/ErrorCard";
import { TablePagination } from "@/components/shared/TablePagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Coin, TimeRange } from "@/types";

const PAGE_SIZE = 15;

function CoinAvatar({ coin, className = "h-7 w-7" }: { coin: Pick<Coin, "symbol" | "icon">; className?: string }) {
  if (coin.icon) {
    return (
      <img
        src={coin.icon}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ${className}`}
    >
      {coin.symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

function MiniSparkline({ data, positive }: { data?: number[]; positive: boolean }) {
  if (!data || data.length < 2) {
    return <span className="inline-block w-[60px] text-right text-xs text-muted-foreground">—</span>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 60},${30 - ((v - min) / range) * 28}`)
    .join(" ");
  return (
    <svg width="60" height="30" className="inline-block">
      <polyline
        fill="none"
        stroke={positive ? "hsl(var(--chart-up))" : "hsl(var(--chart-down))"}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function CoinDetailPanel({ coin, onClose }: { coin: Coin; onClose: () => void }) {
  const { coin: detail, isLoading, timeRange, setTimeRange } = useCoinDetail(coin.id, coin);
  const ranges: TimeRange[] = ["1d", "7d", "30d", "90d"];

  const chartData =
    detail?.priceHistory.map((p) => ({
      t: p.timestamp,
      price: p.price,
    })) ?? [];

  if (!detail && isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CoinAvatar coin={coin} className="h-10 w-10" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">{coin.name}</h3>
              <p className="text-sm text-muted-foreground">
                {coin.symbol.toUpperCase()} · Rank #{coin.rank}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!detail) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="surface-card p-6"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <CoinAvatar coin={detail} className="h-10 w-10" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">{detail.name}</h3>
            <p className="text-sm text-muted-foreground">
              {detail.symbol.toUpperCase()} · Rank #{detail.rank || "—"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-semibold text-card-foreground">{formatCurrency(detail.price)}</p>
        <span
          className={`text-sm font-medium ${detail.change24h >= 0 ? "text-success" : "text-destructive"}`}
        >
          {formatPercent(detail.change24h)} <span className="text-muted-foreground">24h</span>
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {ranges.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setTimeRange(r)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              timeRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mb-6 h-44 w-full rounded-lg border border-border/50 bg-muted/20 p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={detail.id} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                width={56}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Price"]}
                labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">No chart data for this range</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Market Cap</span>
          <p className="font-medium text-card-foreground">{formatCurrency(detail.marketCap)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Volume 24h</span>
          <p className="font-medium text-card-foreground">{formatCurrency(detail.volume24h)}</p>
        </div>
        {detail.ath > 0 && (
          <div>
            <span className="text-muted-foreground">ATH</span>
            <p className="font-medium text-card-foreground">{formatCurrency(detail.ath)}</p>
          </div>
        )}
        {detail.atl > 0 && (
          <div>
            <span className="text-muted-foreground">ATL</span>
            <p className="font-medium text-card-foreground">{formatCurrency(detail.atl)}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MarketPage() {
  const { coins, isLoading, error, search, setSearch, sortBy, sortDir, toggleSort, refetch } = useMarket();
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(coins.length / PAGE_SIZE));
  const paginatedCoins = useMemo(
    () => coins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [coins, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortDir]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (error) return <ErrorCard message={error} onRetry={refetch} />;

  const SortHeader = ({ field, children }: { field: keyof Coin; children: React.ReactNode }) => (
    <th className="cursor-pointer p-4 text-right" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortBy === field && <ArrowUpDown className="h-3 w-3" />}
      </span>
    </th>
  );

  return (
    <PageTransition>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="section-heading">Market</h1>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selectedCoin ? "hidden lg:block" : ""}`}>
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : (
            <div className="surface-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-4">#</th>
                    <th className="p-4">Coin</th>
                    <SortHeader field="price">Price</SortHeader>
                    <SortHeader field="change24h">24h</SortHeader>
                    <SortHeader field="change7d">7d</SortHeader>
                    <SortHeader field="marketCap">Market Cap</SortHeader>
                    <th className="p-4 text-right">7d Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCoins.map((coin, i) => (
                    <motion.tr
                      key={coin.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedCoin(coin)}
                      className={`cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30 ${
                        selectedCoin?.id === coin.id ? "bg-accent/50" : ""
                      }`}
                    >
                      <td className="p-4 text-muted-foreground">{coin.rank}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <CoinAvatar coin={coin} />
                          <div>
                            <p className="font-medium text-card-foreground">{coin.name}</p>
                            <p className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-card-foreground">{formatCurrency(coin.price)}</td>
                      <td
                        className={`p-4 text-right font-mono ${coin.change24h >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {coin.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(coin.change24h)}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-right font-mono ${coin.change7d >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {formatPercent(coin.change7d)}
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">{formatCurrency(coin.marketCap)}</td>
                      <td className="p-4 text-right">
                        <MiniSparkline data={coin.sparkline} positive={coin.change7d >= 0} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                </table>
              </div>
              <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} className="border-t border-border px-2 py-3" />
            </div>
          )}
        </div>

        {selectedCoin && (
          <div className="w-full shrink-0 lg:sticky lg:top-4 lg:w-96 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <CoinDetailPanel
              key={selectedCoin.id}
              coin={selectedCoin}
              onClose={() => setSelectedCoin(null)}
            />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
