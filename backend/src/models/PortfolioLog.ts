import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const PortfolioLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coinId: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    symbol: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 20,
      default: null,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    actionType: {
      type: String,
      enum: ["buy", "sell", "note", "analysis", "risk"],
      required: true,
    },
    quantity: {
      type: Number,
      min: 0,
      default: null,
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
    fees: {
      type: Number,
      min: 0,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    sentiment: {
      type: String,
      enum: ["bullish", "bearish", "neutral"],
      default: null,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PortfolioLogSchema.index({ user: 1, createdAt: -1 });
PortfolioLogSchema.index({ user: 1, actionType: 1 });
PortfolioLogSchema.index({ user: 1, symbol: 1 });

export type PortfolioLogDocument = InferSchemaType<typeof PortfolioLogSchema> & { id: string };

export const PortfolioLogModel: Model<InferSchemaType<typeof PortfolioLogSchema>> =
  models.PortfolioLog || model("PortfolioLog", PortfolioLogSchema);
