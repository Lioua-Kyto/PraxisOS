import { defineConfig } from "drizzle-kit";

// Development tooling only — `npm run db:generate` diffs schema.ts against the
// existing migrations and writes a new .sql file. The app never loads this
// config; at runtime it applies the generated files through the migrator in
// src/main/db/client.ts.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/main/db/schema.ts",
  out: "./drizzle"
});
