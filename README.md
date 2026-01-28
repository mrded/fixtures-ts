# fixture-kit

Type-safe test fixture management with automatic dependency resolution.

## Features

- **Automatic dependency resolution** - Define dependencies, fixtures are set up in the correct order
- **Type-safe** - Full TypeScript support with type inference
- **Cleanup management** - Automatic cleanup in reverse order
- **Circular dependency detection** - Prevents infinite loops
- **Framework agnostic** - Works with any test framework

## Installation

```bash
npm install fixture-kit
# or
yarn add fixture-kit
# or
pnpm add fixture-kit
# or
bun add fixture-kit
```

## Quick Start

```typescript
import {
  createFixtures,
  defineFixture,
  type FixtureRegistry,
} from "fixture-kit";

// Define your dependencies
type Deps = {
  db: Database;
  client: TestClient;
};

// Create a fixture registry
const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => ({
    value: await createTestDatabase(),
    cleanup: async () => await closeDatabase(),
  })),

  client: defineFixture(["db"], async ({ db }) => ({
    value: createTestClient(db),
    cleanup: async () => {},
  })),
};

// Use in tests
const fixtures = createFixtures(registry, ["client"]);
beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should fetch users", async () => {
  const { client } = fixtures.get();
  const users = await client.fetchUsers();
  expect(users).toHaveLength(0);
});
```

## How It Works

**Fixtures** are test resources with dependencies. Define them once, request what you need, and the system handles:

- Setup in dependency order
- Cleanup in reverse order
- Shared dependency deduplication
- Circular dependency detection

## API

### `defineFixture(dependencies, setup)`

Creates a fixture definition.

```typescript
defineFixture(
  ["dep1", "dep2"], // or [] for no dependencies
  async ({ dep1, dep2 }) => ({
    value: createResource(dep1, dep2),
    cleanup: async () => cleanupResource(),
  }),
);
```

### `createFixtures(registry, requested)`

Creates a fixture instance for tests.

```typescript
const fixtures = createFixtures(registry, ["fixture1", "fixture2"]);

await fixtures.setup(); // Setup all fixtures
const deps = fixtures.get(); // Get fixture values
await fixtures.teardown(); // Cleanup all fixtures
```

## Examples

### No Dependencies

```typescript
const registry: FixtureRegistry<Deps> = {
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),
};
```

### With Dependencies

```typescript
const registry: FixtureRegistry<Deps> = {
  config: defineFixture([], async () => ({
    value: loadConfig(),
    cleanup: async () => {},
  })),

  database: defineFixture(["config"], async ({ config }) => ({
    value: await createDatabase(config.databaseUrl),
    cleanup: async () => await closeDatabase(),
  })),

  client: defineFixture(["database"], async ({ database }) => ({
    value: createClient(database),
    cleanup: async () => {},
  })),
};

// Request only what you need - dependencies are automatic
const fixtures = createFixtures(registry, ["client"]);
// Sets up: config → database → client
```

### Multiple Dependencies

```typescript
const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => ({ ... })),
  cache: defineFixture([], async () => ({ ... })),

  authService: defineFixture(["db", "cache"], async ({ db, cache }) => ({
    value: createAuthService(db, cache),
    cleanup: async () => {},
  })),
};
```

### Shared Dependencies

When multiple fixtures depend on the same fixture, it's only set up once:

```typescript
const registry: FixtureRegistry<Deps> = {
  config: defineFixture([], async () => ({ ... })),

  // Both depend on config
  db: defineFixture(["config"], async ({ config }) => ({ ... })),
  cache: defineFixture(["config"], async ({ config }) => ({ ... })),

  // Depends on both db and cache
  service: defineFixture(["db", "cache"], async ({ db, cache }) => ({ ... })),
};

// config is set up once, then db and cache, then service
const fixtures = createFixtures(registry, ["service"]);
```

## Common Patterns

### Database with Test Data

```typescript
const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();
    await db.schema.createTable("users").execute();
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),

  testUsers: defineFixture(["db"], async ({ db }) => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    await db.insertInto("users").values(users).execute();
    return {
      value: users,
      cleanup: async () => await db.deleteFrom("users").execute(),
    };
  }),
};
```

### HTTP Client with Auth

```typescript
const registry: FixtureRegistry<Deps> = {
  server: defineFixture([], async () => {
    const server = await startTestServer();
    return {
      value: server,
      cleanup: async () => await server.close(),
    };
  }),

  authToken: defineFixture(["server"], async ({ server }) => ({
    value: await server.createTestToken({ userId: "test-user" }),
    cleanup: async () => {},
  })),

  client: defineFixture(
    ["server", "authToken"],
    async ({ server, authToken }) => ({
      value: createClient({
        baseUrl: server.url,
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      cleanup: async () => {},
    }),
  ),
};
```

## Types

```typescript
type FixtureResult<T> = {
  value: T;
  cleanup: () => Promise<void>;
};

type Fixture<Deps, K, DepsKeys> = {
  dependencies: readonly DepsKeys[];
  setup: (deps: Pick<Deps, DepsKeys>) => Promise<FixtureResult<Deps[K]>>;
};

type FixtureRegistry<Deps> = {
  [K in keyof Deps]: Fixture<Deps, K, any>;
};
```

## License

MIT
