import { coingeckoClient } from "../clients/coingecko.client";
import { cache } from "../utils/cache";
import {
  MARKET_HISTORY_RANGES,
  MARKET_HISTORY_TTL_SECONDS,
  MARKET_PRICE_TTL_SECONDS,
  MARKET_TOP_TTL_SECONDS,
} from "../utils/constants";

type MarketHistoryRange = (typeof MARKET_HISTORY_RANGES)[number];
import { retry } from "../utils/retry";
import { AppError } from "../utils/appError";

function formatRangeToDays(range: string) {
  return range.replace(/d$/i, "");
}

export const marketService = {
  async getTopCoins(limit: number = 50) {
    const cacheKey = `market:top:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await retry(() => coingeckoClient.getTopCoins(limit));

      const filtered = data.map((coin: Record<string, unknown>, index: number) => {
        const spark = coin.sparkline_in_7d as { price?: number[] } | undefined;
        const prices = Array.isArray(spark?.price) ? spark.price : [];
        return {
          id: coin.id as string,
          symbol: coin.symbol as string,
          name: coin.name as string,
          image: (coin.image as string | null) ?? null,
          price: coin.current_price as number,
          marketCap: coin.market_cap as number,
          volume24h: coin.total_volume as number,
          change24h: (coin.price_change_percentage_24h as number) ?? 0,
          change7d:
            (coin.price_change_percentage_7d_in_currency as number | null) ??
            (coin.price_change_percentage_7d as number | null) ??
            0,
          marketCapRank:
            typeof coin.market_cap_rank === "number" ? coin.market_cap_rank : index + 1,
          sparkline: prices,
        };
      });

      cache.set(cacheKey, filtered, MARKET_TOP_TTL_SECONDS);
      return filtered;
    } catch (error) {
      if (cached) {
        return cached;
      }

      throw new AppError(
        502,
        "MARKET_UPSTREAM_ERROR",
        "Unable to fetch market data",
      );
    }
  },

  async getCoinPrice(coinId: string) {
    const cacheKey = `market:price:${coinId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await retry(() => coingeckoClient.getCoinPrice(coinId));
      const priceData = data?.[coinId];

      if (!priceData) {
        throw new AppError(404, "COIN_NOT_FOUND", "Coin not found");
      }

      const formatted = {
        id: coinId,
        currency: "usd",
        price: priceData.usd ?? null,
        marketCap: priceData.usd_market_cap ?? null,
        volume24h: priceData.usd_24h_vol ?? null,
        change24h: priceData.usd_24h_change ?? null,
      };

      cache.set(cacheKey, formatted, MARKET_PRICE_TTL_SECONDS);
      return formatted;
    } catch (error) {
      if (cached) {
        return cached;
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        502,
        "MARKET_UPSTREAM_ERROR",
        "Unable to fetch coin price",
      );
    }
  },

  async getCoinHistory(coinId: string, range: MarketHistoryRange) {
    const cacheKey = `market:history:${coinId}:${range}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await retry(() =>
        coingeckoClient.getCoinHistory(coinId, formatRangeToDays(range)),
      );

      const formatted = {
        coinId,
        range,
        prices: Array.isArray(data?.prices)
          ? data.prices.map((entry: [number, number]) => ({
              timestamp: new Date(entry[0]).toISOString(),
              price: entry[1],
            }))
          : [],
        marketCaps: Array.isArray(data?.market_caps)
          ? data.market_caps.map((entry: [number, number]) => ({
              timestamp: new Date(entry[0]).toISOString(),
              marketCap: entry[1],
            }))
          : [],
        volumes: Array.isArray(data?.total_volumes)
          ? data.total_volumes.map((entry: [number, number]) => ({
              timestamp: new Date(entry[0]).toISOString(),
              volume: entry[1],
            }))
          : [],
      };

      cache.set(cacheKey, formatted, MARKET_HISTORY_TTL_SECONDS);
      return formatted;
    } catch (error) {
      if (cached) {
        return cached;
      }

      throw new AppError(
        502,
        "MARKET_UPSTREAM_ERROR",
        "Unable to fetch coin history",
      );
    }
  },
};
