---
title: Documentation
---

## Purpose

Bring Playwright/Vitest-style typed fixtures to any test runner. Type-safe test fixture management with automatic dependency resolution.

## Features

- **Automatic dependency resolution** - Define dependencies, fixtures are set up in the correct order
- **Type-safe** - Full TypeScript support with type inference
- **Cleanup management** - Automatic cleanup in reverse order
- **Circular dependency detection** - Prevents infinite loops
- **Framework agnostic** - Works with any test framework

## Motivation

Originally built to bring a proper fixture model to `bun:test`, but works with any JavaScript test framework.

## Quick Example

```typescript
import {
  createFixtures,
  defineFixture,
  type FixtureRegistry,
} from "fixtures-ts";

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

## Getting Started

1. [Install](installation) fixtures-ts in your project
2. Follow the [Quick Start](quick-start) guide
3. Explore [Examples](examples) for common patterns
4. Check the [API Reference](api) for detailed documentation
