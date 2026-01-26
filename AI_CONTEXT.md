# AI Context - Scout API

> **Propósito**: Este documento proporciona contexto completo sobre la aplicación Scout API para asistir a herramientas de IA en la comprensión del proyecto, su arquitectura, decisiones de diseño y mejores prácticas.

## 📋 Resumen Ejecutivo

**Scout API** es una API REST desarrollada con Node.js/TypeScript que gestiona la administración completa de un grupo Scout. Incluye gestión de scouts, familiares, documentos, pagos, entregas de insignias y un bot de WhatsApp integrado para notificaciones automáticas.

### Características Principales

- ✅ CRUD completo para todas las entidades (Scouts, Familiares, Equipos, Documentos, Pagos, Entregas)
- 🔐 Autenticación JWT con sistema RBAC (3 roles: ADMIN, DIRIGENTE, EXTERNO)
- 📦 Caché inteligente con Redis para optimización de consultas
- 📄 Generación y almacenamiento de PDFs en AWS S3
- 📊 Importación masiva desde Google Sheets
- 🤖 Bot de WhatsApp para notificaciones y consultas
- 📚 Documentación automática con Swagger
- 🔍 Logging estructurado con Winston y Logtail

## 🎯 Dominio del Negocio

### Conceptos Clave del Movimiento Scout

#### Scouts

Son los niños/jóvenes que participan en el grupo Scout. Cada scout pertenece a una **rama** según su edad:

- **Manada** (6-10 años): Lobatos/Lobeznas
- **Unidad** (10-14 años): Scouts
- **Caminantes** (14-17 años): Rovers
- **Pioneros** (17-21 años): Dirigentes en formación

Cada scout tiene:

- **Progresión**: Nivel de avance en su formación (Huella, Senda, Travesía)
- **Función**: Rol dentro de su equipo (Guía, Subguía, Tesorero, etc.)
- **Estado**: ACTIVO, INACTIVO, EGRESADO

#### Equipos/Patrullas

Grupos pequeños de scouts (5-8 integrantes) dentro de una rama. Cada equipo tiene:

- **Nombre**: Generalmente de animales (Águilas, Lobos, Cóndores)
- **Lema**: Frase motivacional del equipo
- **Rama**: Categoría a la que pertenece

#### Documentos

Papeles administrativos requeridos por scout:

- **Ficha médica**: Información de salud
- **Autorizaciones**: Permisos de padres
- **DNI**: Fotocopia de documento
- **Certificado médico**: Aptitud física
- **Ficha de inscripción**: Datos personales

Propiedades:

- `vence`: Si el documento tiene fecha de vencimiento
- `completable`: Si se puede generar automáticamente desde la API
- `requiereFamiliar`: Si necesita datos del familiar
- `requiereFirma`: Si necesita firma escaneada

#### Entregas

Insignias o reconocimientos otorgados a los scouts:

- **Especialidades**: Por habilidades específicas (Primeros Auxilios, Campismo)
- **Progresión**: Insignias de avance de nivel
- **Mérito**: Reconocimientos especiales

#### Pagos

Cuotas mensuales o pagos por actividades:

- `concepto`: Descripción del pago (Cuota Mensual, Campamento, Material)
- `monto`: Importe en moneda local
- `metodoPago`: Efectivo, Transferencia, MercadoPago
- `rendido`: Si fue contabilizado oficialmente

#### Familiares

Tutores o padres/madres de los scouts:

- Relación: PADRE, MADRE, TUTOR, OTRO
- Un scout puede tener múltiples familiares
- Relación many-to-many vía tabla `FamiliarScout`

## 🏛 Arquitectura Detallada

### Stack Tecnológico

#### Backend Core

- **Node.js** (v22.13.1+): Entorno de ejecución JavaScript
- **Express.js**: Framework web minimalista y flexible
- **TypeScript**: Superset tipado de JavaScript para mayor seguridad de tipos

#### Base de Datos

- **Turso (LibSQL)**: Base de datos SQLite distribuida y serverless
- **Prisma ORM**: ORM moderno con generación de tipos automática
- **@prisma/adapter-libsql**: Adaptador para conectar Prisma con Turso/LibSQL

#### Caché

- **Redis**: Sistema de caché en memoria para optimizar consultas frecuentes

#### Seguridad y Autenticación

- **Infisical SDK**: Gestión centralizada y segura de secretos y variables de entorno
- **JWT (jsonwebtoken)**: Autenticación basada en tokens
- **bcryptjs**: Hash seguro de contraseñas
- **helmet**: Protección de headers HTTP
- **express-rate-limit**: Limitación de peticiones para prevenir ataques
- **tiny-csrf**: Protección contra ataques CSRF
- **cors**: Configuración de políticas CORS

#### Integraciones Externas

- **AWS S3**: Almacenamiento de documentos PDF en la nube
- **Google Drive API**: Importación de datos desde Google Spreadsheets
- **Google Sheets**: Fuente de datos para carga masiva
- **Infisical**: Centralización de secretos

#### Procesamiento de Archivos

- **pdf-lib**: Generación y manipulación de PDFs
- **xlsx**: Procesamiento de archivos Excel
- **sharp**: Procesamiento y optimización de imágenes
- **express-fileupload**: Manejo de uploads de archivos

#### Validación y Documentación

- **Zod**: Validación de esquemas y tipos en runtime
- **Swagger (swagger-jsdoc, swagger-ui-express)**: Documentación automática de API

#### Logging y Monitoreo

- **Winston**: Sistema de logging estructurado
- **Logtail**: Servicio de logs en la nube
- **Morgan**: Logger de peticiones HTTP

#### Automatización

- **node-cron**: Tareas programadas (recordatorios de cumpleaños, etc.)
- **puppeteer**: Automatización de navegador para WhatsApp Web

#### Herramientas de Desarrollo

- **ts-node & ts-node-dev**: Ejecución de TypeScript en desarrollo
- **nodemon**: Recarga automática del servidor
- **concurrently**: Ejecución paralela de comandos
- **dotenv**: Gestión de variables de entorno
- **DBeaver Community**: Cliente universal de base de datos para explorar y administrar la BD Turso/SQLite

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

### Capa de Mappers

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

