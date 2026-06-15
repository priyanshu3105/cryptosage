import { Types } from "mongoose";
import { PortfolioLogModel } from "../models/PortfolioLog";

type LogInput = {
  coinId?: string;
  symbol?: string;
  name?: string;
  actionType: "buy" | "sell" | "note" | "analysis" | "risk";
  quantity?: number;
  price?: number;
  fees?: number;
  tags?: string[];
  sentiment?: "bullish" | "bearish" | "neutral";
  note: string;
};

type LogQuery = {
  from?: string;
  to?: string;
  symbols?: string[];
  actionTypes?: Array<"buy" | "sell" | "note" | "analysis" | "risk">;
  sentiment?: Array<"bullish" | "bearish" | "neutral">;
  search?: string;
  page?: number;
  pageSize?: number;
};

export const portfolioLogRepo = {
  async create(userId: string, input: LogInput) {
    return PortfolioLogModel.create({
      user: userId,
      ...input,
      coinId: input.coinId ?? null,
      symbol: input.symbol ?? null,
      name: input.name ?? null,
      quantity: input.quantity ?? null,
      price: input.price ?? null,
      fees: input.fees ?? null,
      tags: input.tags ?? [],
      sentiment: input.sentiment ?? null,
    });
  },

  async listByUser(userId: string, query: LogQuery) {
    const filter: Record<string, unknown> = { user: userId };
    const andClauses: Array<Record<string, unknown>> = [];

    if (query.from || query.to) {
      const createdAt: Record<string, string> = {};
      if (query.from) createdAt.$gte = query.from;
      if (query.to) createdAt.$lte = query.to;
      andClauses.push({ createdAt });
    }

    if (query.symbols && query.symbols.length > 0) {
      andClauses.push({ symbol: { $in: query.symbols.map((s) => s.toUpperCase()) } });
    }
    if (query.actionTypes && query.actionTypes.length > 0) {
      andClauses.push({ actionType: { $in: query.actionTypes } });
    }
    if (query.sentiment && query.sentiment.length > 0) {
      andClauses.push({ sentiment: { $in: query.sentiment } });
    }
    if (query.search && query.search.trim().length > 0) {
      andClauses.push({
        $or: [
          { note: { $regex: query.search.trim(), $options: "i" } },
          { symbol: { $regex: query.search.trim(), $options: "i" } },
          { name: { $regex: query.search.trim(), $options: "i" } },
        ],
      });
    }
    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      PortfolioLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      PortfolioLogModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, pageSize, hasMore: skip + items.length < total };
  },

  async getRecentByUser(userId: string, limit: number) {
    return PortfolioLogModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Math.max(1, limit)))
      .exec();
  },

  /** All buy/sell logs in chronological order for portfolio replay. */
  async findTradeLogsForReplay(userId: string) {
    return PortfolioLogModel.find({
      user: userId,
      actionType: { $in: ["buy", "sell"] as const },
    })
      .sort({ createdAt: 1 })
      .exec();
  },

  async findById(userId: string, logId: string) {
    return PortfolioLogModel.findOne({
      _id: new Types.ObjectId(logId),
      user: userId,
    }).exec();
  },

  async update(userId: string, logId: string, updates: Partial<LogInput>) {
    return PortfolioLogModel.findOneAndUpdate(
      { _id: new Types.ObjectId(logId), user: new Types.ObjectId(userId) },
      { $set: updates },
      { new: true }
    ).exec();
  },

  async remove(userId: string, logId: string) {
    return PortfolioLogModel.findOneAndDelete({
      _id: new Types.ObjectId(logId),
      user: new Types.ObjectId(userId),
    }).exec();
  },

  /** Restore journal fields after a failed portfolio replay (e.g. invalid edit). */
  async restoreFromBackup(
    userId: string,
    logId: string,
    backup: {
      coinId?: string | null;
      symbol?: string | null;
      name?: string | null;
      actionType: string;
      quantity?: number | null;
      price?: number | null;
      fees?: number | null;
      tags?: string[];
      sentiment?: string | null;
      note: string;
    }
  ) {
    return PortfolioLogModel.findOneAndUpdate(
      { _id: new Types.ObjectId(logId), user: userId },
      {
        $set: {
          coinId: backup.coinId ?? null,
          symbol: backup.symbol ?? null,
          name: backup.name ?? null,
          actionType: backup.actionType,
          quantity: backup.quantity ?? null,
          price: backup.price ?? null,
          fees: backup.fees ?? null,
          tags: backup.tags ?? [],
          sentiment: backup.sentiment ?? null,
          note: backup.note,
        },
      },
      { new: true }
    ).exec();
  },

  async deleteByUser(userId: string) {
    return PortfolioLogModel.deleteMany({ user: new Types.ObjectId(userId) }).exec();
  },
};
