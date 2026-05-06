import { logger } from "./lib/logger";
import { createServer } from "./server";

const rawPort = process.env["PORT"] || "5003";

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const { start } = createServer();
start(port).catch((err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
