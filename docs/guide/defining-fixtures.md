---
title: Defining Fixtures
---

## Defining Fixtures

Fixtures are defined using the `defineFixture` function. Each fixture specifies its dependencies and provides setup/cleanup logic.

## Basic Syntax

```typescript
defineFixture(dependencies, setup);
```

- **dependencies**: Array of fixture names this fixture depends on
- **setup**: Async function that creates the fixture value and cleanup function

## Simple Fixture (No Dependencies)

```typescript
const registry = {
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),
};
```

## Fixture with Dependencies

```typescript
const registry = {
  config: defineFixture([], async () => ({
    value: loadConfig(),
    cleanup: async () => {},
  })),

  database: defineFixture(["config"], async ({ config }) => ({
    value: await createDatabase(config.databaseUrl),
    cleanup: async () => await closeDatabase(),
  })),
};
```

## Return Value

The setup function must return an object with:

- **value**: The fixture value that will be available in tests
- **cleanup**: Async function to clean up the resource

## Type Safety

TypeScript ensures that:

- Dependency names are valid
- Dependency types match
- Return types are correct

```typescript
type Deps = {
  config: AppConfig;
  db: Database;
};

const registry: FixtureRegistry<Deps> = {
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" } as AppConfig,
    cleanup: async () => {},
  })),

  // TypeScript knows 'config' is available and typed as AppConfig
  db: defineFixture(["config"], async ({ config }) => ({
    value: await createDatabase(config.apiUrl),
    cleanup: async () => {},
  })),
};
```

## Best Practices

### Keep Fixtures Focused

Each fixture should represent a single resource or concept:

```typescript
// Good
const registry = {
  db: defineFixture([], async () => ({ ... })),
  cache: defineFixture([], async () => ({ ... })),
};

// Avoid
const registry = {
  everything: defineFixture([], async () => ({
    value: { db, cache, api, ... },
    cleanup: async () => {},
  })),
};
```

### Always Provide Cleanup

Even if your fixture doesn't need cleanup, provide an empty cleanup function:

```typescript
defineFixture([], async () => ({
  value: { config: "value" },
  cleanup: async () => {}, // Empty cleanup is fine
}));
```

### Use Async Functions

All setup and cleanup functions should be async, even if they don't await anything:

```typescript
defineFixture([], async () => ({
  value: "synchronous value",
  cleanup: async () => {}, // Still async
}));
```
