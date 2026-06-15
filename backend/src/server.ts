import { createApp } from "./app";
import { env } from "./config/env";
import { db } from "./config/db";
import { logger } from "./config/logger";

async function start() {
  try {
    await db.connect();
  } catch (err) {
    logger.warn({ err }, "Database connection failed, starting API without DB");
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server running");
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Startup failed");
  process.exit(1);
});