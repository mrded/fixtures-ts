import { defineFixture } from "../../src";
import type { Fixtures } from "./types";

/**
 * HTTP Client fixture
 * Depends on: db, logger
 *
 * Note: Both db and logger depend on env, but env will only be set up once
 */
export default defineFixture<Fixtures, ["db", "logger"], Fixtures["client"]>(
  ["db", "logger"],
  async ({ db, logger }) => {
    logger.info("Initializing HTTP client");

    const client = {
      get: async (path: string) => {
        logger.info(`GET ${path}`);
        await db.query(`SELECT * FROM logs WHERE path = '${path}'`);
        return { status: 200, data: {} };
      },
      post: async (path: string, data: unknown) => {
        logger.info(`POST ${path}`);
        await db.query(
          `INSERT INTO logs (path, data) VALUES ('${path}', '...')`,
        );
        return { status: 201, data };
      },
    };

    return {
      value: client,
      cleanup: async () => {
        logger.info("Client cleanup");
      },
    };
  },
);
