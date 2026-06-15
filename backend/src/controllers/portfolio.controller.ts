import { NextFunction, Request, Response } from "express";
import { portfolioService } from "../services/portfolio.service";
import { AppError } from "../utils/appError";

function getAuthenticatedUserId(req: Request) {
  if (!req.authUser) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  }

  return req.authUser.id;
}

export const portfolioController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const portfolio = await portfolioService.createPortfolio(userId, req.body.name);
      res.status(201).json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const portfolio = await portfolioService.getPortfolio(userId);
      res.json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const portfolio = await portfolioService.updatePortfolio(userId, req.body.name);
      res.json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async addHolding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const { coinId, quantity, buyPrice, symbol, name } = req.body;
      const portfolio = await portfolioService.addHolding(
        userId,
        coinId,
        quantity,
        buyPrice,
        symbol,
        name
      );
      res.status(201).json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async updateHolding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const holdingId = String(req.params.holdingId);
      const { quantity, buyPrice, symbol, name } = req.body;
      const portfolio = await portfolioService.updateHolding(
        userId,
        holdingId,
        quantity,
        buyPrice,
        symbol,
        name
      );
      res.json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  },

  async removeHolding(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const holdingId = String(req.params.holdingId);
      const portfolio = await portfolioService.removeHolding(userId, holdingId);
      res.json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  },
};
