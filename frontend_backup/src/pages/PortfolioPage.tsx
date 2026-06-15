import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { getApiErrorMessage } from "../features/auth/AuthContext";

function usd(value: number, decimals = 2) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  });
}

type HoldingDraft = {
  coinId: string;
  quantity: string;
  buyPrice: string;
  symbol: string;
  name: string;
};

export function PortfolioPage() {
  const queryClient = useQueryClient();
  const [portfolioName, setPortfolioName] = useState("My Portfolio");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<HoldingDraft>({
    coinId: "",
    quantity: "",
    buyPrice: "",
    symbol: "",
    name: "",
  });

  const marketQuery = useQuery({
    queryKey: ["market-top", 50],
    queryFn: () => api.getTopCoins(50),
  });

  const portfolioQuery = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      try {
        return await api.getPortfolio();
      } catch (error) {
        const message = getApiErrorMessage(error, "");
        if (message === "Portfolio not found") {
          return api.createPortfolio({ name: "My Portfolio" });
        }

        throw error;
      }
    },
  });

  const syncPortfolio = (message: string) => {
    setFeedback(message);
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
  };

  const addHoldingMutation = useMutation({
    mutationFn: () =>
      api.addHolding({
        coinId: draft.coinId,
        quantity: Number(draft.quantity),
        buyPrice: Number(draft.buyPrice),
        symbol: draft.symbol || undefined,
        name: draft.name || undefined,
      }),
    onSuccess: () => {
      setDraft({ coinId: "", quantity: "", buyPrice: "", symbol: "", name: "" });
      syncPortfolio("Holding added.");
    },
  });

  const removeHoldingMutation = useMutation({
    mutationFn: (holdingId: string) => api.removeHolding(holdingId),
    onSuccess: () => syncPortfolio("Holding removed."),
  });

  const updateHoldingMutation = useMutation({
    mutationFn: (payload: { holdingId: string; quantity: number; buyPrice: number }) =>
      api.updateHolding(payload.holdingId, {
        quantity: payload.quantity,
        buyPrice: payload.buyPrice,
        symbol: draft.symbol || undefined,
        name: draft.name || undefined,
      }),
    onSuccess: () => {
      setEditingHoldingId(null);
      setDraft({ coinId: "", quantity: "", buyPrice: "", symbol: "", name: "" });
      syncPortfolio("Holding updated.");
    },
  });

  const renamePortfolioMutation = useMutation({
    mutationFn: () => api.updatePortfolio({ name: portfolioName }),
    onSuccess: () => syncPortfolio("Portfolio name updated."),
  });

  const portfolio = portfolioQuery.data?.data;
  const holdings = portfolio?.holdings ?? [];

  const livePrices = new Map<string, { price: number; change24h: number }>();
  for (const coin of marketQuery.data?.data ?? []) {
    livePrices.set(coin.id, { price: coin.price, change24h: coin.change24h });
    livePrices.set(coin.symbol.toUpperCase(), { price: coin.price, change24h: coin.change24h });
  }

  const enrichedHoldings = holdings.map((holding) => {
    const live =
      livePrices.get(holding.coinId) ??
      (holding.symbol ? livePrices.get(holding.symbol.toUpperCase()) : undefined);
    const currentPrice = live?.price ?? 0;
    const change24h = live?.change24h ?? 0;
    const value = holding.quantity * currentPrice;
    const costBasis = holding.quantity * holding.buyPrice;
    const pnl = value - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ...holding, currentPrice, change24h, value, costBasis, pnl, pnlPct };
  });

  const totals = enrichedHoldings.reduce(
    (acc, holding) => {
      acc.value += holding.value;
      acc.cost += holding.costBasis;
      return acc;
    },
    { value: 0, cost: 0 }
  );
  const totalPnl = totals.value - totals.cost;
  const totalPnlPct = totals.cost > 0 ? (totalPnl / totals.cost) * 100 : 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Portfolio</h1>
          <p className="mt-2 text-sm text-quantix.muted">
            Your Mongo-backed holdings with live market pricing and real-time P&amp;L.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={portfolioName}
            onChange={(event) => setPortfolioName(event.target.value)}
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
          />
          <button
            onClick={() => renamePortfolioMutation.mutate()}
            disabled={renamePortfolioMutation.isPending}
            className="rounded-xl border border-quantix.border px-4 py-3 text-sm text-quantix.text hover:bg-quantix.surface/70 disabled:opacity-60"
          >
            Save name
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Portfolio value" value={usd(totals.value)} />
        <MetricCard label="Invested capital" value={usd(totals.cost)} />
        <MetricCard
          label="All-time P&L"
          value={`${totalPnl >= 0 ? "+" : ""}${usd(totalPnl)} (${totalPnlPct.toFixed(2)}%)`}
        />
      </section>

      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        <h2 className="font-heading text-xl">Add holding</h2>
        <p className="mt-2 text-sm text-quantix.muted">
          Pick a top-market asset and save the position directly to your portfolio.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <select
            value={draft.coinId}
            onChange={(event) => {
              const selected = marketQuery.data?.data.find((coin) => coin.id === event.target.value);
              setDraft((current) => ({
                ...current,
                coinId: event.target.value,
                symbol: selected?.symbol.toUpperCase() ?? "",
                name: selected?.name ?? "",
              }));
            }}
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
          >
            <option value="">Select coin</option>
            {(marketQuery.data?.data ?? []).map((coin) => (
              <option key={coin.id} value={coin.id}>
                {coin.name} ({coin.symbol.toUpperCase()})
              </option>
            ))}
          </select>
          <input
            value={draft.quantity}
            onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))}
            placeholder="Quantity"
            type="number"
            min="0"
            step="0.0001"
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
          />
          <input
            value={draft.buyPrice}
            onChange={(event) => setDraft((current) => ({ ...current, buyPrice: event.target.value }))}
            placeholder="Average buy price"
            type="number"
            min="0"
            step="0.01"
            className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
          />
          <input
            value={draft.symbol}
            readOnly
            placeholder="Symbol"
            className="rounded-xl border border-quantix.border bg-quantix.card/40 px-4 py-3 text-sm text-quantix.muted"
          />
          <button
            onClick={() => {
              if (editingHoldingId) {
                updateHoldingMutation.mutate({
                  holdingId: editingHoldingId,
                  quantity: Number(draft.quantity),
                  buyPrice: Number(draft.buyPrice),
                });
                return;
              }

              addHoldingMutation.mutate();
            }}
            disabled={
              addHoldingMutation.isPending ||
              updateHoldingMutation.isPending ||
              !draft.coinId ||
              !draft.quantity ||
              !draft.buyPrice
            }
            className="rounded-xl bg-quantix.primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {editingHoldingId
              ? updateHoldingMutation.isPending
                ? "Updating..."
                : "Update holding"
              : addHoldingMutation.isPending
                ? "Saving..."
                : "Add holding"}
          </button>
        </div>

        {editingHoldingId ? (
          <button
            onClick={() => {
              setEditingHoldingId(null);
              setDraft({ coinId: "", quantity: "", buyPrice: "", symbol: "", name: "" });
            }}
            className="mt-3 text-sm text-quantix.muted hover:text-quantix.text"
          >
            Cancel editing
          </button>
        ) : null}

        {feedback ? <div className="mt-3 text-sm text-quantix.green">{feedback}</div> : null}
      </section>

      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        {portfolioQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-quantix.muted">Loading your portfolio...</div>
        ) : portfolioQuery.isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {getApiErrorMessage(portfolioQuery.error, "Unable to load your portfolio.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-quantix.muted">
                <tr>
                  <th className="px-3 py-3">Asset</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Avg buy</th>
                  <th className="px-3 py-3">Current</th>
                  <th className="px-3 py-3">Value</th>
                  <th className="px-3 py-3">P&amp;L</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {enrichedHoldings.map((holding) => (
                  <tr key={holding._id} className="border-t border-quantix.border/50">
                    <td className="px-3 py-4">
                      <div className="font-medium text-quantix.text">{holding.name ?? holding.coinId}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-quantix.muted">
                        {holding.symbol ?? holding.coinId}
                      </div>
                    </td>
                    <td className="px-3 py-4 font-mono text-quantix.text">{holding.quantity}</td>
                    <td className="px-3 py-4 font-mono text-quantix.text">{usd(holding.buyPrice)}</td>
                    <td className="px-3 py-4">
                      <div className="font-mono text-quantix.text">{usd(holding.currentPrice)}</div>
                      <div className={`text-xs ${holding.change24h >= 0 ? "text-quantix.green" : "text-quantix.red"}`}>
                        {holding.change24h >= 0 ? "+" : ""}
                        {holding.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-3 py-4 font-mono text-quantix.text">{usd(holding.value)}</td>
                    <td className={`px-3 py-4 font-mono ${holding.pnl >= 0 ? "text-quantix.green" : "text-quantix.red"}`}>
                      {holding.pnl >= 0 ? "+" : ""}
                      {usd(holding.pnl)} ({holding.pnlPct.toFixed(2)}%)
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingHoldingId(holding._id);
                            setDraft({
                              coinId: holding.coinId,
                              quantity: String(holding.quantity),
                              buyPrice: String(holding.buyPrice),
                              symbol: holding.symbol ?? "",
                              name: holding.name ?? "",
                            });
                            setPortfolioName(portfolio?.name ?? "My Portfolio");
                          }}
                          className="rounded-lg border border-quantix.border px-3 py-2 text-xs text-quantix.text hover:bg-quantix.surface/70"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeHoldingMutation.mutate(holding._id)}
                          className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {enrichedHoldings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-sm text-quantix.muted">
                      No holdings yet. Add your first position above.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
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
