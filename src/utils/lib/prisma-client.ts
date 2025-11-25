import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import logger from '../classes/Logger';
import { SecretsManager } from '../classes/SecretsManager';

// if(SecretsManager.getInstance().isInitialized() === false) {
//     await SecretsManager.getInstance().initialize()
// }

const tursoSecrets = SecretsManager.getInstance().getTursoSecrets();
const dbUrl = tursoSecrets.DATABASE_URL;
const dbToken = tursoSecrets.AUTH_TOKEN;

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

