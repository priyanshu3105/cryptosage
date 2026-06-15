import { z } from "zod";

const ActionTypeSchema = z.enum(["buy", "sell", "note", "analysis", "risk"]);
const SentimentSchema = z.enum(["bullish", "bearish", "neutral"]);

/** Plain object only — Zod v4 forbids `.partial()` on schemas that already use `.refine()`. */
const PortfolioLogBodyBaseSchema = z.object({
  coinId: z.string().trim().min(1).max(80).optional(),
  symbol: z.string().trim().min(1).max(20).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  actionType: ActionTypeSchema,
  quantity: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  fees: z.number().nonnegative().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  sentiment: SentimentSchema.optional(),
  note: z.string().trim().min(1).max(5000),
});

export const CreatePortfolioLogBodySchema = PortfolioLogBodyBaseSchema.refine(
  (data) => {
    if (data.actionType === "buy" || data.actionType === "sell") {
      return (
        !!data.coinId?.trim() &&
        data.quantity !== undefined &&
        data.quantity > 0 &&
        data.price !== undefined &&
        data.price >= 0
      );
    }
    return true;
  },
  {
    message:
      "Buys and sells need a coin, quantity greater than zero, and price (per coin, in USD).",
    path: ["coinId"],
  }
);

export const UpdatePortfolioLogBodySchema = PortfolioLogBodyBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one log field must be provided" }
);

export const PortfolioLogParamsSchema = z.object({
  logId: z.string().trim().min(1),
});

export const PortfolioLogQuerySchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  symbols: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const raw = Array.isArray(value) ? value : value.split(",");
      return raw.map((v) => v.trim()).filter(Boolean);
    }),
  actionTypes: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const raw = Array.isArray(value) ? value : value.split(",");
      return raw
        .map((v) => v.trim())
        .filter(Boolean)
        .filter((v): v is z.infer<typeof ActionTypeSchema> =>
          ["buy", "sell", "note", "analysis", "risk"].includes(v)
        );
    }),
  sentiment: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const raw = Array.isArray(value) ? value : value.split(",");
      return raw
        .map((v) => v.trim())
        .filter(Boolean)
        .filter((v): v is z.infer<typeof SentimentSchema> =>
          ["bullish", "bearish", "neutral"].includes(v)
        );
    }),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
