# Webhook — Integración con whatsapp-comprobantes

## Descripción general

El sistema **whatsapp-comprobantes** escucha mensajes de WhatsApp que contienen imágenes o PDFs de comprobantes bancarios. Procesa el contenido mediante OCR (Gemini 2.0 Flash) y envía el resultado estructurado a scout-api. scout-api recibe ese payload, identifica al scout correspondiente y registra el pago de forma automática.

---

## Archivos involucrados

```
src/
├── routes/webhook.ts           — Registro de la ruta POST /api/webhook/comprobante
├── controllers/webhook.ts      — Extrae datos del request y delega en el service
├── services/webhook.ts         — Lógica de matching y creación del pago
├── validators/webhook.ts       — Schema Zod para validar el payload entrante
├── middlewares/webhookAuth.ts  — Autenticación por HMAC-SHA256
└── types/webhook.ts            — Interfaces TypeScript del payload
```

---

## Endpoint

```
POST /api/webhook/comprobante
```

Esta ruta NO usa el middleware `checkSession` (no hay sesión de usuario humano). La autenticación se realiza exclusivamente mediante el header `X-Webhook-Secret`.

---

## Autenticación

El middleware `webhookAuth` valida el header `X-Webhook-Secret` comparándolo contra el HMAC-SHA256 del body calculado con la variable de entorno `WEBHOOK_SECRET`.

```
X-Webhook-Secret: <HMAC-SHA256(body, WEBHOOK_SECRET)>
```

Si la firma no coincide, se retorna `HTTP 401` sin procesar el payload.

> El valor de `WEBHOOK_SECRET` debe ser idéntico en ambos sistemas (scout-api y whatsapp-comprobantes).

---

## Payload entrante

### Headers

| Header | Valor | Validado |
|---|---|---|
| `Content-Type` | `application/json` | — |
| `X-Webhook-Source` | `whatsapp-comprobantes` | ✅ Debe ser exactamente este valor |
| `X-Webhook-Secret` | HMAC-SHA256 del body | ✅ Se recalcula y compara en el servidor |

### Body

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

### Descripción de campos

| Campo | Tipo | Descripción |
|---|---|---|
| `evento` | String | Siempre `comprobante_recibido` |
| `timestamp` | ISO 8601 | Momento en que whatsapp-comprobantes envió el webhook |
| `datos.es_comprobante` | Boolean | `false` si el OCR determinó que la imagen no es un comprobante |
| `datos.monto` | Float | Importe detectado por OCR |
| `datos.fecha` | String (YYYY-MM-DD) | Fecha del comprobante según OCR |
| `datos.hora` | String (HH:mm) | Hora del comprobante según OCR |
| `datos.cbu_alias_destino` | String | CBU o alias de destino de la transferencia |
| `datos.banco_emisor` | String | Banco o billetera emisora |
| `datos.cuit_emisor` | String | CUIT del emisor |
| `datos.nombre_emisor` | String | Nombre completo del emisor según el comprobante |
| `datos.numero_comprobante` | String | Número o ID de la transacción |
| `datos.concepto` | String | Concepto/descripción detectado en el comprobante (puede ser vacío) |
| `datos.whatsapp_remitente` | String | Número de teléfono del remitente (sin `+`, con código de país) |
| `datos.whatsapp_chat_id` | String | ID del chat de WhatsApp |
| `datos.whatsapp_mensaje_texto` | String | Texto del mensaje que acompañó al comprobante |
| `datos.whatsapp_timestamp` | ISO 8601 | Timestamp del mensaje en WhatsApp |

---

## Lógica de matching

El service intenta asociar el pago a un scout en el siguiente orden de prioridad:

### 1. Por teléfono

Compara `datos.whatsapp_remitente` contra `scout.telefono`.

Se aplica normalización de prefijo internacional: el número recibido puede llegar con código de país (`5491123456789`), mientras que el teléfono almacenado puede estar en formato local (`1123456789` o `01123456789`). El matching normaliza ambos antes de comparar.

### 2. Por nombre

Compara `datos.nombre_emisor` contra `scout.nombre + ' ' + scout.apellido`.

La comparación es **case-insensitive** y elimina tildes y caracteres especiales para aumentar la tolerancia.

### Sin match

Si ninguna estrategia encuentra un scout:

- Se retorna `HTTP 422 Unprocessable Entity`.
- La respuesta incluye los datos recibidos para facilitar la revisión manual.
- El pago **no se registra** automáticamente.

---

## Transformación del payload a Pago

| Campo del webhook | Campo del modelo `Pago` | Notas |
|---|---|---|
| `datos.monto` | `monto` | — |
| `datos.fecha` | `fechaPago` | Parseado a `DateTime`. Si es `null`, se usa la fecha actual |
| `datos.concepto` | `concepto` | Fallback: `TRANSFERENCIA {banco_emisor}` si está vacío. Máx 50 chars, en MAYÚSCULAS |
| _(fijo)_ `"TRANSFERENCIA"` | `metodoPago` | Los comprobantes procesados siempre son transferencias |
| scout encontrado `.uuid` | `scoutId` | Resultado del proceso de matching |
| _(fijo)_ `false` | `rendido` | Los pagos creados automáticamente siempre quedan pendientes de rendición |

---

## Flujo completo

```
WhatsApp (imagen/PDF)
    ↓
whatsapp-comprobantes
    → OCR con Gemini 2.0 Flash
    → Construye payload JSON
    ↓
POST /api/webhook/comprobante
    ↓
webhookAuth (valida HMAC-SHA256)
    ↓
validate (schema Zod)
    ↓
WebhookController
    ↓
WebhookService
    ├── Matching por teléfono
    ├── Matching por nombre
    └── Si no hay match → HTTP 422
    ↓
PagoService.create(...)
    ↓
HTTP 201 — Pago registrado
```

---

## Respuestas HTTP

| Código | Situación |
|---|---|
| `201 Created` | Pago registrado correctamente |
| `400 Bad Request` | Payload inválido (falla de validación Zod) |
| `401 Unauthorized` | Firma HMAC incorrecta o ausente |
| `422 Unprocessable Entity` | No se encontró un scout que coincida con el comprobante |
| `500 Internal Server Error` | Error inesperado en el procesamiento |

---

## Variables de entorno nuevas

```env
WEBHOOK_SECRET=<valor-compartido-con-whatsapp-comprobantes>
```

> Este valor debe coincidir exactamente con el configurado en el sistema whatsapp-comprobantes. Se recomienda generarlo con al menos 32 bytes de entropía (`openssl rand -hex 32`).
