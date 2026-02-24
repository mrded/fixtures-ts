---
title: Database Fixtures
---

## Database Fixtures

Common patterns for setting up database fixtures with schema creation and test data.

## Basic Database Fixture

```typescript
import { defineFixture, type FixtureRegistry } from "fixtures-ts";

type Deps = {
  db: Database;
};

const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),
};
```

## With Schema Creation

```typescript
type Deps = {
  db: Database;
};

const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();

    // Create schema
    await db.schema.createTable("users").execute();
    await db.schema.createTable("posts").execute();

    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),
};
```

## With Test Data

```typescript
type Deps = {
  db: Database;
  testUsers: User[];
};

const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();
    await db.schema.createTable("users").execute();
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),

  testUsers: defineFixture(["db"], async ({ db }) => {
    const users = [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ];

    await db.insertInto("users").values(users).execute();

    return {
      value: users,
      cleanup: async () => await db.deleteFrom("users").execute(),
    };
  }),
};
```

## Multiple Tables

```typescript
type Deps = {
  db: Database;
  testUsers: User[];
  testPosts: Post[];
};

const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();
    await db.schema.createTable("users").execute();
    await db.schema.createTable("posts").execute();
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),

  testUsers: defineFixture(["db"], async ({ db }) => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    await db.insertInto("users").values(users).execute();
    return {
      value: users,
      cleanup: async () => await db.deleteFrom("users").execute(),
    };
  }),

  testPosts: defineFixture(["db", "testUsers"], async ({ db, testUsers }) => {
    const posts = [
      { id: 1, userId: testUsers[0].id, title: "Hello World" },
      { id: 2, userId: testUsers[1].id, title: "Goodbye World" },
    ];
    await db.insertInto("posts").values(posts).execute();
    return {
      value: posts,
      cleanup: async () => await db.deleteFrom("posts").execute(),
    };
  }),
};
```

## With Migrations

```typescript
const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();

    // Run migrations
    await runMigrations(db);

    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),
};
```

## Using in Tests

```typescript
import { test, beforeEach, afterEach, expect } from "vitest";

const fixtures = createFixtures(registry, ["testPosts"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should query posts", async () => {
  const { db, testPosts } = fixtures.get();

  const posts = await db.selectFrom("posts").selectAll().execute();

  expect(posts).toHaveLength(testPosts.length);
  expect(posts[0].title).toBe("Hello World");
});

test("should create new post", async () => {
  const { db, testUsers } = fixtures.get();

  await db
    .insertInto("posts")
    .values({ id: 3, userId: testUsers[0].id, title: "New Post" })
    .execute();

  const posts = await db.selectFrom("posts").selectAll().execute();
  expect(posts).toHaveLength(3);
});
```

## SQLite Example

```typescript
import Database from "better-sqlite3";

const registry = {
  db: defineFixture([], async () => {
    const db = new Database(":memory:");

    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    return {
      value: db,
      cleanup: async () => db.close(),
    };
  }),
};
```

## PostgreSQL Example

```typescript
import { Client } from "pg";

const registry = {
  db: defineFixture([], async () => {
    const client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });

    await client.connect();
    await client.query("CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT)");

    return {
      value: client,
      cleanup: async () => {
        await client.query("DROP TABLE users");
        await client.end();
      },
    };
  }),
};
```
