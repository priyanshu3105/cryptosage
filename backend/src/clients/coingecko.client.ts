import axios from "axios";
import { env } from "../config/env";

const client = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: env.EXTERNAL_API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

export const coingeckoClient = {
  async getTopCoins(limit: number = 50) {
    const { data } = await client.get("/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: limit,
        page: 1,
        sparkline: true,
        price_change_percentage: "24h,7d",
      },
    });
    return data;
  },

  async getCoinPrice(id: string) {
    const { data } = await client.get("/simple/price", {
      params: {
        ids: id,
        vs_currencies: "usd",
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
      },
    });
    return data;
  },

  async getCoinHistory(coinId: string, range: string = "7") {
    const { data } = await client.get(`/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: "usd",
        days: range,
      },
    });
    return data;
  },
};
