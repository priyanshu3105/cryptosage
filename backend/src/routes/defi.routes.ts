import { Router } from "express";
import { defiController } from "../controllers/defi.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  DefiProtocolsQuerySchema,
  DefiSlugParamsSchema,
  DefiTvlQuerySchema,
} from "../validators/defi.schema";

const router = Router();

router.get(
  "/protocols",
  validate({ query: DefiProtocolsQuerySchema }),
  defiController.getProtocols,
);
router.get(
  "/protocols/:slug",
  validate({ params: DefiSlugParamsSchema }),
  defiController.getProtocol,
);
router.get(
  "/protocols/:slug/tvl",
  validate({ params: DefiSlugParamsSchema, query: DefiTvlQuerySchema }),
  defiController.getProtocolTVL,
);

export default router;
