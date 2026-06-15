import { Types } from "mongoose";
import { PortfolioModel } from "../models/Portfolio";

type CreatePortfolioInput = {
  userId: string;
  name?: string;
};

type HoldingInput = {
  coinId: string;
  quantity: number;
  buyPrice: number;
  symbol?: string;
  name?: string;
};

type HoldingUpdateInput = {
  quantity?: number;
  buyPrice?: number;
  symbol?: string;
  name?: string;
};

export const portfolioRepo = {
  async create(userIdOrInput: string | CreatePortfolioInput) {
    const input =
      typeof userIdOrInput === "string" ? { userId: userIdOrInput } : userIdOrInput;

    return PortfolioModel.create({
      user: input.userId,
      name: input.name ?? "My Portfolio",
      holdings: [],
    });
  },

  async getByUser(userId: string) {
    return PortfolioModel.findOne({ user: userId }).exec();
  },

  async deleteByUser(userId: string) {
    return PortfolioModel.findOneAndDelete({ user: userId }).exec();
  },

  async update(userId: string, updates: { name?: string }) {
    return PortfolioModel.findOneAndUpdate({ user: userId }, { $set: updates }, { new: true }).exec();
  },

  async addHolding(portfolioId: string, holding: HoldingInput) {
    return PortfolioModel.findByIdAndUpdate(
      portfolioId,
      {
        $push: {
          holdings: {
            coinId: holding.coinId,
            quantity: holding.quantity,
            buyPrice: holding.buyPrice,
            symbol: holding.symbol ?? null,
            name: holding.name ?? null,
          },
        },
      },
      { new: true }
    ).exec();
  },

  async updateHolding(portfolioId: string, holdingId: string, updates: HoldingUpdateInput) {
    const setOperations: Record<string, unknown> = {};

    if (updates.quantity !== undefined) {
      setOperations["holdings.$.quantity"] = updates.quantity;
    }
    if (updates.buyPrice !== undefined) {
      setOperations["holdings.$.buyPrice"] = updates.buyPrice;
    }
    if (updates.symbol !== undefined) {
      setOperations["holdings.$.symbol"] = updates.symbol;
    }
    if (updates.name !== undefined) {
      setOperations["holdings.$.name"] = updates.name;
    }

    if (Object.keys(setOperations).length === 0) {
      return PortfolioModel.findById(portfolioId).exec();
    }

    return PortfolioModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(portfolioId),
        "holdings._id": new Types.ObjectId(holdingId),
      },
      { $set: setOperations },
      { new: true }
    ).exec();
  },

  async removeHolding(portfolioId: string, holdingId: string) {
    return PortfolioModel.findByIdAndUpdate(
      portfolioId,
      {
        $pull: {
          holdings: { _id: new Types.ObjectId(holdingId) },
        },
      },
      { new: true }
    ).exec();
  },

  /** Replace all holdings (e.g. after replaying journal buy/sell logs). */
  async replaceHoldings(portfolioId: string, holdings: HoldingInput[]) {
    const embedded = holdings.map((h) => ({
      coinId: h.coinId,
      quantity: h.quantity,
      buyPrice: h.buyPrice,
      symbol: h.symbol ?? null,
      name: h.name ?? null,
    }));
    return PortfolioModel.findByIdAndUpdate(
      portfolioId,
      { $set: { holdings: embedded } },
      { new: true }
    ).exec();
  },
};
