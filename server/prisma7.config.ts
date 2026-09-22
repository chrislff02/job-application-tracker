import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma CLI configuration for the schema, migrations,
// and database connection used by this project.
export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: process.env.DATABASE_URL,
  },
});
