import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AppError } from "../utils/appError";

export const authController = {
  async createGuest(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.createGuest();
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async upgradeGuest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
      }

      const { name, email, password } = req.body;
      const result = await authService.upgradeGuest(req.authUser.id, {
        name,
        email,
        password,
      });
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
      }

      const user = await authService.me(req.authUser.id);
      res.json({ data: user });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
      }

      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.authUser.id,
        currentPassword,
        newPassword
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authUser) {
        throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
      }

      const result = await authService.deleteAccount(req.authUser.id);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  },
};
