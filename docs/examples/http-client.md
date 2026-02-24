---
title: HTTP Client Fixtures
---

## HTTP Client Fixtures

Patterns for setting up HTTP clients with test servers and authentication.

## Basic HTTP Server

```typescript
import { defineFixture, type FixtureRegistry } from "fixtures-ts";

type Deps = {
  server: TestServer;
  client: HttpClient;
};

const registry: FixtureRegistry<Deps> = {
  server: defineFixture([], async () => {
    const server = await startTestServer();
    return {
      value: server,
      cleanup: async () => await server.close(),
    };
  }),

  client: defineFixture(["server"], async ({ server }) => ({
    value: createClient({ baseUrl: server.url }),
    cleanup: async () => {},
  })),
};
```

## With Authentication

```typescript
type Deps = {
  server: TestServer;
  authToken: string;
  client: HttpClient;
};

const registry: FixtureRegistry<Deps> = {
  server: defineFixture([], async () => {
    const server = await startTestServer();
    return {
      value: server,
      cleanup: async () => await server.close(),
    };
  }),

  authToken: defineFixture(["server"], async ({ server }) => ({
    value: await server.createTestToken({ userId: "test-user" }),
    cleanup: async () => {},
  })),

  client: defineFixture(
    ["server", "authToken"],
    async ({ server, authToken }) => ({
      value: createClient({
        baseUrl: server.url,
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      cleanup: async () => {},
    }),
  ),
};
```

## Multiple Clients

```typescript
type Deps = {
  server: TestServer;
  adminToken: string;
  userToken: string;
  adminClient: HttpClient;
  userClient: HttpClient;
};

const registry: FixtureRegistry<Deps> = {
  server: defineFixture([], async () => {
    const server = await startTestServer();
    return {
      value: server,
      cleanup: async () => await server.close(),
    };
  }),

  adminToken: defineFixture(["server"], async ({ server }) => ({
    value: await server.createTestToken({ userId: "admin", role: "admin" }),
    cleanup: async () => {},
  })),

  userToken: defineFixture(["server"], async ({ server }) => ({
    value: await server.createTestToken({ userId: "user", role: "user" }),
    cleanup: async () => {},
  })),

  adminClient: defineFixture(
    ["server", "adminToken"],
    async ({ server, adminToken }) => ({
      value: createClient({
        baseUrl: server.url,
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
      cleanup: async () => {},
    }),
  ),

  userClient: defineFixture(
    ["server", "userToken"],
    async ({ server, userToken }) => ({
      value: createClient({
        baseUrl: server.url,
        headers: { Authorization: `Bearer ${userToken}` },
      }),
      cleanup: async () => {},
    }),
  ),
};
```

## With Database

```typescript
type Deps = {
  db: Database;
  server: TestServer;
  client: HttpClient;
};

const registry: FixtureRegistry<Deps> = {
  db: defineFixture([], async () => {
    const db = await createTestDatabase();
    return {
      value: db,
      cleanup: async () => await db.destroy(),
    };
  }),

  server: defineFixture(["db"], async ({ db }) => {
    const server = await startTestServer({ database: db });
    return {
      value: server,
      cleanup: async () => await server.close(),
    };
  }),

  client: defineFixture(["server"], async ({ server }) => ({
    value: createClient({ baseUrl: server.url }),
    cleanup: async () => {},
  })),
};
```

## Using in Tests

```typescript
import { test, beforeEach, afterEach, expect } from "vitest";

const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should fetch users", async () => {
  const { client } = fixtures.get();

  const response = await client.get("/users");

  expect(response.status).toBe(200);
  expect(response.data).toEqual([]);
});

test("should create user", async () => {
  const { client } = fixtures.get();

  const response = await client.post("/users", {
    name: "Alice",
    email: "alice@example.com",
  });

  expect(response.status).toBe(201);
  expect(response.data.name).toBe("Alice");
});
```

## Express Example

```typescript
import express from "express";
import type { Server } from "http";

const registry = {
  server: defineFixture([], async () => {
    const app = express();
    app.use(express.json());

    app.get("/health", (req, res) => res.json({ status: "ok" }));

    const server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    const address = server.address();
    const port = typeof address === "object" ? address?.port : 0;

    return {
      value: { app, url: `http://localhost:${port}` },
      cleanup: async () => {
        await new Promise((resolve) => server.close(resolve));
      },
    };
  }),
};
```

## Fetch Example

```typescript
const registry = {
  server: defineFixture([], async () => ({ ... })),

  client: defineFixture(['server'], async ({ server }) => {
    const baseUrl = server.url;

    const client = {
      async get(path: string) {
        const response = await fetch(`${baseUrl}${path}`);
        return { status: response.status, data: await response.json() };
      },
      async post(path: string, body: unknown) {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return { status: response.status, data: await response.json() };
      },
    };

    return {
      value: client,
      cleanup: async () => {},
    };
  }),
};
```
