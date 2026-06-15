import { NextFunction, Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { AppError } from "../utils/appError";

export const chatController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await chatService.ask(req.body, req.requestId ?? "unknown");
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async askPortfolioInsights(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
      }
      const result = await chatService.askPortfolioInsights(req.authUser.id, req.body);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
};
