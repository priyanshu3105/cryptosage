import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepo } from "../repositories/user.repo";
import { portfolioRepo } from "../repositories/portfolio.repo";
import { chatSessionRepo } from "../repositories/chatSession.repo";
import { portfolioLogRepo } from "../repositories/portfolioLog.repo";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

export const authService = {
  async register(email: string, password: string, name: string) {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      throw new AppError(
        409,
        "USER_EXISTS",
        "A user with this email already exists",
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userRepo.create({
      email,
      password: hash,
      name,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  },

  async login(email: string, password: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  },

  async me(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError(
        400,
        "PASSWORD_REUSE",
        "New password must be different from the current password"
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepo.updatePassword(user.id, passwordHash);

    return {
      message: "Password changed successfully.",
    };
  },

  async deleteAccount(userId: string) {
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    await Promise.all([
      portfolioRepo.deleteByUser(userId),
      portfolioLogRepo.deleteByUser(userId),
      chatSessionRepo.deleteByUser(userId),
      userRepo.deleteById(userId),
    ]);

    return {
      message: "User account deleted successfully.",
    };
  },
};
