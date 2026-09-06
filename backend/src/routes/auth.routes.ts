import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { authRateLimit, guestRateLimit } from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  ChangePasswordBodySchema,
  LoginBodySchema,
  RegisterBodySchema,
  UpgradeGuestBodySchema,
} from "../validators/auth.schema";

const router = Router();

router.post("/guest", guestRateLimit, authController.createGuest);
router.post(
  "/register",
  authRateLimit,
  validate({ body: RegisterBodySchema }),
  authController.register
);
router.post(
  "/login",
  authRateLimit,
  validate({ body: LoginBodySchema }),
  authController.login
);
router.post(
  "/upgrade",
  requireAuth,
  authRateLimit,
  validate({ body: UpgradeGuestBodySchema }),
  authController.upgradeGuest
);
router.post(
  "/change-password",
  requireAuth,
  authRateLimit,
  validate({ body: ChangePasswordBodySchema }),
  authController.changePassword
);
router.get("/me", requireAuth, authController.me);
router.delete("/me", requireAuth, authController.deleteMe);

export default router;
