---
title: File-Based Organization
---

## File-Based Organization

For larger projects, organize fixtures in separate files for better maintainability and scalability. This guide shows a complete, production-ready example.

You can find the complete working example in the [`tests/fixtures/`](https://github.com/mrded/fixtures-ts/tree/main/tests/fixtures) directory of this repository.

## Recommended Structure

```
tests/
├── fixtures/
│   ├── types.ts           # Fixture type definitions
│   ├── env.fixture.ts     # Config fixture (no dependencies)
│   ├── db.fixture.ts      # Database fixture (depends on env)
│   ├── logger.fixture.ts  # Logger fixture (depends on env)
│   ├── client.fixture.ts  # Client fixture (depends on db, logger)
│   ├── registry.ts        # Central registry
│   └── index.ts           # Typed createFixtures export
└── example.test.ts        # Example test file
```

## Dependency Graph

```
env (root)
├── db
│   └── client
└── logger
    └── client
```

When you request `["client"]`, the setup order is:

1. `env` (set up once, shared by db and logger)
2. `db` and `logger` (sequentially, in dependency order)
3. `client`

Cleanup happens in reverse order.

## Running the Example

```bash
# Run all tests (includes the example)
bun test

# Or run just the example directly
bun test tests/example.test.ts
```

You'll see console output showing:

- Fixture setup order
- Database queries
- Logger messages
- Cleanup in reverse order

## Key Patterns Demonstrated

1. **Separate Files** - Each fixture in its own file for better organization
2. **Dependency Resolution** - Automatic setup based on dependencies
3. **Shared Dependencies** - `env` is only set up once even though both `db` and `logger` depend on it
4. **Selective Fixtures** - Request only what you need per test suite
5. **Cleanup Management** - Automatic cleanup in reverse dependency order

## Fixture Examples

### Simple Fixture (No Dependencies)

```typescript
// env.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";

export default defineFixture<Fixtures, [], Fixtures["env"]>([], async () => ({
  value: {
    apiUrl: "http://localhost:3000",
    dbUrl: "postgresql://localhost/test",
    logLevel: "info",
  },
  cleanup: async () => {
    // No cleanup needed for config
  },
}));
```

### Fixture with Cleanup

```typescript
// db.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";

export default defineFixture<Fixtures, ["env"], Fixtures["db"]>(
  ["env"],
  async ({ env }) => {
    const db = await createDatabase(env.dbUrl);
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  },
);
```

### Fixture with Multiple Dependencies

```typescript
// client.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";

export default defineFixture<Fixtures, ["db", "logger"], Fixtures["client"]>(
  ["db", "logger"],
  async ({ db, logger }) => {
    logger.info("Initializing HTTP client");
    return {
      value: createTestClient(db, logger),
      cleanup: async () => {
        logger.info("Client cleanup");
      },
    };
  },
);
```

## Common Testing Patterns

### Database with Test Data

```typescript
// db.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";

export default defineFixture<Fixtures, ["env"], Fixtures["db"]>(
  ["env"],
  async ({ env }) => {
    const db = await createTestDatabase(env.dbUrl);
    await db.schema.createTable("users").execute();
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  },
);

// testUsers.fixture.ts
export default defineFixture<Fixtures, ["db"], Fixtures["testUsers"]>(
  ["db"],
  async ({ db }) => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    await db.insertInto("users").values(users).execute();
    return {
      value: users,
      cleanup: async () => await db.deleteFrom("users").execute(),
    };
  },
);
```

### HTTP Server and Client

```typescript
// server.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";

export default defineFixture<Fixtures, [], Fixtures["server"]>([], async () => {
  const server = await startTestServer();
  return {
    value: server,
    cleanup: async () => await server.close(),
  };
});

// client.fixture.ts
export default defineFixture<Fixtures, ["server"], Fixtures["client"]>(
  ["server"],
  async ({ server }) => ({
    value: createClient({
      baseUrl: server.url,
      headers: { Authorization: "Bearer test-token" },
    }),
    cleanup: async () => {},
  }),
);
```

### MSW for API Mocking

```typescript
// msw.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";
import { setupServer } from "msw/node";
import { handlers } from "../mocks/handlers";

export default defineFixture<Fixtures, [], Fixtures["msw"]>([], async () => {
  const server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: "error" });
  return {
    value: server,
    cleanup: async () => server.close(),
  };
});
```

### Logger

```typescript
// logger.fixture.ts
import { defineFixture } from "fixtures-ts";
import type { Fixtures } from "./types";

export default defineFixture<Fixtures, ["env"], Fixtures["logger"]>(
  ["env"],
  async ({ env }) => {
    const logger = createLogger({
      level: env.logLevel,
      format: "json",
    });
    return {
      value: logger,
      cleanup: async () => {
        // Flush logs if needed
      },
    };
  },
);
```

## Dependency Resolution

When you request a fixture, all dependencies are automatically resolved:

```typescript
// Dependency chain:
// client.fixture.ts depends on db
// db.fixture.ts depends on env
// env.fixture.ts has no dependencies

const fixtures = createFixtures(["client"]);
await fixtures.setup();
// Sets up: env → db → client
```

Shared dependencies are set up only once:

```typescript
// Both logger and db depend on env
// client depends on both logger and db

const fixtures = createFixtures(["client"]);
await fixtures.setup();
// Sets up: env (once) → logger → db → client
// (or env → db → logger → client, depending on topological sort)
```

## Adapting to Your Project

1. **Update types.ts** - Define your actual fixture types
2. **Create fixture files** - One file per fixture (db, cache, server, etc.)
3. **Update registry.ts** - Import and register all your fixtures
4. **Use in tests** - Import `createFixtures` and request what you need
