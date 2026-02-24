---
title: Installation
---

## Installation

Install fixtures-ts using your preferred package manager:

### npm

```bash
npm install fixtures-ts
```

### yarn

```bash
yarn add fixtures-ts
```

### pnpm

```bash
pnpm add fixtures-ts
```

### bun

```bash
bun add fixtures-ts
```

## Requirements

- Node.js 18.0.0 or higher
- TypeScript (for type-safe fixtures)

## Verify Installation

Create a simple test file to verify the installation:

```typescript
import { createFixtures, defineFixture } from "fixtures-ts";

type Deps = {
  config: { apiUrl: string };
};

const registry = {
  config: defineFixture([], async () => ({
    value: { apiUrl: "http://localhost:3000" },
    cleanup: async () => {},
  })),
};

const fixtures = createFixtures(registry, ["config"]);
await fixtures.setup();
console.log(fixtures.get().config); // { apiUrl: 'http://localhost:3000' }
await fixtures.teardown();
```

## Next Steps

Continue to the [Quick Start](quick-start) guide to learn how to use fixtures-ts in your tests.
