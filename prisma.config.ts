import { defineConfig } from 'prisma/config'
import 'dotenv/config'

// Esta configuracion aplica solo a prisma usando prisma CLI.
export default defineConfig({
    schema: './src/prisma/schema.prisma',
    migrations: {
        path: './src/prisma/migrations',
    },
    // El datasource SQlite sera tenido en cuenta para los comandos de prisma CLI.
    // Ej: prisma migrate, prisma db pull, prisma generate, etc.
    datasource: {
        url: "file:./data/scout.db",
    },
})