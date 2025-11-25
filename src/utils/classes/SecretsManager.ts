import { InfisicalSDK } from '@infisical/sdk';
import type {
  AppSecrets,
  AWSSecrets,
  BetterStackSecrets,
  DatosGrupo,
  GoogleDriveSecrets,
  TursoSecrets,
} from '../../types/secrets';
import { SECRET_KEYS } from '../../types/secrets';

/**
 * Singleton para gestionar secretos desde Infisical
 * Proporciona acceso tipado a todos los secretos de la aplicación
 */
export class SecretsManager {
  private static instance: SecretsManager;
  private client: InfisicalSDK;
  private secrets: AppSecrets | null = null;
  private isInitialized = false;
  private environment: string = "";
  private projectId: string = "";

  private constructor() {
    const siteUrl = process.env.INFISICAL_SITE_URL || 'https://app.infisical.com';

    this.client = new InfisicalSDK({
      siteUrl,
    });
  }

  /**
   * Obtiene la instancia singleton
   */
  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Inicializa el cliente y carga todos los secretos desde Infisical
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!process.env.INFISICAL_SERVICE_TOKEN) {
      throw new Error('INFISICAL_SERVICE_TOKEN es requerido en .env');
    }

    if (!process.env.INFISICAL_PROJECT_ID) {
      throw new Error('INFISICAL_PROJECT_ID es requerido en .env');
    }


    this.projectId = process.env.INFISICAL_PROJECT_ID;
    this.environment = process.env.INFISICAL_ENV || 'dev';
    const authToken = process.env.INFISICAL_SERVICE_TOKEN;

    try {

      const authenticatedClient = await this.client.auth().accessToken(authToken);
      // Reemplazar cliente con el autenticado
      this.client = authenticatedClient;

      const indexSecrets = await this.listSecrets();
      const foldersSecrets = await this.listFoldersSecrets();

      // Mapear secretos a objeto tipado
      const secretsMap = new Map<string, string>([
        ...indexSecrets.map((secret) => [secret.secretKey, secret.secretValue] as [string, string]),
        ...foldersSecrets.flatMap((folder) => folder.secrets.map(folderSecret => [`${folder.folder}/${folderSecret.key}`, folderSecret.value] as [string, string])),
      ]);

      // Helper para obtener secreto de forma segura
      const getSecret = (key: string, defaultValue = ''): string => {
        return secretsMap.get(key) ?? defaultValue;
      };

      const getFolderSecret = (folder: string, key: string, defaultValue = ''): string => {
        return secretsMap.get(`${folder}/${key}`) ?? defaultValue;
      }

      // Parsear DATOS_GRUPO
      const datosGrupoRaw = getSecret(SECRET_KEYS.DATOS_GRUPO);
      let datosGrupo: DatosGrupo;

      try {
        datosGrupo = datosGrupoRaw
          ? JSON.parse(datosGrupoRaw)
          : { numero: '58', nombre: 'Madre Teresa', distrito: '2', zona: '9' };
      } catch (error) {
        console.warn('Error parseando DATOS_GRUPO, usando valores por defecto:', error);
        datosGrupo = { numero: '58', nombre: 'Madre Teresa', distrito: '2', zona: '9' };
      }

      // Construir objeto de secretos tipado
      this.secrets = {
        DATABASE_URL: getSecret(SECRET_KEYS.DATABASE_URL),
        DATOS_GRUPO: datosGrupo,
        JWT_SECRET: getSecret(SECRET_KEYS.JWT_SECRET),
        PORT: parseInt(getSecret(SECRET_KEYS.PORT, process.env.PORT || '8080'), 10),
        REDIS_CONNECTION_URI: getSecret(SECRET_KEYS.REDIS_CONNECTION_URI),

        AWS: {
          S3_ACCESS_KEY: getFolderSecret("AWS", SECRET_KEYS.S3_ACCESS_KEY),
          S3_BUCKET_NAME: getFolderSecret("AWS", SECRET_KEYS.S3_BUCKET_NAME),
          S3_REGION: getFolderSecret("AWS", SECRET_KEYS.S3_REGION),
          S3_SECRET_ACCESS_KEY: getFolderSecret("AWS", SECRET_KEYS.S3_SECRET_ACCESS_KEY),
        },

        BETTERSTACK: {
          AUTH_TOKEN: getFolderSecret("BETTERSTACK", SECRET_KEYS.BETTERSTACK_AUTH_TOKEN),
          INGESTING_HOST: getFolderSecret("BETTERSTACK", SECRET_KEYS.BETTERSTACK_INGESTING_HOST),
        },

        GOOGLE_DRIVE: {
          PRIVATE_KEY: getFolderSecret("GOOGLE_DRIVE", SECRET_KEYS.GOOGLE_DRIVE_PRIVATE_KEY),
          SERVICE_ACCOUNT_EMAIL: getFolderSecret("GOOGLE_DRIVE", SECRET_KEYS.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL),
          SPREADSHEET_DATA_KEY: getFolderSecret("GOOGLE_DRIVE", SECRET_KEYS.GOOGLE_DRIVE_SPREADSHEET_DATA_KEY),
        },

        TURSO: {
          AUTH_TOKEN: getFolderSecret("TURSO", SECRET_KEYS.TURSO_AUTH_TOKEN),
          DATABASE_URL: getFolderSecret("TURSO", SECRET_KEYS.TURSO_DATABASE_URL),
        },
      };


      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Error inicializando SecretsManager: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtiene todos los secretos (debe llamarse después de initialize)
   */
  public getSecrets(): AppSecrets {
    if (!this.isInitialized || !this.secrets) {
      throw new Error('SecretsManager no ha sido inicializado. Llama a initialize() primero.');
    }
    return this.secrets;
  }

  /**
   * Obtiene solo los secretos de AWS
   */
  public getAWSSecrets(): AWSSecrets {
    return this.getSecrets().AWS;
  }

  /**
   * Obtiene solo los secretos de BetterStack
   */
  public getBetterStackSecrets(): BetterStackSecrets {
    return this.getSecrets().BETTERSTACK;
  }

  /**
   * Obtiene solo los secretos de Google Drive
   */
  public getGoogleDriveSecrets(): GoogleDriveSecrets {
    return this.getSecrets().GOOGLE_DRIVE;
  }

  /**
   * Obtiene solo los secretos de Turso
   */
  public getTursoSecrets(): TursoSecrets {
    return this.getSecrets().TURSO;
  }

  /**
   * Obtiene los datos del grupo scout
   */
  public getDatosGrupo(): DatosGrupo {
    return this.getSecrets().DATOS_GRUPO;
  }

  /**
   * Obtiene el JWT secret
   */
  public getJWTSecret(): string {
    return this.getSecrets().JWT_SECRET;
  }

  /**
   * Obtiene la URI de conexión a Redis
   */
  public getRedisURI(): string {
    return this.getSecrets().REDIS_CONNECTION_URI;
  }

  /**
   * Obtiene el puerto del servidor
   */
  public getPort(): number {
    return this.getSecrets().PORT;
  }

  /**
   * Obtiene la DATABASE_URL principal
   */
  public getDatabaseURL(): string {
    return this.getSecrets().DATABASE_URL;
  }

  /**
   * Verifica si el manager está inicializado
   */
  public isReady(): boolean {
    return this.isInitialized;
  }


  public async listSecrets() {
    const response = await this.client.secrets().listSecrets({
      projectId: this.projectId,
      environment: this.environment,
      secretPath: '/',
    });
    return response.secrets;
  }

  public async listFoldersSecrets() {
    const foldersWithSecrets = []

    const folders = await this.client.folders().listFolders({
      projectId: this.projectId,
      environment: this.environment,
      recursive: false,
    });


    for (const folder of folders) {
      const secretsFromFolder = await this.client.secrets().listSecrets({
        projectId: this.projectId,
        environment: this.environment,
        secretPath: `/${folder.name}`,
      });

      foldersWithSecrets.push({
        folder: folder.name,
        secrets: secretsFromFolder.secrets.map(s => ({
          key: s.secretKey,
          value: s.secretValue,
        })),
      });
    }
    return foldersWithSecrets;
  }
}
