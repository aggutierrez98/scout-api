# Arquitectura — scout-api

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript 5.9 |
| Runtime | Node.js |
| Framework HTTP | Express.js 4.21.2 |
| ORM | Prisma 7 |
| Base de datos | SQLite / Turso (LibSQL) |
| Caché | Redis |
| Autenticación | JWT |
| Validación | Zod |
| Logging | Winston |
| Almacenamiento de archivos | AWS S3 |
| Integración externa | Google APIs (Sheets, Drive) |
| Gestión de secretos | Infisical |

---

## Estructura de carpetas

```
src/
├── controllers/        — Maneja HTTP request/response; delega en services
├── services/           — Lógica de negocio pura; accede a Prisma y utils
├── routes/             — Definición de rutas Express; aplica middlewares
├── middlewares/
│   ├── checkSession    — Verifica JWT y evalúa RBAC
│   ├── validate        — Valida body/params con esquemas Zod
│   ├── cache           — Caché de respuestas con Redis
│   └── error           — Manejador global de errores
├── models/             — Tipos generados por Prisma
├── mappers/            — Transformación entidad → DTO (uuid → id público)
├── types/              — Interfaces TypeScript (IScout, IPago, etc.)
├── validators/         — Schemas Zod por entidad
├── utils/
│   ├── classes/        — AppError, Logger, CacheManager, SecretsManager, generadores PDF
│   ├── lib/            — prisma-client, jwt.util, s3.util, etc.
│   └── helpers/        — validatePermissions, googleDriveApi, etc.
├── prisma/
│   └── schema.prisma
├── Server.ts           — Configuración de Express y registro de rutas
└── index.ts            — Punto de entrada; inicializa Server y conexiones
```

---

## Modelos de datos (Prisma)

### Scout

| Campo | Tipo | Descripción |
|---|---|---|
| `uuid` | String (PK) | Identificador interno |
| `nombre` | String | — |
| `apellido` | String | — |
| `dni` | String | Documento nacional de identidad |
| `sexo` | Enum | — |
| `fechaNacimiento` | DateTime | — |
| `localidad` | String | — |
| `direccion` | String | — |
| `telefono` | String | Se usa para matching de comprobantes |
| `mail` | String | — |
| `rama` | Enum | Manada, Tropa, Comunidad, etc. |
| `funcion` | Enum | Scout, Guía, Suplente, etc. |
| `equipoId` | String (FK) | Patrulla / unidad a la que pertenece |
| `estado` | Enum | ACTIVO, INACTIVO, etc. |
| `progresionActual` | String | Etapa de progresión vigente. Formato: `PROG_<RAMA>_<ETAPA>` (ej. `PROG_TROPA_1`). Validado contra `PROGRESIONES_POR_RAMA` en `ScoutService`. |

### Pago

| Campo | Tipo | Descripción |
|---|---|---|
| `uuid` | String (PK) | — |
| `concepto` | String | Descripción del pago |
| `monto` | Float | Importe |
| `rendido` | Boolean | Si fue rendido en tesorería |
| `metodoPago` | Enum | `EFECTIVO`, `TRANSFERENCIA`, `OTRO` |
| `scoutId` | String (FK) | Scout que realizó el pago |
| `fechaPago` | DateTime | Fecha del comprobante o ingreso |

### Familiar

| Campo | Tipo |
|---|---|
| `uuid` | String (PK) |
| `nombre` | String |
| `apellido` | String |
| `dni` | String |
| `sexo` | Enum |
| `telefono` | String |
| `mail` | String |

### FamiliarScout (relación N:M)

| Campo | Tipo | Descripción |
|---|---|---|
| `familiarId` | String (FK) | — |
| `scoutId` | String (FK) | — |
| `relacion` | Enum | `PADRE`, `MADRE`, `TUTOR`, etc. |

### Equipo

| Campo | Tipo |
|---|---|
| `uuid` | String (PK) |
| `nombre` | String |
| `lema` | String |
| `rama` | Enum |

### Documento / DocumentoPresentado / EntregaRealizada

Modelos para gestión documental e insignias de progresión.

- `Documento`: catálogo de documentos requeridos por la organización.
- `DocumentoPresentado`: instancia de un documento presentado por un scout; referencia al archivo en S3.
- `EntregaRealizada`: registro de insignias y hitos de progresión completados.

---

## Rutas HTTP

| Método | Path | Descripción |
|---|---|---|
| `POST` / `GET` | `/api/auth` | Login y validación JWT |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/scout` | CRUD de scouts |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/pago` | CRUD de pagos de cuotas |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/documento` | Gestión documental + subida a S3 |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/entrega` | Insignias y progresiones |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/familiar` | Gestión de familiares |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/equipo` | Patrullas / unidades |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/evento` | Eventos del grupo |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/tipo-evento` | Catálogo de tipos de evento |

---

## Autenticación y RBAC

### JWT

- Expiración: **2 horas**.
- El middleware `checkSession` valida el token en cada request protegido y adjunta el usuario al contexto.

### Roles del sistema

| Rol | Permission set |
|---|---|
| `EXTERNO` | `EXTERNO_PERM` |
| `JOVEN` | `EXTERNO_PERM` |
| `COLABORADOR` | `COLABORADOR_PERM` |
| `ACOMPAÑANTE` | `COLABORADOR_PERM` |
| `PADRE_REPRESENTANTE` | `FAMILIAR_PERM` (solo lectura + documentos propios) |
| `AYUDANTE_RAMA` | `AYUDANTE_PERM` (lectura + entregas + equipos + familiares) |
| `SUBJEFE_RAMA` | `EDUCADOR_PERM` |
| `JEFE_RAMA` | `JEFE_PERM` (+ create/modify/delete evento) |
| `SUBJEFE_GRUPO` | `JEFE_PERM` |
| `JEFE_GRUPO` | `JEFE_PERM` |
| `ADMINISTRADOR` | `ADMIN_PERM` (acceso completo + gestión de usuarios y tipo-evento) |

