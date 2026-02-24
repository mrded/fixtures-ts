---
title: Cleanup
---

## Cleanup

Proper cleanup is essential for test isolation. fixtures-ts ensures resources are cleaned up in the correct order.

## Cleanup Function

Each fixture provides a cleanup function:

```typescript
defineFixture([], async () => ({
  value: await createResource(),
  cleanup: async () => {
    // Cleanup logic here
    await closeResource();
  },
}));
```

## Cleanup Order

Cleanup happens in **reverse** dependency order:

```typescript
const registry = {
  config: defineFixture([], async () => ({
    value: loadConfig(),
    cleanup: async () => console.log("Cleanup config"),
  })),

  db: defineFixture(["config"], async ({ config }) => ({
    value: await createDb(config),
    cleanup: async () => console.log("Cleanup db"),
  })),

  client: defineFixture(["db"], async ({ db }) => ({
    value: createClient(db),
    cleanup: async () => console.log("Cleanup client"),
  })),
};

const fixtures = createFixtures(registry, ["client"]);
await fixtures.setup();
// Logs: "Cleanup client" → "Cleanup db" → "Cleanup config"
await fixtures.teardown();
```

## When Cleanup Runs

Call `teardown()` to run all cleanup functions:

```typescript
const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown); // Cleanup runs here
```

## Error Handling

If a cleanup function throws, the error will propagate to the caller and stop the teardown process. Remaining cleanup functions will not run:

```typescript
const registry = {
  a: defineFixture([], async () => ({
    value: "a",
    cleanup: async () => {
      throw new Error("Cleanup failed");
    },
  })),

  b: defineFixture([], async () => ({
    value: "b",
    cleanup: async () => {
      console.log("Cleanup b"); // Will NOT run if 'a' throws (if 'a' runs first)
    },
  })),
};
```

To ensure cleanup always runs even if one fails, wrap cleanup logic in try-catch:

```typescript
defineFixture([], async () => ({
  value: await createResource(),
  cleanup: async () => {
    try {
      await closeResource();
    } catch (error) {
      console.error("Cleanup failed:", error);
      // Don't rethrow to allow other cleanups to run
    }
  },
}));
```

## No-op Cleanup

If a fixture doesn't need cleanup, provide an empty async function:

```typescript
defineFixture([], async () => ({
  value: { config: "value" },
  cleanup: async () => {}, // No cleanup needed
}));
```

## Best Practices

### Close Connections

Always close database connections, file handles, and network connections:

```typescript
defineFixture([], async () => {
  const db = await createConnection();
  return {
    value: db,
    cleanup: async () => await db.close(),
  };
});
```

### Delete Temporary Files

Clean up any temporary files or directories:

```typescript
defineFixture([], async () => {
  const tmpDir = await createTempDir();
  return {
    value: tmpDir,
    cleanup: async () => await fs.rm(tmpDir, { recursive: true }),
  };
});
```

### Reset State

Reset any shared state to prevent test pollution:

```typescript
defineFixture([], async () => {
  const cache = new Map();
  return {
    value: cache,
    cleanup: async () => cache.clear(),
  };
});
```

### Don't Depend on Cleanup Order

While cleanup is deterministic (reverse dependency order), write cleanup functions that are independent:

```typescript
// Good: Independent cleanup
defineFixture(["db"], async ({ db }) => ({
  value: await createService(db),
  cleanup: async () => {
    // Doesn't assume db is still available
    await closeServiceConnections();
  },
}));
```
