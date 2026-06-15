import { z } from "zod";

export const CreatePortfolioBodySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
});

export const UpdatePortfolioBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export const AddHoldingBodySchema = z.object({
  coinId: z.string().trim().min(1).max(80),
  quantity: z.number().positive(),
  buyPrice: z.number().nonnegative(),
  symbol: z.string().trim().max(20).optional(),
  name: z.string().trim().max(120).optional(),
});

export const UpdateHoldingBodySchema = z
  .object({
    quantity: z.number().positive().optional(),
    buyPrice: z.number().nonnegative().optional(),
    symbol: z.string().trim().max(20).optional(),
    name: z.string().trim().max(120).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one holding field must be provided",
  });

export const HoldingParamsSchema = z.object({
  holdingId: z.string().trim().min(1),
});
