import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

let isConnected = false;

export const db = {
  async connect() {
    if (isConnected) return;

    mongoose.set("strictQuery", true);

    try {
      await mongoose.connect(env.MONGODB_URI, {
        autoIndex: env.NODE_ENV !== "production",
      });

      isConnected = true;
      logger.info({ mongo: mongoose.connection.name }, "MongoDB connected");

      mongoose.connection.on("error", (err) => {
        logger.error({ err }, "MongoDB connection error");
      });

      mongoose.connection.on("disconnected", () => {
        isConnected = false;
        logger.warn("MongoDB disconnected");
      });
    } catch (err) {
      logger.fatal({ err }, "MongoDB connection failed");
      throw err;
    }
  },

  getStatus() {
    const state = mongoose.connection.readyState;
    return { readyState: state, connected: state === 1 };
  },

  async disconnect() {
    if (!isConnected) return;
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected (manual)");
  },
};