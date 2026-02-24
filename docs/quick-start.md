---
title: Quick Start
---

## Quick Start

This guide will walk you through creating your first fixtures and using them in tests.

## Basic Concepts

**Fixtures** are test resources that can depend on other fixtures. The system automatically:

- Sets up fixtures in dependency order
- Cleans up in reverse order
- Deduplicates shared dependencies
- Detects circular dependencies

## Step 1: Define Your Dependencies Type

First, define the shape of all your fixtures:

```typescript
type Deps = {
  config: AppConfig;
  db: Database;
  client: TestClient;
};
```

## Step 2: Create Fixtures

Use `defineFixture` to create individual fixtures:

```typescript
import { defineFixture, type FixtureRegistry } from "fixtures-ts";

const registry: FixtureRegistry<Deps> = {
  // Fixture with no dependencies
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),

  // Fixture that depends on config
  db: defineFixture(["config"], async ({ config }) => ({
    value: await createDatabase(config.dbUrl),
    cleanup: async () => await closeDatabase(),
  })),

  // Fixture that depends on db
  client: defineFixture(["db"], async ({ db }) => ({
    value: createTestClient(db),
    cleanup: async () => {},
  })),
};
```

## Step 3: Use in Tests

Create a fixture instance and integrate with your test framework:

```typescript
import { createFixtures } from "fixtures-ts";

// Request only what you need - dependencies are automatic
const fixtures = createFixtures(registry, ["client"]);

// Setup before each test
beforeEach(fixtures.setup);

// Cleanup after each test
afterEach(fixtures.teardown);

// Use in tests
test("should work", async () => {
  const { client } = fixtures.get();
  // ... your test code
});
```

## How It Works

When you request `['client']`, the system:

1. Analyzes dependencies: `client` needs `db`, which needs `config`
2. Sets up in order: `config` → `db` → `client`
3. Makes the requested fixtures (here: `client`) available via `fixtures.get()`; dependencies are set up automatically
4. Cleans up in reverse order: `client` → `db` → `config`

## Next Steps

- Learn more about [defining fixtures](guide/defining-fixtures)
- Understand [dependency resolution](guide/dependencies)
- Explore [example patterns](examples)
