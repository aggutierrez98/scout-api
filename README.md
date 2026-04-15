# Scout API

API REST para gestión de grupos Scout. Sistema completo de administración de scouts, familiares, documentos, pagos, entregas de insignias e integración webhook con procesamiento automático de comprobantes de pago vía WhatsApp.

## 📋 Tabla de Contenidos

- [Dominio del Negocio](#-dominio-del-negocio)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura de la API](#-arquitectura-de-la-api)
- [Modelos de datos](#-modelos-de-datos)
- [Autenticación y RBAC](#-autenticación-y-rbac)
- [Rutas HTTP](#-rutas-http)
- [Webhook — whatsapp-comprobantes](#-webhook--whatsapp-comprobantes)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Configurar entorno de desarrollo](#-configurar-entorno-de-desarrollo)
- [Flujo de Trabajo Diario de Desarrollo](#-flujo-de-trabajo-diario-de-desarrollo)
- [Herramientas de Desarrollo](#️-herramientas-de-desarrollo)
- [Integraciones de Terceros](#-integraciones-de-terceros)
- [Scripts Disponibles](#-scripts-disponibles)
- [Producción](#-producción)

---

## 🎯 Dominio del Negocio

### Conceptos Clave del Movimiento Scout

#### Scouts

Niños y jóvenes que participan en el grupo Scout. Cada scout pertenece a una **rama** según su edad:

- **Manada** (6–10 años): Lobatos / Lobeznas
- **Unidad** (10–14 años): Scouts
- **Caminantes** (14–17 años): Rovers
- **Pioneros** (17–21 años): Dirigentes en formación

Cada scout tiene:

- **Progresión**: Nivel de avance en su formación (Huella, Senda, Travesía)
- **Función**: Rol dentro de su equipo (Guía, Subguía, Tesorero, etc.)
- **Estado**: `ACTIVO`, `INACTIVO`, `EGRESADO`

#### Equipos / Patrullas

Grupos pequeños de scouts (5–8 integrantes) dentro de una rama. Tienen nombre (generalmente de animales), lema y rama.

#### Documentos

Papeles administrativos requeridos por scout:

- Ficha médica, autorizaciones, DNI, certificado médico, ficha de inscripción

Propiedades relevantes:
- `vence`: si tiene fecha de vencimiento
- `completable`: si se puede generar automáticamente desde la API
- `requiereFamiliar`: si necesita datos del familiar
- `requiereFirma`: si necesita firma escaneada

#### Entregas

Insignias o reconocimientos: especialidades (Primeros Auxilios, Campismo), progresión de nivel, y méritos especiales.

#### Pagos

Cuotas mensuales o pagos por actividades. Campos clave: `concepto`, `monto`, `metodoPago` (`EFECTIVO`, `TRANSFERENCIA`, `OTRO`), `rendido`.

Los pagos pueden crearse manualmente vía la API o **automáticamente** a través del webhook de comprobantes.

#### Familiares

Tutores, padres o madres de scouts. Relación `PADRE`, `MADRE`, `TUTOR`, `OTRO`. Un scout puede tener múltiples familiares (relación N:M vía `FamiliarScout`).

---

## 🚀 Tecnologías Utilizadas

| Capa | Tecnología |
|------|-----------|
| Lenguaje | TypeScript 5.9 |
| Runtime | Node.js v22.13.1+ |
| Framework HTTP | Express.js 4.21.2 |
| ORM | Prisma 7 |
| Base de datos | Turso (LibSQL / SQLite distribuida) |
| Caché | Redis |
| Autenticación | JWT + bcryptjs |
| Validación | Zod |
| Logging | Winston + Logtail + Morgan |
| Almacenamiento archivos | AWS S3 |
| Integraciones externas | Google Sheets / Drive API |
| Gestión de secretos | Infisical |
| Generación PDF | pdf-lib |
| Protección HTTP | helmet, express-rate-limit, cors |
| Tareas programadas | node-cron |

---

## 🏗 Arquitectura de la API

La API sigue una **arquitectura en capas** con separación clara de responsabilidades:

```
HTTP Request
    ↓
Express Router
    ↓
checkSession (verifica JWT y evalúa RBAC)
    ↓
validate (valida body/params con esquema Zod)
    ↓
Controller (extrae datos del request)
    ↓
Service (lógica de negocio)
    ↓
Prisma (acceso a base de datos)
    ↓
Mapper (entidad → DTO, uuid → id público)
    ↓
HTTP Response
```

Los errores en cualquier capa se propagan vía `AppError` y son capturados por el middleware global de errores.

### Características Arquitectónicas

#### 1. Patrón MVC Modificado

- **Routes**: Definen endpoints y aplican middlewares
- **Controllers**: Manejan lógica HTTP (request/response)
- **Services**: Contienen lógica de negocio pura
- **Models**: Definición de esquemas (Prisma)

#### 2. Capa de Mappers

Sistema de transformación de datos entre Prisma y la capa de aplicación. Evita exponer `uuid` internos convirtiendo al campo público `id`.

Mappers implementados: `mapScout`, `mapPartialScout`, `mapFamiliar`, `mapEquipo`, `mapPago`, `mapEntregaRealizada`, `mapDocumentoPresentado`, `mapDocumentoDefinicion`, `mapUser`.

```typescript
const scout = await prisma.scout.findUnique({ where: { uuid: id } });
return mapScout(scout); // transforma uuid → id, calcula edad
```

#### 3. Convenciones de IDs

- `id`: autoincremental (INT) solo para uso interno en BD
- `uuid`: nanoid, usado siempre en la API — **nunca se expone `id` directamente**

#### 4. Inyección de Dependencias

Los servicios se instancian en `Server.ts` y se pasan como parámetros a los routers y controllers:

```typescript
const scoutService = new ScoutService();
router.use("/scout", checkSession, createScoutRouter(scoutService));
```

#### 5. Singletons

- `SecretsManager`: descarga secretos desde Infisical al iniciar
- `CacheManager`: única instancia del cliente Redis

#### 6. Caché (Cache-Aside / Lazy Loading)

- `cacheMiddleware`: cachea respuestas GET en Redis (TTL: 60 segundos)
- `cleanCacheMiddleware`: invalida caché en operaciones de escritura
- Clave de caché: `{recurso}/{params}` (e.g. `scout/123`, `pago?scoutId=abc`)

---

## 💾 Modelos de datos

### Scout

| Campo | Tipo | Descripción |
|---|---|---|
| `uuid` | String (PK) | Identificador interno (nunca expuesto) |
| `nombre` | String | — |
| `apellido` | String | — |
| `dni` | String | Único |
| `sexo` | Enum | — |
| `fechaNacimiento` | DateTime | — |
| `localidad` | String | — |
| `direccion` | String | — |
| `telefono` | String | Usado para matching de comprobantes webhook |
| `mail` | String | — |
| `rama` | Enum | Manada, Unidad, Caminantes, Pioneros |
| `funcion` | Enum | Guía, Subguía, Tesorero, etc. |
| `equipoId` | String (FK) | Patrulla a la que pertenece |
| `estado` | Enum | `ACTIVO`, `INACTIVO`, `EGRESADO` |
| `progresionActual` | String | Etapa de progresión vigente |

### Pago

| Campo | Tipo | Descripción |
|---|---|---|
| `uuid` | String (PK) | — |
| `concepto` | String | Descripción del pago |
| `monto` | Float | Importe |
| `rendido` | Boolean | Si fue rendido en tesorería |
| `metodoPago` | Enum | `EFECTIVO`, `TRANSFERENCIA`, `OTRO` |
| `scoutId` | String (FK) | — |
| `fechaPago` | DateTime | Fecha del comprobante o ingreso |

### Familiar

Datos del familiar: `uuid`, `nombre`, `apellido`, `dni`, `sexo`, `telefono`, `mail`.

### FamiliarScout (N:M)

| Campo | Tipo | Descripción |
|---|---|---|
| `familiarId` | String (FK) | — |
| `scoutId` | String (FK) | — |
| `relacion` | Enum | `PADRE`, `MADRE`, `TUTOR`, etc. |

### Equipo

`uuid`, `nombre`, `lema`, `rama`.

### Documento / DocumentoPresentado / EntregaRealizada

- `Documento`: catálogo de tipos de documentos requeridos por la organización
- `DocumentoPresentado`: instancia de documento presentado por un scout; referencia al archivo en S3
- `EntregaRealizada`: registro de insignias y hitos de progresión completados

---

## 🔐 Autenticación y RBAC

### JWT

- Expiración: **2 horas**
- Middleware `checkSession`: valida el token en cada request protegido y adjunta el usuario al contexto

### Jerarquía de Roles

```
EXTERNO < COLABORADOR < EDUCADOR < JEFE_RAMA < ADMINISTRADOR
```

Cada rol incluye todos los permisos del rol anterior. Existen también roles especiales: `JOVEN`, `ACOMPAÑANTE`, `AYUDANTE_RAMA`, `SUBJEFE_RAMA`, `SUBJEFE_GRUPO`, `JEFE_GRUPO`, `PADRE_REPRESENTANTE`.

### Formato de Permisos

```
{accion}_{recurso}
```

Ejemplos: `create_pago`, `read_scout`, `delete_documento`, `modify_entrega`.

### Permisos por Rol

| Rol | Permisos clave |
|---|---|
| `EXTERNO` | `read_*` en todas las entidades + `create_documento` |
| `COLABORADOR` | Todo EXTERNO + `create_pago`, `modify_pago`, `modify_documento` |
| `EDUCADOR` | Todo COLABORADOR + `create_scout/equipo/familiar/entrega`, `modify_entrega/equipo/familiar`, `delete_equipo/documento/pago` |
| `JEFE_RAMA` | Todo EDUCADOR + `modify_scout`, `delete_scout/familiar/entrega` |
| `ADMINISTRADOR` | Todo JEFE_RAMA + `create_auth`, `modify_auth` |

---

## 🗺 Rutas HTTP

| Método | Path | Descripción |
|---|---|---|
| `POST` / `GET` | `/api/auth` | Login y validación JWT |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/scout` | CRUD de scouts |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/pago` | CRUD de pagos de cuotas |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/documento` | Gestión documental + subida a S3 |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/entrega` | Insignias y progresiones |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/familiar` | Gestión de familiares |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/equipo` | Patrullas / unidades |
| `POST` | `/api/webhook/comprobante` | Recepción de comprobantes vía webhook (whatsapp-comprobantes) |
| `POST` | `/api/webhook/nomina` | Recepción de nómina diaria vía webhook (cruz-del-sur) |
| `POST` | `/api/nomina/sync` | Pull on-demand de nómina desde cruz-del-sur (requiere ADMINISTRADOR) |
| — | `/health` | Health check |
| — | `/docs` | Documentación Swagger |

---

## 🔔 Webhook — whatsapp-comprobantes

El sistema **whatsapp-comprobantes** es un servicio externo que escucha mensajes de WhatsApp con imágenes o PDFs de comprobantes bancarios, los procesa mediante OCR (Gemini 2.0 Flash) y envía el resultado estructurado a este endpoint. scout-api identifica al scout correspondiente y registra el pago automáticamente.

### Archivos

```
src/
├── routes/webhook.ts           — Ruta POST /api/webhook/comprobante
├── controllers/webhook.ts      — Extrae datos y delega en el service
├── services/webhook.ts         — Lógica de matching y creación del pago
├── validators/webhook.ts       — Schema Zod del payload
├── middlewares/webhookAuth.ts  — Autenticación HMAC-SHA256
└── types/webhook.ts            — Interfaces TypeScript
```

### Autenticación

Esta ruta **NO usa `checkSession`**. La autenticación es exclusivamente por HMAC-SHA256:

```
X-Webhook-Secret: <HMAC-SHA256(body, WEBHOOK_SECRET)>
```

Si la firma no coincide → `HTTP 401`.

### Payload entrante

```json
{
  "evento": "comprobante_recibido",
  "timestamp": "2026-04-11T14:32:45.123Z",
  "datos": {
    "es_comprobante": true,
    "monto": 15000.50,
    "fecha": "2026-04-11",
    "hora": "14:32",
    "cbu_alias_destino": "juan.perez",
    "banco_emisor": "Mercado Pago",
    "cuit_emisor": "20-12345678-9",
    "nombre_emisor": "Juan Carlos Pérez",
    "numero_comprobante": "TXN-12345678-ABC",
    "concepto": "cuota scout",
    "whatsapp_remitente": "5491123456789",
    "whatsapp_chat_id": "5491123456789@s.whatsapp.net",
    "whatsapp_mensaje_texto": "Acá el comprobante",
    "whatsapp_timestamp": "2026-04-11T14:31:30.000Z"
  }
}
```

### Lógica de matching (en orden de prioridad)

1. **Por teléfono**: compara `datos.whatsapp_remitente` contra `scout.telefono` con normalización de prefijo internacional
2. **Por nombre**: compara `datos.nombre_emisor` contra `scout.nombre + apellido` de forma case-insensitive, sin tildes
3. **Sin match**: retorna `HTTP 422` sin registrar el pago

### Transformación a Pago

| Campo webhook | Campo Pago | Notas |
|---|---|---|
| `datos.monto` | `monto` | — |
| `datos.fecha` | `fechaPago` | Si es null, se usa la fecha actual |
| `datos.concepto` | `concepto` | Fallback: `TRANSFERENCIA {banco_emisor}`. Máx 50 chars, MAYÚSCULAS |
| _(fijo)_ `"TRANSFERENCIA"` | `metodoPago` | Siempre transferencia |
| scout encontrado `.uuid` | `scoutId` | — |
| _(fijo)_ `false` | `rendido` | Siempre queda pendiente de rendición |

### Respuestas HTTP

| Código | Situación |
|---|---|
| `201 Created` | Pago registrado correctamente |
| `400 Bad Request` | Payload inválido (Zod) |
| `401 Unauthorized` | Firma HMAC incorrecta o ausente |
| `422 Unprocessable Entity` | No se encontró scout coincidente |
| `500 Internal Server Error` | Error inesperado |

### Variable de entorno requerida

```env
WEBHOOK_SECRET=<valor-compartido-con-whatsapp-comprobantes>
```

> Generar con: `openssl rand -hex 32`. Debe coincidir exactamente entre ambos sistemas.

---

## 📋 Integración con cruz-del-sur — Nómina

La integración con **cruz-del-sur** mantiene sincronizados los scouts del sistema con la nómina oficial de Scouts de Argentina. Un scout con DNI presente en la nómina queda como `ACTIVO`; si no aparece, pasa a `INACTIVO`.

### Las 3 formas de comunicación

| Forma | Endpoint | Cuándo usarla |
|---|---|---|
| **1. On-demand pull** | `POST /api/nomina/sync` | Sincronización manual desde un cliente autenticado |
| **2. Webhook push** | `POST /api/webhook/nomina` | Cruz-del-sur envía la nómina diaria automáticamente |
| **3. Cron programado** | _(interno)_ | Sync automático diario a las 7:00 AM (Argentina) |

### Forma 1 — On-demand pull

```http
POST /api/nomina/sync
Authorization: Bearer <jwt-de-administrador>
```

Scout-api llama internamente a `GET {CRUZ_DEL_SUR_API_URL}/members` y sincroniza. Solo accesible con rol `ADMINISTRADOR` (permiso `create_nomina`).

**Respuesta:**

```json
{
  "procesados": 120,
  "actualizados": 115,
  "desactivados": 3,
  "noEncontrados": 5,
  "errores": 0,
  "timestamp": "2026-04-12T10:00:00.000Z"
}
```

### Forma 2 — Webhook push desde cruz-del-sur

```http
POST /api/webhook/nomina
X-Webhook-Source: cruz-del-sur
X-Webhook-Secret: <HMAC-SHA256(body, NOMINA_WEBHOOK_SECRET)>
Content-Type: application/json
```

Cruz-del-sur envía la nómina completa cuando la exporta. Scout-api valida la firma HMAC y sincroniza.

**Payload esperado:**

```json
{
  "event": "members.exported",
  "timestamp": "2026-04-12T09:00:00.000Z",
  "total": 120,
  "trigger": "scheduled",
  "data": [
    {
      "documento": "12345678",
      "nombre": "Juan",
      "apellido": "Pérez",
      "sexo": "Masculino",
      "fechaNacimiento": "15/05/2010",
      "rama": "Scouts",
      "funcion": "Scout",
      "telefono": "1123456789",
      "email": "juan@example.com",
      "localidad": "Buenos Aires",
      "calle": "Av. Siempre Viva 123"
    }
  ]
}
```

### Forma 3 — Cron programado

Scout-api ejecuta automáticamente un pull de la nómina todos los días a las **10:00 UTC (7:00 AM Argentina)**, una hora después del export diario de cruz-del-sur (6:00 AM).

### Lógica de sincronización

1. Para cada miembro de la nómina: buscar scout por `dni` (coincidencia exacta)
2. Si existe → actualizar campos + `estado = "ACTIVO"`
3. Si no existe → log de no encontrado, NO se crea automáticamente
4. Scouts activos en nuestro sistema cuyo DNI no está en la nómina → `estado = "INACTIVO"`

### Mapeo de campos

| Campo cruz-del-sur | Campo Scout | Transformación |
|---|---|---|
| `documento` | `dni` | Clave de matching |
| `nombre` | `nombre` | Directo |
| `apellido` | `apellido` | Directo |
| `sexo` | `sexo` | "Masculino"/"masculino"/"m" → "M"; "Femenino"/"femenino"/"f" → "F" |
| `fechaNacimiento` | `fechaNacimiento` | "DD/MM/YYYY" o "YYYY-MM-DD" → `Date` |
| `rama` | `rama` | "Scouts" → "SCOUTS", "Lobatos y Lobeznas" → "MANADA", etc. (`RAMAS_MAP`) |
| `funcion` | `funcion` | "Jefe de Manada" → "JEFE_RAMA", "Scout" → "JOVEN", etc. (`FUNCIONES_MAP`) |
| `telefono` | `telefono` | Directo |
| `email` | `mail` | Directo |
| `localidad` | `localidad` | Directo |
| `calle` | `direccion` | Directo |
| `provincia` | `provincia` | Directo |
| `nacionalidad` | `nacionalidad` | Directo |
| `religion` | `religion` | Directo |

### Variables de entorno

```env
# Credenciales para llamar a la API de cruz-del-sur (formas 1 y 3)
CRUZ_DEL_SUR_API_URL=http://localhost:3000
CRUZ_DEL_SUR_API_KEY=<api-key-de-cruz-del-sur>

# Secreto compartido para validar webhooks entrantes de cruz-del-sur (forma 2)
NOMINA_WEBHOOK_SECRET=<generar-con-openssl-rand-hex-32>
```

### Archivos involucrados

```
src/
├── types/nomina.ts                  — Interfaces CruzDelSurMember, NominaWebhookPayload, NominaSyncResult
├── validators/nomina.ts             — Schema Zod del payload webhook
├── middlewares/nominaWebhookAuth.ts — Auth HMAC-SHA256 para webhook
├── services/nomina.ts               — pullNomina, syncNomina, pullAndSync
├── controllers/nomina.ts            — syncOnDemand, recibirWebhook
└── routes/nomina.ts                 — createNominaRouter (webhook), createNominaSyncRouter (on-demand)
```

---

## 📁 Estructura de Carpetas

```
scout-api/
├── src/
│   ├── bin/                          # Scripts CLI
│   │   ├── createAdminUser.ts
│   │   ├── seedDB.ts
│   │   ├── deleteDBData.ts
│   │   └── seed/                     # Scripts individuales de seedDB
│   │       ├── loadScouts.ts
│   │       ├── loadFamiliares.ts
│   │       ├── loadEquipos.ts
│   │       ├── loadDocumentos.ts
│   │       ├── loadEntregas.ts
│   │       ├── loadPagos.ts
│   │       └── saveUsersData.ts
│   │
│   ├── controllers/                  # Lógica HTTP (request/response)
│   │   ├── auth.ts
│   │   ├── documento.ts
│   │   ├── entrega.ts
│   │   ├── equipo.ts
│   │   ├── familiar.ts
│   │   ├── pago.ts
│   │   ├── scout.ts
│   │   └── webhook.ts
│   │
│   ├── docs/                         # Swagger
│   │   ├── spec.json
│   │   └── swagger-ts/
│   │
│   ├── middlewares/
│   │   ├── cache.ts                  # Cache-Aside con Redis
│   │   ├── error.ts                  # Manejo global de errores
│   │   ├── httpLog.ts                # Morgan logger
│   │   ├── session.ts                # JWT + RBAC
│   │   ├── tooBusy.ts                # Protección contra sobrecarga
│   │   ├── validate.ts               # Validación Zod
│   │   └── webhookAuth.ts            # HMAC-SHA256 para webhook
│   │
│   ├── mappers/                      # Entidad → DTO (uuid → id)
│   │   ├── auth.ts, scout.ts, familiar.ts, equipo.ts
│   │   ├── pago.ts, entrega.ts, documentoPresentado.ts
│   │   └── index.ts
│   │
│   ├── models/
│   │   └── scout.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── routes/
│   │   ├── auth.ts, scout.ts, documento.ts, pago.ts
│   │   ├── familiar.ts, equipo.ts, entrega.ts
│   │   ├── webhook.ts
│   │   └── index.ts
│   │
│   ├── services/                     # Lógica de negocio pura
│   │   ├── auth.ts, scout.ts, documento.ts, pago.ts
│   │   ├── familiar.ts, equipo.ts, entrega.ts
│   │   └── webhook.ts
│   │
│   ├── types/
│   │   ├── constantTypes.ts          # Enums (ROLES, ramas, etc.)
│   │   ├── scout.ts, familiar.ts, pago.ts, documento.ts
│   │   ├── entrega.ts, equipo.ts, user.ts, webhook.ts
│   │   └── XLSXTypes.ts
│   │
│   ├── utils/
│   │   ├── classes/
│   │   │   ├── AppError.ts           # Error personalizado con HttpCode
│   │   │   ├── CacheManager.ts       # Singleton Redis
│   │   │   ├── Logger.ts             # Singleton Winston + Logtail
│   │   │   ├── ErrorHandler.ts
│   │   │   ├── ExitHandler.ts        # Graceful shutdown
│   │   │   └── documentos/           # Generadores PDF por tipo
│   │   ├── helpers/
│   │   │   ├── googleDriveApi.ts     # Cliente Google Sheets/Drive
│   │   │   ├── validatePermissions.ts # RBAC check
│   │   │   └── helpers.ts
│   │   ├── lib/
│   │   │   ├── prisma-client.ts
│   │   │   ├── jwt.util.ts
│   │   │   ├── s3.util.ts
│   │   │   ├── bcrypt.util.ts
│   │   │   ├── pdf-lib.ts
│   │   │   └── winston.util.ts
│   │   ├── permissions.ts            # Constantes de permisos por rol
│   │   └── constants.ts
│   │
│   ├── validators/                   # Schemas Zod por entidad
│   │   ├── auth.ts, scout.ts, familiar.ts, equipo.ts
│   │   ├── pago.ts, documento.ts, entrega.ts
│   │   ├── webhook.ts
│   │   └── generics.ts
│   │
│   ├── whatsapp/                     # Bot WhatsApp (actualmente desactivado)
│   │   ├── WhatsappSession.ts        # Singleton (comentado en Server.ts)
│   │   ├── useCases.ts
│   │   ├── recordarCumpleaños.ts     # Cron (comentado en Server.ts)
│   │   └── clientConfig.ts
│   │
│   ├── Server.ts                     # Express config + registro de rutas
│   └── index.ts                      # Punto de entrada
│
├── data/
│   └── scout.db                      # BD SQLite local para desarrollo
├── docker-compose.yml                # Turso (LibSQL) + Redis
├── .env.example
├── package.json
├── tsconfig.json
└── pm2.config.js
```

### Convenciones de Nomenclatura

- **Archivos**: camelCase (`scoutService.ts`)
- **Clases**: PascalCase (`ScoutService`, `CacheManager`)
- **Funciones**: camelCase (`getScout`, `validatePermissions`)
- **Constantes**: UPPER_SNAKE_CASE (`JWT_SECRET`)
- **Tipos/Interfaces**: PascalCase, interfaces con prefijo `I` (`IScout`)

---

## 🛠 Configurar entorno de desarrollo

### Requisitos Previos

1. **Node.js** v22.13.1+ con npm
2. **Docker & Docker Compose**
3. **DBeaver Community** (recomendado para explorar la BD)

### Pasos

#### 1. Clonar e instalar

```bash
git clone https://github.com/aggutierrez98/scout-api.git
cd scout-api
npm install
```

#### 2. Configurar variables de entorno

```bash
cp .env.example .env.development
```

Editar `.env.development`:

```env
NODE_ENV=development
PORT=8080

INFISICAL_SERVICE_TOKEN=<service-token-del-admin>
INFISICAL_PROJECT_ID=<project-id>
INFISICAL_ENV=dev
INFISICAL_SITE_URL=https://app.infisical.com

WEBHOOK_SECRET=<valor-compartido-con-whatsapp-comprobantes>
```

> El resto de secretos (AWS, Google Drive, Turso, JWT, etc.) se obtienen automáticamente desde **Infisical** al arrancar el servidor.

#### 3. Inicializar Docker (primera vez)

Asegurarse de tener libres los puertos **9000** (Turso) y **6379** (Redis).

```bash
npm run docker:init-with-data
```

Este comando:
1. Levanta contenedores Docker (Turso + Redis)
2. Copia `data/scout.db` al contenedor
3. Genera el cliente Prisma
4. Limpia datos existentes
5. Carga datos desde Google Sheets (equipos → scouts → familiares → documentos → entregas → pagos)

#### 4. Crear usuario administrador

```bash
npm run create-admin:dev
```

#### 5. Iniciar servidor

```bash
npm run dev
```

Servidor disponible en `http://localhost:8080`. Swagger en `http://localhost:8080/docs`.

---

## 🔄 Flujo de Trabajo Diario de Desarrollo

**Si los contenedores están detenidos:**

```bash
npm run docker:init
npm run dev
```

**Si ya están corriendo:**

```bash
npm run dev
```

**Verificar estado:**

```bash
npm run docker:status
```

**Recargar datos desde Google Sheets:**

```bash
npm run docker:load-data
```

### Gestión de cambios en el schema de Prisma

```bash
# 1. Regenerar cliente Prisma (tipos TypeScript)
npm run prisma:generate-client:dev

# 2. Crear migración
npm run prisma:migrate:dev

# 3. Aplicar migración a la BD local
npm run prisma:apply-migrations:dev
```

---

## 🛠️ Herramientas de Desarrollo

### DBeaver — Explorar la base de datos

1. Nueva conexión → tipo **LibSQL**
2. Conexión por **Host**, Server URL: `http://localhost:9000`
3. Los contenedores Docker deben estar corriendo

### Logs del Sistema

- 🟢 **INFO**: Operaciones normales
- 🟡 **WARN**: Advertencias
- 🔴 **ERROR**: Errores críticos
- 🟣 **HTTP**: Peticiones HTTP entrantes
- ⚪ **DEBUG**: Debug detallado

---

## 🔌 Integraciones de Terceros

### 1. Google Drive / Google Sheets

Importación masiva de datos desde hojas de cálculo. Hojas disponibles: `scouts`, `familiares`, `equipos`, `documentos`, `entregas`, `pagos`, `usuarios`.

### 2. AWS S3

Almacenamiento de documentos PDF. Estructura del bucket:

```
s3://scout-documentos/
└── documentos/
    └── scout_{uuid}/
        ├── ficha_medica.pdf
        └── ...
```

URLs de descarga firmadas con expiración de 1 hora.

### 3. Infisical

Gestión centralizada de secretos. Al iniciar, `SecretsManager` (singleton) se autentica con Infisical y descarga todos los secretos. Solo 4 variables necesarias en `.env`.

### 4. Turso (LibSQL)

Base de datos SQLite distribuida. En desarrollo: contenedor Docker en puerto 9000. En producción: instancia Turso cloud.

### 5. Redis

Caché de consultas frecuentes. TTL por defecto: 60 segundos.

### 6. Logtail

Logs centralizados en la nube (solo en producción).

---

## 📜 Scripts Disponibles

### Docker

```bash
npm run docker:init              # Iniciar Docker (Turso + Redis)
npm run docker:init-with-data    # Iniciar Docker + cargar datos
npm run docker:load-data         # Solo cargar datos
npm run docker:up                # Levantar contenedores
npm run docker:down              # Detener contenedores
npm run docker:restart           # Reiniciar contenedores
npm run docker:logs              # Ver logs
npm run docker:status            # Ver estado
```

### Desarrollo

```bash
npm run dev                  # Servidor con hot-reload
npm run dev:docker           # Docker + servidor en un comando
npm run studio:dev           # Prisma Studio (GUI de BD)
```

### Producción

```bash
npm run build                # Compilar TypeScript
npm start                    # Iniciar en producción
npm run studio               # Prisma Studio en producción
```

### Gestión de Datos

```bash
# Desarrollo
npm run load-scouts:dev
npm run load-familiares:dev
npm run load-equipos:dev
npm run load-documentos:dev
npm run load-entregas:dev
npm run load-pagos:dev
npm run deleteDBData:dev

# Producción (equivalentes sin :dev)
npm run load-scouts
npm run deleteDBData
```

### Usuarios

```bash
npm run create-admin:dev     # Crear admin en desarrollo
npm run createAdmin          # Crear admin en producción
npm run save-users:dev       # Exportar usuarios a Sheets
```

---

## 🚀 Producción

### Variables de entorno

```env
NODE_ENV=production
PORT=3000

INFISICAL_SITE_URL=https://app.infisical.com
INFISICAL_PROJECT_ID=<id-del-proyecto>
INFISICAL_ENV=production
INFISICAL_SERVICE_TOKEN=<token-de-servicio>

WEBHOOK_SECRET=<mismo-valor-que-en-whatsapp-comprobantes>
```

> El `SecretsManager` se inicializa antes de que Express comience a escuchar, garantizando que todos los secretos estén disponibles antes del primer request.

### Compilar y arrancar

```bash
npm run build
npm start
```

### Prisma en producción

```bash
npm run prisma:generate-client
npm run prisma:apply-migrations
```

### PM2

El archivo `pm2.config.js` está configurado para gestionar el proceso en producción.

---

## 📞 Soporte

Para dudas o problemas, contactar al administrador del proyecto.
