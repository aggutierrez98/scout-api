# uScout API

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

- **Infisical SDK**: Gestión centralizada y segura de secretos y variables de entorno
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

## 📁 Estructura de Carpetasscout-api/├── src/

```
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
├── prisma/                           # Prisma root (alternativo)
│   └── migrations/
│
├── .env.example                      # Variables de entorno ejemplo
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

1. **Node.js** (v22.13.1 o superior)

   ```bash
   node --version  # Verificar versión
   ```
2. **npm** (v9.5.0 o superior)

   ```bash
   npm --version
   ```
3. **Docker & Docker Compose** (requerido)

   - **Obligatorio para desarrollo**: Ejecuta Turso (LibSQL) y Redis
   - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Verificar instalación:

   ```bash
   docker --version
   docker compose version
   ```
4. **Credenciales de Infisical** (solicitar al administrador)

   - **No necesitas crear cuenta en Infisical**
   - El administrador del proyecto te proporcionará:
     - `INFISICAL_SERVICE_TOKEN` - Service Token del ambiente de desarrollo
     - `INFISICAL_PROJECT_ID` - ID del proyecto
     - `INFISICAL_ENV` - Ambiente (ej: `dev`, `staging`, `prod`)
     - `INFISICAL_SITE_URL` - URL del servidor (opcional)
   - Estos valores te darán acceso a todos los secretos del ambiente configurado
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

### 3. Configurar Variables de Entorno e Infisical

Este proyecto usa **Infisical** para gestionar secretos de forma centralizada y segura.

#### a) Solicitar Service Token de Infisical

**Solicita al administrador del proyecto** las siguientes credenciales para tu entorno:

- `INFISICAL_SERVICE_TOKEN` - Service Token para el ambiente de desarrollo
- `INFISICAL_PROJECT_ID` - ID del proyecto en Infisical
- `INFISICAL_ENV` - Ambiente de Infisical (ej: `dev`, `staging`, `prod`)
- `INFISICAL_SITE_URL` - URL del servidor Infisical (usualmente `https://app.infisical.com`)

> 💡 **Nota**: El administrador generará un Service Token específico para el ambiente de desarrollo. Cada ambiente (dev/staging/prod) tiene su propio token con acceso solo a los secretos de ese ambiente. Todos los secretos (AWS, Google Drive, Turso, etc.) están configurados centralmente.

#### b) Crear archivo .env.development

```bash
cp .env.example .env.development
```

Edita `.env.development` y completa con las credenciales proporcionadas:

```dosini
NODE_ENV=development
PORT=8080

# Credenciales proporcionadas por el administrador
INFISICAL_SERVICE_TOKEN=<service-token-del-admin>
INFISICAL_PROJECT_ID=<project-id>
INFISICAL_ENV=dev
INFISICAL_SITE_URL=https://app.infisical.com
```

#### c) Secretos gestionados centralmente

Los siguientes secretos están configurados en Infisical por el administrador (no necesitas configurarlos localmente):

**Secretos principales:**

- `DATABASE_URL` - Ruta local de SQLite (file:./src/prisma/scout.db)
- `JWT_SECRET` - Clave para firmar tokens JWT
- `REDIS_CONNECTION_URI` - URI de conexión a Redis
- `DATOS_GRUPO` - JSON con datos del grupo: `{"numero":"58","nombre":"Madre Teresa","distrito":"2","zona":"9"}`

**AWS S3 (almacenamiento de documentos):**

- `S3_ACCESS_KEY` - Access Key ID de AWS
- `S3_SECRET_ACCESS_KEY` - Secret Access Key
- `S3_BUCKET_NAME` - Nombre del bucket
- `S3_REGION` - Región del bucket (ej: us-east-1)

**BetterStack (logs en producción):**

- `BETTERSTACK_AUTH_TOKEN` - Token de autenticación
- `BETTERSTACK_INGESTING_HOST` - Host de ingesta (in.logs.betterstack.com)

