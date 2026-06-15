import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, BarChart3, ArrowUpDown } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PageTransition, FadeIn } from "@/components/shared/Animations";
import { CardSkeleton, TableSkeleton } from "@/components/shared/Skeletons";
import { ErrorCard } from "@/components/shared/ErrorCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatPercent, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Holding } from "@/types";

function HoldingAvatar({ holding }: { holding: Pick<Holding, "symbol" | "icon"> }) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(holding.icon && !failed);
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-1 ring-border/50">
      {showImg ? (
        <img
          src={holding.icon}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase leading-none text-primary">
          {(holding.symbol ?? "?").slice(0, 2)}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  hint,
  value,
  change,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  hint?: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay}>
      <div className="card-hover surface-card p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {hint ? <p className="mt-1 text-[11px] leading-snug text-muted-foreground/90">{hint}</p> : null}
          </div>
          <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-card-foreground">{value}</p>
        {change !== undefined && (
          <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-success" : "text-destructive"}`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercent(change)}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { summary, recentJournalTrades, isLoading, error, fetchPortfolio } = usePortfolio();

  if (error) return <ErrorCard message={error} onRetry={fetchPortfolio} />;

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="section-heading">Portfolio</h1>
        <p className="section-subheading">Track your crypto holdings and performance</p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : summary ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Value"
            hint="What your positions are worth right now at live prices."
            value={formatCurrency(summary.totalValue)}
            icon={Wallet}
            delay={0}
          />
          <StatCard
            label="Total P&L"
            hint="Profit or loss versus what you paid on average (including buys and sells in your Journal)."
            value={formatCurrency(summary.totalPnl)}
            change={summary.totalPnlPercent}
            icon={BarChart3}
            delay={0.06}
          />
          <StatCard
            label="24h Change"
            hint="Rough one-day dollar move, estimated from each coin’s 24h market change."
            value={formatCurrency(summary.change24h)}
            change={summary.change24hPercent}
            icon={ArrowUpDown}
            delay={0.12}
          />
          <StatCard
            label="Holdings"
            hint="How many different assets you currently hold."
            value={String(summary.holdings.length)}
            icon={TrendingUp}
            delay={0.18}
          />
        </div>
      ) : null}

      {/* Holdings Table */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Holdings</h2>
          <Button size="sm" variant="outline" asChild>
            <Link to="/portfolio-journal">Log buy / sell in Journal</Link>
          </Button>
        </div>

        {isLoading ? <TableSkeleton /> : !summary?.holdings.length ? (
          <EmptyState
            title="No holdings yet"
            description="Your positions are built from buy and sell entries in the Journal. Log a trade there to see holdings here."
            actionLabel="Open Journal"
            onAction={() => navigate("/portfolio-journal")}
          />
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="p-4">Asset</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-right">Value</th>
                  <th className="p-4 text-right">P&L</th>
                  <th className="p-4 text-right">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {summary.holdings.map((h, i) => (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <HoldingAvatar holding={{ symbol: h.symbol, icon: h.icon }} />
                        <div>
                          <p className="font-medium text-card-foreground">{h.name ?? h.coinId}</p>
                          <p className="text-xs text-muted-foreground">{h.symbol ?? "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-card-foreground">{h.amount}</td>
                    <td className="p-4 text-right font-mono text-card-foreground">{formatCurrency(h.currentPrice)}</td>
                    <td className="p-4 text-right font-mono font-medium text-card-foreground">{formatCurrency(h.value)}</td>
                    <td className="p-4 text-right">
                      <span className={`font-mono text-sm ${h.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(h.pnl)} <span className="text-xs">({formatPercent(h.pnlPercent)})</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${h.allocation}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{h.allocation}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent journal trades (same source as holdings) */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Recent journal trades</h2>
        {isLoading ? <TableSkeleton rows={3} /> : !recentJournalTrades.length ? (
          <EmptyState
            title="No buy or sell logs yet"
            description="Log a trade in the Journal to update holdings and see it here."
            actionLabel="Open Journal"
            onAction={() => navigate("/portfolio-journal")}
          />
        ) : (
          <div className="space-y-2">
            {recentJournalTrades.map((log, i) => (
              <FadeIn key={log.id} delay={i * 0.04}>
                <div className="surface-card flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-1.5 ${log.actionType === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {log.actionType === "buy" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground capitalize">
                        {log.actionType} {log.symbol ?? log.coinId ?? ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-card-foreground">
                      {log.quantity != null ? log.quantity : "—"}{" "}
                      <span className="text-muted-foreground">{log.symbol ?? ""}</span>
                    </p>
                    {log.price != null ? (
                      <p className="text-xs text-muted-foreground">{formatCurrency(log.price)} / unit</p>
                    ) : null}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
