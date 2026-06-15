import { http } from "../../services/http";
import type { MarketTopResponse } from "./market.types";

export async function fetchTopCoins(limit = 50): Promise<MarketTopResponse> {
  const res = await http.get<MarketTopResponse>("/market/top", {
    params: { limit },
  });
  return res.data;
}