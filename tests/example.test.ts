/**
 * Example test file demonstrating fixture usage with bun:test
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createFixtures } from "./fixtures";

describe("User API", () => {
  // Request client and logger fixtures
  // Dependencies automatically resolved: env → (db + logger) → client
  const fixtures = createFixtures(["client", "logger"]);

  beforeEach(fixtures.setup);
  afterEach(fixtures.teardown);

  test("should fetch users", async () => {
    const { client, logger } = fixtures.get();

    logger.info("Fetching users");
    const response = await client.get("/users");

    expect(response.status).toBe(200);
    expect(response.data).toEqual({});
  });

  test("should create user", async () => {
    const { client, logger } = fixtures.get();

    logger.info("Creating user");
    const response = await client.post("/users", {
      name: "Alice",
      email: "alice@example.com",
    });

    expect(response.status).toBe(201);
    expect(response.data).toEqual({
      name: "Alice",
      email: "alice@example.com",
    });
  });
});

describe("Database operations", () => {
  // Request only db fixture
  // Only env and db will be set up (no logger or client)
  const fixtures = createFixtures(["db"]);

  beforeEach(fixtures.setup);
  afterEach(fixtures.teardown);

  test("should query database", async () => {
    const { db } = fixtures.get();

    const results = await db.query("SELECT * FROM users");

    expect(results).toEqual([]);
  });

  test("should handle multiple queries", async () => {
    const { db } = fixtures.get();

    await db.query("INSERT INTO users (name) VALUES ('Bob')");
    const results = await db.query("SELECT * FROM users");

    expect(results).toEqual([]);
  });
});

describe("Environment config", () => {
  // Request only env fixture (no dependencies)
  const fixtures = createFixtures(["env"]);

  beforeEach(fixtures.setup);
  afterEach(fixtures.teardown);

  test("should have correct config", () => {
    const { env } = fixtures.get();

    expect(env.apiUrl).toBe("http://localhost:3000");
    expect(env.dbUrl).toBe("postgresql://localhost/test");
    expect(env.logLevel).toBe("info");
  });
});
