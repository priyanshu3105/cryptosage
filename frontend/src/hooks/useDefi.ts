import { useState, useEffect, useCallback } from "react";
import type { Protocol, ProtocolDetail } from "@/types";
import { apiClient } from "@/services/api";
import { mockProtocols } from "@/services/mock-data";

type ProtocolListRow = {
  name: string;
  slug: string;
  tvl: number;
  category: string | null;
  chains: string[];
  logo: string | null;
  change1d: number;
};

type ProtocolDetailRow = {
  name: string;
  slug: string;
  category: string | null;
  chains: string[];
  tvl: number;
  logo: string | null;
  description: string | null;
  url: string | null;
  audits: string | number | null;
  change1d: number | null;
};

type ProtocolTvlRow = {
  slug: string;
  range: string;
  tvl: Array<{ timestamp: string; tvl: number }>;
};

export function useDefi() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chainFilter, setChainFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fetchProtocols = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ProtocolListRow[]>("/defi/protocols");
      setProtocols(
        data.map((p) => ({
          id: p.slug,
          slug: p.slug,
          name: p.name,
          icon: p.logo ?? undefined,
          tvl: p.tvl,
          tvlChange24h: p.change1d ?? 0,
          chain: p.chains?.[0] ?? "Unknown",
          category: p.category ?? "Uncategorized",
        }))
      );
    } catch {
      setProtocols(
        mockProtocols.map((p) => ({
          ...p,
          slug: p.id || p.name.toLowerCase().replace(/\s+/g, "-"),
        }))
      );
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProtocols();
  }, [fetchProtocols]);

  const chains = ["all", ...new Set(protocols.map((p) => p.chain))];
  const categories = ["all", ...new Set(protocols.map((p) => p.category))];

  const filtered = protocols.filter((p) => {
    if (chainFilter !== "all" && p.chain !== chainFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  return {
    protocols: filtered,
    chains,
    categories,
    isLoading,
    error,
    chainFilter,
    setChainFilter,
    categoryFilter,
    setCategoryFilter,
    refetch: fetchProtocols,
  };
}

export function useProtocolDetail(id: string | undefined, listProtocol?: Protocol | null) {
  const [protocol, setProtocol] = useState<ProtocolDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProtocol(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setProtocol(null);

    const load = async () => {
      try {
        const detail = await apiClient.get<ProtocolDetailRow>(`/defi/protocols/${id}`);

        let tvlPoints: Array<{ timestamp: string; tvl: number }> = [];
        try {
          const tvlPayload = await apiClient.get<ProtocolTvlRow>(`/defi/protocols/${id}/tvl`);
          const raw = tvlPayload?.tvl;
          tvlPoints = Array.isArray(raw) ? raw : [];
        } catch {
          tvlPoints = [];
        }

        const tvlChange =
          detail.change1d != null && Number.isFinite(detail.change1d)
            ? detail.change1d
            : typeof listProtocol?.tvlChange24h === "number"
              ? listProtocol.tvlChange24h
              : 0;

        const tvlHistory = tvlPoints.map((point) => ({
          timestamp: new Date(point.timestamp).getTime(),
          tvl: typeof point.tvl === "number" ? point.tvl : Number(point.tvl) || 0,
        }));

        const apiTvl = typeof detail.tvl === "number" && Number.isFinite(detail.tvl) ? detail.tvl : 0;
        const listTvl = typeof listProtocol?.tvl === "number" && Number.isFinite(listProtocol.tvl) ? listProtocol.tvl : 0;
        const lastHistTvl = tvlHistory.length > 0 ? tvlHistory[tvlHistory.length - 1].tvl : 0;
        const resolvedTvl = apiTvl > 0 ? apiTvl : listTvl > 0 ? listTvl : lastHistTvl;

        setProtocol({
          id: detail.slug,
          slug: detail.slug,
          name: detail.name,
          icon: detail.logo ?? listProtocol?.icon,
          tvl: resolvedTvl,
          tvlChange24h: tvlChange,
          chain: detail.chains?.[0] ?? listProtocol?.chain ?? "Unknown",
          category: detail.category ?? listProtocol?.category ?? "Uncategorized",
          url: detail.url ?? undefined,
          description: detail.description ?? undefined,
          tvlHistory,
          chains: detail.chains ?? [],
          audits: detail.audits != null ? [`Audits: ${detail.audits}`] : [],
        });
      } catch {
        const found = mockProtocols.find((p) => (p.id || p.name.toLowerCase().replace(/\s+/g, "-")) === id);
        if (found) {
          setProtocol({
            ...found,
            slug: found.id || found.name.toLowerCase().replace(/\s+/g, "-"),
            icon: found.icon,
            description: `${found.name} is a DeFi protocol.`,
            tvlHistory: Array.from({ length: 30 }, (_, i) => ({
              timestamp: Date.now() - (29 - i) * 86400000,
              tvl: found.tvl * (0.9 + Math.random() * 0.2),
            })),
            chains: [found.chain],
          });
        } else {
          setProtocol(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, listProtocol?.slug]);

  return { protocol, isLoading };
}
