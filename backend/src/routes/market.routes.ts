import { Router } from "express";
import { marketController } from "../controllers/market.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  MarketCoinParamsSchema,
  MarketHistoryQuerySchema,
  MarketTopQuerySchema,
} from "../validators/market.schema";

const router = Router();

router.get(
  "/top",
  validate({ query: MarketTopQuerySchema }),
  marketController.getTop,
);
router.get(
  "/price/:coinId",
  validate({ params: MarketCoinParamsSchema }),
  marketController.getCoinPrice,
);
router.get(
  "/history/:coinId",
  validate({ params: MarketCoinParamsSchema, query: MarketHistoryQuerySchema }),
  marketController.getCoinHistory,
);

export default router;
