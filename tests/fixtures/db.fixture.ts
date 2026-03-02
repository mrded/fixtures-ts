import { defineFixture } from "../../src";
import type { Fixtures } from "./types";

/**
 * Database fixture
 * Depends on: env
 */
export default defineFixture<Fixtures, ["env"], Fixtures["db"]>(
  ["env"],
  async ({ env }) => {
    // Simulate database connection
    console.log(`[DB] Connecting to ${env.dbUrl}`);
    const db = {
      query: async (sql: string) => {
        console.log(`[DB] Executing query: ${sql}`);
        return [];
      },
      close: async () => {
        console.log("[DB] Closing connection");
      },
    };

    return {
      value: db,
      cleanup: async () => {
        await db.close();
      },
    };
  },
);
