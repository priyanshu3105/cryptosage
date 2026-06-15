import { Router } from "express";
import { portfolioController } from "../controllers/portfolio.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  AddHoldingBodySchema,
  CreatePortfolioBodySchema,
  HoldingParamsSchema,
  UpdateHoldingBodySchema,
  UpdatePortfolioBodySchema,
} from "../validators/portfolio.schema";
import { portfolioLogController } from "../controllers/portfolioLog.controller";
import {
  CreatePortfolioLogBodySchema,
  PortfolioLogParamsSchema,
  PortfolioLogQuerySchema,
  UpdatePortfolioLogBodySchema,
} from "../validators/portfolioLog.schema";

const router = Router();

router.use(requireAuth);

router.post("/", validate({ body: CreatePortfolioBodySchema }), portfolioController.create);
router.get("/", portfolioController.get);
router.put("/", validate({ body: UpdatePortfolioBodySchema }), portfolioController.update);
router.post("/holdings", validate({ body: AddHoldingBodySchema }), portfolioController.addHolding);
router.put(
  "/holdings/:holdingId",
  validate({ params: HoldingParamsSchema, body: UpdateHoldingBodySchema }),
  portfolioController.updateHolding
);
router.delete(
  "/holdings/:holdingId",
  validate({ params: HoldingParamsSchema }),
  portfolioController.removeHolding
);
router.post("/logs", validate({ body: CreatePortfolioLogBodySchema }), portfolioLogController.create);
router.get("/logs", validate({ query: PortfolioLogQuerySchema }), portfolioLogController.list);
router.put(
  "/logs/:logId",
  validate({ params: PortfolioLogParamsSchema, body: UpdatePortfolioLogBodySchema }),
  portfolioLogController.update
);
router.delete(
  "/logs/:logId",
  validate({ params: PortfolioLogParamsSchema }),
  portfolioLogController.remove
);

export default router;
