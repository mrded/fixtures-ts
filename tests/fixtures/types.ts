/**
 * Example fixture type definitions
 * Define all your fixtures and their types here
 */
export type Fixtures = {
  env: {
    apiUrl: string;
    dbUrl: string;
    logLevel: string;
  };
  db: {
    query: (sql: string) => Promise<unknown[]>;
    close: () => Promise<void>;
  };
  logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
  client: {
    get: (path: string) => Promise<{ status: number; data: unknown }>;
    post: (
      path: string,
      data: unknown,
    ) => Promise<{ status: number; data: unknown }>;
  };
};
