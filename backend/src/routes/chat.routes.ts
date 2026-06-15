import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { chatRateLimit } from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate.middleware";
import { ChatRequestSchema, PortfolioInsightsRequestSchema } from "../validators/chat.schema";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", chatRateLimit, validate({ body: ChatRequestSchema }), chatController.create);
router.post(
  "/portfolio-insights",
  requireAuth,
  chatRateLimit,
  validate({ body: PortfolioInsightsRequestSchema }),
  chatController.askPortfolioInsights
);

export default router;
