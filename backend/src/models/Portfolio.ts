import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const HoldingSchema = new Schema(
  {
    coinId: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
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
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    buyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    versionKey: false,
  }
);

const PortfolioSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      default: "My Portfolio",
    },
    holdings: {
      type: [HoldingSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
PortfolioSchema.index({ "holdings.coinId": 1 });

export type HoldingDocument = InferSchemaType<typeof HoldingSchema> & { _id: Types.ObjectId };
export type PortfolioDocument = InferSchemaType<typeof PortfolioSchema> & { id: string };

export const PortfolioModel: Model<InferSchemaType<typeof PortfolioSchema>> =
  models.Portfolio || model("Portfolio", PortfolioSchema);
