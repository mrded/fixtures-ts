import { createFixtures as baseCreateFixtures } from "../../src";
import { registry } from "./registry";
import type { Fixtures } from "./types";

/**
 * Typed createFixtures helper for this project
 * This provides autocomplete for fixture names and ensures type safety
 */
export const createFixtures = <K extends keyof Fixtures>(
  requested: readonly K[],
) => baseCreateFixtures<Fixtures, K>(registry, requested);
