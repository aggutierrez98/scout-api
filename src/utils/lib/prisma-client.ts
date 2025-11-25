import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import logger from '../classes/Logger';

const dbUrl = process.env.TURSO_DATABASE_URL!
const dbToken = process.env.TURSO_AUTH_TOKEN

logger.info(`Conexion a DB: ${dbUrl}`);

// const libsql = createClient({
//     url: dbUrl,
//     authToken: dbToken,
// })

const adapter = new PrismaLibSql({
    url: dbUrl,
    authToken: dbToken,
})

// const adapter = new PrismaLibSQL(libsql)
export const prismaClient = new PrismaClient({ adapter })

