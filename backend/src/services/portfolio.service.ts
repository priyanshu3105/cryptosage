import { portfolioRepo } from "../repositories/portfolio.repo";
import { AppError } from "../utils/appError";

export const portfolioService = {
  async getPortfolio(userId: string) {
    let portfolio = await portfolioRepo.getByUser(userId);

    if (!portfolio) {
      portfolio = await portfolioRepo.create({
        userId,
        name: "My Portfolio",
      });
    }

    return portfolio;
  },

  async createPortfolio(userId: string, name?: string) {
    const existing = await portfolioRepo.getByUser(userId);

    if (existing) {
      throw new AppError(409, "PORTFOLIO_EXISTS", "Portfolio already exists for this user");
    }

    return portfolioRepo.create({ userId, name });
  },

  async updatePortfolio(userId: string, name: string) {
    const updated = await portfolioRepo.update(userId, { name });

    if (!updated) {
      throw new AppError(404, "PORTFOLIO_NOT_FOUND", "Portfolio not found");
    }

    return updated;
  },

  async addHolding(
    userId: string,
    coinId: string,
    quantity: number,
    buyPrice: number,
    symbol?: string,
    name?: string
  ) {
    const portfolio = await portfolioRepo.getByUser(userId);

    if (!portfolio) {
      throw new AppError(404, "PORTFOLIO_NOT_FOUND", "Portfolio not found");
    }

    return portfolioRepo.addHolding(portfolio.id, {
      coinId,
      quantity,
      buyPrice,
      symbol,
      name,
    });
  },

  async updateHolding(
    userId: string,
    holdingId: string,
    quantity?: number,
    buyPrice?: number,
    symbol?: string,
    name?: string
  ) {
    const portfolio = await portfolioRepo.getByUser(userId);

    if (!portfolio) {
      throw new AppError(404, "PORTFOLIO_NOT_FOUND", "Portfolio not found");
    }

    const updated = await portfolioRepo.updateHolding(portfolio.id, holdingId, {
      quantity,
      buyPrice,
      symbol,
      name,
    });

    if (!updated) {
      throw new AppError(404, "HOLDING_NOT_FOUND", "Holding not found");
    }

    return updated;
  },

  async removeHolding(userId: string, holdingId: string) {
    const portfolio = await portfolioRepo.getByUser(userId);

    if (!portfolio) {
      throw new AppError(404, "PORTFOLIO_NOT_FOUND", "Portfolio not found");
    }

    return portfolioRepo.removeHolding(portfolio.id, holdingId);
  },

};
