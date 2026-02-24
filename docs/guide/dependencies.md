---
title: Dependencies
---

## Dependencies

Fixtures can depend on other fixtures. The system automatically resolves dependencies and sets them up in the correct order.

## Declaring Dependencies

List dependency names in the first argument to `defineFixture`:

```typescript
const registry = {
  config: defineFixture([], async () => ({ ... })),

  // Depends on config
  db: defineFixture(['config'], async ({ config }) => ({ ... })),

  // Depends on db
  client: defineFixture(['db'], async ({ db }) => ({ ... })),
};
```

## Automatic Resolution

When you request fixtures, all dependencies are automatically included:

```typescript
// Request only client
const fixtures = createFixtures(registry, ["client"]);

// Automatically sets up: config → db → client
await fixtures.setup();
```

## Multiple Dependencies

A fixture can depend on multiple other fixtures:

```typescript
const registry = {
  db: defineFixture([], async () => ({ ... })),
  cache: defineFixture([], async () => ({ ... })),

  // Depends on both db and cache
  authService: defineFixture(['db', 'cache'], async ({ db, cache }) => ({
    value: createAuthService(db, cache),
    cleanup: async () => {},
  })),
};
```

## Shared Dependencies

When multiple fixtures depend on the same fixture, it's only set up once:

```typescript
const registry = {
  config: defineFixture([], async () => {
    console.log('Setting up config');
    return { value: loadConfig(), cleanup: async () => {} };
  }),

  db: defineFixture(['config'], async ({ config }) => ({ ... })),
  cache: defineFixture(['config'], async ({ config }) => ({ ... })),

  service: defineFixture(['db', 'cache'], async ({ db, cache }) => ({ ... })),
};

const fixtures = createFixtures(registry, ['service']);
await fixtures.setup();
// Logs "Setting up config" only once
```

The dependency graph:

```
    config
    /    \
   db    cache
    \    /
    service
```

## Dependency Order

Fixtures are set up in topological order, ensuring all dependencies are ready before a fixture is created:

```typescript
const registry = {
  a: defineFixture([], ...),
  b: defineFixture(['a'], ...),
  c: defineFixture(['a'], ...),
  d: defineFixture(['b', 'c'], ...),
};

// Setup order: a → b → c → d (or a → c → b → d)
```

## Circular Dependency Detection

The system detects circular dependencies and throws an error:

```typescript
const registry = {
  a: defineFixture(['b'], ...),
  b: defineFixture(['a'], ...), // Error: circular dependency!
};
```

## Type Safety

TypeScript ensures dependency names and types are correct:

```typescript
type Deps = {
  config: AppConfig;
  db: Database;
};

const registry: FixtureRegistry<Deps> = {
  db: defineFixture(
    ['config'], // ✓ 'config' exists
    async ({ config }) => { // ✓ config is typed as AppConfig
      return { ... };
    }
  ),

  // Error: 'invalid' doesn't exist in Deps
  client: defineFixture(['invalid'], ...),
};
```

## Accessing Dependency Values

Dependencies are passed as an object to the setup function:

```typescript
defineFixture(["db", "cache"], async ({ db, cache }) => {
  // db and cache are fully typed
  const result = await db.query("...");
  return {
    value: createService(db, cache),
    cleanup: async () => {},
  };
});
```
