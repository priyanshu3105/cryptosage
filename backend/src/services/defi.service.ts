import { defillamaClient } from "../clients/defillama.client";
import { cache } from "../utils/cache";
import {
  DEFI_PROTOCOL_DETAIL_TTL_SECONDS,
  DEFI_PROTOCOL_LIST_TTL_SECONDS,
  DEFI_TVL_TTL_SECONDS,
} from "../utils/constants";
import { retry } from "../utils/retry";
import { AppError } from "../utils/appError";

/** Coerce DefiLlama numeric fields (sometimes strings). */
function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

/**
 * Total TVL from a protocol payload. DefiLlama often sets `tvl`, but some entries only expose
 * per-chain totals on `currentChainTvls` (or omit a numeric top-level `tvl`).
 */
function extractTotalTvlFromProtocol(protocol: Record<string, unknown> | null | undefined): number {
  if (!protocol) return 0;
  let t = num(protocol.tvl);
  if (t > 0) return t;

  const current = protocol.currentChainTvls;
  if (current && typeof current === "object" && !Array.isArray(current)) {
    for (const v of Object.values(current as Record<string, unknown>)) {
      t += num(v);
    }
  }
  if (t > 0) return t;

  const chainTvls = protocol.chainTvls;
  if (chainTvls && typeof chainTvls === "object" && !Array.isArray(chainTvls)) {
    const cv = chainTvls as Record<string, { tvl?: unknown }>;
    for (const block of Object.values(cv)) {
      if (block && typeof block === "object" && "tvl" in block) {
        const arr = block.tvl;
        if (Array.isArray(arr) && arr.length > 0) {
          const last = arr[arr.length - 1] as Record<string, unknown> | undefined;
          const raw = last?.totalLiquidityUSD ?? last?.tvl;
          t += num(raw);
        }
      }
    }
  }

  return t;
}

/** DefiLlama `/protocol/:slug` may expose history as a top-level `tvl` array or under `chainTvls.<chain>.tvl`. */
function extractProtocolTvlHistory(protocol: Record<string, unknown> | null | undefined): unknown[] {
  const top = protocol?.tvl;
  if (Array.isArray(top)) return top;

  const chainTvls = protocol?.chainTvls;
  if (chainTvls && typeof chainTvls === "object" && !Array.isArray(chainTvls)) {
    const cv = chainTvls as Record<string, { tvl?: unknown[] }>;
    const eth = cv.Ethereum?.tvl;
    if (Array.isArray(eth)) return eth;
    for (const key of Object.keys(cv)) {
      const block = cv[key];
      if (block && typeof block === "object" && Array.isArray((block as { tvl?: unknown[] }).tvl)) {
        return (block as { tvl: unknown[] }).tvl;
      }
    }
  }
  return [];
}

export const defiService = {
  /** Full protocol list (sorted by TVL desc). Paginate on the client so filters still work. */
  async getProtocols() {
    const cacheKey = "defi:protocols:all";

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const protocols = await retry(() => defillamaClient.getProtocols());

      const mapped = (protocols as Record<string, unknown>[])
        .map((p) => ({
          name: p.name as string,
          slug: p.slug as string,
          tvl: extractTotalTvlFromProtocol(p),
          category: (p.category as string) ?? null,
          chains: Array.isArray(p.chains)
            ? (p.chains as string[])
            : p.chain
              ? [String(p.chain)]
              : [],
          logo: typeof p.logo === "string" ? p.logo : null,
          change1d:
            typeof p.change_1d === "number"
              ? p.change_1d
              : typeof p.change1d === "number"
                ? p.change1d
                : 0,
        }))
        .sort((a, b) => b.tvl - a.tvl);

      cache.set(cacheKey, mapped, DEFI_PROTOCOL_LIST_TTL_SECONDS);
      return mapped;
    } catch (error) {
      if (cached) {
        return cached;
      }

      throw new AppError(502, "DEFI_UPSTREAM_ERROR", "Unable to fetch protocol list");
    }
  },

  async getProtocol(slug: string) {
    const cacheKey = `defi:protocol:${slug}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const protocol = (await retry(() =>
        defillamaClient.getProtocol(slug),
      )) as Record<string, unknown> | null;
      const formatted = {
        name: (protocol?.name as string) ?? slug,
        slug: (protocol?.slug as string) ?? slug,
        category: (protocol?.category as string) ?? null,
        chains: Array.isArray(protocol?.chains) ? (protocol.chains as string[]) : [],
        tvl: extractTotalTvlFromProtocol(protocol),
        logo: typeof protocol?.logo === "string" ? protocol.logo : null,
        description: (protocol?.description as string) ?? null,
        url: (protocol?.url as string) ?? null,
        twitter: protocol?.twitter ?? null,
        audits: protocol?.audits ?? null,
        auditNote: protocol?.audit_note ?? null,
        change1d:
          typeof protocol?.change_1d === "number"
            ? protocol.change_1d
            : typeof protocol?.change1d === "number"
              ? protocol.change1d
              : null,
      };

      cache.set(cacheKey, formatted, DEFI_PROTOCOL_DETAIL_TTL_SECONDS);
      return formatted;
    } catch (error) {
      if (cached) {
        return cached;
      }

      throw new AppError(502, "DEFI_UPSTREAM_ERROR", "Unable to fetch protocol details");
    }
  },

  async getProtocolTVL(slug: string, range: "30d" | "90d" | "180d" = "90d") {
    const cacheKey = `defi:protocol:${slug}:tvl:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const protocol = (await retry(() =>
        defillamaClient.getProtocol(slug)
      )) as Record<string, unknown>;
      const rangeDays = Number(range.replace(/d$/i, ""));
      const history = extractProtocolTvlHistory(protocol);
      const filteredHistory = history.slice(Math.max(history.length - rangeDays, 0)) as Record<
        string,
        unknown
      >[];

      const formatted = {
        slug,
        range,
        tvl: filteredHistory.map((entry) => {
          const rawDate = entry.date ?? entry.timestamp;
          const sec =
            typeof rawDate === "number"
              ? rawDate
              : typeof rawDate === "string"
                ? Number(rawDate)
                : 0;
          const tvlVal = entry.totalLiquidityUSD ?? entry.tvl ?? 0;
          return {
            timestamp: new Date(sec > 1e12 ? sec : sec * 1000).toISOString(),
            tvl: typeof tvlVal === "number" ? tvlVal : Number(tvlVal) || 0,
          };
        }),
      };

      cache.set(cacheKey, formatted, DEFI_TVL_TTL_SECONDS);
      return formatted;
    } catch (error) {
      if (cached) {
        return cached;
      }

      throw new AppError(502, "DEFI_UPSTREAM_ERROR", "Unable to fetch protocol TVL history");
    }
  },

};
