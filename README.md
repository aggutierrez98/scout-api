# Scout API

API REST para gestión de grupos Scout con bot de WhatsApp integrado. Sistema completo de administración de scouts, familiares, documentos, pagos y entregas de insignias.

## 📋 Tabla de Contenidos

- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura de la API](#-arquitectura-de-la-api)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Requisitos Previos](#-requisitos-previos)
- [Configuración del Entorno de Desarrollo](#-configuración-del-entorno-de-desarrollo)
- [Integraciones de Terceros](#-integraciones-de-terceros)
- [Scripts Disponibles](#-scripts-disponibles)
- [Producción](#-producción)

## 🚀 Tecnologías Utilizadas

### Backend Core
- **Node.js** (v18.14.2+): Entorno de ejecución JavaScript
- **Express.js**: Framework web minimalista y flexible
- **TypeScript**: Superset tipado de JavaScript para mayor seguridad de tipos

### Base de Datos
- **Turso (LibSQL)**: Base de datos SQLite distribuida y serverless
- **Prisma ORM**: ORM moderno con generación de tipos automática
- **@prisma/adapter-libsql**: Adaptador para conectar Prisma con Turso/LibSQL

### Caché y Sesiones
- **Redis**: Sistema de caché en memoria para optimizar consultas frecuentes
- **MongoDB**: Almacenamiento de sesiones remotas de WhatsApp (vía wwebjs-mongo)

### Seguridad y Autenticación
- **JWT (jsonwebtoken)**: Autenticación basada en tokens
- **bcryptjs**: Hash seguro de contraseñas
- **helmet**: Protección de headers HTTP
- **express-rate-limit**: Limitación de peticiones para prevenir ataques
- **tiny-csrf**: Protección contra ataques CSRF
- **cors**: Configuración de políticas CORS

### Integraciones Externas
- **AWS S3**: Almacenamiento de documentos PDF en la nube
- **Google Drive API**: Importación de datos desde Google Spreadsheets
- **Google Sheets**: Fuente de datos para carga masiva
- **WhatsApp Web.js**: Bot automatizado de WhatsApp

### Procesamiento de Archivos
- **pdf-lib**: Generación y manipulación de PDFs
- **xlsx**: Procesamiento de archivos Excel
- **sharp**: Procesamiento y optimización de imágenes
- **express-fileupload**: Manejo de uploads de archivos

### Validación y Documentación
- **Zod**: Validación de esquemas y tipos en runtime
- **Swagger (swagger-jsdoc, swagger-ui-express)**: Documentación automática de API

### Logging y Monitoreo
- **Winston**: Sistema de logging estructurado
- **Logtail**: Servicio de logs en la nube
- **Morgan**: Logger de peticiones HTTP

### Automatización
- **node-cron**: Tareas programadas (recordatorios de cumpleaños, etc.)
- **puppeteer**: Automatización de navegador para WhatsApp Web

### Herramientas de Desarrollo
- **ts-node & ts-node-dev**: Ejecución de TypeScript en desarrollo
- **nodemon**: Recarga automática del servidor
- **concurrently**: Ejecución paralela de comandos
- **dotenv**: Gestión de variables de entorno

## 🏗 Arquitectura de la API

La API sigue una **arquitectura en capas** (Layered Architecture) con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────┐
│              Client (Frontend/Bot)              │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│           Middlewares (Seguridad/Cache)         │
│  • Authentication (JWT)                         │
│  • Authorization (RBAC)                         │
│  • Rate Limiting                                │
│  • Cache (Redis)                                │
│  • Validation (Zod)                             │
│  • Error Handling                               │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│              Routes (Endpoints)                 │
│  • /api/auth                                    │
│  • /api/scout                                   │
│  • /api/documento                               │
│  • /api/pago                                    │
│  • /api/familiar                                │
│  • /api/equipo                                  │
│  • /api/entrega                                 │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│            Controllers (HTTP Logic)             │
│  • Request handling                             │
│  • Response formatting                          │
│  • HTTP status codes                            │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│          Services (Business Logic)              │
│  • Domain operations                            │
│  • Data transformation                          │
│  • Business rules                               │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│         Models/Prisma (Data Access)             │
│  • Database queries                             │
│  • Data validation                              │
│  • Relationships                                │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│           Database (Turso/LibSQL)               │
└─────────────────────────────────────────────────┘
```

### Características Arquitectónicas

#### 1. **Patrón MVC Modificado**
- **Routes**: Definen endpoints y aplican middlewares
- **Controllers**: Manejan lógica HTTP (request/response)
- **Services**: Contienen lógica de negocio pura
- **Models**: Definición de esquemas (Prisma)

#### 2. **Inyección de Dependencias**
Los controladores reciben servicios como parámetros:
```typescript
const scoutService = new ScoutService();
const scoutController = new ScoutController({ scoutService });
```

#### 3. **Middleware Pipeline**
Cada petición pasa por una cadena de middlewares:
- Logging (Morgan)
- Security (Helmet, Rate Limiting)
- Authentication (JWT verification)
- Authorization (RBAC)
- Validation (Zod schemas)
- Cache (Redis)
- Error handling

#### 4. **Sistema de Caché Inteligente**
- `cacheMiddleware`: Almacena respuestas en Redis
- `cleanCacheMiddleware`: Invalida caché al modificar datos
- TTL configurable por endpoint

#### 5. **Manejo Centralizado de Errores**
- Clase `AppError` personalizada
- Middleware `errorMiddleware` global
- Logging estructurado con Winston

#### 6. **Sistema de Permisos RBAC**
Roles: `ADMIN`, `DIRIGENTE`, `EXTERNO`
- Validación por recurso y método HTTP
- Implementado en `validatePermissions`

## 📁 Estructura de Carpetas

```
scout-api/
├── src/
│   ├── bin/                          # Scripts de utilidad y comandos CLI
│   │   ├── createAdminUser.ts        # Crear usuario administrador
│   │   ├── deleteDBData.ts           # Limpiar base de datos
│   │   ├── dumpData.sh               # Script bash para carga de datos
│   │   ├── loadDocumentos.ts         # Importar documentos desde Sheets
│   │   ├── loadEntregas.ts           # Importar entregas
│   │   ├── loadEquipos.ts            # Importar equipos
│   │   ├── loadFamiliares.ts         # Importar familiares
│   │   ├── loadPagos.ts              # Importar pagos
│   │   ├── loadScouts.ts             # Importar scouts
│   │   ├── restoreData-prod.sh       # Restaurar datos en producción
│   │   └── saveUsersData.ts          # Guardar datos de usuarios
│   │
│   ├── controllers/                  # Controladores (Lógica HTTP)
│   │   ├── auth.ts                   # Login, register, logout
│   │   ├── documento.ts              # CRUD documentos
│   │   ├── entrega.ts                # CRUD entregas de insignias
│   │   ├── equipo.ts                 # CRUD equipos/patrullas
│   │   ├── familiar.ts               # CRUD familiares
│   │   ├── pago.ts                   # CRUD pagos/cuotas
│   │   └── scout.ts                  # CRUD scouts
│   │
│   ├── docs/                         # Documentación Swagger
│   │   ├── spec.json                 # Especificación OpenAPI
│   │   ├── spec_v3.json              # Versión 3 de la spec
│   │   └── swagger-ts/               # Definiciones TypeScript Swagger
│   │       ├── swagger.ts
│   │       ├── resources/
│   │       └── schemas/
│   │
│   ├── middlewares/                  # Middlewares Express
│   │   ├── cache.ts                  # Cache con Redis
│   │   ├── error.ts                  # Manejo global de errores
│   │   ├── httpLog.ts                # Logging de peticiones HTTP
│   │   ├── index.ts                  # Exports centralizados
│   │   ├── session.ts                # Autenticación JWT
│   │   ├── tooBusy.ts                # Protección contra sobrecarga
│   │   └── validate.ts               # Validación con Zod
│   │
│   ├── models/                       # Modelos de datos
│   │   └── scout.ts                  # Modelo Scout con extensiones
│   │
│   ├── prisma/                       # Configuración Prisma
│   │   ├── schema.prisma             # Esquema de base de datos
│   │   └── migrations/               # Historial de migraciones
│   │
│   ├── routes/                       # Definición de rutas
│   │   ├── auth.ts                   # Rutas de autenticación
│   │   ├── documento.ts              # Rutas de documentos
│   │   ├── entrega.ts                # Rutas de entregas
│   │   ├── equipo.ts                 # Rutas de equipos
│   │   ├── familiar.ts               # Rutas de familiares
│   │   ├── index.ts                  # Router principal
│   │   ├── pago.ts                   # Rutas de pagos
│   │   └── scout.ts                  # Rutas de scouts
│   │
│   ├── services/                     # Lógica de negocio
│   │   ├── auth.ts                   # Autenticación y autorización
│   │   ├── documento.ts              # Gestión de documentos
│   │   ├── entrega.ts                # Gestión de entregas
│   │   ├── equipo.ts                 # Gestión de equipos
│   │   ├── familiar.ts               # Gestión de familiares
│   │   ├── pago.ts                   # Gestión de pagos
│   │   └── scout.ts                  # Gestión de scouts
│   │
│   ├── types/                        # Definiciones TypeScript
│   │   ├── constantTypes.ts          # Tipos de constantes
│   │   ├── documento.ts              # Tipos de documentos
│   │   ├── entrega.ts                # Tipos de entregas
│   │   ├── equipo.ts                 # Tipos de equipos
│   │   ├── familiar.ts               # Tipos de familiares
│   │   ├── index.ts                  # Exports centralizados
│   │   ├── pago.ts                   # Tipos de pagos
│   │   ├── scout.ts                  # Tipos de scouts
│   │   ├── user.ts                   # Tipos de usuarios
│   │   └── XLSXTypes.ts              # Tipos para importación Excel
│   │
│   ├── utils/                        # Utilidades y helpers
│   │   ├── classes/                  # Clases utilitarias
│   │   │   ├── AppError.ts           # Error personalizado
│   │   │   ├── CacheManager.ts       # Gestor de Redis
│   │   │   ├── ErrorHandler.ts       # Manejador de errores
│   │   │   ├── ExitHandler.ts        # Graceful shutdown
│   │   │   ├── Logger.ts             # Logger Winston
│   │   │   └── documentos/           # Procesadores de documentos PDF
│   │   │
│   │   ├── helpers/                  # Funciones helper
│   │   │   ├── getDireccionData.ts
│   │   │   ├── getFuncion.ts
│   │   │   ├── googleDriveApi.ts     # Cliente Google Drive/Sheets
│   │   │   ├── helpers.ts            # Helpers generales
│   │   │   ├── hexToRgb.ts
│   │   │   ├── mapXLSXScoutToScoutData.ts
│   │   │   └── validatePermissions.ts # RBAC
│   │   │
│   │   ├── lib/                      # Wrappers de librerías
│   │   │   ├── bcrypt.util.ts        # Hash de contraseñas
│   │   │   ├── exceljs.ts            # Procesamiento Excel
│   │   │   ├── jwt.util.ts           # Generación JWT
│   │   │   ├── pdf-lib.ts            # Generación PDF
│   │   │   ├── prisma-client.ts      # Cliente Prisma
│   │   │   ├── s3.util.ts            # Cliente AWS S3
│   │   │   ├── winston.util.ts       # Configuración Winston
│   │   │   └── zod.util.ts           # Utilidades Zod
│   │   │
│   │   ├── constants.ts              # Constantes globales
│   │   ├── index.ts                  # Exports centralizados
│   │   ├── permissions.ts            # Definición de permisos
│   │   └── regex.ts                  # Expresiones regulares
│   │
│   ├── validators/                   # Esquemas Zod
│   │   ├── auth.ts                   # Validadores de auth
│   │   ├── documento.ts              # Validadores de documentos
│   │   ├── entrega.ts                # Validadores de entregas
│   │   ├── equipo.ts                 # Validadores de equipos
│   │   ├── familiar.ts               # Validadores de familiares
│   │   ├── generics.ts               # Validadores genéricos
│   │   ├── index.ts                  # Exports centralizados
│   │   ├── pago.ts                   # Validadores de pagos
│   │   └── scout.ts                  # Validadores de scouts
│   │
│   ├── whatsapp/                     # Bot de WhatsApp
│   │   ├── clientConfig.ts           # Configuración cliente WA
│   │   ├── options.ts                # Opciones del bot
│   │   ├── recordarCumpleaños.ts     # Cron de cumpleaños
│   │   ├── useCases.ts               # Casos de uso del bot
│   │   └── WhatsappSession.ts        # Sesión principal (Singleton)
│   │
│   ├── index.ts                      # Punto de entrada
│   └── Server.ts                     # Clase principal del servidor
│
├── data/                             # Datos locales (Turso dev)
│   └── scout/
│
├── prisma/                           # Prisma root (alternativo)
│   └── migrations/
│
├── .env.example                      # Variables de entorno ejemplo
├── backup.sql                        # Backup de base de datos
├── docker-compose.yml                # Compose para Redis
├── package.json                      # Dependencias y scripts
├── pm2.config.js                     # Configuración PM2
├── tsconfig.json                     # Configuración TypeScript
├── README.md                         # Este archivo
└── Todo.md                           # Lista de tareas pendientes
```

### Convenciones de Nomenclatura

- **Archivos**: camelCase para TypeScript (`scoutService.ts`)
- **Clases**: PascalCase (`ScoutService`, `CacheManager`)
- **Funciones**: camelCase (`getScout`, `validatePermissions`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `JWT_SECRET`)
- **Tipos/Interfaces**: PascalCase con prefijo `I` para interfaces (`IScout`, `ScoutType`)

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (v18.14.2 o superior)
   ```bash
   node --version  # Verificar versión
   ```

2. **npm** (v9.5.0 o superior) o **yarn**
   ```bash
   npm --version
   ```

3. **Docker Desktop** (opcional, para desarrollo local)
   - Requerido para ejecutar Redis en contenedor
   - [Descargar Docker](https://www.docker.com/products/docker-desktop)

4. **Chromium** o Google Chrome
   - Requerido por WhatsApp Web.js (Puppeteer)
   - Viene instalado en la mayoría de sistemas

5. **Git**
   ```bash
   git --version
   ```

## 🛠 Configuración del Entorno de Desarrollo

### 1. Clonar el Repositorio

```bash
git clone https://github.com/aggutierrez98/scout-api.git
cd scout-api
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.development` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env.development
```

#### Variables Requeridas

```dosini
# ============================================
# SERVIDOR
# ============================================
PORT=3000                                    # Puerto del servidor Node.js

# ============================================
# SEGURIDAD
# ============================================
JWT_SECRET=tu_clave_secreta_super_segura    # Clave para firmar JWT (mínimo 32 caracteres)

# ============================================
# BASE DE DATOS (TURSO/LIBSQL)
# ============================================
TURSO_DATABASE_URL=http://127.0.0.1:9000    # URL de Turso (local en desarrollo)
TURSO_AUTH_TOKEN=                            # Token de autenticación (vacío en local)

# En desarrollo local, Turso corre con:
# turso dev --db-file ./src/prisma/scout.db --port 9000

# ============================================
# REDIS (CACHÉ)
# ============================================
REDIS_CONNECTION_URI=redis://localhost:6379  # URI de conexión Redis

# ============================================
# GOOGLE DRIVE API
# ============================================
# Credenciales de Service Account para Google Drive/Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_DATA_KEY=1ABC...xyz      # ID de la hoja de cálculo

# Cómo obtener credenciales:
# 1. Ir a https://console.cloud.google.com
# 2. Crear proyecto o seleccionar uno existente
# 3. Habilitar Google Drive API y Google Sheets API
# 4. Crear Service Account en IAM & Admin
# 5. Crear clave JSON y extraer email y private_key
# 6. Compartir el Spreadsheet con el email del Service Account

# ============================================
# AWS S3 (ALMACENAMIENTO)
# ============================================
AWS_S3_ACCESS_KEY=AKIA...                   # Access Key ID de AWS
AWS_S3_SECRET_ACCESS_KEY=...                # Secret Access Key
AWS_S3_BUCKET_NAME=scout-documentos         # Nombre del bucket
AWS_S3_REGION=us-east-1                     # Región del bucket

# Cómo configurar:
# 1. Crear bucket S3 en AWS Console
# 2. Crear usuario IAM con permisos S3
# 3. Generar Access Keys en IAM
# 4. Configurar política del bucket para permitir PutObject/GetObject

# ============================================
# LOGTAIL (LOGGING EN LA NUBE)
# ============================================
LOGTAIL_TOKEN=tu_token_logtail              # Token de Logtail (opcional)
LOGTAIL_INGESTING_HOST=in.logtail.com       # Host de ingesta

# Obtener token en: https://logtail.com

# ============================================
# WHATSAPP BOT (OPCIONAL)
# ============================================
# MONGODB_URI=mongodb://localhost:27017/whatsapp  # URI MongoDB para sesiones
# WHATSAPP_US_CHAT_ID=123456789@c.us              # ID del chat de WhatsApp

# ============================================
# DATOS DEL GRUPO SCOUT
# ============================================
DATOS_GRUPO='{"nombre":"Grupo Scout X","numero":123,"distrito":"Norte"}'
```

### 4. Configurar Base de Datos

La API utiliza **Turso** (LibSQL) que es SQLite compatible pero con capacidades distribuidas.

#### Desarrollo Local

```bash
# Iniciar Turso en modo desarrollo (ejecuta automáticamente con npm run dev)
turso dev --db-file ./src/prisma/scout.db --port 9000
```

#### Crear Esquema de Base de Datos

```bash
# Aplicar el esquema Prisma a la base de datos
npm run push:dev
```

Esto ejecuta `prisma db push` que:
- Crea las tablas según el schema
- No genera archivos de migración (útil en desarrollo)

### 5. Iniciar Redis (Caché)

Redis se usa para cachear peticiones frecuentes y mejorar el rendimiento.

```bash
# Iniciar Redis con Docker
docker compose up -d
```

Esto levanta un contenedor con Redis en el puerto `6379`.

**Alternativa sin Docker:**
```bash
# Instalar Redis localmente
# macOS
brew install redis
redis-server

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis
```

### 6. Cargar Datos de Prueba

Para desarrollo, puedes cargar datos desde Google Sheets:

```bash
# Script que ejecuta todas las cargas en orden
sh src/bin/dumpData.sh
```

O individualmente:
```bash
npm run load-equipos:dev      # Cargar equipos/patrullas
npm run load-scouts:dev       # Cargar scouts
npm run load-familiares:dev   # Cargar familiares
npm run load-documentos:dev   # Cargar tipos de documentos
npm run load-entregas:dev     # Cargar entregas de insignias
npm run load-pagos:dev        # Cargar pagos
```

### 7. Crear Usuario Administrador

```bash
npm run create-admin:dev
```

Este script interactivo te pedirá:
- Username
- Password
- Confirmación de password

El usuario creado tendrá rol `ADMIN` con todos los permisos.

### 8. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Esto ejecuta:
- **Turso**: Base de datos local en puerto 9000
- **Nodemon**: Recarga automática al detectar cambios
- **Servidor Express**: En el puerto especificado en `.env.development`

#### Verificar que funciona

```bash
# Health check
curl http://localhost:3000/api/auth/health

# Documentación Swagger
open http://localhost:3000/docs
```

### 9. Herramientas de Desarrollo

#### Prisma Studio (GUI para la BD)

```bash
npm run studio:dev
```

Abre una interfaz web en `http://localhost:5555` para explorar y editar datos.

#### Logs

Los logs se muestran en consola con colores:
- 🟢 **INFO**: Operaciones normales
- 🟡 **WARN**: Advertencias
- 🔴 **ERROR**: Errores
- 🟣 **HTTP**: Peticiones HTTP
- ⚪ **DEBUG**: Información de depuración

#### Hot Reload

El servidor se recarga automáticamente al guardar cambios en archivos `.ts`.

### 10. Limpiar Base de Datos

Si necesitas reiniciar la base de datos:

```bash
npm run deleteDBData:dev   # Borrar todos los datos
npm run push:dev           # Recrear esquema
sh src/bin/dumpData.sh     # Recargar datos de prueba
npm run create-admin:dev   # Crear nuevo admin
```

## 🔌 Integraciones de Terceros

### 1. Google Drive API / Google Sheets

**Propósito**: Importación masiva de datos desde hojas de cálculo.

#### Configuración

1. **Crear Proyecto en Google Cloud Console**
   - Ir a [Google Cloud Console](https://console.cloud.google.com)
   - Crear un nuevo proyecto o seleccionar uno existente

2. **Habilitar APIs**
   ```
   Google Drive API
   Google Sheets API
   ```

3. **Crear Service Account**
   - Ir a `IAM & Admin` > `Service Accounts`
   - Crear Service Account
   - Generar clave JSON
   - Extraer `client_email` y `private_key`

4. **Compartir Spreadsheet**
   - Abrir tu Google Sheet
   - Compartir con el email del Service Account (client_email)
   - Copiar el ID del Sheet (de la URL)

5. **Configurar Variables**
   ```dosini
   GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_SPREADSHEET_DATA_KEY=1ABC...xyz
   ```

#### Uso

```typescript
// Leer datos de una hoja
import { getSpreadSheetData } from './utils/helpers/googleDriveApi';
const scouts = await getSpreadSheetData('scouts');

// Escribir datos
import { writeSpreadSheet } from './utils/helpers/googleDriveApi';
await writeSpreadSheet('scouts', scoutsData);
```

#### Hojas Disponibles
- `scouts`: Datos de scouts
- `familiares`: Datos de familiares
- `equipos`: Equipos/patrullas
- `documentos`: Tipos de documentos
- `entregas`: Entregas de insignias
- `pagos`: Pagos/cuotas
- `usuarios`: Usuarios del sistema

### 2. AWS S3

**Propósito**: Almacenamiento persistente de documentos PDF (fichas médicas, autorizaciones, etc.).

#### Configuración

1. **Crear Bucket S3**
   - Ir a [AWS S3 Console](https://s3.console.aws.amazon.com)
   - Crear nuevo bucket
   - Configurar región (ej: `us-east-1`)

2. **Configurar Políticas**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::tu-bucket/*"
       }
     ]
   }
   ```

3. **Crear Usuario IAM**
   - Ir a `IAM` > `Users`
   - Crear usuario con acceso programático
   - Adjuntar política de S3
   - Generar Access Keys

4. **Configurar Variables**
   ```dosini
   AWS_S3_ACCESS_KEY=AKIA...
   AWS_S3_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET_NAME=scout-documentos
   AWS_S3_REGION=us-east-1
   ```

#### Uso

```typescript
// Subir archivo
import { uploadToS3 } from './utils/lib/s3.util';
const etag = await uploadToS3(pdfBuffer, 'documentos/scout_123.pdf');

// Obtener URL firmada (temporal)
import { getFileInS3 } from './utils/lib/s3.util';
const signedUrl = await getFileInS3('documentos/scout_123.pdf');
// URL válida por 1 hora
```

### 3. Turso (LibSQL)

**Propósito**: Base de datos distribuida SQLite con sincronización en la nube.

#### Desarrollo Local

```bash
# Ejecutar servidor local (incluido en npm run dev)
turso dev --db-file ./src/prisma/scout.db --port 9000
```

#### Producción en Turso Cloud

1. **Crear cuenta** en [turso.tech](https://turso.tech)

2. **Instalar CLI**
   ```bash
   brew install tursodatabase/tap/turso
   # o
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

3. **Crear base de datos**
   ```bash
   turso db create scout-db
   turso db show scout-db
   ```

4. **Obtener credenciales**
   ```bash
   turso db tokens create scout-db
   turso db show scout-db --url
   ```

5. **Configurar variables**
   ```dosini
   TURSO_DATABASE_URL=libsql://scout-db-[user].turso.io
   TURSO_AUTH_TOKEN=eyJhb...
   ```

### 4. Redis

**Propósito**: Caché de consultas frecuentes para optimizar rendimiento.

#### Configuración

```dosini
REDIS_CONNECTION_URI=redis://localhost:6379
```

#### Uso Interno

El caché se gestiona automáticamente mediante middlewares:

```typescript
// En routes
router.get('/:id', 
  cacheMiddleware,        // Cachea GET requests
  controller.getItem
);

router.put('/:id',
  cleanCacheMiddleware,   // Invalida caché al modificar
  controller.updateItem
);
```

#### TTL y Configuración

```typescript
// En middlewares/cache.ts
cacheManager.set(cacheKey, data, {
  expirationInMs: 60000  // 1 minuto
});
```

### 5. WhatsApp Web.js

**Propósito**: Bot automatizado para notificaciones y consultas.

#### Características

- 📅 Recordatorios automáticos de cumpleaños
- 📊 Consultas de información (scouts, pagos, documentos)
- 🔔 Notificaciones de eventos

#### Configuración

1. **MongoDB para sesiones** (opcional, se puede usar LocalAuth)
   ```dosini
   MONGODB_URI=mongodb://localhost:27017/whatsapp
   WHATSAPP_US_CHAT_ID=123456789@c.us
   ```

2. **Activar en código**
   ```typescript
   // En src/index.ts (actualmente comentado)
   await serverInstance.connectWhatsapp();
   ```

3. **Escanear QR**
   - Al iniciar, se mostrará un QR en la consola
   - Escanear con WhatsApp Web en tu teléfono

#### Comandos del Bot

- `menu`: Mostrar comandos disponibles
- `scouts`: Listar scouts activos
- `cumpleaños`: Ver cumpleaños del mes
- `documentos [dni]`: Documentos faltantes de un scout
- `pagos [semana]`: Pagos de la semana

### 6. Logtail

**Propósito**: Logs centralizados en la nube para producción.

#### Configuración

1. **Crear cuenta** en [logtail.com](https://logtail.com)
2. **Obtener token** del dashboard
3. **Configurar variables**
   ```dosini
   LOGTAIL_TOKEN=tu_token_logtail
   LOGTAIL_INGESTING_HOST=in.logtail.com
   ```

#### Logs Enviados

- Errores críticos
- Peticiones HTTP (en producción)
- Eventos importantes (login, cambios de permisos, etc.)

## 📜 Scripts Disponibles

### Desarrollo

```bash
npm run dev                  # Iniciar servidor de desarrollo con hot-reload
npm run studio:dev           # Abrir Prisma Studio
npm run push:dev             # Aplicar cambios del schema a la BD
```

### Producción

```bash
npm run build                # Compilar TypeScript a JavaScript
npm start                    # Iniciar servidor en producción
npm run studio               # Prisma Studio en producción
npm run push                 # Push schema en producción
```

### Gestión de Datos

```bash
# Cargar datos desde Google Sheets (desarrollo)
npm run load-scouts:dev
npm run load-familiares:dev
npm run load-equipos:dev
npm run load-documentos:dev
npm run load-entregas:dev
npm run load-pagos:dev

# Cargar datos en producción
npm run load-scouts
npm run load-familiares
# ... (equivalentes sin :dev)

# Eliminar todos los datos
npm run deleteDBData:dev     # Desarrollo
npm run deleteDBData         # Producción
```

### Usuarios

```bash
npm run create-admin:dev     # Crear admin en desarrollo
npm run createAdmin          # Crear admin en producción
npm run save-users:dev       # Exportar usuarios a Sheets (dev)
npm run save-users           # Exportar usuarios a Sheets (prod)
```

### Utilidades

```bash
npm run fill-pdf             # Completar PDFs con datos (testing)
npm test                     # Ejecutar tests (pendiente implementar)
```

## 🚀 Producción

### Compilar para Producción

```bash
# 1. Compilar TypeScript
npm run build

# 2. Verificar carpeta dist/
ls -la dist/
```

### Variables de Entorno de Producción

Crea `.env.production` con las credenciales reales:

```dosini
NODE_ENV=production
PORT=3000

# Base de datos Turso remota
TURSO_DATABASE_URL=libsql://scout-db-[user].turso.io
TURSO_AUTH_TOKEN=eyJhbG...

# Redis (puede ser Redis Cloud, AWS ElastiCache, etc.)
REDIS_CONNECTION_URI=redis://usuario:password@redis-host:6379

# Resto de variables con credenciales de producción
JWT_SECRET=...
AWS_S3_ACCESS_KEY=...
# etc.
```

### Deployment Options

#### 1. VPS (DigitalOcean, Linode, AWS EC2)

```bash
# Instalar Node.js y PM2
npm install -g pm2

# Iniciar con PM2
pm2 start pm2.config.js

# Ver logs
pm2 logs

# Monitoreo
pm2 monit

# Guardar configuración
pm2 save
pm2 startup
```

#### 2. Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY src/prisma ./src/prisma
CMD ["npm", "start"]
```

```bash
docker build -t scout-api .
docker run -p 3000:3000 --env-file .env.production scout-api
```

#### 3. Plataformas Cloud

- **Railway**: Conectar repo GitHub y configurar variables
- **Render**: Deploy automático desde GitHub
- **Fly.io**: `fly launch` y `fly deploy`
- **Vercel**: Funciona con API Routes de Next.js (requiere adaptación)

### Consideraciones de Producción

✅ **Hacer**:
- Usar `NODE_ENV=production`
- Habilitar rate limiting (`express-rate-limit`)
- Configurar CORS con dominios específicos
- Usar HTTPS (certificado SSL)
- Configurar logs en Logtail
- Hacer backups regulares de la BD
- Usar Redis externo (no contenedor local)
- Configurar monitoreo (PM2, DataDog, etc.)

❌ **No hacer**:
- Exponer variables de entorno en el código
- Usar base de datos local de Turso
- Deshabilitar autenticación JWT
- Permitir CORS desde cualquier origen (`*`)
- Ignorar logs de errores

### Notas Importantes

**WhatsApp Web.js**:
- Solo funciona correctamente con Node.js v18.14.2 y npm v9.5.0
- Si usas otra versión, cambia a `LocalAuth` en lugar de `MongoStore`
- Puppeteer requiere dependencias adicionales en Linux (librerías gráficas)

**Turso Dev**:
- En desarrollo, ejecutar `turso dev` antes de iniciar el servidor
- El comando `npm run dev` ya lo hace automáticamente con `concurrently`

**Prisma**:
- Ejecutar `npm run push:dev` después de cambios en `schema.prisma`
- Nunca editar archivos en `@prisma/client` manualmente

---

## 📞 Soporte

Para reportar issues o contribuir:
- **GitHub Issues**: [scout-api/issues](https://github.com/aggutierrez98/scout-api/issues)
- **Repository**: [github.com/aggutierrez98/scout-api](https://github.com/aggutierrez98/scout-api)

## 📄 Licencia

ISC License - Ver `LICENSE` para más detalles.
