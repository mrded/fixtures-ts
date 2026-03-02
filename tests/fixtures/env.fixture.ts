import { defineFixture } from "../../src";
import type { Fixtures } from "./types";

/**
 * Environment configuration fixture
 * No dependencies - this is a root fixture
 */
export default defineFixture<Fixtures, [], Fixtures["env"]>([], async () => ({
  value: {
    apiUrl: "http://localhost:3000",
    dbUrl: "postgresql://localhost/test",
    logLevel: "info",
  },
  cleanup: async () => {
    // No cleanup needed for config
  },
}));
