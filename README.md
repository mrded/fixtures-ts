# fixtures-ts

Type-safe test fixture management with automatic dependency resolution for any test framework.

## Installation

```bash
npm install fixtures-ts
```

## Quick Start

```typescript
import {
  createFixtures,
  defineFixture,
  type FixtureRegistry,
} from "fixtures-ts";

type Fixtures = {
  db: Database;
  client: TestClient;
};

const registry: FixtureRegistry<Fixtures> = {
  db: defineFixture<Fixtures, [], Fixtures["db"]>([], async () => ({
    value: await createTestDatabase(),
    cleanup: async () => await closeDatabase(),
  })),

  client: defineFixture<Fixtures, ["db"], Fixtures["client"]>(
    ["db"],
    async ({ db }) => ({
      value: createTestClient(db),
      cleanup: async () => {},
    }),
  ),
};

const fixtures = createFixtures(registry, ["client"]);

beforeEach(fixtures.setup);
afterEach(fixtures.teardown);

test("should work", async () => {
  const { client } = fixtures.get();
  // use client...
});
```

> **Note:** The `defineFixture()` API is intentionally verbose to provide maximum type safety. I'm aware of this and exploring ways to simplify the fixture definition syntax while maintaining type safety. For now, the current approach works reliably and provides excellent TypeScript inference.

## Documentation

📖 **[Full Documentation](https://mrded.github.io/fixtures-ts/)**

- [Quick Start Guide](https://mrded.github.io/fixtures-ts/quick-start)
- [API Reference](https://mrded.github.io/fixtures-ts/api)
- [Examples](https://mrded.github.io/fixtures-ts/examples/)
- [Complete Example](tests/fixtures/) - File-based organization for larger projects

## Features

- ✅ Automatic dependency resolution
- ✅ Type-safe with full TypeScript support
- ✅ Automatic cleanup in reverse order
- ✅ Circular dependency detection
- ✅ Framework agnostic (works with any test runner)

## Sponsors

- [Checkatrade](https://www.checkatrade.com/)

## License

MIT
