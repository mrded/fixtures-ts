import { type FixtureRegistry } from "../../src";
import type { Fixtures } from "./types";
import envFixture from "./env.fixture";
import dbFixture from "./db.fixture";
import loggerFixture from "./logger.fixture";
import clientFixture from "./client.fixture";

/**
 * Central registry combining all fixtures
 * Import and register each fixture here
 */
export const registry: FixtureRegistry<Fixtures> = {
  env: envFixture,
  db: dbFixture,
  logger: loggerFixture,
  client: clientFixture,
};
