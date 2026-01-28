import { describe, expect, it, mock } from "bun:test";
import { createFixtures, defineFixture, type FixtureRegistry } from ".";

describe("fixtures", () => {
  it("should setup fixture with no dependency", async () => {
    // Arrange
    type Deps = { foo: string };
    const registry: FixtureRegistry<Deps> = {
      foo: defineFixture([], async () => ({
        value: "test-value",
        cleanup: async () => {},
      })),
    };
    const fixtures = createFixtures(registry, ["foo"]);

    // Act
    await fixtures.setup();
    const { foo } = fixtures.get();

    // Assert
    expect(foo).toBe("test-value");

    await fixtures.teardown();
  });

  it("should setup fixture with one dependency", async () => {
    // Arrange
    type Deps = { db: string; client: string };
    const registry: FixtureRegistry<Deps> = {
      db: defineFixture([], async () => ({
        value: "db-instance",
        cleanup: async () => {},
      })),
      client: defineFixture(["db"], async ({ db }) => ({
        value: `client-with-${db}`,
        cleanup: async () => {},
      })),
    };
    const fixtures = createFixtures(registry, ["client"]);

    // Act
    await fixtures.setup();
    const { client } = fixtures.get();

    // Assert
    expect(client).toBe("client-with-db-instance");

    await fixtures.teardown();
  });

  it("should setup multiple unrelated dependencies", async () => {
    // Arrange
    type Deps = { foo: string; bar: number; baz: boolean };
    const registry: FixtureRegistry<Deps> = {
      foo: defineFixture([], async () => ({
        value: "test",
        cleanup: async () => {},
      })),
      bar: defineFixture([], async () => ({
        value: 42,
        cleanup: async () => {},
      })),
      baz: defineFixture([], async () => ({
        value: true,
        cleanup: async () => {},
      })),
    };
    const fixtures = createFixtures(registry, ["foo", "bar", "baz"]);

    // Act
    await fixtures.setup();
    const { foo, bar, baz } = fixtures.get();

    // Assert
    expect(foo).toBe("test");
    expect(bar).toBe(42);
    expect(baz).toBe(true);

    await fixtures.teardown();
  });

  it("should setup nested dependencies", async () => {
    // Arrange
    const setupOrder: string[] = [];
    type Deps = { a: string; b: string; c: string; d: string };
    const registry: FixtureRegistry<Deps> = {
      a: defineFixture([], async () => {
        setupOrder.push("a");
        return { value: "a", cleanup: async () => {} };
      }),
      b: defineFixture(["a"], async ({ a }) => {
        setupOrder.push("b");
        return { value: `b-${a}`, cleanup: async () => {} };
      }),
      c: defineFixture(["b"], async ({ b }) => {
        setupOrder.push("c");
        return { value: `c-${b}`, cleanup: async () => {} };
      }),
      d: defineFixture(["c"], async ({ c }) => {
        setupOrder.push("d");
        return { value: `d-${c}`, cleanup: async () => {} };
      }),
    };
    const fixtures = createFixtures(registry, ["d"]);

    // Act
    await fixtures.setup();
    const { d } = fixtures.get();

    // Assert
    expect(d).toBe("d-c-b-a");
    expect(setupOrder).toEqual(["a", "b", "c", "d"]);

    await fixtures.teardown();
  });

  it("should execute cleanup in reverse order", async () => {
    // Arrange
    const cleanupOrder: string[] = [];
    type Deps = { a: string; b: string; c: string };
    const registry: FixtureRegistry<Deps> = {
      a: defineFixture([], async () => ({
        value: "a",
        cleanup: async () => {
          cleanupOrder.push("a");
        },
      })),
      b: defineFixture(["a"], async () => ({
        value: "b",
        cleanup: async () => {
          cleanupOrder.push("b");
        },
      })),
      c: defineFixture(["b"], async () => ({
        value: "c",
        cleanup: async () => {
          cleanupOrder.push("c");
        },
      })),
    };
    const fixtures = createFixtures(registry, ["c"]);

    // Act
    await fixtures.setup();
    await fixtures.teardown();

    // Assert
    expect(cleanupOrder).toEqual(["c", "b", "a"]);
  });

  it("should handle shared dependencies", async () => {
    // Arrange
    const setupOrder: string[] = [];
    type Deps = { shared: string; foo: string; bar: string };
    const registry: FixtureRegistry<Deps> = {
      shared: defineFixture([], async () => {
        setupOrder.push("shared");
        return { value: "shared-value", cleanup: async () => {} };
      }),
      foo: defineFixture(["shared"], async ({ shared }) => {
        setupOrder.push("foo");
        return { value: `foo-${shared}`, cleanup: async () => {} };
      }),
      bar: defineFixture(["shared"], async ({ shared }) => {
        setupOrder.push("bar");
        return { value: `bar-${shared}`, cleanup: async () => {} };
      }),
    };
    const fixtures = createFixtures(registry, ["foo", "bar"]);

    // Act
    await fixtures.setup();
    const { foo, bar } = fixtures.get();

    // Assert
    expect(foo).toBe("foo-shared-value");
    expect(bar).toBe("bar-shared-value");
    expect(setupOrder).toEqual(["shared", "foo", "bar"]);

    await fixtures.teardown();
  });

  it("should throw if cleanup fails", async () => {
    // Arrange
    const cleanup1 = mock(async () => {});
    const cleanup2 = mock(async () => {
      throw new Error("cleanup failed");
    });
    const cleanup3 = mock(async () => {});

    type Deps = { a: string; b: string; c: string };
    const registry: FixtureRegistry<Deps> = {
      a: defineFixture([], async () => ({
        value: "a",
        cleanup: cleanup1,
      })),
      b: defineFixture(["a"], async () => ({
        value: "b",
        cleanup: cleanup2,
      })),
      c: defineFixture(["b"], async () => ({
        value: "c",
        cleanup: cleanup3,
      })),
    };
    const fixtures = createFixtures(registry, ["c"]);

    // Act
    await fixtures.setup();

    // Assert
    await expect(fixtures.teardown()).rejects.toThrow("cleanup failed");
    expect(cleanup3).toHaveBeenCalledOnce();
    expect(cleanup2).toHaveBeenCalledOnce();
    expect(cleanup1).not.toHaveBeenCalled();
  });

  it("should throw on circular dependency", async () => {
    // Arrange
    type Deps = { a: string; b: string };
    const registry: FixtureRegistry<Deps> = {
      a: defineFixture(["b"], async () => ({
        value: "a",
        cleanup: async () => {},
      })),
      b: defineFixture(["a"], async () => ({
        value: "b",
        cleanup: async () => {},
      })),
    };
    const fixtures = createFixtures(registry, ["a"]);

    // Act & Assert
    await expect(fixtures.setup()).rejects.toThrow(
      "Circular dependency detected",
    );
  });

  it("should throw when getting fixtures before setup", () => {
    // Arrange
    type Deps = { foo: string };
    const registry: FixtureRegistry<Deps> = {
      foo: defineFixture([], async () => ({
        value: "test",
        cleanup: async () => {},
      })),
    };
    const fixtures = createFixtures(registry, ["foo"]);

    // Act & Assert
    expect(() => fixtures.get()).toThrow("Fixtures not initialized");
  });

  it("should cleanup already-created fixtures when setup fails", async () => {
    // Arrange
    const cleanup1 = mock(async () => {});
    const cleanup2 = mock(async () => {});

    type Deps = { a: string; b: string; c: string };
    const registry: FixtureRegistry<Deps> = {
      a: defineFixture([], async () => ({
        value: "a",
        cleanup: cleanup1,
      })),
      b: defineFixture(["a"], async () => ({
        value: "b",
        cleanup: cleanup2,
      })),
      c: defineFixture(["b"], async () => {
        throw new Error("setup failed");
      }),
    };
    const fixtures = createFixtures(registry, ["c"]);

    // Act & Assert
    await expect(fixtures.setup()).rejects.toThrow("setup failed");
    expect(cleanup2).toHaveBeenCalledOnce();
    expect(cleanup1).toHaveBeenCalledOnce();
  });
});
