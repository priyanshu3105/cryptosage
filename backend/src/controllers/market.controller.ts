import { Request, Response, NextFunction } from "express";
import { marketService } from "../services/market.service";

export const marketController = {
  async getTop(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const data = await marketService.getTopCoins(limit);
      res.json({ data, meta: { source: "CoinGecko", limit } });
    } catch (error) {
      next(error);
    }
  },

  async getCoinPrice(req: Request, res: Response, next: NextFunction) {
    try {
      const coinId = String(req.params.coinId);
      const data = await marketService.getCoinPrice(coinId);
      res.json({ data, meta: { source: "CoinGecko" } });
    } catch (error) {
      next(error);
    }
  },

  async getCoinHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const coinId = String(req.params.coinId);
      const range = (req.query.range ? String(req.query.range) : "7d") as
        | "1d"
        | "7d"
        | "30d"
        | "90d";
      const data = await marketService.getCoinHistory(coinId, range);
      res.json({ data, meta: { source: "CoinGecko", range } });
    } catch (error) {
      next(error);
    }
  },
};
