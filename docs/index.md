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

type Fixtures = {
  db: Database;
  client: TestClient;
};

const registry: FixtureRegistry<Fixtures> = {
  db: defineFixture<Fixtures, [], Fixtures["db"]>([], async () => ({
    value: await createTestDatabase(),
    cleanup: async () => await closeDatabase(),
  })),

  client: defineFixture<Fixtures, ["db"], Fixtures["client"]>(
    ["db"],
    async ({ db }) => ({
      value: createTestClient(db),
      cleanup: async () => {},
    }),
  ),
};

const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client } = fixtures.get();
  // use client...
});
```

## Getting Started

1. Check out the [Getting Started](getting-started) guide for installation, quick start, and API reference
2. Learn about [File Organization](file-organization) for practical patterns and larger projects
