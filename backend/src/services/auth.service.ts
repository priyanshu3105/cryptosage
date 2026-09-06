import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepo } from "../repositories/user.repo";
import { portfolioRepo } from "../repositories/portfolio.repo";
import { chatSessionRepo } from "../repositories/chatSession.repo";
import { portfolioLogRepo } from "../repositories/portfolioLog.repo";
import { env } from "../config/env";
import { AppError } from "../utils/appError";

const GUEST_TOKEN_TTL = "30d";
const ACCOUNT_TOKEN_TTL = "7d";

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  isGuest?: boolean | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isGuest: Boolean(user.isGuest),
  };
}

function signToken(userId: string, isGuest: boolean) {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: isGuest ? GUEST_TOKEN_TTL : ACCOUNT_TOKEN_TTL,
  });
}

export const authService = {
  // Throwaway account so visitors can use portfolio/journal without signup.
  async createGuest() {
    const handle = randomBytes(12).toString("hex");

    const user = await userRepo.create({
      name: "Guest",
      email: `guest_${handle}@guest.cryptosage.local`,
      password: null,
      isGuest: true,
    });

    return {
      token: signToken(user.id, true),
      user: toPublicUser(user),
    };
  },

  async register(email: string, password: string, name: string) {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      throw new AppError(409, "USER_EXISTS", "A user with this email already exists");
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await userRepo.create({
      email,
      password: hash,
      name,
      isGuest: false,
    });

    return {
      token: signToken(user.id, false),
      user: toPublicUser(user),
    };
  },

  async login(email: string, password: string) {
    const user = await userRepo.findByEmail(email);
    if (!user || user.isGuest || !user.password) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    return {
      token: signToken(user.id, false),
      user: toPublicUser(user),
    };
  },

  // Keep the same userId so portfolio/journal/chat stay attached.
  async upgradeGuest(
    userId: string,
    input: { name: string; email: string; password: string }
  ) {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    if (!user.isGuest) {
      throw new AppError(400, "NOT_A_GUEST", "Only guest sessions can be upgraded");
    }

    const existing = await userRepo.findByEmail(input.email);
    if (existing && String(existing._id) !== userId) {
      throw new AppError(409, "USER_EXISTS", "A user with this email already exists");
    }

    const hash = await bcrypt.hash(input.password, 10);
    const upgraded = await userRepo.upgradeGuest(userId, {
      name: input.name,
      email: input.email,
      password: hash,
    });

    if (!upgraded) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return {
      token: signToken(upgraded.id, false),
      user: toPublicUser(upgraded),
    };
  },

  async me(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return toPublicUser(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepo.findById(userId);

    if (!user || user.isGuest || !user.password) {
      throw new AppError(400, "NOT_AN_ACCOUNT", "Guest sessions cannot change passwords");
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

    return { message: "Password changed successfully." };
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
      message: user.isGuest
        ? "Session data deleted successfully."
        : "User account deleted successfully.",
    };
  },
};
