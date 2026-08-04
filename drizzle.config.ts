import { defineConfig } from "drizzle-kit";

// Not used for automatic migrations at runtime (the app creates its schema
// idempotently on launch — see src/main/db/client.ts) — this config exists so
// `drizzle-kit studio` / `drizzle-kit generate` can be run against the schema
// during development.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./dev.sqlite3"
  }
});
