---
title: API Reference
---

## API Reference

Complete API documentation for fixtures-ts.

## Functions

### `defineFixture(dependencies, setup)`

Creates a fixture definition.

**Parameters:**

- `dependencies`: `readonly DepsKeys[]` - Array of fixture names this fixture depends on
- `setup`: `(deps: Pick<Deps, DepsKeys>) => Promise<FixtureResult<T>>` - Async function that sets up the fixture

**Returns:** `Fixture<Deps, K, DepsKeys>`

**Example:**

```typescript
defineFixture(["db"], async ({ db }) => ({
  value: createClient(db),
  cleanup: async () => await closeClient(),
}));
```

### `createFixtures(registry, requested)`

Creates a fixture instance for use in tests.

**Parameters:**

- `registry`: `FixtureRegistry<Deps>` - The fixture registry containing all fixture definitions
- `requested`: `readonly (keyof Deps)[]` - Array of fixture names to set up

**Returns:** Object with methods:

- `setup(): Promise<void>` - Sets up all requested fixtures and their dependencies
- `get(): Deps` - Returns all fixture values
- `teardown(): Promise<void>` - Cleans up all fixtures in reverse order

**Example:**

```typescript
const fixtures = createFixtures(registry, ["client"]);
await fixtures.setup();
const { client } = fixtures.get();
await fixtures.teardown();
```

## Types

### `FixtureResult<T>`

The return type of a fixture setup function.

```typescript
type FixtureResult<T> = {
  value: T;
  cleanup: () => Promise<void>;
};
```

**Properties:**

- `value`: `T` - The fixture value that will be available in tests
- `cleanup`: `() => Promise<void>` - Async function to clean up the fixture

### `Fixture<Deps, K, DepsKeys>`

Represents a single fixture definition.

```typescript
type Fixture<Deps, K, DepsKeys extends keyof Deps> = {
  dependencies: readonly DepsKeys[];
  setup: (deps: Pick<Deps, DepsKeys>) => Promise<FixtureResult<Deps[K]>>;
};
```

**Properties:**

- `dependencies`: Array of dependency names
- `setup`: Function that creates the fixture value and cleanup

### `FixtureRegistry<Deps>`

A collection of all fixture definitions.

```typescript
type FixtureRegistry<Deps> = {
  [K in keyof Deps]: Fixture<Deps, K, any>;
};
```

Each key in `Deps` must have a corresponding fixture definition.

## Usage Patterns

### Complete Example

```typescript
import {
  createFixtures,
  defineFixture,
  type FixtureRegistry,
  type FixtureResult,
} from "fixtures-ts";

// 1. Define your dependency types
type Deps = {
  config: AppConfig;
  db: Database;
  client: TestClient;
};

// 2. Create fixture registry
const registry: FixtureRegistry<Deps> = {
  config: defineFixture(
    [],
    async (): Promise<FixtureResult<AppConfig>> => ({
      value: { apiUrl: "http://localhost:3000" },
      cleanup: async () => {},
    }),
  ),

  db: defineFixture(
    ["config"],
    async ({ config }): Promise<FixtureResult<Database>> => ({
      value: await createDatabase(config.dbUrl),
      cleanup: async () => await closeDatabase(),
    }),
  ),

  client: defineFixture(
    ["db"],
    async ({ db }): Promise<FixtureResult<TestClient>> => ({
      value: createClient(db),
      cleanup: async () => {},
    }),
  ),
};

// 3. Create fixtures instance
const fixtures = createFixtures(registry, ["client"]);

// 4. Use in tests
beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client, db, config } = fixtures.get();
  // All dependencies are available
});
```

### Type Inference

TypeScript infers types automatically:

```typescript
const registry = {
  db: defineFixture([], async () => ({
    value: await createDatabase(), // Returns Database
    cleanup: async () => {},
  })),

  client: defineFixture(["db"], async ({ db }) => {
    // db is typed as Database
    const client = createClient(db);
    return {
      value: client, // Returns TestClient
      cleanup: async () => {},
    };
  }),
};

const fixtures = createFixtures(registry, ["client"]);
await fixtures.setup();

const { db, client } = fixtures.get();
// db is Database
// client is TestClient
```

### Error Handling

```typescript
try {
  await fixtures.setup();
} catch (error) {
  console.error("Setup failed:", error);
}

try {
  await fixtures.teardown();
} catch (error) {
  console.error("Cleanup failed:", error);
  // Note: If a cleanup throws, remaining cleanups will NOT run
}
```

### Circular Dependencies

```typescript
// This will throw an error at runtime
const registry = {
  a: defineFixture(['b'], async ({ b }) => ({ ... })),
  b: defineFixture(['a'], async ({ a }) => ({ ... })), // Error!
};

// Error: Circular dependency detected: a -> b -> a
```

## Advanced Usage

### Conditional Fixtures

```typescript
const registry = {
  db: defineFixture([], async () => {
    const useInMemory = process.env.USE_IN_MEMORY_DB === "true";

    const db = useInMemory
      ? await createInMemoryDb()
      : await createPostgresDb();

    return {
      value: db,
      cleanup: async () => await db.close(),
    };
  }),
};
```

### Fixture Factories

```typescript
function createDatabaseFixture(connectionString: string) {
  return defineFixture([], async () => {
    const db = await createDatabase(connectionString);
    return {
      value: db,
      cleanup: async () => await db.close(),
    };
  });
}

const registry = {
  testDb: createDatabaseFixture("postgresql://localhost/test"),
  prodDb: createDatabaseFixture("postgresql://localhost/prod"),
};
```
