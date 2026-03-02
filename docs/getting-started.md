---
title: Getting Started
---

## Installation

Install fixtures-ts using your preferred package manager:

```bash
npm install fixtures-ts
yarn add fixtures-ts
pnpm add fixtures-ts
bun add fixtures-ts
```

**Requirements:** Node.js 18.0.0 or higher

## Quick Start

**Fixtures** are test resources that can depend on other fixtures. The system automatically:

- Sets up fixtures in dependency order
- Cleans up in reverse order
- Deduplicates shared dependencies
- Detects circular dependencies

### Step 1: Define Your Fixtures Type

```typescript
type Fixtures = {
  config: AppConfig;
  db: Database;
  client: TestClient;
};
```

### Step 2: Create Fixtures

```typescript
import { defineFixture, type FixtureRegistry } from "fixtures-ts";

const registry: FixtureRegistry<Fixtures> = {
  // Fixture with no dependencies
  config: defineFixture<Fixtures, [], Fixtures["config"]>([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),

  // Fixture that depends on config
  db: defineFixture<Fixtures, ["config"], Fixtures["db"]>(
    ["config"],
    async ({ config }) => ({
      value: await createDatabase(config.dbUrl),
      cleanup: async () => await closeDatabase(),
    }),
  ),

  // Fixture that depends on db
  client: defineFixture<Fixtures, ["db"], Fixtures["client"]>(
    ["db"],
    async ({ db }) => ({
      value: createTestClient(db),
      cleanup: async () => {},
    }),
  ),
};
```

### Step 3: Use in Tests

```typescript
import { createFixtures } from "fixtures-ts";

// Request only what you need - dependencies are automatic
const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client } = fixtures.get();
  // ... your test code
});
```

### How It Works

When you request `['client']`, the system:

1. Analyzes dependencies: `client` needs `db`, which needs `config`
2. Sets up in order: `config` → `db` → `client`
3. Makes all fixtures available via `fixtures.get()`
4. Cleans up in reverse order: `client` → `db` → `config`

## API Reference

### `defineFixture(dependencies, setup)`

Defines a fixture with its dependencies and setup logic.

```typescript
defineFixture<Fixtures, ["db"], Fixtures["client"]>(
  ["db"], // Dependencies this fixture needs
  async ({ db }) => ({
    // Setup function receives dependencies
    value: createClient(db),
    cleanup: async () => await closeClient(),
  }),
);
```

**Type Parameters:**

- `Fixtures` - Your complete fixtures type
- `["db"]` - Array of dependency names (empty `[]` for no dependencies)
- `Fixtures["client"]` - The type this fixture returns

### `createFixtures(registry, requested)`

Creates a fixture instance for use in your tests.

```typescript
const fixtures = createFixtures(registry, ["client"]);
```

**Returns:**

- `setup()` - Sets up requested fixtures and their dependencies
- `get()` - Returns the fixture values
- `teardown()` - Cleans up all fixtures in reverse order

### `FixtureResult<T>`

What your setup function must return:

```typescript
{
  value: T,              // The fixture value
  cleanup: async () => { // How to clean up this fixture
    // cleanup logic...
  }
}
```

## Type Inference

TypeScript can infer types automatically if you omit the type parameters:

```typescript
const registry: FixtureRegistry<Fixtures> = {
  db: defineFixture([], async () => ({
    value: await createDatabase(), // TypeScript infers Database
    cleanup: async () => {},
  })),

  client: defineFixture(["db"], async ({ db }) => {
    // db is automatically typed as Database
    return {
      value: createClient(db), // TypeScript infers TestClient
      cleanup: async () => {},
    };
  }),
};
```

We recommend explicit type parameters for clarity, but inference works well for simple cases.

## Error Handling

If setup fails, already-created fixtures are automatically cleaned up:

```typescript
await fixtures.setup(); // If this throws, partial fixtures are cleaned up
```

If teardown throws, remaining cleanups will NOT run. Handle errors in cleanup functions if needed:

```typescript
cleanup: async () => {
  try {
    await closeConnection();
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
};
```

## Circular Dependencies

Circular dependencies throw an error at setup time:

```typescript
const registry = {
  a: defineFixture(['b'], ...),
  b: defineFixture(['a'], ...), // ❌ Error: Circular dependency detected
};
```
