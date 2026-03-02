import { defineFixture } from "../../src";
import type { Fixtures } from "./types";

/**
 * Logger fixture
 * Depends on: env
 */
export default defineFixture<Fixtures, ["env"], Fixtures["logger"]>(
  ["env"],
  async ({ env }) => {
    console.log(`[Logger] Initializing with level: ${env.logLevel}`);

    const logger = {
      info: (msg: string) => console.log(`[INFO] ${msg}`),
      error: (msg: string) => console.error(`[ERROR] ${msg}`),
    };

    return {
      value: logger,
      cleanup: async () => {
        console.log("[Logger] Cleanup");
      },
    };
  },
);
