import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 4000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);

const ChatSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 8,
      maxlength: 64,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    mode: {
      type: String,
      enum: ["market", "defi", "auto"],
      default: "auto",
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
export type ChatSessionDocument = InferSchemaType<typeof ChatSessionSchema> & { id: string };

export const ChatSessionModel: Model<InferSchemaType<typeof ChatSessionSchema>> =
  models.ChatSession || model("ChatSession", ChatSessionSchema);