**Ejemplo de uso:**

```typescript
// En un servicio
import { mapScout } from "../mappers";

const scout = await prisma.scout.findUnique({ where: { uuid: id } });
return mapScout(scout); // Transforma uuid a id y calcula edad
```

### Flujo de una Petición Típica

```typescript
// Ejemplo: GET /api/scout/123

1. Request → Express Router
   ↓
2. Middleware: morganMiddleware (Log HTTP)
   ↓
3. Middleware: checkSession (Verificar JWT)
   ↓ (Si es válido)
4. Middleware: validatePermissions (RBAC)
   ↓ (Si tiene permisos)
5. Route: /scout/:id
   ↓
6. Middleware: validate(GetScoutSchema) (Zod)
   ↓
7. Middleware: cacheMiddleware (Buscar en Redis)
   ↓ (Si no hay caché)
8. Controller: scoutController.getItem
   ↓
9. Service: scoutService.getItem(id)
   ↓
10. Prisma: ScoutModel.findUnique({ where: { uuid: id } })
    ↓
11. Turso DB: SELECT * FROM scout WHERE uuid = ?
    ↓
12. Mapper: mapScout(scout) - Transforma uuid → id, calcula edad
    ↓
13. Response ← Service ← Controller
    ↓
13. Middleware: cacheMiddleware.set (Guardar en Redis)
    ↓
14. Response JSON → Client
```

## 🔐 Sistema de Autenticación y Autorización

### Autenticación (Authentication)

**Implementación**: JWT (JSON Web Tokens)

#### Flujo de Login

```typescript
// POST /api/auth/login
{
  "username": "admin",
  "password": "secure123"
}

// Proceso:
1. AuthController recibe credenciales
2. AuthService.login() valida usuario
3. Verificar password con bcrypt.compare()
4. Generar JWT con payload: { id: user.uuid, role: user.role }
5. Retornar token + datos del usuario

// Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-123",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

#### Verificación de Token

```typescript
// En cada request protegido:
// Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

1. Middleware checkSession extrae token
2. verifyToken(token) decodifica con JWT_SECRET
3. Obtener userId del payload
4. Buscar usuario en BD para validar que existe
5. Adjuntar user a req.user para uso posterior
6. Continuar con siguiente middleware
```

### Autorización (Authorization)

**Implementación**: RBAC (Role-Based Access Control)

#### Roles Definidos

```typescript
enum RolesType {
  ADMIN = "ADMIN", // Control total
  DIRIGENTE = "DIRIGENTE", // Gestión de scouts y actividades
  EXTERNO = "EXTERNO", // Solo lectura limitada
}
```

#### Matriz de Permisos

```typescript
// En src/utils/permissions.ts

const permissions = {
  ADMIN: {
    scout: ["GET", "POST", "PUT", "DELETE"],
    documento: ["GET", "POST", "PUT", "DELETE"],
    pago: ["GET", "POST", "PUT", "DELETE"],
    familiar: ["GET", "POST", "PUT", "DELETE"],
    equipo: ["GET", "POST", "PUT", "DELETE"],
    entrega: ["GET", "POST", "PUT", "DELETE"],
  },
  DIRIGENTE: {
    scout: ["GET", "POST", "PUT"],
    documento: ["GET", "POST"],
    pago: ["GET", "POST"],
    familiar: ["GET", "POST", "PUT"],
    equipo: ["GET"],
    entrega: ["GET", "POST"],
  },
  EXTERNO: {
    scout: ["GET"], // Solo ver sus propios datos
    documento: ["GET"],
    pago: ["GET"],
    familiar: ["GET"],
  },
};
```

#### Validación de Permisos

```typescript
// En checkSession middleware:
const resource = req.baseUrl.split("api/")[1]; // "scout"
const method = req.method; // "POST"
const userRole = user.role; // "DIRIGENTE"

const isAllowed = validatePermissions({
  method,
  resource,
  userRole,
});

if (!isAllowed) {
  throw new AppError({
    name: "FORBIDDEN",
    description: "No tienes permisos para esta acción",
    httpCode: 403,
  });
}
```

## 💾 Gestión de Datos

### Base de Datos (Turso/LibSQL)

**Prisma Schema** (src/prisma/schema.prisma)

#### Modelo Relacional

```prisma
// Entidades principales y sus relaciones

Scout ──1:N──> DocumentoPresentado
  │            (Un scout tiene muchos documentos)
  │
  ├──1:N──> Pago
  │         (Un scout tiene muchos pagos)
  │
  ├──1:N──> EntregaRealizada
  │         (Un scout tiene muchas entregas)
  │
  ├──N:1──> Equipo
  │         (Muchos scouts pertenecen a un equipo)
  │
  ├──N:M──> Familiar (via FamiliarScout)
  │         (Relación many-to-many)
  │
  └──1:1──> User (opcional)
            (Un scout puede tener un usuario)

Documento ──1:N──> DocumentoPresentado
           (Un tipo de documento puede estar
            presentado por muchos scouts)

Familiar ──N:M──> Scout (via FamiliarScout)
  │       (Un familiar puede tener varios scouts)
  │
  └──1:1──> User (opcional)
            (Un familiar puede tener usuario)
```

#### Convenciones de Base de Datos

1. **IDs**:
   - `id`: Autoincremental (INT) para uso interno
   - `uuid`: String único (nanoid) para uso en API
   - **Importante**: La API siempre usa `uuid`, nunca expone `id`

2. **Timestamps**:
   - `fechaCreacion`: DateTime @default(now())
   - `fechaActualizacion`: DateTime @updatedAt

3. **Índices**:
   - Todos los foreign keys tienen índices
   - Índices compuestos en queries frecuentes

   ```prisma
   @@index([scoutId, documentoId])
   ```

4. **Soft Deletes**:
   - No se implementan, se usa campo `estado` en Scout
   - `estado: "ACTIVO" | "INACTIVO" | "EGRESADO"`

### Extensiones de Prisma

```typescript
// En src/services/scout.ts

