import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { portfolioLogService, type ReplayWarning } from "../services/portfolioLog.service";

function getAuthenticatedUserId(req: Request) {
  if (!req.authUser) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
  }
  return req.authUser.id;
}

function metaWithWarning(warning?: ReplayWarning) {
  if (!warning) return undefined;
  return {
    replayWarning: {
      code: warning.code,
      message: warning.message,
      offendingLogId: warning.offendingLogId,
      offendingCreatedAt: warning.offendingCreatedAt,
      offendingSymbol: warning.offendingSymbol ?? undefined,
    },
  };
}

export const portfolioLogController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const { log, replayWarning } = await portfolioLogService.create(userId, req.body);
      const body: { data: unknown; meta?: ReturnType<typeof metaWithWarning> } = { data: log };
      const meta = metaWithWarning(replayWarning);
      if (meta) body.meta = meta;
      res.status(201).json(body);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const result = await portfolioLogService.list(userId, req.query as Record<string, unknown>);
      res.json({
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const logId = String(req.params.logId);
      const { log, replayWarning } = await portfolioLogService.update(userId, logId, req.body);
      const body: { data: unknown; meta?: ReturnType<typeof metaWithWarning> } = { data: log };
      const meta = metaWithWarning(replayWarning);
      if (meta) body.meta = meta;
      res.json(body);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthenticatedUserId(req);
      const logId = String(req.params.logId);
      const result = await portfolioLogService.remove(userId, logId);
      const { replayWarning, ...rest } = result;
      const body: { data: unknown; meta?: ReturnType<typeof metaWithWarning> } = { data: rest };
      const meta = metaWithWarning(replayWarning);
      if (meta) body.meta = meta;
      res.json(body);
    } catch (error) {
      next(error);
    }
  },
};
