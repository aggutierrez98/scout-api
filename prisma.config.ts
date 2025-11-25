import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: './src/prisma/schema.prisma',
  migrations: {
    path: './src/prisma/migrations',
    seed: './src/bin/seedPrisma.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})