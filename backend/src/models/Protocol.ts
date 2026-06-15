import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const ProtocolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 120,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: null,
    },
    chains: {
      type: [String],
      default: [],
    },
    tvl: {
      type: Number,
      min: 0,
      default: 0,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 255,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ProtocolSchema.index({ slug: 1 }, { unique: true });
ProtocolSchema.index({ featured: 1, tvl: -1 });

export type ProtocolDocument = InferSchemaType<typeof ProtocolSchema> & { id: string };

export const ProtocolModel: Model<InferSchemaType<typeof ProtocolSchema>> =
  models.Protocol || model("Protocol", ProtocolSchema);
