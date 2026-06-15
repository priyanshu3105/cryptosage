import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";

function usd(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function DefiPage() {
  const [chainFilter, setChainFilter] = useState("all");
  const defiQuery = useQuery({
    queryKey: ["defi-protocols", 15],
    queryFn: () => api.getDefiProtocols(15),
    refetchInterval: 10 * 60_000,
  });

  const protocols = defiQuery.data?.data ?? [];
  const availableChains = useMemo(() => {
    const values = new Set<string>();
    for (const protocol of protocols) {
      for (const chain of protocol.chains) values.add(chain);
    }

    return ["all", ...Array.from(values).slice(0, 20)];
  }, [protocols]);

  const filteredProtocols =
    chainFilter === "all"
      ? protocols
      : protocols.filter((protocol) => protocol.chains.includes(chainFilter));

  const totalTVL = filteredProtocols.reduce((sum, protocol) => sum + protocol.tvl, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl">DeFi Dashboard</h1>
          <p className="mt-2 text-sm text-quantix.muted">
            Explore protocol TVL, chain coverage, and deeper protocol-specific context.
          </p>
        </div>

        <select
          value={chainFilter}
          onChange={(event) => setChainFilter(event.target.value)}
          className="rounded-xl border border-quantix.border bg-quantix.card/80 px-4 py-3 text-sm text-quantix.text"
        >
          {availableChains.map((chain) => (
            <option key={chain} value={chain}>
              {chain === "all" ? "All chains" : chain}
            </option>
          ))}
        </select>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Protocols in view" value={String(filteredProtocols.length)} />
        <InfoCard label="Combined TVL" value={usd(totalTVL)} />
        <InfoCard label="Data source" value={defiQuery.data?.meta?.source ?? "DefiLlama"} />
      </section>

      <section className="glass-card rounded-2xl border border-quantix.border/70 p-4">
        {defiQuery.isLoading ? (
          <div className="py-12 text-center text-sm text-quantix.muted">Loading protocols...</div>
        ) : defiQuery.isError ? (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Unable to load DeFi protocols right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-quantix.muted">
                <tr>
                  <th className="px-3 py-3">Protocol</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Chains</th>
                  <th className="px-3 py-3">TVL</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredProtocols.map((protocol) => (
                  <tr key={protocol.slug} className="border-t border-quantix.border/50">
                    <td className="px-3 py-4 font-medium text-quantix.text">{protocol.name}</td>
                    <td className="px-3 py-4 text-quantix.muted">{protocol.category ?? "Unknown"}</td>
                    <td className="px-3 py-4 text-quantix.muted">{protocol.chains.slice(0, 4).join(", ")}</td>
                    <td className="px-3 py-4 font-mono text-quantix.text">{usd(protocol.tvl)}</td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        to={`/defi/${protocol.slug}`}
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

function InfoCard(props: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl border border-quantix.border/70 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-quantix.muted">{props.label}</div>
      <div className="mt-3 font-heading text-2xl text-quantix.text">{props.value}</div>
    </div>
  );
}
