import express from "express";
import { randomUUID } from "crypto";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { db } from "./config/db";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import portfolioRoutes from "./routes/portfolio.routes";
import marketRoutes from "./routes/market.routes";
import defiRoutes from "./routes/defi.routes";
import chatRoutes from "./routes/chat.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";

export function createApp() {
  const app = express();

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  const marketLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many market requests, please try again in a moment.",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const defiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many DeFi data requests, please try again in a moment.",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => {
    req.requestId = req.header("x-request-id") || randomUUID();
    res.setHeader("x-request-id", req.requestId);
    next();
  });

  app.use(globalLimiter);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      data: {
        status: "ok",
        services: {
          backend: true,
          mongo: db.getStatus().connected,
          groqConfigured: Boolean(env.GROQ_API_KEY),
        },
      },
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/portfolio", portfolioRoutes);
  app.use("/api/market", marketLimiter, marketRoutes);
  app.use("/api/defi", defiLimiter, defiRoutes);
  app.use("/api/chat", chatRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
