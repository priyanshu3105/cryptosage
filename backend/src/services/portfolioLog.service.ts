import { portfolioLogRepo } from "../repositories/portfolioLog.repo";
import { AppError } from "../utils/appError";
import { rebuildHoldingsFromJournal, type ReplayResult } from "./portfolioJournalSync.service";

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

export type ReplayWarning = Exclude<ReplayResult, { ok: true }>;

export type LogWriteResult<T> = {
  log: T;
  replayWarning?: ReplayWarning;
};

function isTrade(actionType: string | undefined): actionType is "buy" | "sell" {
  return actionType === "buy" || actionType === "sell";
}

function validateMergedTradeFields(merged: {
  actionType: string;
  coinId?: string | null;
  quantity?: number | null;
  price?: number | null;
}) {
  if (!isTrade(merged.actionType)) return;
  const coinId = (merged.coinId ?? "").trim();
  if (!coinId) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Buys and sells need a coin. Pick one from the list in the journal form."
    );
  }
  const qty = merged.quantity ?? 0;
  if (qty <= 0) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Enter an amount greater than zero for buys and sells."
    );
  }
  if ((merged.price ?? 0) < 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Price cannot be negative.");
  }
}

/**
 * Run a holdings replay best-effort. Failures are returned as warnings, never thrown,
 * so a single bad historical row cannot block new journal entries.
 */
async function safeReplay(userId: string): Promise<ReplayWarning | undefined> {
  try {
    const result = await rebuildHoldingsFromJournal(userId);
    if (!result.ok) return result;
    return undefined;
  } catch {
    // Defensive: if the underlying rebuild ever throws unexpectedly, surface a generic warning
    // instead of failing the user-facing write.
    return {
      ok: false,
      code: "INVALID_JOURNAL_TRADE",
      message:
        "Holdings could not be recalculated right now. Your entry was saved; please review your journal.",
    };
  }
}

export const portfolioLogService = {
  async create(userId: string, input: LogInput): Promise<LogWriteResult<unknown>> {
    const log = await portfolioLogRepo.create(userId, input);

    let replayWarning: ReplayWarning | undefined;
    if (isTrade(input.actionType)) {
      replayWarning = await safeReplay(userId);
    }

    return { log, replayWarning };
  },

  list(userId: string, query: LogQuery) {
    return portfolioLogRepo.listByUser(userId, query);
  },

  async update(
    userId: string,
    logId: string,
    updates: Partial<LogInput>
  ): Promise<LogWriteResult<unknown>> {
    const existing = await portfolioLogRepo.findById(userId, logId);
    if (!existing) {
      throw new AppError(404, "LOG_NOT_FOUND", "Portfolio log not found");
    }
    const backup = existing.toObject();

    const merged = {
      actionType: updates.actionType ?? backup.actionType,
      coinId: updates.coinId !== undefined ? updates.coinId : backup.coinId,
      quantity: updates.quantity !== undefined ? updates.quantity : backup.quantity,
      price: updates.price !== undefined ? updates.price : backup.price,
    };
    validateMergedTradeFields(merged);

    const updated = await portfolioLogRepo.update(userId, logId, updates);
    if (!updated) {
      throw new AppError(404, "LOG_NOT_FOUND", "Portfolio log not found");
    }

    const tradeRelevantBefore = isTrade(backup.actionType);
    const tradeRelevantAfter = isTrade(merged.actionType);
    const tradeFieldsChanged =
      updates.actionType !== undefined ||
      updates.coinId !== undefined ||
      updates.quantity !== undefined ||
      updates.price !== undefined ||
      updates.fees !== undefined ||
      updates.symbol !== undefined ||
      updates.name !== undefined;

    let replayWarning: ReplayWarning | undefined;
    if ((tradeRelevantBefore || tradeRelevantAfter) && tradeFieldsChanged) {
      replayWarning = await safeReplay(userId);
    }

    return { log: updated, replayWarning };
  },

  async remove(userId: string, logId: string) {
    const deleted = await portfolioLogRepo.remove(userId, logId);
    if (!deleted) {
      throw new AppError(404, "LOG_NOT_FOUND", "Portfolio log not found");
    }

    let replayWarning: ReplayWarning | undefined;
    if (isTrade(deleted.actionType)) {
      replayWarning = await safeReplay(userId);
    }

    return { id: logId, replayWarning };
  },
};
