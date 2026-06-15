import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";

type Range = "7d" | "30d";

function usd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 2 : 4,
  });
}

export function MarketCoinPage() {
  const { coinId = "" } = useParams();
  const [range, setRange] = useState<Range>("7d");

  const priceQuery = useQuery({
    queryKey: ["coin-price", coinId],
    queryFn: () => api.getCoinPrice(coinId),
    enabled: Boolean(coinId),
  });

  const historyQuery = useQuery({
    queryKey: ["coin-history", coinId, range],
    queryFn: () => api.getCoinHistory(coinId, range),
    enabled: Boolean(coinId),
  });

  const price = priceQuery.data?.data;
  const chartData =
    historyQuery.data?.data.prices.map((point) => ({
      time: new Date(point.timestamp).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      price: Number(point.price.toFixed(2)),
    })) ?? [];

  return (
    <div className="space-y-5">
      <Link to="/market" className="text-sm text-quantix.primary hover:underline">
        Back to market explorer
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl capitalize">{coinId.replace(/-/g, " ")}</h1>
          <p className="mt-2 text-sm text-quantix.muted">
            Live price snapshot and historical price movement for the selected asset.
          </p>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d"] as Range[]).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`rounded-lg border px-4 py-2 text-sm ${
                range === item
                  ? "border-quantix.primary bg-quantix.primary text-white"
                  : "border-quantix.border text-quantix.muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Current price" value={price ? usd(price.price ?? 0) : "--"} />
        <MetricCard label="24h change" value={price ? `${price.change24h >= 0 ? "+" : ""}${price.change24h.toFixed(2)}%` : "--"} />
        <MetricCard label="Market cap" value={price?.marketCap ? usd(price.marketCap) : "--"} />
        <MetricCard label="24h volume" value={price?.volume24h ? usd(price.volume24h) : "--"} />
      </section>

      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        <div className="mb-4">
          <h2 className="font-heading text-xl">Price history</h2>
          <p className="text-sm text-quantix.muted">Range: {historyQuery.data?.meta?.range ?? range}</p>
        </div>

        {historyQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-quantix.muted">Loading chart...</div>
        ) : historyQuery.isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Unable to load chart data.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="coinHistoryFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#12b981" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#12b981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="price" stroke="#10b981" fill="url(#coinHistoryFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl border border-quantix.border/70 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-quantix.muted">{props.label}</div>
      <div className="mt-3 font-heading text-2xl text-quantix.text">{props.value}</div>
    </div>
  );
}