**Google Drive (carga de datos):**

- `GOOGLE_DRIVE_PRIVATE_KEY` - Private key del Service Account
- `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` - Email del Service Account
- `GOOGLE_DRIVE_SPREADSHEET_DATA_KEY` - ID de la hoja de datos

**Turso (producción):**

- `TURSO_AUTH_TOKEN` - Token de autenticación de Turso Cloud
- `TURSO_DATABASE_URL` - URL de base de datos Turso (libsql://...)

#### d) ¿Cómo funciona? (Arquitectura)

Al iniciar la aplicación, el `SecretsManager` (singleton) se autentica con Infisical usando tus credenciales y descarga todos los secretos de forma segura:

```
Tu máquina                          Infisical Cloud
─────────────                       ───────────────
                                
.env.development                    📦 Proyecto Scout API
  ├─ CLIENT_ID      ────┐           ├─ JWT_SECRET
  ├─ CLIENT_SECRET  ────┼──────────►├─ AWS Keys
  └─ PROJECT_ID     ────┘   Auth    ├─ Google Drive Keys
                                    ├─ Turso Credentials
SecretsManager                      └─ Redis URI
  └─ Descarga secretos tipados
  
Tu código usa:
  • SecretsManager.getInstance().getJWTSecret()
  • SecretsManager.getInstance().getAWSSecrets()
  • etc. (todo tipado en TypeScript)
```

**Ventajas de este enfoque:**
✅ **Cero configuración local** - Solo 4 variables en tu `.env`
✅ **Secretos centralizados** - El admin actualiza, todos reciben los cambios
✅ **Sin secretos en Git** - `.env.development` solo tiene credenciales de acceso
✅ **Tipado completo** - TypeScript valida todos los secretos
✅ **Rotación fácil** - El admin rota secretos sin tocar tu código

### 4. Inicializar Entorno Docker (Primera Vez)

**⚠️ Este paso es obligatorio la primera vez que trabajas con el proyecto:**

```bash
# Inicializa Docker (Turso + Redis) y carga datos de desarrollo
npm run docker:init-with-data
```

Este comando realiza automáticamente:

1. 🐳 Levanta contenedores Docker (Turso + Redis)
2. 📦 Copia la base de datos `src/prisma/scout.db` al contenedor
3. 🗑️ Limpia datos existentes en la base de datos
4. 📥 Carga datos de desarrollo desde Google Sheets (scouts, familiares, equipos, etc.)
5. 👤 Permite crear un usuario administrador

**Tiempo estimado:** 2-3 minutos

Esto levanta:

- **Turso (LibSQL)**: Puerto 9000 - Base de datos SQLite con datos de desarrollo
- **Redis**: Puerto 6379 - Sistema de caché en memoria

### 5. Crear Usuario Administrador

```bash
npm run create-admin:dev
```

Este script interactivo te pedirá:

- Username
- Password
- Confirmación de password

El usuario creado tendrá rol `ADMIN` con todos los permisos.

> **Nota:** Este paso requiere que los contenedores Docker estén corriendo.

### 6. Iniciar Servidor de Desarrollo

Una vez completada la inicialización Docker del paso 4, puedes trabajar normalmente:

```bash
npm run dev
```

El servidor iniciará en `http://localhost:3000` (o el puerto configurado en `.env.development`).

## 🔄 Flujo de Trabajo Diario

### Primera vez trabajando en el proyecto

```bash
npm run docker:init-with-data  # Inicia Docker + carga datos
npm run create-admin:dev       # Crea usuario administrador
npm run dev                     # Inicia servidor
```

### Sesiones posteriores

**Si los contenedores están detenidos:**

```bash
npm run docker:init  # Solo inicia contenedores
npm run dev          # Inicia servidor
```

**Si los contenedores ya están corriendo:**

```bash
npm run dev  # Solo inicia el servidor
```

**Verificar estado de contenedores:**

```bash
npm run docker:status
```

### Recargar datos de desarrollo

Si necesitas refrescar los datos desde Google Sheets:

```bash
npm run docker:load-data
```

Este comando ejecuta automáticamente:

1. Limpieza de datos existentes (`deleteDBData`)
2. Guardado de usuarios (`save-users`)
3. Carga secuencial de: equipos → scouts → familiares → documentos → entregas → pagos

### 7. Verificar Instalación

Una vez iniciado el servidor (`npm run dev`), verifica que todo funciona:

```bash
# Health check del API
curl http://localhost:8080/api/auth/health

# Abrir documentación Swagger
open http://localhost:8080/docs

# Verificar estado de Docker
npm run docker:status
```

El servidor ejecuta:

- **Turso (LibSQL)**: Base de datos en puerto 9000 (contenedor Docker)
- **Redis**: Caché en puerto 6379 (contenedor Docker)
- **Express API**: En el puerto configurado en `.env.development` (default: 8080)
- **Nodemon**: Hot reload automático al detectar cambios

## 🛠️ Herramientas de Desarrollo

### Prisma Studio

Interfaz gráfica para explorar y editar la base de datos:

```bash
npm run studio:dev
```

Se abre en `http://localhost:5555`

### Logs del Sistema

El servidor muestra logs con colores según severidad:

- 🟢 **INFO**: Operaciones normales
- 🟡 **WARN**: Advertencias
- 🔴 **ERROR**: Errores críticos
- 🟣 **HTTP**: Peticiones HTTP entrantes
- ⚪ **DEBUG**: Información de depuración detallada

### Hot Reload

Nodemon detecta cambios en archivos `.ts` y reinicia el servidor automáticamente.

### Reiniciar Base de Datos

Si necesitas limpiar y recargar la base de datos completamente:

```bash
npm run deleteDBData:dev    # Borrar todos los datos
npm run docker:load-data    # Recargar desde Google Sheets
npm run create-admin:dev    # Crear nuevo usuario admin
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

#### Turso en Producción (Turso Cloud)

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

### Docker (Entorno de Desarrollo)

```bash
npm run docker:init              # Iniciar Docker (Turso + Redis)
npm run docker:init-with-data    # Iniciar Docker + cargar datos de desarrollo
npm run docker:load-data         # Solo cargar datos (Docker debe estar corriendo)
npm run docker:up                # Levantar contenedores
npm run docker:down              # Detener contenedores
npm run docker:restart           # Reiniciar contenedores
npm run docker:logs              # Ver logs de contenedores
npm run docker:status            # Ver estado de contenedores
```

### Desarrollo

```bash
npm run dev                  # Iniciar servidor de desarrollo con hot-reload
npm run dev:docker           # Iniciar Docker + servidor en un comando
npm run studio:dev           # Abrir Prisma Studio (GUI de base de datos)
```

### Producción

```bash
npm run build                # Compilar TypeScript a JavaScript
npm start                    # Iniciar servidor en producción
npm run studio               # Prisma Studio en producción
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

**Docker**:

- Los contenedores deben estar corriendo antes de iniciar el servidor
- Usar `npm run docker:status` para verificar estado de contenedores
- Si los contenedores están detenidos, ejecutar `npm run docker:init`

**Prisma**:

- El esquema se gestiona mediante migraciones en Prisma (ver `src/prisma/migrations/`)
- Nunca editar archivos en `@prisma/client` manualmente
- Regenerar cliente: `npx prisma generate`

---

## 📞 Soporte

Para reportar issues o contribuir:

- **GitHub Issues**: [scout-api/issues](https://github.com/aggutierrez98/scout-api/issues)
- **Repository**: [github.com/aggutierrez98/scout-api](https://github.com/aggutierrez98/scout-api)

## 📄 Licencia

ISC License - Ver `LICENSE` para más detalles.
