import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { userRepo } from "../repositories/user.repo";
import { AppError } from "../utils/appError";

type AuthTokenPayload = {
  userId: string;
  iat?: number;
  exp?: number;
};

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    const user = await userRepo.findById(payload.userId);

    if (!user) {
      throw new AppError(401, "AUTH_INVALID", "Invalid authentication token");
    }

    req.authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isGuest: Boolean(user.isGuest),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "AUTH_INVALID", "Invalid authentication token"));
  }
}
