import { Request, Response, NextFunction } from "express";
import { defiService } from "../services/defi.service";

export const defiController = {
  async getProtocols(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await defiService.getProtocols();
      res.json({ data, meta: { source: "DefiLlama", total: data.length } });
    } catch (error) {
      next(error);
    }
  },

  async getProtocol(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const data = await defiService.getProtocol(slug);
      res.json({ data, meta: { source: "DefiLlama" } });
    } catch (error) {
      next(error);
    }
  },

  async getProtocolTVL(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const range = (req.query.range ? String(req.query.range) : "90d") as
        | "30d"
        | "90d"
        | "180d";
      const data = await defiService.getProtocolTVL(slug, range);
      res.json({ data, meta: { source: "DefiLlama", range } });
    } catch (error) {
      next(error);
    }
  },
};
