import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";
import { AppError } from "../utils/appError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = req.requestId ?? "unknown";

  if (err instanceof AppError) {
    logger.warn(
      { err: { code: err.code, message: err.message }, requestId },
      "Handled application error"
    );

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    });
    return;
  }

  logger.error({ err, requestId }, "Unhandled error");
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
      requestId,
    },
  });
}
