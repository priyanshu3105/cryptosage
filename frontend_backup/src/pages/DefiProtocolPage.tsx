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

type Range = "30d" | "90d" | "180d";

function usd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function DefiProtocolPage() {
  const { slug = "" } = useParams();
  const [range, setRange] = useState<Range>("90d");

  const detailQuery = useQuery({
    queryKey: ["defi-protocol-detail", slug],
    queryFn: () => api.getDefiProtocol(slug),
    enabled: Boolean(slug),
  });

  const tvlQuery = useQuery({
    queryKey: ["defi-protocol-tvl", slug, range],
    queryFn: () => api.getDefiProtocolTVL(slug, range),
    enabled: Boolean(slug),
  });

  const detail = detailQuery.data?.data;
  const chartData =
    tvlQuery.data?.data.tvl.map((point) => ({
      time: new Date(point.timestamp).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      tvl: Number(point.tvl.toFixed(0)),
    })) ?? [];

  return (
    <div className="space-y-5">
      <Link to="/defi" className="text-sm text-quantix.primary hover:underline">
        Back to DeFi dashboard
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl">{detail?.name ?? slug}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-quantix.muted">
            {detail?.description ?? "Protocol overview, chain exposure, audit context, and recent TVL history."}
          </p>
        </div>

        <div className="flex gap-2">
          {(["30d", "90d", "180d"] as Range[]).map((item) => (
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
        <MetricCard label="Category" value={detail?.category ?? "Unknown"} />
        <MetricCard label="Current TVL" value={detail?.tvl ? usd(detail.tvl) : "--"} />
        <MetricCard label="Chains" value={detail?.chains?.length ? detail.chains.join(", ") : "--"} />
        <MetricCard label="Audits" value={detail?.audits !== null && detail?.audits !== undefined ? String(detail.audits) : "--"} />
      </section>

      {detail?.auditNote ? (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {detail.auditNote}
        </section>
      ) : null}

      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        <div className="mb-4">
          <h2 className="font-heading text-xl">TVL history</h2>
          <p className="text-sm text-quantix.muted">
            {tvlQuery.data?.meta?.range ?? range} view of protocol liquidity over time.
          </p>
        </div>

        {tvlQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-quantix.muted">Loading TVL chart...</div>
        ) : tvlQuery.isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Unable to load protocol TVL history.
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="protocolTvlFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="tvl" stroke="#38bdf8" fill="url(#protocolTvlFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-quantix.muted">
          {detail?.url ? (
            <a href={detail.url} target="_blank" rel="noreferrer" className="text-quantix.primary hover:underline">
              Visit protocol site
            </a>
          ) : null}
          {detail?.twitter ? (
            <a
              href={`https://twitter.com/${detail.twitter.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-quantix.primary hover:underline"
            >
              View Twitter
            </a>
          ) : null}
        </div>
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
