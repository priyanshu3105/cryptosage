import { z } from "zod";
import { DEFI_TVL_RANGES } from "../utils/constants";

export const DefiProtocolsQuerySchema = z.object({});

export const DefiSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});

export const DefiTvlQuerySchema = z.object({
  range: z.enum(DEFI_TVL_RANGES).optional(),
});
