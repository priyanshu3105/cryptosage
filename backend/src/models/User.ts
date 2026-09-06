import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 160,
    },
    // Guests have no password; accounts store a bcrypt hash.
    password: {
      type: String,
      minlength: 60,
      maxlength: 255,
      default: null,
    },
    isGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { id: string };

export const UserModel: Model<InferSchemaType<typeof UserSchema>> =
  models.User || model("User", UserSchema);