Los permission sets están definidos en `src/utils/permissions.ts` y el mapa `grants` en `src/utils/helpers/validatePermissions.ts`.

### Formato de permisos

```
{accion}_{recurso}
```

Ejemplos: `create_pago`, `read_scout`, `delete_documento`, `create_evento`.

### Row-Level Scoping (ScopingContext)

Además del RBAC por acción, cada request tiene un **ScopingContext** que restringe QUÉ filas puede ver el usuario autenticado:

| Scope | Aplicable a | Restricción |
|---|---|---|
| `ALL` | ADMINISTRADOR, JEFE_GRUPO, SUBJEFE_GRUPO, COLABORADOR, etc. | Sin filtro — ve todos los registros |
| `RAMA` | `AYUDANTE_RAMA`, `SUBJEFE_RAMA`, `JEFE_RAMA` | Solo scouts de la misma rama del usuario |
| `FAMILIAR` | `PADRE_REPRESENTANTE` | Solo scouts vinculados a su familiar |

**Implementación:**
- `src/utils/helpers/buildScopingContext.ts` — construye el contexto a partir del usuario
- `src/middlewares/session.ts` — agrega `res.locals.scopingContext` en cada request autenticado
- Los controllers inyectan el contexto en los services vía parámetro
- Los services aplican `ramaFilter` o `familiarId` al `where` de Prisma según el scope

---

## Flujo de request

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

---

## Registro de pagos

### Request

```http
POST /api/pago
Content-Type: application/json
Authorization: Bearer <jwt>
```

```json
{
  "scoutId": "abc123def4",
  "concepto": "CUOTA FEBRERO",
  "monto": 500,
  "metodoPago": "TRANSFERENCIA",
  "fechaPago": "2025-02-15"
}
```

### Valores válidos para `metodoPago`

| Valor | Descripción |
|---|---|
| `EFECTIVO` | Pago en mano |
| `TRANSFERENCIA` | Transferencia bancaria |
| `OTRO` | Cualquier otro medio |

---

## Variables de entorno

Las siguientes variables se leen directamente del entorno. El resto de secretos (credenciales de base de datos, JWT, AWS, etc.) se obtienen en tiempo de arranque desde **Infisical**.

```env
NODE_ENV=production
PORT=3000
INFISICAL_SITE_URL=https://app.infisical.com
INFISICAL_PROJECT_ID=<id-del-proyecto>
INFISICAL_ENV=production
INFISICAL_SERVICE_TOKEN=<token-de-servicio>
```

> El `SecretsManager` (en `src/utils/classes/`) se inicializa antes de que Express comience a escuchar, garantizando que todos los secretos estén disponibles antes del primer request.

---

## Módulo: motor de pagos por reglas (2026+)

### Servicios agregados

- `ServicioReglasPago`: alta/edición/activación de ciclos y reglas.
- `ServicioObligacionesPago`: generación de `ObligacionPago`, scoping por rol y lectura de pendientes.
- `ServicioImputacionPago`: aplica pagos reales sobre obligaciones y gestiona `SaldoAFavor`.
- `ServicioCondonacionPago`: condona deuda incompleta con auditoría (`CondonacionPago`).
- `ServicioPagosPendientes`: fachada para consumo desde cron.

### Diseño de datos

El motor separa claramente:

1. **Reglas** (`CicloReglasPago` + tablas de reglas)
2. **Deuda esperada** (`ObligacionPago`)
3. **Pago real aplicado** (`ImputacionPago`)
4. **Excepción auditada** (`CondonacionPago`)
5. **Crédito remanente** (`SaldoAFavor`)

Esto desacopla la lógica de cobro del campo textual `Pago.concepto`.

### Integración con endpoint de pago existente

`POST /api/pago` conserva su contrato, pero ahora:

- crea el pago real,
- intenta generar recibo,
- dispara imputación automática sobre obligaciones,
- guarda saldo a favor si sobra dinero.

### Índices clave

- `ObligacionPago(cicloId, periodo)`
- `ObligacionPago(familiaClave, estado)`
- `ObligacionPago(scoutId, periodo)`
- `SaldoAFavor(familiaClave, cicloId)` (unique)

---

## Actualizaciones recientes (abril 2026)

### API de pendientes con paginación para infinite scroll

- `GET /api/pago/pendientes` acepta `offset` y `limit` (además de `rama`, `estado`, `familiaClave`, `scoutNombre`).
- `GET /api/documento/pendientes` acepta `offset` y `limit` (además de `familiarId`, `soloCompletable`).

Esto habilita listas más livianas en frontend (lotes de 20 items).

### Contexto de grupo en autenticación

- `GET /api/auth/me` y `GET /api/auth/renew` ahora exponen `datosGrupo` (`nombre`, `numero`, `distrito`, `zona`) tomados de `SecretsManager`.
- Se usa para identidad dinámica del header en web.

### Cobertura completa de eventos y tipo de evento

Se consolidó documentación/colección de pruebas para:

- CRUD completo de `/api/evento`,
- `/api/evento/mis-eventos`,
- administración de participantes de evento,
- CRUD completo de `/api/tipo-evento`.
