import type { AnyFixture, FixtureRegistry, FixtureResult } from "./types";

/**
 * Topologically sort fixtures based on their dependencies
 * Throws an error if circular dependencies are detected
 */
const sortFixtures = <T>(fixtures: T[], dependencies: Map<T, T[]>): T[] => {
  const sorted: T[] = [];
  const visited = new Set<T>();
  const visiting = new Set<T>();

  const visit = (name: T): void => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected: ${String(name)}`);
    }

    visiting.add(name);

    const deps = dependencies.get(name);
    if (deps) {
      for (const dep of deps) {
        visit(dep);
      }
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(name);
  };

  for (const fixture of fixtures) {
    visit(fixture);
  }

  return sorted;
};

/**
 * Get a fixture from the registry, throwing if not found
 */
const getFixture = <Deps extends Record<string, unknown>>(
  registry: FixtureRegistry<Deps>,
  name: keyof Deps,
): AnyFixture<Deps> => {
  const fixture = registry[name];
  if (!fixture) {
    throw new Error(`Fixture not found: ${String(name)}`);
  }
  return fixture as AnyFixture<Deps>;
};

/**
 * Setup fixtures with automatic dependency resolution
 *
 * @param registry - Registry of all available fixtures
 * @param requested - Fixture names requested for the test
 * @returns Object with setup, teardown, and get methods
 *
 * @example
 * ```typescript
 * const fixtures = createFixtures(registry, ["client", "db"]);
 * beforeEach(fixtures.setup);
 * afterEach(fixtures.teardown);
 *
 * test("my test", async () => {
 *   const { client, db } = fixtures.get();
 *   // use fixtures
 * });
 * ```
 */
export const createFixtures = <
  Deps extends Record<string, unknown>,
  K extends keyof Deps,
>(
  registry: FixtureRegistry<Deps>,
  requested: readonly K[],
) => {
  const state = {
    deps: null as Deps | null,
    cleanups: [] as Array<() => Promise<void>>,
  };

  const setup = async () => {
    const dependencies = new Map<keyof Deps, (keyof Deps)[]>();
    const toLoad = new Set<keyof Deps>(requested);

    // Build dependency graph
    for (const name of requested) {
      const loadDeps = (n: keyof Deps) => {
        if (dependencies.has(n)) return;
        const fixture = getFixture(registry, n);
        const d = [...fixture.dependencies];
        dependencies.set(n, d);
        d.forEach((dep) => {
          toLoad.add(dep);
          loadDeps(dep);
        });
      };
      loadDeps(name);
    }

    const sorted = sortFixtures(Array.from(toLoad), dependencies);
    const values = {} as Deps;
    state.cleanups = [];

    try {
      for (const name of sorted) {
        const fixture = getFixture(registry, name);
        const result = await fixture.setup(values);
        values[name] = result.value as never;
        state.cleanups.push(result.cleanup);
      }

      state.deps = values;
    } catch (error) {
      // Cleanup already-created fixtures before rethrowing
      for (const cleanup of [...state.cleanups].reverse()) {
        // Ignore cleanup errors
        await cleanup().catch(() => {});
      }
      state.cleanups = [];
      state.deps = null;
      throw error;
    }
  };

  const teardown = async () => {
    for (const cleanup of state.cleanups.reverse()) {
      // Ignore cleanup errors
      await cleanup().catch(() => {});
    }
    state.deps = null;
    state.cleanups = [];
  };

  const get = (): Pick<Deps, K> => {
    if (!state.deps) throw new Error("Fixtures not initialized");
    return Object.fromEntries(
      requested.map((name) => [name, state.deps![name]]),
    ) as Pick<Deps, K>;
  };

  return { setup, teardown, get };
};

/**
 * Helper to define a fixture with minimal boilerplate
 *
 * @example
 * ```typescript
 * export default defineFixture(
 *   ["fetch"],
 *   async ({ fetch }) => ({
 *     value: createClient({ fetch }),
 *     cleanup: async () => {},
 *   })
 * );
 * ```
 */
export const defineFixture = <
  Deps extends Record<string, unknown>,
  const DepsKeys extends ReadonlyArray<keyof Deps>,
  T,
>(
  dependencies: DepsKeys,
  setup: (deps: Pick<Deps, DepsKeys[number]>) => Promise<FixtureResult<T>>,
): {
  readonly dependencies: DepsKeys;
  setup: typeof setup;
} => ({
  dependencies,
  setup,
});
