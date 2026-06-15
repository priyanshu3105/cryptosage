import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";

type Bucket = {
  count: number;
  windowStart: number;
};

const store = new Map<string, Bucket>();

function createRateLimiter(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || now - bucket.windowStart >= options.windowMs) {
      store.set(key, { count: 1, windowStart: now });
      res.setHeader("X-RateLimit-Limit", String(options.max));
      res.setHeader("X-RateLimit-Remaining", String(options.max - 1));
      return next();
    }

    if (bucket.count >= options.max) {
      next(new AppError(429, "RATE_LIMITED", "Too many requests, please try again later"));
      return;
    }

    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(options.max - bucket.count, 0)));
    next();
  };
}

export const authRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
export const chatRateLimit = createRateLimiter({ windowMs: 60 * 1000, max: 15 });
