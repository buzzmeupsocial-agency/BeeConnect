import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js loads .env.local automatically; the standalone Prisma CLI doesn't,
// so load it explicitly here (falls back to .env if present).
config({ path: [".env.local", ".env"] });

// Migrations run against the direct (non-pooled) connection.
// The app itself connects via DATABASE_URL (pooled) — see src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
