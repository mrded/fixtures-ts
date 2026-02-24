---
title: Examples
---

## Examples

Common patterns and real-world examples for using fixtures-ts.

## Available Examples

### [Database Fixtures](database)

Learn how to set up database fixtures with schema creation and test data seeding.

### [HTTP Client](http-client)

Create fixtures for HTTP clients with authentication and test servers.

### [Shared Dependencies](shared-dependencies)

Understand how multiple fixtures can share common dependencies efficiently.

## General Patterns

### Simple Configuration

```typescript
const registry = {
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),
};
```

### With Cleanup

```typescript
const registry = {
  server: defineFixture([], async () => {
    const server = await startServer();
    return {
      value: server,
      cleanup: async () => await server.close(),
    };
  }),
};
```

### Chained Dependencies

```typescript
const registry = {
  config: defineFixture([], async () => ({ ... })),
  db: defineFixture(['config'], async ({ config }) => ({ ... })),
  cache: defineFixture(['config'], async ({ config }) => ({ ... })),
  service: defineFixture(['db', 'cache'], async ({ db, cache }) => ({ ... })),
};
```

## Test Framework Integration

### Vitest / Jest

```typescript
import { beforeEach, afterEach, test, expect } from "vitest";

const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client } = fixtures.get();
  expect(client).toBeDefined();
});
```

### Bun

```typescript
import { beforeEach, afterEach, test, expect } from "bun:test";

const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client } = fixtures.get();
  expect(client).toBeDefined();
});
```

### Node.js Test Runner

```typescript
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client } = fixtures.get();
  assert(client);
});
```
