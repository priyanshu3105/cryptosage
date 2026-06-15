import { portfolioRepo } from "../repositories/portfolio.repo";
import { portfolioLogRepo } from "../repositories/portfolioLog.repo";
import { portfolioService } from "./portfolio.service";

type Position = {
  coinId: string;
  quantity: number;
  cost: number;
  symbol: string | null;
  name: string | null;
};

const EPS = 1e-12;

export type ReplayResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INVALID_JOURNAL_TRADE"
        | "INVALID_BUY"
        | "INVALID_SELL"
        | "SELL_EXCEEDS_HOLDINGS";
      message: string;
      offendingLogId?: string;
      offendingCreatedAt?: string;
      offendingSymbol?: string | null;
    };

/**
 * Rebuild portfolio holdings from all buy/sell journal entries (chronological replay, average cost basis).
 *
 * Returns a result object instead of throwing so callers can persist user-facing logs even when the
 * derived holdings projection cannot be updated. The journal is the source of truth; holdings are
 * a best-effort cached projection rebuilt from it.
 */
export async function rebuildHoldingsFromJournal(userId: string): Promise<ReplayResult> {
  const portfolio = await portfolioService.getPortfolio(userId);
  const portfolioId = String(portfolio.id ?? portfolio._id);

  const logs = await portfolioLogRepo.findTradeLogsForReplay(userId);
  const positions = new Map<string, Position>();

  for (const log of logs) {
    if (log.actionType !== "buy" && log.actionType !== "sell") continue;

    const logId = String((log as { _id: unknown })._id ?? "");
    const createdAt =
      log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt ?? "");
    const coinId = (log.coinId ?? "").trim();

    if (!coinId) {
      return {
        ok: false,
        code: "INVALID_JOURNAL_TRADE",
        message:
          "A buy or sell entry is missing a coin. Edit or delete that journal entry, then try again.",
        offendingLogId: logId,
        offendingCreatedAt: createdAt,
        offendingSymbol: log.symbol ?? null,
      };
    }

    const qty = log.quantity ?? 0;
    const price = log.price ?? 0;
    const fees = log.fees ?? 0;

    if (log.actionType === "buy") {
      if (qty <= 0 || !Number.isFinite(qty)) {
        return {
          ok: false,
          code: "INVALID_BUY",
          message:
            "Each buy needs a quantity greater than zero. Fix the journal entry and try again.",
          offendingLogId: logId,
          offendingCreatedAt: createdAt,
          offendingSymbol: log.symbol ?? null,
        };
      }
      if (price < 0 || !Number.isFinite(price)) {
        return {
          ok: false,
          code: "INVALID_BUY",
          message: "Buy price cannot be negative.",
          offendingLogId: logId,
          offendingCreatedAt: createdAt,
          offendingSymbol: log.symbol ?? null,
        };
      }

      const prev = positions.get(coinId) ?? {
        coinId,
        quantity: 0,
        cost: 0,
        symbol: log.symbol ?? null,
        name: log.name ?? null,
      };
      prev.cost += qty * price + (fees > 0 ? fees : 0);
      prev.quantity += qty;
      if (log.symbol) prev.symbol = log.symbol;
      if (log.name) prev.name = log.name;
      positions.set(coinId, prev);
      continue;
    }

    // sell
    if (qty <= 0 || !Number.isFinite(qty)) {
      return {
        ok: false,
        code: "INVALID_SELL",
        message: "Each sell needs a quantity greater than zero. Fix the journal entry and try again.",
        offendingLogId: logId,
        offendingCreatedAt: createdAt,
        offendingSymbol: log.symbol ?? null,
      };
    }
    if (price < 0 || !Number.isFinite(price)) {
      return {
        ok: false,
        code: "INVALID_SELL",
        message: "Sell price cannot be negative.",
        offendingLogId: logId,
        offendingCreatedAt: createdAt,
        offendingSymbol: log.symbol ?? null,
      };
    }

    const prev = positions.get(coinId);
    if (!prev || prev.quantity <= EPS) {
      return {
        ok: false,
        code: "SELL_EXCEEDS_HOLDINGS",
        message: `You are trying to sell ${log.symbol ?? coinId}, but your journal does not show any left to sell at that point in time. Add an earlier buy, or reduce the sell amount.`,
        offendingLogId: logId,
        offendingCreatedAt: createdAt,
        offendingSymbol: log.symbol ?? null,
      };
    }

    if (qty > prev.quantity + EPS) {
      return {
        ok: false,
        code: "SELL_EXCEEDS_HOLDINGS",
        message: `You are trying to sell ${qty} of ${log.symbol ?? coinId}, but your journal only shows ${prev.quantity.toFixed(8).replace(/\.?0+$/, "")} on hand at that point in time. Reduce the sell, or add more buys earlier.`,
        offendingLogId: logId,
        offendingCreatedAt: createdAt,
        offendingSymbol: log.symbol ?? null,
      };
    }

    const avgCost = prev.cost / prev.quantity;
    prev.quantity -= qty;
    prev.cost -= qty * avgCost;
    if (prev.quantity <= EPS) {
      prev.quantity = 0;
      prev.cost = 0;
    }
    positions.set(coinId, prev);
  }

  const holdings = Array.from(positions.values())
    .filter((p) => p.quantity > EPS)
    .map((p) => ({
      coinId: p.coinId,
      quantity: p.quantity,
      buyPrice: p.quantity > EPS ? p.cost / p.quantity : 0,
      symbol: p.symbol ?? undefined,
      name: p.name ?? undefined,
    }));

  await portfolioRepo.replaceHoldings(portfolioId, holdings);
  return { ok: true };
}
