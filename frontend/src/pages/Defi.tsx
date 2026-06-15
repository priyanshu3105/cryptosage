import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDefi, useProtocolDetail } from "@/hooks/useDefi";
import { PageTransition } from "@/components/shared/Animations";
import { TableSkeleton, CardSkeleton } from "@/components/shared/Skeletons";
import { ErrorCard } from "@/components/shared/ErrorCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import type { Protocol } from "@/types";

const PAGE_SIZE = 15;

function ProtocolAvatar({ protocol, className = "h-8 w-8" }: { protocol: Pick<Protocol, "name" | "icon">; className?: string }) {
  if (protocol.icon) {
    return (
      <img
        src={protocol.icon}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ${className}`}
    >
      {protocol.name.slice(0, 2)}
    </div>
  );
}

function ProtocolDetailCard({
  protocolId,
  listProtocol,
  onClose,
}: {
  protocolId: string;
  listProtocol: Protocol;
  onClose: () => void;
}) {
  const { protocol, isLoading } = useProtocolDetail(protocolId, listProtocol);

  const chartData =
    protocol?.tvlHistory.map((pt) => ({
      t: pt.timestamp,
      tvl: pt.tvl,
    })) ?? [];

  if (isLoading && !protocol) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ProtocolAvatar protocol={listProtocol} className="h-10 w-10" />
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">{listProtocol.name}</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="secondary">{listProtocol.chain}</Badge>
                <Badge variant="outline">{listProtocol.category}</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            ✕
          </Button>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!isLoading && !protocol) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="surface-card p-6"
      >
        <p className="text-sm text-muted-foreground">Could not load protocol details.</p>
        <Button variant="outline" size="sm" className="mt-4" type="button" onClick={onClose}>
          Close
        </Button>
      </motion.div>
    );
  }

  if (!protocol) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="surface-card p-6"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <ProtocolAvatar protocol={protocol} className="h-10 w-10" />
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">{protocol.name}</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant="secondary">{protocol.chain}</Badge>
              <Badge variant="outline">{protocol.category}</Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} type="button">
          ✕
        </Button>
      </div>

      <p className="mb-1 text-2xl font-semibold text-card-foreground">{formatCurrency(protocol.tvl)}</p>
      <p
        className={`mb-4 text-sm font-medium ${protocol.tvlChange24h >= 0 ? "text-success" : "text-destructive"}`}
      >
        <span className="inline-flex items-center gap-0.5">
          {protocol.tvlChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {formatPercent(protocol.tvlChange24h)} <span className="text-muted-foreground">24h TVL</span>
        </span>
      </p>

      {protocol.description && <p className="mb-4 text-sm text-muted-foreground">{protocol.description}</p>}

      <div className="mb-6 h-44 w-full rounded-lg border border-border/50 bg-muted/20 p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart key={protocol.slug} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                }
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => formatCurrency(Number(v))}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                width={72}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "TVL"]}
                labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Line
                type="monotone"
                dataKey="tvl"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground">No TVL history for this range</p>
          </div>
        )}
      </div>

      {protocol.url && (
        <a
          href={protocol.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Visit website
        </a>
      )}
    </motion.div>
  );
}

export default function DefiPage() {
  const {
    protocols,
    chains,
    categories,
    isLoading,
    error,
    chainFilter,
    setChainFilter,
    categoryFilter,
    setCategoryFilter,
    refetch,
  } = useDefi();
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [page, setPage] = useState(1);
  const [protocolSearch, setProtocolSearch] = useState("");
  const [chipFilter, setChipFilter] = useState("");

  const visibleChains = useMemo(() => {
    const q = chipFilter.trim().toLowerCase();
    if (!q) return chains;
    return chains.filter((c) => c === "all" || c.toLowerCase().includes(q));
  }, [chains, chipFilter]);

  const visibleCategories = useMemo(() => {
    const q = chipFilter.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c === "all" || c.toLowerCase().includes(q));
  }, [categories, chipFilter]);

  const protocolsForTable = useMemo(() => {
    const q = protocolSearch.trim().toLowerCase();
    if (!q) return protocols;
    return protocols.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.chain.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [protocols, protocolSearch]);

  const totalPages = Math.max(1, Math.ceil(protocolsForTable.length / PAGE_SIZE));
  const paginatedProtocols = useMemo(
    () => protocolsForTable.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [protocolsForTable, page]
  );

  useEffect(() => {
    setPage(1);
  }, [chainFilter, categoryFilter, protocolSearch]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (error) return <ErrorCard message={error} onRetry={refetch} />;

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="section-heading">DeFi Protocols</h1>
        <p className="section-subheading">Track total value locked across DeFi</p>
      </div>

      <div className="surface-soft mb-6 rounded-2xl border border-border/70 p-4 shadow-sm dark:border-[hsl(var(--neon-cyan)/0.12)] sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="defi-protocol-search" className="text-xs font-medium text-muted-foreground">
              Search protocols
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="defi-protocol-search"
                placeholder="Name, slug, chain, or category…"
                value={protocolSearch}
                onChange={(e) => setProtocolSearch(e.target.value)}
                className="h-10 border-border/80 bg-background/80 pl-9 shadow-none dark:bg-card/40"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-1.5">
            <label htmlFor="defi-chip-search" className="text-xs font-medium text-muted-foreground">
              Narrow filter chips
            </label>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="defi-chip-search"
                placeholder="Match chain or category labels…"
                value={chipFilter}
                onChange={(e) => setChipFilter(e.target.value)}
                className="h-10 border-border/80 bg-background/80 pl-9 shadow-none dark:bg-card/40"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4 border-t border-border/50 pt-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Chain</span>
              <span className="hidden text-[10px] text-muted-foreground/70 sm:inline">Swipe or shift-scroll</span>
            </div>
            <div
              className="overflow-x-auto overscroll-x-contain rounded-xl border border-border/50 bg-background/50 px-1 py-1.5 dark:bg-card/30 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
              title="Scroll horizontally for more chains"
            >
              <div className="flex w-max flex-nowrap gap-1.5 px-1.5 py-0.5">
                {visibleChains.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChainFilter(c)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      chainFilter === c
                        ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30"
                        : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {c === "all" ? "All Chains" : c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</span>
              <span className="hidden text-[10px] text-muted-foreground/70 sm:inline">Swipe or shift-scroll</span>
            </div>
            <div
              className="overflow-x-auto overscroll-x-contain rounded-xl border border-border/50 bg-background/50 px-1 py-1.5 dark:bg-card/30 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
              title="Scroll horizontally for more categories"
            >
              <div className="flex w-max flex-nowrap gap-1.5 px-1.5 py-0.5">
                {visibleCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      categoryFilter === c
                        ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30"
                        : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {c === "all" ? "All Categories" : c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selectedProtocol ? "lg:max-w-none" : ""}`}>
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : !protocolsForTable.length ? (
            <EmptyState
              title="No protocols found"
              description={
                protocolSearch.trim()
                  ? "Try a different search or clear filters"
                  : "Adjust your filters to see results"
              }
            />
          ) : (
            <div className="surface-card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="p-4">Protocol</th>
                    <th className="p-4 text-right">TVL</th>
                    <th className="p-4 text-right">24h Change</th>
                    <th className="p-4">Chain</th>
                    <th className="p-4">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProtocols.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedProtocol(p)}
                      className={`cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30 ${
                        selectedProtocol?.id === p.id ? "bg-accent/50" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <ProtocolAvatar protocol={p} />
                          <span className="font-medium text-card-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-card-foreground">
                        {formatCurrency(p.tvl)}
                      </td>
                      <td
                        className={`p-4 text-right font-mono ${p.tvlChange24h >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {p.tvlChange24h >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPercent(p.tvlChange24h)}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-xs">
                          {p.chain}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {p.category}
                        </Badge>
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

        {selectedProtocol && (
          <div className="w-full shrink-0 lg:sticky lg:top-4 lg:w-96 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
            <ProtocolDetailCard
              key={selectedProtocol.slug}
              protocolId={selectedProtocol.slug}
              listProtocol={selectedProtocol}
              onClose={() => setSelectedProtocol(null)}
            />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
