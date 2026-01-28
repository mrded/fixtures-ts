/**
 * Result returned by a fixture function
 */
export type FixtureResult<T> = {
  value: T;
  cleanup: () => Promise<void>;
};

/**
 * A fixture that creates a test resource with explicit dependencies
 *
 * @template Deps - The record type mapping fixture names to their value types
 * @template K - The key in Deps that this fixture provides
 * @template DepsKeys - The keys in Deps that this fixture depends on
 *
 * @example
 * ```typescript
 * const clientFixture: Fixture<Deps, "client", "fetch"> = {
 *   dependencies: ["fetch"] as const,
 *   setup: async ({ fetch }) => ({
 *     value: createClient({ fetch }),
 *     cleanup: async () => {},
 *   }),
 * };
 * ```
 */
export type Fixture<
  Deps extends Record<string, unknown>,
  K extends keyof Deps,
  DepsKeys extends keyof Deps = never,
> = {
  dependencies: readonly DepsKeys[];
  setup: (deps: Pick<Deps, DepsKeys>) => Promise<FixtureResult<Deps[K]>>;
};

/**
 * Internal type for fixture with erased generics
 */
export type AnyFixture<Deps extends Record<string, unknown>> = {
  dependencies: readonly (keyof Deps)[];
  setup: (deps: Deps) => Promise<{
    value: unknown;
    cleanup: () => Promise<void>;
  }>;
};

/**
 * A registry mapping fixture names to their fixture functions
 */
export type FixtureRegistry<Deps extends Record<string, unknown>> = {
  [K in keyof Deps]: Fixture<Deps, K, any>;
};
