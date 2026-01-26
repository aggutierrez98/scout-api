# Scout API

API REST para gestión de grupos Scout con bot de WhatsApp integrado. Sistema completo de administración de scouts, familiares, documentos, pagos y entregas de insignias.

## 📋 Tabla de Contenidos

- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura de la API](#-arquitectura-de-la-api)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Configurar entorno de desarrollo](#-configurar-entorno-de-desarrollo)
- [Flujo de Trabajo Diario de Desarrollo](#-flujo-de-trabajo-diario-de-desarrollo)
- [Herramientas de Desarrollo](#️-herramientas-de-desarrollo)
- [Integraciones de Terceros](#-integraciones-de-terceros)
- [Scripts Disponibles](#-scripts-disponibles)
- [Producción](#-producción)
- [Soporte](#-soporte)
- [Licencia](#-licencia)

## 🚀 Tecnologías Utilizadas

### Backend Core

- **Node.js** (v18.14.2+): Entorno de ejecución JavaScript
- **Express.js**: Framework web minimalista y flexible
- **TypeScript**: Superset tipado de JavaScript para mayor seguridad de tipos

### Base de Datos

- **Turso (LibSQL)**: Base de datos SQLite distribuida y serverless
- **Prisma ORM**: ORM moderno con generación de tipos automática
- **@prisma/adapter-libsql**: Adaptador para conectar Prisma con Turso/LibSQL

### Caché

- **Redis**: Sistema de caché en memoria para optimizar consultas frecuentes

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
- **Infisical**: Centralizacion de secretos

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
│            Mappers (Data Mapping)               │
│  • Transform Prisma models to DTOs              │
│  • uuid → id conversion                         │
│  • Computed fields (e.g., edad)                 │
│  • Type-safe data transformation                │
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

#### 7. **Capa de Mappers**

Sistema de transformación de datos entre la capa de persistencia (Prisma) y la capa de aplicación:

**Propósito:**

- **Abstracción de datos**: Separa la representación interna de la base de datos de la API pública
- **Transformación de tipos**: Convierte `uuid` (string) a `id` para mantener consistencia en la API
- **Campos computados**: Calcula automáticamente campos derivados como `edad` a partir de `fechaNacimiento`
- **Type-safety**: Garantiza tipado correcto entre capas sin usar `$extends` de Prisma

**Mappers implementados:**

- `mapUser`: Transforma usuarios con scouts/familiares anidados
- `mapScout` / `mapPartialScout`: Transforma scouts (completos o parciales) y calcula edad
- `mapFamiliar`: Transforma familiares y calcula edad
- `mapEquipo`: Transforma equipos/patrullas
- `mapPago`: Transforma registros de pagos
- `mapEntregaRealizada`: Transforma entregas de insignias
- `mapDocumentoPresentado`: Transforma documentos presentados
- `mapDocumentoDefinicion`: Transforma definiciones de documentos

**Ventajas:**

- ✅ Eliminación de `prisma.$extends` mejorando el rendimiento
- ✅ Mayor control sobre la forma de los datos expuestos
- ✅ Facilita testing y mocking de datos
- ✅ Permite evolucionar el schema de BD sin romper contratos de API

## 📁 Estructura de Carpetas

```
scout-api/
├── src/
│   ├── bin/                          # Scripts de utilidad y comandos CLI
│   │   ├── createAdminUser.ts        # Crear usuario administrador
│   │   ├── seedDB.ts                 # Alimentar base de datos local (Desarrollo)
│   │   ├── deleteDBData.ts           # Limpiar base de datos local (Desarrollo)
│   │   ├── seed/                     # Scripts independientes para seedDB.ts
│   │   │   ├── loadDocumentos.ts         # Importar documentos desde Sheets
│   │   │   ├── loadEntregas.ts           # Importar entregas
│   │   │   ├── loadEquipos.ts            # Importar equipos
│   │   │   ├── loadFamiliares.ts         # Importar familiares
│   │   │   ├── loadPagos.ts              # Importar pagos
│   │   │   ├── loadScouts.ts             # Importar scouts
│   │   │   └── saveUsersData.ts          # Guardar datos de usuarios
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
│   ├── mappers/                      # Transformadores de datos
│   │   ├── auth.ts                   # Mapper de usuarios
│   │   ├── scout.ts                  # Mapper de scouts (con edad)
│   │   ├── familiar.ts               # Mapper de familiares (con edad)
│   │   ├── equipo.ts                 # Mapper de equipos
│   │   ├── pago.ts                   # Mapper de pagos
│   │   ├── entrega.ts                # Mapper de entregas
│   │   ├── documentoPresentado.ts    # Mapper de documentos
│   │   └── index.ts                  # Exports centralizados
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

## 🛠 Configurar entorno de desarrollo

### Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js y npm** (v22.13.1 o superior) ([aqui](https://nodejs.org/en/download#/) tienes el enlace para descargar e instalar)

   ```bash
   node --version  # Verificar versión nodejs
   npm --version  # Verificar versión npm
   ```

2. **Docker & Docker Compose** (requerido)
   - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Verificar instalación:

   ```bash
   docker --version
   docker compose version
   ```

3. **DBeaver Community** (recomendado para visualizar la base de datos)
   - [Descargar DBeaver](https://dbeaver.io/download/)
   - Cliente universal de base de datos para explorar y administrar la BD Turso/SQLite

4. **Git**

   ```bash
   git --version
   ```

### Configurar y levantar el entorno

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/aggutierrez98/scout-api.git
cd scout-api
```

#### 2. Instalar Dependencias

```bash
npm install
```

#### 3. Configurar Variables de Entorno e Infisical

#### a) Crear archivo .env.development copiado del archivo de ejemplo (.env.example)

```bash
cp .env.example .env.development
```

#### b) Solicitar Credenciales de Infisical

Este proyecto usa [**Infisical**](https://infisical.com/) para gestionar secretos de forma centralizada y segura.

**Solicita al administrador del proyecto** las siguientes credenciales para tu entorno:

- `INFISICAL_SERVICE_TOKEN` - Service Token para el ambiente de desarrollo
- `INFISICAL_PROJECT_ID` - ID del proyecto en Infisical
- `INFISICAL_ENV` - Ambiente de Infisical (ej: `dev`, `staging`, `prod`)
- `INFISICAL_SITE_URL` - URL del servidor Infisical (usualmente `https://app.infisical.com`)

> 💡 **Nota**: El administrador generará un Service Token específico para el ambiente de desarrollo. Cada ambiente (dev/staging/prod) tiene su propio token con acceso solo a los secretos de ese ambiente. Todos los secretos (AWS, Google Drive, Turso, etc.) están configurados centralmente.

Edita `.env.development` y completa con las credenciales proporcionadas:

```dosini
NODE_ENV=development
PORT=8080

# Credenciales proporcionadas por el administrador
INFISICAL_SERVICE_TOKEN=<service-token-del-admin>
INFISICAL_PROJECT_ID=<project-id>
INFISICAL_ENV=dev
INFISICAL_SITE_URL=<infisical-site-url>
```

### 4. Inicializar Entorno Docker (Primera Vez)

**⚠️ Este paso es obligatorio la primera vez que trabajas con el proyecto:**

Primero asegurarse de tener libres los puertos 9000 y 6379.
Luego correr el comando:

```bash
# Inicializa Docker (Turso + Redis) y carga datos de desarrollo
npm run docker:init-with-data
```

> Nota: Este comando realiza automáticamente:
>
> 1. 🐳 Levanta contenedores Docker (Turso + Redis)
> 2. 📦 Copia la base de datos `data/scout.db` al contenedor
> 3. 💻 Crea el cliente de prisma.
> 4. 🗑️ Limpia datos existentes en la base de datos
> 5. 📥 Carga datos de desarrollo desde Google Sheets (scouts, familiares, equipos, etc.).
> 6. **Tiempo estimado:** 2-3 minutos

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

El usuario creado tendrá rol `ADMIN` con todos los permisos.

> **Nota:** Este paso requiere que los contenedores Docker estén corriendo.

### 6. Iniciar Servidor de Desarrollo

Una vez completada la inicialización Docker del paso 4, puedes trabajar normalmente:

```bash
npm run dev
```

El servidor iniciará en `http://localhost:8080` (o el puerto configurado en `.env.development`).

### 7. Verificar Instalación

Una vez iniciado el servidor (`npm run dev`), verifica que todo funciona:

```bash
# Health check del API
curl http://localhost:8080/health

# Abrir documentación Swagger
open http://localhost:8080/docs
```

## 🔄 Flujo de Trabajo Diario de Desarrollo

### Luego de haber configurado el proyecto una primera vez, cada vez que se quiera correr el proyecto se hara

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

El servidor ejecuta:

- **Turso (LibSQL)**: Base de datos en puerto 9000 (contenedor Docker)
- **Redis**: Caché en puerto 6379 (contenedor Docker)
- **Express API**: En el puerto configurado en `.env.development` (default: 8080)
- **Nodemon**: Hot reload automático al detectar cambios

## 🛠️ Herramientas de Desarrollo

### DBeaver - Explorador de Base de Datos

DBeaver permite visualizar y administrar la base de datos Turso/SQLite de forma gráfica.

#### Configurar DBeaver para conectarse a la base de datos local

1. **Abrir DBeaver** y crear una nueva conexión
2. **Seleccionar tipo de base de datos**:
   - En el diálogo de nueva conexión, buscar y seleccionar **LibSQL**
3. **Configurar la conexión**:
   - **Conexion**: Seleccionar conexion por `Host`.
   - **Server URL**: Ingresar la URL `http://localhost:9000`
   - Hacer clic en **Test Connection** para verificar
4. **Guardar y conectar**

> 💡 **Nota**: Los contenedores Docker deben estar corriendo (`npm run docker:init`) para que DBeaver pueda conectarse.

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

#### Uso de Google Drive API

```typescript
// Leer datos de una hoja
import { getSpreadSheetData } from "./utils/helpers/googleDriveApi";
const scouts = await getSpreadSheetData("scouts");

// Escribir datos
import { writeSpreadSheet } from "./utils/helpers/googleDriveApi";
await writeSpreadSheet("scouts", scoutsData);
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

#### Uso de AWS

```typescript
// Subir archivo
import { uploadToS3 } from "./utils/lib/s3.util";
const etag = await uploadToS3(pdfBuffer, "documentos/scout_123.pdf");

// Obtener URL firmada (temporal)
import { getFileInS3 } from "./utils/lib/s3.util";
const signedUrl = await getFileInS3("documentos/scout_123.pdf");
// URL válida por 1 hora
```

### 3. Turso (LibSQL)

**Propósito**: Base de datos distribuida SQLite con sincronización en la nube.

### 4. Redis

**Propósito**: Caché de consultas frecuentes para optimizar rendimiento.

#### Uso Interno

El caché se gestiona automáticamente mediante middlewares:

```typescript
// En routes
router.get(
  "/:id",
  cacheMiddleware, // Cachea GET requests
  controller.getItem,
);

router.put(
  "/:id",
  cleanCacheMiddleware, // Invalida caché al modificar
  controller.updateItem,
);
```

#### TTL y Configuración

```typescript
// En middlewares/cache.ts
cacheManager.set(cacheKey, data, {
  expirationInMs: 60000, // 1 minuto
});
```

### 5. Logtail

**Propósito**: Logs centralizados en la nube para producción.

#### Logs Enviados

- Errores críticos
- Peticiones HTTP (en producción)
- Eventos importantes (login, cambios de permisos, etc.)

### 6. Infisical

**Proposito**: Centralizar los secretos haciendo mas facil la mantenibilidad y configuracion.

#### (Arquitectura)

Al iniciar la aplicación, el ⁠ SecretsManager ⁠ (singleton) se autentica con Infisical usando tus credenciales y descarga todos los secretos de forma segura:

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
```

Tu código usa:

```typescript
SecretsManager.getInstance().getJWTSecret();
SecretsManager.getInstance().getAWSSecrets();
```

**Ventajas de este enfoque:**
✅ **Cero configuración local** - Solo 4 variables en tu `.env`
✅ **Secretos centralizados** - El admin actualiza, todos reciben los cambios
✅ **Sin secretos en Git** - `.env.development` solo tiene credenciales de acceso
✅ **Tipado completo** - TypeScript valida todos los secretos
✅ **Rotación fácil** - El admin rota secretos sin tocar tu código

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

// TODO: CAMBIAR por credenciales infisical
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

### Notas Importantes

**Docker**:

- Los contenedores deben estar corriendo antes de iniciar el servidor
- Usar `npm run docker:status` para verificar estado de contenedores
- Si los contenedores están detenidos, ejecutar `npm run docker:init`

**Prisma**:

- El esquema se gestiona mediante migraciones en Prisma (ver `src/prisma/migrations/`)
- Nunca editar archivos en `@prisma/client` manualmente

**Gestión de Cambios en la Base de Datos (Desarrollo)**:

Cada vez que realices cambios en la estructura de la base de datos (`src/prisma/schema.prisma`), debes aplicar estos cambios tanto al cliente de Prisma como a la base de datos local:

1. **Regenerar el cliente de Prisma** (actualiza los tipos TypeScript):

   ```bash
   npm run prisma:generate-client:dev
   ```

2. **Crear migración** (genera archivo SQL con los cambios):

   ```bash
   npm run prisma:migrate:dev
   ```

3. **Aplicar migración a la base de datos local**:

   ```bash
   npm run prisma:apply-migrations:dev
   ```

> 💡 **Nota**: Estos comandos afectan solo tu entorno de desarrollo local. Para aplicar cambios a producción (Turso), usa los comandos de producción documentados más abajo.

---

## 📞 Soporte