const prisma = prismaClient.$extends({
  result: {
    scout: {
      // Ocultar uuid interno, exponer como 'id'
      id: {
        compute: (data) => data.uuid,
      },
      uuid: {
        compute: () => undefined, // Nunca exponer uuid
      },
      // Campo calculado: edad
      edad: {
        needs: { fechaNacimiento: true },
        compute(scout) {
          return getAge(scout.fechaNacimiento);
        },
      },
    },
  },
});
```

### Sistema de Caché (Redis)

#### Estrategia de Caché

**Patrón**: Cache-Aside (Lazy Loading)

```typescript
// 1. Request GET /api/scout/123
//    ↓
// 2. cacheMiddleware.get("scout/123")
//    ↓
// 3. Si existe en Redis:
//    → return cached data (HIT)
//    ↓
// 4. Si no existe:
//    → Ejecutar consulta a BD (MISS)
//    → Guardar resultado en Redis
//    → Return data
```

#### Invalidación de Caché

```typescript
// Request PUT /api/scout/123
// Request DELETE /api/scout/123
//    ↓
// cleanCacheMiddleware.clear("scout/*")
//    ↓
// Ejecutar operación de escritura
//    ↓
// Redis.del("scout/*")
```

#### Configuración de TTL

```typescript
// En middlewares/cache.ts
const DEFAULT_TTL = 60000; // 1 minuto

cacheManager.set(cacheKey, data, {
  expirationInMs: DEFAULT_TTL,
});
```

#### Claves de Caché

```
Formato: {resource}/{params}

Ejemplos:
- scout/123
- scout?limit=10&offset=0&equipoId=abc
- documento/456
- pago?scoutId=789&rendido=true
```

### Almacenamiento de Archivos (AWS S3)

#### Estructura de Bucket

```
s3://scout-documentos/
├── documentos/
│   ├── scout_{uuid}/
│   │   ├── ficha_medica.pdf
│   │   ├── autorizacion.pdf
│   │   ├── dni.pdf
│   │   └── certificado_medico.pdf
│   └── ...
└── temp/
    └── generated_{timestamp}.pdf
```

#### Flujo de Upload

```typescript
// POST /api/documento/:documentoId/upload
// multipart/form-data con archivo PDF

1. express-fileupload parsea el archivo
2. Controller recibe req.files.documento
3. Service procesa el PDF:
   - Validar tamaño (<10MB)
   - Validar formato (application/pdf)
4. Generar key única: `documentos/scout_${uuid}/${documentoId}.pdf`
5. uploadToS3(pdfBuffer, key)
   - Subir a S3 con StorageClass: STANDARD_IA
   - Retornar ETag
6. Guardar uploadId en DocumentoPresentado
7. Response: { success: true, uploadId: "..." }
```

#### Descarga Segura con URLs Firmadas

```typescript
// GET /api/documento/:id/download

1. Obtener DocumentoPresentado con uploadId
2. getFileInS3(uploadId)
   - Generar presigned URL con expiresIn: 3600s (1h)
3. Response: { url: "https://s3.amazonaws.com/..." }
4. Cliente descarga directamente desde S3
5. URL expira después de 1 hora
```

## 🎨 Patrones de Diseño Implementados

### 1. Repository Pattern (via Prisma)

Aunque no hay una capa explícita de repositorios, Prisma ORM actúa como tal.

```typescript
// Services interactúan con Prisma, no con SQL directo
class ScoutService {
  async getItem(uuid: string) {
    return await ScoutModel.findUnique({
      where: { uuid },
      include: { equipo: true, documentosPresentados: true },
    });
  }
}
```

### 2. Dependency Injection

Los servicios se inyectan en controladores:

```typescript
// En routes/scout.ts
const scoutService = new ScoutService();
const scoutController = new ScoutController({ scoutService });
```

Beneficios:

- Testeable: Se pueden inyectar mocks
- Desacoplado: Controller no conoce implementación de Service
- Reusable: Un servicio puede usarse en múltiples controllers

### 3. Middleware Chain Pattern

```typescript
router.get(
  "/:id",
  validate(GetScoutSchema), // Validación
  checkSession, // Autenticación
  cacheMiddleware, // Caché
  scoutController.getItem, // Handler
);
```

### 4. Singleton Pattern

**SecretsManager**: Gestión centralizada de secretos con Infisical

```typescript
// src/utils/classes/SecretsManager.ts
export class SecretsManager {
  private static instance: SecretsManager;
  private secrets: InfisicalSecrets;

  private constructor() {}

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  async initialize() {
    // Descarga secretos de Infisical
    this.secrets = await fetchSecretsFromInfisical();
  }

  getJWTSecret() {
    return this.secrets.JWT_SECRET;
  }
  getAWSSecrets() {
    return this.secrets.AWS;
  }
  // ...
}

// Uso:
await SecretsManager.getInstance().initialize();
const jwtSecret = SecretsManager.getInstance().getJWTSecret();
```

**CacheManager**: Una sola instancia de cliente Redis

```typescript
// src/utils/classes/CacheManager.ts
export class CacheManager {
  private static instance: CacheManager;
  private readonly client;

  private constructor() {
    this.client = createClient({...});
    this.client.connect();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
}

// Uso:
const cacheManager = CacheManager.getInstance(); // Singleton
```

**WhatsAppSession**: Sesión única de WhatsApp

```typescript
export class WhatsAppSession {
  private static instance: WhatsAppSession;

  static getInstance() {
    if (!WhatsAppSession.instance) {
      WhatsAppSession.instance = new WhatsAppSession();
    }
    return WhatsAppSession.instance;
  }
}
```

**WhatsAppSbot**: Sesión única de WhatsApp

```typescript
export class WhatsAppSbot {
  private static instance: WhatsAppSbot;

  public static getInstance(): WhatsAppSbot {
    if (!WhatsAppSbot.instance) {
      WhatsAppSbot.instance = new WhatsAppSbot();
    }
    return WhatsAppSbot.instance;
  }
}
```

### 5. Factory Pattern

Creación dinámica de routers:

```typescript
// routes/scout.ts
export default function createScoutRouter(scoutService: ScoutService) {
  const router = Router();
  const scoutController = new ScoutController({ scoutService });

  router.get("/", scoutController.getItems);
  router.post("/", scoutController.insertItem);
  // ...

  return router;
}
```

### 6. Error Handling Pattern

Errores centralizados con clase personalizada:

```typescript
class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean;

