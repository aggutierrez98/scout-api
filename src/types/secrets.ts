/**
 * Tipos para secretos gestionados por Infisical
 */

export interface AWSSecrets {
  S3_ACCESS_KEY: string;
  S3_BUCKET_NAME: string;
  S3_REGION: string;
  S3_SECRET_ACCESS_KEY: string;
}

export interface BetterStackSecrets {
  AUTH_TOKEN: string;
  INGESTING_HOST: string;
}

export interface GoogleDriveSecrets {
  PRIVATE_KEY: string;
  SERVICE_ACCOUNT_EMAIL: string;
  SPREADSHEET_DATA_KEY: string;
}

export interface TursoSecrets {
  AUTH_TOKEN: string;
  DATABASE_URL: string;
}

export interface DatosGrupo {
  numero: string;
  nombre: string;
  distrito: string;
  zona: string;
}

/**
 * Interface principal que agrupa todos los secretos de la aplicación
 */
export interface AppSecrets {
  // Secretos principales
  DATABASE_URL: string;
  DATOS_GRUPO: DatosGrupo;
  JWT_SECRET: string;
  PORT: number;
  REDIS_CONNECTION_URI: string;

  // Secretos organizados por servicio
  AWS: AWSSecrets;
  BETTERSTACK: BetterStackSecrets;
  GOOGLE_DRIVE: GoogleDriveSecrets;
  TURSO: TursoSecrets;
}

/**
 * Claves de secretos tal como están almacenadas en Infisical
 */
export const SECRET_KEYS = {
  // Principales
  DATABASE_URL: 'DATABASE_URL',
  DATOS_GRUPO: 'DATOS_GRUPO',
  JWT_SECRET: 'JWT_SECRET',
  PORT: 'PORT',
  REDIS_CONNECTION_URI: 'REDIS_CONNECTION_URI',

  // AWS
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_BUCKET_NAME: 'S3_BUCKET_NAME',
  S3_REGION: 'S3_REGION',
  S3_SECRET_ACCESS_KEY: 'S3_SECRET_ACCESS_KEY',

  // BetterStack (Logtail)
  BETTERSTACK_AUTH_TOKEN: 'AUTH_TOKEN',
  BETTERSTACK_INGESTING_HOST: 'INGESTING_HOST',

  // Google Drive
  GOOGLE_DRIVE_PRIVATE_KEY: 'PRIVATE_KEY',
  GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL: 'SERVICE_ACCOUNT_EMAIL',
  GOOGLE_DRIVE_SPREADSHEET_DATA_KEY: 'SPREADSHEET_DATA_KEY',

  // Turso
  TURSO_AUTH_TOKEN: 'AUTH_TOKEN',
  TURSO_DATABASE_URL: 'DATABASE_URL',
} as const;
