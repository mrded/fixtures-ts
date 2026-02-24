---
title: Shared Dependencies
---

## Shared Dependencies

When multiple fixtures depend on the same fixture, it's only set up once. This is efficient and ensures consistency.

## Basic Example

```typescript
import { defineFixture, type FixtureRegistry } from "fixtures-ts";

type Deps = {
  config: AppConfig;
  db: Database;
  cache: Cache;
  service: Service;
};

const registry: FixtureRegistry<Deps> = {
  // Shared dependency - set up only once
  config: defineFixture([], async () => {
    console.log("Setting up config");
    return {
      value: loadConfig(),
      cleanup: async () => console.log("Cleaning up config"),
    };
  }),

  // Both db and cache depend on config
  db: defineFixture(["config"], async ({ config }) => {
    console.log("Setting up db");
    return {
      value: await createDatabase(config.databaseUrl),
      cleanup: async () => console.log("Cleaning up db"),
    };
  }),

  cache: defineFixture(["config"], async ({ config }) => {
    console.log("Setting up cache");
    return {
      value: await createCache(config.cacheUrl),
      cleanup: async () => console.log("Cleaning up cache"),
    };
  }),

  // Service depends on both db and cache
  service: defineFixture(["db", "cache"], async ({ db, cache }) => {
    console.log("Setting up service");
    return {
      value: createService(db, cache),
      cleanup: async () => console.log("Cleaning up service"),
    };
  }),
};
```

## Dependency Graph

```
      config (set up once)
      /    \
     db    cache
      \    /
      service
```

When you request `['service']`:

```typescript
const fixtures = createFixtures(registry, ["service"]);
await fixtures.setup();
// Console output:
// Setting up config
// Setting up db
// Setting up cache
// Setting up service
```

Config is only set up once, even though both db and cache depend on it.

## Multiple Consumers

```typescript
type Deps = {
  db: Database;
  userRepo: UserRepository;
  postRepo: PostRepository;
  commentRepo: CommentRepository;
};

const registry: FixtureRegistry<Deps> = {
  // Shared database connection
  db: defineFixture([], async () => ({
    value: await createDatabase(),
    cleanup: async () => await closeDatabase(),
  })),

  // All repositories use the same db instance
  userRepo: defineFixture(["db"], async ({ db }) => ({
    value: new UserRepository(db),
    cleanup: async () => {},
  })),

  postRepo: defineFixture(["db"], async ({ db }) => ({
    value: new PostRepository(db),
    cleanup: async () => {},
  })),

  commentRepo: defineFixture(["db"], async ({ db }) => ({
    value: new CommentRepository(db),
    cleanup: async () => {},
  })),
};

// Request multiple repositories
const fixtures = createFixtures(registry, [
  "userRepo",
  "postRepo",
  "commentRepo",
]);
// db is set up only once
```

## Deep Dependency Tree

```typescript
type Deps = {
  config: Config;
  logger: Logger;
  db: Database;
  cache: Cache;
  userService: UserService;
  authService: AuthService;
  api: API;
};

const registry: FixtureRegistry<Deps> = {
  config: defineFixture([], async () => ({ ... })),

  // logger depends on config
  logger: defineFixture(['config'], async ({ config }) => ({ ... })),

  // db depends on config and logger
  db: defineFixture(['config', 'logger'], async ({ config, logger }) => ({ ... })),

  // cache depends on config and logger
  cache: defineFixture(['config', 'logger'], async ({ config, logger }) => ({ ... })),

  // userService depends on db and logger
  userService: defineFixture(['db', 'logger'], async ({ db, logger }) => ({ ... })),

  // authService depends on db, cache, and logger
  authService: defineFixture(['db', 'cache', 'logger'], async ({ db, cache, logger }) => ({ ... })),

  // api depends on all services
  api: defineFixture(['userService', 'authService'], async ({ userService, authService }) => ({ ... })),
};
```

Dependency graph:

```
           config
          /   |   \
      logger  |    |
      /  |  \ | /  |
     db  |   \|/   cache
      \  |   /|\   /
       \ |  / | \ /
    userService authService
         \      /
           api
```

When requesting `['api']`:

- config is set up once
- logger is set up once (even though db, cache, userService, and authService all depend on it)
- db is set up once (even though userService and authService both depend on it)
- cache is set up once

## Benefits

### Performance

Setting up expensive resources (database connections, servers) only once improves test performance:

```typescript
const registry = {
  // Expensive to create
  db: defineFixture([], async () => {
    const db = await createDatabaseConnection(); // Slow operation
    return {
      value: db,
      cleanup: async () => await db.close(),
    };
  }),

  // Many fixtures can share the same connection
  userRepo: defineFixture(['db'], async ({ db }) => ({ ... })),
  postRepo: defineFixture(['db'], async ({ db }) => ({ ... })),
  commentRepo: defineFixture(['db'], async ({ db }) => ({ ... })),
};
```

### Consistency

All fixtures receive the same instance, ensuring consistent state:

```typescript
const registry = {
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),

  client1: defineFixture(["config"], async ({ config }) => ({
    value: createClient(config.apiUrl), // Same URL
    cleanup: async () => {},
  })),

  client2: defineFixture(["config"], async ({ config }) => ({
    value: createClient(config.apiUrl), // Same URL
    cleanup: async () => {},
  })),
};
```