  constructor(args: {
    name: string;
    httpCode: HttpCode;
    description: string;
    isOperational?: boolean;
  }) {
    super(args.description);
    this.name = args.name;
    this.httpCode = args.httpCode;
    this.isOperational = args.isOperational ?? true;
    Error.captureStackTrace(this);
  }
}

// Uso:
throw new AppError({
  name: "SCOUT_NOT_FOUND",
  description: "Scout no encontrado",
  httpCode: HttpCode.NOT_FOUND,
});
```

### 7. Observer Pattern

**Crons**: Observan el tiempo y ejecutan acciones

```typescript
// whatsapp/recordarCumpleaños.ts
import cron from "node-cron";

export default function recordarCumpleaños() {
  // Todos los días a las 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    const scouts = await obtenerScoutsPorCumplirAños();
    // Enviar notificaciones...
  });
}
```

## 🔄 Flujos de Negocio Importantes

### 1. Registro de un Nuevo Scout

```typescript
// POST /api/scout
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "fechaNacimiento": "2010-05-15",
  "dni": "45123456",
  "sexo": "MASCULINO",
  "localidad": "Buenos Aires",
  "direccion": "Av. Siempre Viva 123",
  "equipoId": "equipo-uuid-123",
  "rama": "UNIDAD"
}

// Proceso:
1. Validar datos con Zod (validators/scout.ts)
2. Verificar que DNI no exista (único)
3. Verificar que equipo existe y pertenece a la rama correcta
4. Generar UUID para el scout
5. Calcular edad a partir de fechaNacimiento
6. Insertar en BD con Prisma
7. Invalidar caché de scouts
8. Retornar scout creado
```

### 2. Subida de Documento de Scout

```typescript
// POST /api/documento/:documentoId/scout/:scoutId
// FormData con archivo PDF

1. Verificar que scout existe
2. Verificar que tipo de documento existe
3. Verificar si ya presentó ese documento
   - Si existe: actualizar
   - Si no: crear nuevo
4. Procesar archivo:
   a. Si es "completable":
      - Generar PDF desde plantilla
      - Completar con datos del scout
      - Agregar firma si requiere
   b. Si no:
      - Usar archivo subido
5. Subir PDF a S3
6. Guardar uploadId en DocumentoPresentado
7. Si vence: guardar fechaVencimiento
8. Invalidar caché
9. Response: { success: true, documentoId: "..." }
```

### 3. Importación Masiva desde Google Sheets

```typescript
// npm run load-scouts:dev

1. Conectar con Google Sheets API
2. Leer hoja "scouts"
3. Mapear columnas a campos del schema:
   - "Nombre" → nombre
   - "Apellido" → apellido
   - "Fecha Nac." → fechaNacimiento
   - etc.
4. Validar cada fila:
   - DNI único
   - Fecha válida
   - Equipo existe
5. Procesar por lotes (chunks de 50):
   - createMany para eficiencia
   - Rollback si hay error
6. Log de resultados:
   - Insertados: 45
   - Errores: 2 (DNI duplicado)
7. Actualizar relaciones:
   - Asignar a equipos
   - Crear usuarios si aplica
```

### 4. Generación de Reporte de Pagos

```typescript
// GET /api/pago?startDate=2024-01-01&endDate=2024-01-31&rendido=false

1. Parsear query params
2. Validar fechas
3. Buscar en caché
4. Query a BD:
   SELECT p.*, s.nombre, s.apellido
   FROM pago p
   JOIN scout s ON p.scoutId = s.uuid
   WHERE p.fechaPago BETWEEN ? AND ?
   AND p.rendido = ?
5. Agrupar por método de pago
6. Calcular totales
7. Formatear response:
   {
     "pagos": [...],
     "resumen": {
       "total": 45000,
       "porMetodo": {
         "EFECTIVO": 20000,
         "TRANSFERENCIA": 25000
       },
       "cantidad": 15
     }
   }
8. Cachear resultado (TTL: 5 min)
9. Return response
```

### 5. Bot de WhatsApp - Recordatorio de Cumpleaños

```typescript
// Cron: todos los días a las 8:00 AM

1. Obtener fecha actual
2. Query scouts con cumpleaños = hoy
   WHERE DAY(fechaNacimiento) = DAY(NOW())
   AND MONTH(fechaNacimiento) = MONTH(NOW())
3. Para cada scout:
   - Calcular edad que cumple
   - Buscar familiares
   - Formatear mensaje:
     "🎉 ¡Hoy cumple años Juan Pérez! Felicitaciones por sus 14 años 🎂"
4. Enviar mensaje al grupo de WhatsApp
5. Log de notificaciones enviadas
```

## 🔧 Herramientas y Utilidades Clave

### 1. Validación con Zod

```typescript
// validators/scout.ts
import { z } from "zod";

export const PostScoutSchema = z.object({
  body: z.object({
    nombre: z.string().min(2).max(50),
    apellido: z.string().min(2).max(50),
    fechaNacimiento: z.string().datetime(),
    dni: z.string().regex(/^\d{7,8}$/),
    sexo: z.enum(["MASCULINO", "FEMENINO"]),
    equipoId: z.string().uuid().optional(),
    rama: z.enum(["MANADA", "UNIDAD", "CAMINANTES", "PIONEROS"]),
  }),
});

// Uso en route:
router.post(
  "/",
  validate(PostScoutSchema), // Middleware que valida
  controller.insertItem,
);
```

### 2. Logger Winston

```typescript
// utils/classes/Logger.ts
import winston from 'winston';
import { LogtailTransport } from '@logtail/winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new LogtailTransport({...}) // Solo en producción
  ]
});

// Uso:
logger.info('Scout creado', { scoutId: '123', nombre: 'Juan' });
logger.error('Error al conectar Redis', { error: err.message });
```

### 3. Manejo de Errores

```typescript
// utils/classes/AppError.ts
export class AppError extends Error {
  public readonly name: string;
  public readonly httpCode: HttpCode;
  public readonly isOperational: boolean;

  constructor(args: {...}) {
    super(args.description);
    // ...
  }
}

