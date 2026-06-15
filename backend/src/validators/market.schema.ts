import { z } from "zod";
import { MARKET_HISTORY_RANGES } from "../utils/constants";

export const MarketTopQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(250).optional(),
});

export const MarketCoinParamsSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
});

export const MarketHistoryQuerySchema = z.object({
  range: z.enum(MARKET_HISTORY_RANGES).optional(),
});
