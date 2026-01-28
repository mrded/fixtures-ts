/**
 * fixtures-ts - Type-safe test fixture management with automatic dependency resolution
 *
 * @example
 * ```typescript
 * import { createFixtures, defineFixture, type FixtureRegistry } from "fixtures-ts";
 *
 * type Deps = {
 *   db: Database;
 *   client: TestClient;
 * };
 *
 * const registry: FixtureRegistry<Deps> = {
 *   db: defineFixture([], async () => ({
 *     value: await createDb(),
 *     cleanup: async () => await closeDb(),
 *   })),
 *   client: defineFixture(["db"], async ({ db }) => ({
 *     value: createClient(db),
 *     cleanup: async () => {},
 *   })),
 * };
 *
 * const fixtures = createFixtures(registry, ["client"]);
 * beforeEach(fixtures.setup);
 * afterEach(fixtures.teardown);
 *
 * test("my test", () => {
 *   const { client } = fixtures.get();
 *   // use client
 * });
 * ```
 */

export type {
  Fixture,
  FixtureResult,
  FixtureRegistry,
  AnyFixture,
} from "./types";

export { createFixtures, defineFixture } from "./fixtures";