// middlewares/error.ts
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`${err.name}: ${err.message}`);
    return res.status(err.httpCode).json({
      error: err.name,
      message: err.message
    });
  }

  // Error no controlado
  logger.error(`Uncaught error: ${err.message}`, { stack: err.stack });
  return res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Ocurrió un error inesperado'
  });
};
```

### 4. Generación de PDFs

```typescript
// utils/lib/pdf-lib.ts
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function completePDF(
  templatePath: string,
  data: ScoutData,
): Promise<Buffer> {
  // 1. Cargar plantilla
  const existingPdfBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  // 2. Obtener formulario
  const form = pdfDoc.getForm();

  // 3. Completar campos
  form.getTextField("nombre").setText(data.nombre);
  form.getTextField("apellido").setText(data.apellido);
  form.getTextField("dni").setText(data.dni);
  // ...

  // 4. Aplanar (hacer no editable)
  form.flatten();

  // 5. Retornar buffer
  return await pdfDoc.save();
}
```

### 5. Scripts de Utilidad (bin/)

```typescript
// bin/createAdminUser.ts
import prompt from "prompt-sync";

(async () => {
  const promptSync = prompt();

  const username = promptSync("Username: ");
  const password = promptSync("Password: ", { echo: "*" });
  const confirmPassword = promptSync("Confirm password: ", { echo: "*" });

  if (password !== confirmPassword) {
    console.error("Las contraseñas no coinciden");
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: {
      uuid: nanoid(),
      username,
      password: hashedPassword,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("✅ Usuario admin creado exitosamente");
})();
```

### 6. DBeaver - Explorador de Base de Datos

**Propósito**: Herramienta gráfica para visualizar y administrar la base de datos Turso/SQLite.

#### Configurar DBeaver para la base de datos local

1. **Abrir DBeaver** y crear una nueva conexión
2. **Seleccionar tipo de base de datos**:
   - En el diálogo de nueva conexión, buscar y seleccionar **LibSQL**
3. **Configurar la conexión**:
   - **Conexión**: Seleccionar conexión por `Host`
   - **Server URL**: Ingresar la URL `http://localhost:9000`
   - Hacer clic en **Test Connection** para verificar
4. **Guardar y conectar**

> 💡 **Nota**: Los contenedores Docker deben estar corriendo (`npm run docker:init`) para que DBeaver pueda conectarse.

**Ventajas de usar DBeaver:**

- ✅ Visualización de tablas y relaciones
- ✅ Ejecución de queries SQL personalizadas
- ✅ Exploración de datos sin código
- ✅ Exportación/importación de datos
- ✅ Diagrama ER automático
- ✅ Estadísticas de tablas

## 🤖 WhatsApp Bot

### Arquitectura

```typescript
// Singleton pattern para una sola sesión
WhatsAppSbot.getInstance()

// Eventos escuchados:
- 'qr': Mostrar QR para escanear
- 'ready': Cliente listo
- 'message': Mensaje recibido
- 'message_create': Mensaje enviado por nosotros
- 'auth_failure': Error de autenticación
- 'remote_session_saved': Sesión guardada en MongoDB
```

### Comandos Disponibles

```typescript
// whatsapp/useCases.ts

const MENU_COMMANDS = {
  menu: "Mostrar este menú",
  scouts: "Listar todos los scouts activos",
  cumpleaños: "Ver cumpleaños del mes",
  "cumpleaños próximos": "Próximos 7 días",
  "documentos [dni]": "Documentos faltantes de un scout",
  "documentos scout [dni]": "Documentos presentados",
  pagos: "Pagos de la semana actual",
  "pagos [semana]": "Pagos de una semana específica",
  "entregas [dni]": "Entregas de un scout",
  "familiar [dni]": "Datos del familiar de un scout",
  "familiares [dni]": "Todos los familiares de un scout",
};
```

### Ejemplo de Caso de Uso

```typescript
// obtenerDocumentosFaltantes
export async function obtenerDocumentosFaltantes(dni: string) {
  // 1. Buscar scout por DNI
  const scout = await ScoutService.getByDNI(dni);
  if (!scout) return "❌ Scout no encontrado";

  // 2. Obtener todos los tipos de documentos
  const allDocumentos = await DocumentoService.getAll();

  // 3. Obtener documentos presentados por el scout
  const presentados = await DocumentoPresentadoService.getByScout(scout.id);

  // 4. Calcular faltantes
  const faltantes = allDocumentos.filter(
    (doc) => !presentados.find((p) => p.documentoId === doc.id),
  );

  // 5. Formatear respuesta
  if (faltantes.length === 0) {
    return `✅ ${scout.nombre} ${scout.apellido} tiene todos los documentos al día`;
  }

  let mensaje = `📄 Documentos faltantes de ${scout.nombre} ${scout.apellido}:\n\n`;
  faltantes.forEach((doc) => {
    mensaje += `- ${doc.nombre}\n`;
  });

  return mensaje;
}
```

### Cron de Cumpleaños

```typescript
// whatsapp/recordarCumpleaños.ts
import cron from "node-cron";

export default function recordarCumpleaños() {
  // Ejecutar todos los días a las 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    const scouts = await obtenerScoutsPorCumplirAños();

    if (scouts.length === 0) return;

    let mensaje = "🎂 ¡CUMPLEAÑOS HOY! 🎉\n\n";
    scouts.forEach((scout) => {
      const edad = getAge(scout.fechaNacimiento);
      mensaje += `🎈 ${scout.nombre} ${scout.apellido} cumple ${edad} años\n`;
    });

    const bot = WhatsAppSbot.getInstance();
    await bot.sendMessageToGroup(mensaje);
  });
}
```

## 🚨 Decisiones de Diseño Importantes

### 1. ¿Por qué Infisical para gestión de secretos?

**Razones**:

- ✅ **Centralización**: Todos los secretos en un solo lugar seguro
- ✅ **Zero-config local**: Desarrolladores solo necesitan 4 variables en `.env`
- ✅ **Rotación fácil**: Admin cambia secretos sin tocar código
- ✅ **Ambientes separados**: dev/staging/prod con secretos independientes
- ✅ **Tipado TypeScript**: SecretsManager provee tipos para todos los secretos
- ✅ **Sin secretos en Git**: `.env` solo contiene credenciales de acceso a Infisical

**Implementación**:

```typescript
// Al inicio de la app
await SecretsManager.getInstance().initialize();

// En cualquier parte del código
const jwtSecret = SecretsManager.getInstance().getJWTSecret();
const awsKeys = SecretsManager.getInstance().getAWSSecrets();
```

### 2. ¿Por qué Turso en lugar de PostgreSQL?

**Razones**:

- ✅ **Serverless**: No requiere gestión de servidor
- ✅ **SQLite compatible**: Desarrollo local sencillo
- ✅ **Baja latencia**: Base de datos distribuida globalmente
- ✅ **Gratis para proyectos pequeños**
- ✅ **Migración fácil**: Si crece, migrar a PostgreSQL es directo

**Trade-offs**:

- ❌ Funciones avanzadas de PostgreSQL no disponibles
- ❌ Comunidad más pequeña que PostgreSQL

### 3. ¿Por qué UUID en lugar de ID autoincremental expuesto?

**Razones**:

- ✅ **Seguridad**: No expone cantidad total de registros
- ✅ **Distribuibilidad**: Se pueden generar en cliente sin conflicto
- ✅ **No predecibles**: Evita enumeration attacks
- ✅ **Migración fácil**: Mover datos entre BDs sin conflicto

**Implementación**:

```typescript
// Se usa nanoid() en lugar de UUID v4 por ser más corto
import { nanoid } from "nanoid";

const uuid = nanoid(); // "V1StGXR8_Z5jdHi6B-myT"
```

### 4. ¿Por qué separar Controllers y Services?

**Razones**:

- ✅ **Testabilidad**: Services se pueden testear sin HTTP
- ✅ **Reusabilidad**: Un servicio puede usarse en API y Bot
- ✅ **Separación de concerns**: Controller maneja HTTP, Service maneja lógica
- ✅ **Mantenibilidad**: Cambios en lógica no afectan endpoints

**Ejemplo**:

```typescript
// ScoutService se usa en:
// 1. API REST (scoutController)
// 2. WhatsApp Bot (obtenerScouts)
// 3. Scripts CLI (loadScouts.ts)
```

### 5. ¿Por qué crear una capa de Mappers en lugar de usar $extends de Prisma?

**Razones**:

- ✅ **Rendimiento**: Evita overhead de extensiones de Prisma
- ✅ **Control explícito**: Transformaciones visibles y testeables
- ✅ **Type-safety**: Tipos explícitos sin magia de Prisma
- ✅ **Flexibilidad**: Fácil agregar lógica de transformación compleja
- ✅ **Debugging**: Stack traces más limpios

**Implementación**:

```typescript
// Antes (con $extends):
const scout = await prisma.scout.findUnique({ where: { uuid } });
// scout.id ya estaba mapeado automáticamente

// Después (con mappers):
const scout = await prisma.scout.findUnique({ where: { uuid } });
return mapScout(scout); // Transformación explícita
```

### 4. ¿Por qué Redis para caché y no in-memory?

**Razones**:

- ✅ **Persistencia**: Sobrevive a reinicios del servidor
- ✅ **Escalabilidad**: Múltiples instancias comparten caché
- ✅ **TTL automático**: Expiración de claves sin lógica adicional
- ✅ **Estructuras de datos**: Listas, sets, hashes

**Trade-off**:

- ❌ Dependencia externa adicional

### 5. ¿Por qué no usar Prisma Migrate en desarrollo?

**Decisión**: Usar `prisma db push` en lugar de `prisma migrate dev`

**Razones**:

- ✅ **Rapidez**: No genera archivos de migración
- ✅ **Flexibilidad**: Cambios rápidos en schema sin historial
- ✅ **SQLite**: Menos crítico tener migraciones versionadas

**En producción**: Usar `prisma migrate deploy` con migraciones versionadas

### 6. ¿Por qué JWT sin refresh tokens?

**Decisión**: JWT de larga duración (7 días) sin refresh tokens

**Razones**:

- ✅ **Simplicidad**: No requiere almacenar tokens en BD
- ✅ **Stateless**: Backend no mantiene estado de sesión
- ✅ **Suficiente para el caso de uso**: Usuarios de confianza (dirigentes)

**Trade-offs**:

- ❌ No se puede revocar token antes de expiración
- ❌ Si se compromete el token, es válido por 7 días

**Mitigación**:

- Rotación regular de JWT_SECRET
- Monitoreo de actividad sospechosa
- TTL corto en producción crítica

## 📝 Mejores Prácticas para IA

### Cuando Modifiques Código

1. **Respeta la arquitectura en capas**
   - No pongas lógica de negocio en controllers
   - No hagas queries a BD en routes

2. **Sigue las convenciones de nombres**
   - Servicios: `NombreService` (PascalCase)
   - Funciones: `getNombre`, `createItem` (camelCase)
   - Constantes: `MAX_RETRIES` (UPPER_SNAKE_CASE)

3. **Valida siempre con Zod**
   - Toda entrada de usuario debe tener schema Zod
   - Coloca schemas en `validators/`

4. **Usa SecretsManager para secretos**
   - ❌ NUNCA: `const secret = process.env.JWT_SECRET`
   - ✅ SIEMPRE: `const secret = SecretsManager.getJWTSecret()`
   - Todos los secretos deben venir de Infisical vía SecretsManager
   - Solo `INFISICAL_*`, `NODE_ENV` y `PORT` pueden leerse de process.env

5. **Maneja errores apropiadamente**
   - Usa `AppError` para errores controlados
   - Lanza con `throw new AppError({...})`
   - Nunca retornes error sin logging

6. **Actualiza documentación**
   - Si cambias endpoint, actualiza Swagger
   - Si agregas secreto, agrégalo a Infisical Dashboard y types/secrets.ts
   - Si cambias arquitectura, actualiza AI_CONTEXT.md

### Cuando Agregues Features

1. **Nuevos Endpoints**

   ```typescript
   // 1. Crear tipo en types/
   // 2. Crear validador en validators/
   // 3. Crear servicio en services/
   // 4. Crear controlador en controllers/
   // 5. Crear ruta en routes/
   // 6. Agregar middleware de caché si aplica
   // 7. Documentar en Swagger
   ```

2. **Nuevos Modelos de BD**

   ```typescript
   // 1. Agregar modelo en schema.prisma
   // 2. Ejecutar prisma db push
   // 3. Crear tipos TypeScript
   // 4. Crear servicio
   // 5. Agregar extensión Prisma si se necesita campo calculado
   ```

3. **Nuevas Integraciones**

   ```typescript
   // 1. Agregar secretos a Infisical Dashboard (no a .env)
   // 2. Agregar tipos en src/types/secrets.ts
   // 3. Agregar método getter en SecretsManager.ts
   // 4. Crear wrapper en utils/lib/ que use SecretsManager
   // 5. Documentar en README.md sección de integraciones
   // 6. Manejar errores de conexión apropiadamente

   // Ejemplo: Agregar integración con Stripe
   // a) En Infisical Dashboard: Crear folder STRIPE/ con STRIPE_API_KEY
   // b) En secrets.ts:
   export interface StripeSecrets {
     STRIPE_API_KEY: string;
     STRIPE_WEBHOOK_SECRET: string;
   }

   // c) En SecretsManager.ts:
   static getStripeSecrets(): StripeSecrets {
     return {
       STRIPE_API_KEY: this.getSecret('STRIPE_API_KEY', 'STRIPE'),
       STRIPE_WEBHOOK_SECRET: this.getSecret('STRIPE_WEBHOOK_SECRET', 'STRIPE')
     };
   }

   // d) En utils/lib/stripe.util.ts:
   const { STRIPE_API_KEY } = SecretsManager.getStripeSecrets();
   ```

### Testing (Pendiente)

**Estructura sugerida para cuando se implementen tests**:

```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── validators/
├── integration/
│   └── routes/
└── e2e/
    └── flows/
```

**Librerías recomendadas**:

- Jest: Framework de testing
- Supertest: Testing de endpoints HTTP
- Prismock: Mock de Prisma

## 🔍 Debugging Tips

### 1. Problemas con Base de Datos

```bash
# Verificar conexión Turso
turso db show scout-db

# Ver logs de Prisma
DEBUG="prisma:*" npm run dev

# Inspeccionar BD con Prisma Studio
npm run studio:dev
```

### 2. Problemas con Redis

```bash
# Verificar que Redis está corriendo
docker ps | grep redis

# Conectar a Redis CLI
docker exec -it <container_id> redis-cli

# Ver claves en caché
KEYS *

# Ver valor de clave
GET scout/123

# Limpiar toda la caché
FLUSHALL
```

### 3. Problemas con Autenticación

```typescript
// En checkSession middleware, agregar logs:
logger.debug("Token recibido:", jwt);
logger.debug("Usuario decodificado:", isUser);
logger.debug("Permisos:", { method, resource, userRole });
```

### 4. Problemas con WhatsApp Bot

```bash
# Ver sesión en MongoDB
mongosh
use whatsapp
db.sessions.find()

# Si no escanea QR, borrar sesión y reiniciar
db.sessions.deleteMany({})
```

### 5. Problemas con AWS S3

```typescript
// Verificar configuración desde Infisical
import { SecretsManager } from "./utils/classes/SecretsManager";

const awsSecrets = SecretsManager.getAWSSecrets();
console.log("AWS Config:", {
  region: awsSecrets.region,
  bucket: awsSecrets.bucketName,
  hasAccessKey: !!awsSecrets.accessKey,
});

// Test de upload
import { uploadToS3 } from "./utils/lib/s3.util";
const testBuffer = Buffer.from("test");
await uploadToS3(testBuffer, "test/test.txt");
```

## 🎓 Glosario Scout

- **Rama**: Categoría por edad (Manada, Unidad, Caminantes, Pioneros)
- **Patrulla/Equipo**: Grupo pequeño de scouts dentro de una rama
- **Progresión**: Nivel de avance en la formación Scout
- **Función**: Rol dentro del equipo (Guía, Subguía, etc.)
- **Especialidad**: Habilidad específica reconocida con insignia
- **Entrega**: Ceremonia donde se otorgan insignias
- **Dirigente**: Adulto que lidera y forma a los scouts
- **Lobato/Lobezna**: Integrante de la rama Manada
- **Scout**: Integrante de la rama Unidad (también nombre genérico)
- **Rover**: Integrante de la rama Caminantes
- **Pionero**: Scout en formación para ser dirigente

## 🔗 Referencias Útiles

### Documentación de Tecnologías

- **Prisma**: https://www.prisma.io/docs
- **Turso**: https://docs.turso.tech
- **Express**: https://expressjs.com
- **Zod**: https://zod.dev
- **Infisical**: https://infisical.com/docs
- **AWS SDK S3**: https://docs.aws.amazon.com/sdk-for-javascript/v3/
- **Google Sheets API**: https://developers.google.com/sheets/api
- **WhatsApp Web.js**: https://wwebjs.dev
- **Winston**: https://github.com/winstonjs/winston
- **Redis**: https://redis.io/docs

### Estructura de Código

- **Naming Conventions**: Ver README.md sección "Convenciones de Nomenclatura"
- **Folder Structure**: Ver README.md sección "Estructura de Carpetas"
- **API Endpoints**: Ver `/docs` (Swagger UI) cuando el servidor esté corriendo

### Variables de Entorno y Gestión de Secretos

#### Infisical - Gestión Centralizada de Secretos

Este proyecto usa **Infisical** para gestionar todos los secretos de forma centralizada y segura. En lugar de tener múltiples variables de entorno locales, solo necesitas configurar las credenciales de acceso a Infisical.

**Variables locales requeridas** (`.env.development`):

```dosini
# Variables de Node.js
NODE_ENV=development
PORT=8080

# Credenciales de Infisical (proporcionadas por el administrador)
INFISICAL_TOKEN=st.xxx.xxxxx.xxxxx          # Service Token del ambiente
INFISICAL_PROJECT_ID=your-project-id-here   # ID del proyecto
INFISICAL_ENV=dev                           # Ambiente: dev, staging, prod
INFISICAL_SITE_URL=https://app.infisical.com  # URL del servidor (opcional)
```

**Secretos gestionados por Infisical**:

Todos los siguientes secretos se obtienen automáticamente desde Infisical al iniciar la aplicación:

- **JWT**: `JWT_SECRET`, `JWT_EXPIRY`
- **Turso (Base de datos)**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Redis (Caché)**: `REDIS_URI`
- **AWS S3**: `S3_ACCESS_KEY`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET_NAME`
- **Google Drive**: `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY`, `GOOGLE_DRIVE_FOLDER_ID`
- **BetterStack (Logging)**: `BETTERSTACK_AUTH_TOKEN`, `BETTERSTACK_SOURCE_TOKEN`
- **Datos del Grupo**: `GRUPO_NUMERO`, `GRUPO_NOMBRE`, `GRUPO_DISTRITO`, etc.

#### Cómo Funciona

```typescript
// 1. Al iniciar la aplicación (src/index.ts)
await SecretsManager.initialize();

// 2. En cualquier parte del código, obtén secretos de forma tipada
import { SecretsManager } from "./utils/classes/SecretsManager";

// Obtener secreto JWT
const jwtSecret = SecretsManager.getJWTSecret();

// Obtener secretos de AWS
const awsSecrets = SecretsManager.getAWSSecrets();
// { accessKey: string, secretAccessKey: string, region: string, bucketName: string }

// Obtener secretos de Turso
const tursoSecrets = SecretsManager.getTursoSecrets();
// { databaseUrl: string, authToken: string }
```

#### Arquitectura de Secretos

```
┌─────────────────────────────────────────┐
│  Infisical Dashboard (Web)             │
│  ┌──────────────────────────────────┐  │
│  │  Project: scout-api              │  │
│  │  ├─ Environment: dev             │  │
│  │  │  ├─ Index (root)              │  │
│  │  │  │  ├─ JWT_SECRET             │  │
│  │  │  │  ├─ REDIS_URI              │  │
│  │  │  ├─ Folder: AWS/              │  │
│  │  │  │  ├─ S3_ACCESS_KEY          │  │
│  │  │  │  └─ S3_SECRET_ACCESS_KEY   │  │
│  │  │  ├─ Folder: TURSO/            │  │
│  │  │  ├─ Folder: GOOGLE_DRIVE/     │  │
│  │  │  └─ Folder: BETTERSTACK/      │  │
│  │  └─ Environment: prod            │  │
│  │     └─ (misma estructura)        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓ (Service Token)
┌─────────────────────────────────────────┐
│  Scout API (Node.js)                    │
│  ┌──────────────────────────────────┐  │
│  │  SecretsManager.initialize()     │  │
│  │  ├─ Lee INFISICAL_TOKEN          │  │
│  │  ├─ Lee INFISICAL_PROJECT_ID     │  │
│  │  ├─ Lee INFISICAL_ENV (dev/prod) │  │
│  │  ├─ Conecta con Infisical SDK    │  │
│  │  ├─ Descarga todos los secretos  │  │
│  │  └─ Los cachea en memoria        │  │
│  └──────────────────────────────────┘  │
│                ↓                        │
│  ┌──────────────────────────────────┐  │
│  │  Código de la App                │  │
│  │  ├─ getJWTSecret()               │  │
│  │  ├─ getAWSSecrets()              │  │
│  │  ├─ getTursoSecrets()            │  │
│  │  └─ etc...                       │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

#### Tipos de Secretos

```typescript
// src/types/secrets.ts - Tipos TypeScript para todos los secretos

export interface AppSecrets {
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  REDIS_URI: string;
}

export interface AWSSecrets {
  S3_ACCESS_KEY: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_REGION: string;
  S3_BUCKET_NAME: string;
}

export interface TursoSecrets {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
}

export interface GoogleDriveSecrets {
  GOOGLE_DRIVE_CLIENT_EMAIL: string;
  GOOGLE_DRIVE_PRIVATE_KEY: string;
  GOOGLE_DRIVE_FOLDER_ID: string;
}

export interface BetterStackSecrets {
  BETTERSTACK_AUTH_TOKEN: string;
  BETTERSTACK_SOURCE_TOKEN: string;
}

export interface DatosGrupo {
  GRUPO_NUMERO: string;
  GRUPO_NOMBRE: string;
  GRUPO_DISTRITO: string;
  GRUPO_LOGO_URL?: string;
  // ... más campos del grupo
}
```

#### Flujo para Desarrolladores

1. **Solicitar credenciales al administrador**
   - El admin te proporciona: `INFISICAL_TOKEN`, `INFISICAL_PROJECT_ID`, `INFISICAL_ENV`
   - Son credenciales específicas del ambiente (dev tiene su token, prod otro)

2. **Configurar localmente**

   ```bash
   # Copiar ejemplo
   cp .env.example .env.development

   # Pegar credenciales del admin
   INFISICAL_TOKEN=st.dev.xxxxx
   INFISICAL_PROJECT_ID=project-id
   INFISICAL_ENV=dev
   ```

3. **Ejecutar la aplicación**

   ```bash
   npm run dev
   # La app descarga automáticamente todos los secretos desde Infisical
   ```

4. **Usar secretos en el código**

   ```typescript
   // ❌ NUNCA hacer esto
   const secret = process.env.JWT_SECRET;

   // ✅ SIEMPRE hacer esto
   const secret = SecretsManager.getJWTSecret();
   ```

#### Ventajas de este Enfoque

- ✅ **Centralización**: Todos los secretos en un solo lugar
- ✅ **Seguridad**: No hay secretos en código ni en archivos .env versionados
- ✅ **Ambientes**: Un token por ambiente (dev/staging/prod)
- ✅ **Tipado**: TypeScript valida que uses los secretos correctos
- ✅ **Rotación**: El admin puede rotar secretos sin tocar código
- ✅ **Auditoría**: Infisical registra quién accede a qué secretos

#### Archivos Importantes

```
src/
├── types/
│   └── secrets.ts              # Interfaces de todos los secretos
├── utils/
│   └── classes/
│       └── SecretsManager.ts   # Singleton para gestión de secretos
└── index.ts                    # Inicializa SecretsManager al arrancar
```

Ver `.env.example` para lista completa y actualizada de variables requeridas.

---

**Última actualización**: Noviembre 2025  
**Versión del documento**: 1.1.0  
**Mantenedor**: @aggutierrez98
